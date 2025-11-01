/**
 * Agent Executor
 * 
 * Generic executor that can run any configured agent.
 * Handles reading from session, calling OpenAI, and writing back to session.
 */

import { AgentConfig, AgentType } from '@/config/agents.config';
import { 
  readSession, 
  writeAgentOutput, 
  addExecutionLog,
  getAgentInput,
} from './sessionService';
import { generateJSONCompletion, generateImage } from '@/lib/openai';
import { fillPromptTemplate } from '@/config/prompts.config';
import { ModelConfig, ImageModelConfig } from '@/config/models.config';
import { AgentExecutionLog } from '@/types/session.types';

/**
 * Execute an agent
 * 
 * @param agentConfig - The agent configuration
 * @param sessionId - The session ID
 * @returns The output from the agent
 */
export async function executeAgent(
  agentConfig: AgentConfig,
  sessionId: string
): Promise<any> {
  const startTime = new Date().toISOString();
  const startMs = Date.now();
  
  try {
    console.log(`\n🤖 Executing ${agentConfig.name}...`);
    
    // 1. Read input from session
    const inputData = getAgentInput(sessionId, agentConfig.inputFields);
    console.log(`   📥 Input fields: ${Object.keys(inputData).join(', ')}`);
    
    // 2. Build prompt with input data
    const promptVariables = buildPromptVariables(inputData, sessionId);
    const userPrompt = fillPromptTemplate(
      agentConfig.userPromptTemplate,
      promptVariables
    );
    
    // 3. Call OpenAI (or return mock data)
    let output: any;
    
    if (agentConfig.type === 'imageGeneration') {
      // Image generation uses DALL-E
      output = await executeImageAgent(
        agentConfig.systemPrompt,
        userPrompt,
        agentConfig.modelConfig as ImageModelConfig,
        sessionId
      );
    } else {
      // Text generation uses GPT
      output = await executeTextAgent(
        agentConfig.systemPrompt,
        userPrompt,
        agentConfig.modelConfig as ModelConfig
      );
    }
    
    console.log(`   ✅ Agent completed successfully`);
    
    // 4. Write output to session
    writeAgentOutput(sessionId, agentConfig.outputField, output);
    
    // 5. Log execution with summarized data
    const endTime = new Date().toISOString();
    const duration = Date.now() - startMs;
    
    const log: AgentExecutionLog = {
      agentId: agentConfig.id,
      agentName: agentConfig.name,
      startTime,
      endTime,
      duration,
      inputData: summarizeInputData(inputData),
      outputData: summarizeOutputData(output, agentConfig.outputField),
      success: true,
    };
    
    addExecutionLog(sessionId, log);
    
    return output;
    
  } catch (error) {
    console.error(`   ❌ Agent execution failed:`, error);
    
    // Log failure
    const endTime = new Date().toISOString();
    const duration = Date.now() - startMs;
    
    const log: AgentExecutionLog = {
      agentId: agentConfig.id,
      agentName: agentConfig.name,
      startTime,
      endTime,
      duration,
      inputData: {},
      outputData: null,
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
    
    addExecutionLog(sessionId, log);
    
    throw error;
  }
}

/**
 * Execute a text-based agent (GPT)
 */
async function executeTextAgent(
  systemPrompt: string,
  userPrompt: string,
  modelConfig: ModelConfig
): Promise<any> {
  // Call OpenAI to generate JSON response
  console.log(`   🤖 Calling OpenAI API (${modelConfig.model})...`);
  return await generateJSONCompletion(
    systemPrompt,
    userPrompt,
    modelConfig
  );
}

/**
 * Execute an image generation agent (DALL-E)
 */
async function executeImageAgent(
  systemPrompt: string,
  userPrompt: string,
  modelConfig: ImageModelConfig,
  sessionId: string
): Promise<any> {
  // Call DALL-E to generate image
  console.log(`   🎨 Calling DALL-E API (${modelConfig.model})...`);
  const result = await generateImage(userPrompt, modelConfig);
  return {
    id: `image-${Date.now()}`,
    url: result.url,
    revisedPrompt: result.revisedPrompt,
    sourceType: 'unknown', // Will be determined by caller
    sourceId: '',
    timestamp: new Date().toISOString(),
  };
}

/**
 * Build prompt variables from input data
 */
function buildPromptVariables(
  inputData: Record<string, any>,
  sessionId: string
): Record<string, string> {
  const variables: Record<string, string> = {};
  const session = readSession(sessionId);
  
  // Convert all input data to strings for template filling
  for (const [key, value] of Object.entries(inputData)) {
    const cleanKey = key.split('.').pop()!; // Use last part of path
    
    if (typeof value === 'string') {
      variables[cleanKey] = value;
    } else if (typeof value === 'object' && value !== null) {
      variables[cleanKey] = JSON.stringify(value, null, 2);
    } else {
      variables[cleanKey] = String(value);
    }
  }
  
  // Add common variables that might be needed
  if (session.historicalContext) {
    variables['historicalContextJson'] = JSON.stringify(session.historicalContext, null, 2);
  }
  
  if (session.selectedPersona) {
    variables['personaJson'] = JSON.stringify(session.selectedPersona, null, 2);
  }
  
  if (session.lifelines.length > 0) {
    const latestLifeline = session.lifelines[session.lifelines.length - 1];
    variables['lifelineJson'] = JSON.stringify(latestLifeline, null, 2);
  }
  
  if (session.choices.length > 0) {
    const latestChoice = session.choices[session.choices.length - 1];
    variables['previousChoice'] = latestChoice.choiceTitle;
  }
  
  if (session.pivotalMoments.length > 0) {
    variables['momentNumber'] = String(session.pivotalMoments.length + 1);
  } else {
    variables['momentNumber'] = '1';
  }
  
  // Add image prompt data for image generation
  if (session.imagePrompts.length > 0) {
    const latestPrompt = session.imagePrompts[session.imagePrompts.length - 1];
    variables['imagePrompt'] = latestPrompt.prompt;
    variables['sceneDescription'] = latestPrompt.prompt;
  }
  
  // Add current age for pivotal moment generation
  if (session.lifelines.length > 0) {
    const latestLifeline = session.lifelines[session.lifelines.length - 1];
    variables['currentAge'] = String(latestLifeline.endAge);
  } else {
    variables['currentAge'] = '0';
  }
  
  // Add config values
  variables['numberOfOptions'] = String(session.config.numberOfPersonaOptions || 4);
  
  // Add previous lifeline section if continuing
  if (session.lifelines.length > 0 && session.choices.length > 0) {
    const previousLifelines = session.lifelines.map(l => JSON.stringify(l, null, 2)).join('\n\n');
    variables['previousLifelineSection'] = `Previous Lifelines:\n${previousLifelines}`;
  } else {
    variables['previousLifelineSection'] = '';
  }
  
  // Calculate expected age range for lifeline generation
  let expectedStartAge = 0;
  let yearsToAdvance = 10; // Default
  
  if (session.lifelines.length > 0) {
    // Continuing from previous lifeline
    const lastLifeline = session.lifelines[session.lifelines.length - 1];
    expectedStartAge = lastLifeline.endAge;
    
    // Calculate years to advance (5-15 years, shorter as character ages)
    const characterAge = expectedStartAge;
    if (characterAge < 20) {
      yearsToAdvance = Math.floor(Math.random() * 6) + 10; // 10-15 years
    } else if (characterAge < 40) {
      yearsToAdvance = Math.floor(Math.random() * 6) + 7; // 7-12 years
    } else {
      yearsToAdvance = Math.floor(Math.random() * 6) + 5; // 5-10 years
    }
  } else {
    // First lifeline - start from birth
    expectedStartAge = 0;
    yearsToAdvance = Math.floor(Math.random() * 6) + 10; // 10-15 years
  }
  
  variables['expectedStartAge'] = String(expectedStartAge);
  variables['yearsToAdvance'] = String(yearsToAdvance);
  
  // Add continuation context if this is not the first lifeline
  if (session.lifelines.length > 0 && session.choices.length > 0) {
    const lastChoice = session.choices[session.choices.length - 1];
    const lastPivotalMoment = session.pivotalMoments[session.pivotalMoments.length - 1];
    
    variables['continuationContext'] = `CONTINUATION CONTEXT:
- The character is now ${expectedStartAge} years old
- Previous pivotal moment: "${lastPivotalMoment?.title || 'Unknown'}"
- The character chose: "${lastChoice.choiceTitle}"
- You MUST continue the story from age ${expectedStartAge}, NOT from birth
- Show the consequences and outcomes of their choice
- Advance the narrative approximately ${yearsToAdvance} years forward`;
    
    variables['ageRangeWarning'] = `⚠️ CRITICAL: You MUST start at age ${expectedStartAge} (not 0). This is a CONTINUATION of an existing life story.`;
  } else {
    variables['continuationContext'] = `This is the character's first lifeline, starting from birth (age 0).`;
    variables['ageRangeWarning'] = '';
  }
  
  // Add scene context for image prompt generation
  let sceneContext = '';
  if (session.lifelines.length > 0) {
    const latestLifeline = session.lifelines[session.lifelines.length - 1];
    sceneContext += `Latest Lifeline (Age ${latestLifeline.startAge}-${latestLifeline.endAge}):\n`;
    sceneContext += latestLifeline.narrative + '\n\n';
  }
  if (session.pivotalMoments.length > 0) {
    const latestMoment = session.pivotalMoments[session.pivotalMoments.length - 1];
    sceneContext += `Latest Pivotal Moment:\n`;
    sceneContext += `${latestMoment.title} (Age ${latestMoment.age})\n`;
    sceneContext += latestMoment.situation + '\n';
  }
  variables['sceneContext'] = sceneContext || 'Character just started their life journey.';
  
  // Add source type and ID for image prompt generation
  variables['sourceType'] = 'context';
  variables['sourceId'] = session.metadata.sessionId;
  variables['timestamp'] = String(Date.now());
  
  // Add location and period info for prompts
  variables['location'] = session.input.location;
  variables['period'] = session.input.date;
  variables['contextDescription'] = session.historicalContext 
    ? `${session.historicalContext.country} - ${session.historicalContext.description}` 
    : session.input.location;
  variables['additionalStyleInstructions'] = 'natural lighting, period-accurate details';
  
  return variables;
}

/**
 * Check if an agent can be executed (has required inputs)
 */
export function canExecuteAgent(
  agentConfig: AgentConfig,
  sessionId: string
): { canExecute: boolean; missingFields: string[] } {
  const session = readSession(sessionId);
  const missingFields: string[] = [];
  
  for (const inputField of agentConfig.inputFields) {
    if (inputField.required) {
      const value = getNestedValue(session, inputField.field);
      if (value === undefined) {
        missingFields.push(inputField.field);
      }
    }
  }
  
  return {
    canExecute: missingFields.length === 0,
    missingFields,
  };
}

/**
 * Get a nested value from an object using dot notation
 */
function getNestedValue(obj: any, path: string): any {
  const keys = path.split('.');
  let value = obj;
  
  for (const key of keys) {
    if (value === undefined || value === null) {
      return undefined;
    }
    value = value[key];
  }
  
  return value;
}

/**
 * Summarize input data to reduce JSON size
 * Instead of including full objects, just include metadata
 */
function summarizeInputData(inputData: Record<string, any>): Record<string, any> {
  const summary: Record<string, any> = {};
  
  for (const [key, value] of Object.entries(inputData)) {
    if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
      // Keep primitives as-is
      summary[key] = value;
    } else if (Array.isArray(value)) {
      // For arrays, just show the count
      summary[key] = `[Array with ${value.length} items]`;
    } else if (typeof value === 'object' && value !== null) {
      // For objects, just show the keys
      summary[key] = `{${Object.keys(value).join(', ')}}`;
    } else {
      summary[key] = value;
    }
  }
  
  return summary;
}

/**
 * Summarize output data to reduce JSON size
 * Keep only essential information about what was generated
 */
function summarizeOutputData(output: any, _outputField: string): any {
  if (!output) {
    return null;
  }
  
  // For array outputs (lifelines, pivotalMoments, etc.)
  if (Array.isArray(output)) {
    return `[Array with ${output.length} items]`;
  }
  
  // For object outputs, create a minimal summary
  if (typeof output === 'object') {
    const summary: Record<string, any> = {};
    
    // Keep ID fields
    if (output.id) summary.id = output.id;
    if (output.title) summary.title = output.title;
    if (output.age) summary.age = output.age;
    if (output.year) summary.year = output.year;
    
    // For lifelines
    if (output.startAge !== undefined) summary.startAge = output.startAge;
    if (output.endAge !== undefined) summary.endAge = output.endAge;
    
    // For persona options
    if (output.options) summary.optionsCount = output.options.length;
    
    // For pivotal moments
    if (output.choices) summary.choicesCount = output.choices.length;
    
    // Show what keys exist without full content
    summary._structure = Object.keys(output).join(', ');
    
    return summary;
  }
  
  return output;
}

