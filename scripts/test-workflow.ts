#!/usr/bin/env tsx

/**
 * Interactive Workflow Test Script
 * 
 * This script tests the complete agent workflow with:
 * - Interactive console input for initial parameters
 * - Step-by-step execution with approval gates
 * - Detailed logging of inputs and outputs
 * - User selection for personas and pivotal moment choices
 * - Looping through multiple lifeline/pivotal moment cycles
 * - Session data saved to JSON file
 */

import * as readline from 'readline';
import { 
  createSession, 
  readSession, 
  setSelectedPersona, 
  addUserChoice,
  endSession,
  getSessionPath,
  updateSessionMetadata,
} from '../src/services/sessionService';
import { generateHistoricalContext } from '../src/services/historicalContextService';
import { generatePersonaOptions } from '../src/services/personaService';
import { generateLifeline } from '../src/services/lifelineService';
import { generatePivotalMoment } from '../src/services/pivotalMomentService';
import { getAgentConfig, getNextAgent, AgentType } from '../src/config/agents.config';
import { GAME_CONFIG } from '../src/config/workflow.config';
import { SessionInput } from '../src/types/session.types';
import { PersonaOption } from '../src/types/persona.types';
import { Choice } from '../src/types/pivotalMoment.types';

// Create readline interface
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

/**
 * Promisified question function
 */
function question(query: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(query, resolve);
  });
}

/**
 * Wait for user to press Enter
 */
async function waitForApproval(): Promise<void> {
  console.log('\n⏸️  Press Enter to continue...');
  await question('');
}

/**
 * Print a section header
 */
function printHeader(title: string, stepNumber?: number): void {
  console.log('\n' + '='.repeat(80));
  if (stepNumber) {
    console.log(`STEP ${stepNumber}: ${title}`);
  } else {
    console.log(title);
  }
  console.log('='.repeat(80));
}

/**
 * Print formatted JSON
 */
function printJSON(label: string, data: any, maxLength: number = 500): void {
  const jsonString = JSON.stringify(data, null, 2);
  if (jsonString.length > maxLength) {
    const truncated = jsonString.substring(0, maxLength);
    console.log(`\n${label}:\n${truncated}...\n(truncated for readability)`);
  } else {
    console.log(`\n${label}:\n${jsonString}`);
  }
}

/**
 * Select a persona from options
 */
async function selectPersona(options: PersonaOption[]): Promise<PersonaOption> {
  console.log('\n📋 Available Personas:\n');
  
  options.forEach((option, index) => {
    console.log(`${index + 1}. ${option.title} (${option.probability}% probability)`);
    console.log(`   Class: ${option.familyBackground.socialClass}`);
    console.log(`   Occupation: ${option.familyBackground.occupation}`);
    console.log(`   Wealth: ${option.familyBackground.wealth}`);
    console.log(`   Location: ${option.familyBackground.location}`);
    console.log(`   Opportunities: ${option.opportunities.join(', ')}`);
    console.log(`   Challenges: ${option.challenges.join(', ')}`);
    console.log('');
  });
  
  while (true) {
    const answer = await question(`Select a persona (1-${options.length}): `);
    const choice = parseInt(answer);
    
    if (choice >= 1 && choice <= options.length) {
      return options[choice - 1];
    }
    
    console.log(`❌ Invalid choice. Please enter a number between 1 and ${options.length}.`);
  }
}

/**
 * Select a choice from pivotal moment
 */
async function selectChoice(choices: Choice[]): Promise<Choice> {
  console.log('\n🔀 Available Choices:\n');
  
  choices.forEach((choice, index) => {
    console.log(`${index + 1}. ${choice.title} (Risk: ${choice.risk})`);
    console.log(`   ${choice.description}`);
    console.log(`   Immediate Consequences:`);
    choice.immediateConsequences.forEach(c => console.log(`     • ${c}`));
    console.log(`   Potential Outcomes:`);
    choice.potentialOutcomes.forEach(o => console.log(`     • ${o}`));
    console.log(`   Alignment: ${choice.alignment.join(', ')}`);
    console.log('');
  });
  
  while (true) {
    const answer = await question(`Select a choice (1-${choices.length}): `);
    const choiceIndex = parseInt(answer);
    
    if (choiceIndex >= 1 && choiceIndex <= choices.length) {
      return choices[choiceIndex - 1];
    }
    
    console.log(`❌ Invalid choice. Please enter a number between 1 and ${choices.length}.`);
  }
}

/**
 * Main workflow execution
 */
async function main() {
  try {
    printHeader('🕰️  Time Travel Game - Workflow Test', undefined);
    
    console.log('\nThis script will guide you through the complete agent workflow.');
    console.log('You will be prompted for input and asked to approve each step.\n');
    
    // Step 0: Get initial input
    printHeader('Initial Setup');
    
    const date = await question('Enter historical date (e.g., 1789-07-14): ');
    const location = await question('Enter location (e.g., Paris, France): ');
    const time = await question('Enter time of day (optional, e.g., afternoon): ');
    
    const input: SessionInput = {
      date,
      location,
      time: time || undefined,
    };
    
    // Create session
    const { sessionId, session } = createSession(input, {
      maxPivotalMoments: GAME_CONFIG.defaultPivotalMoments,
      numberOfPersonaOptions: GAME_CONFIG.defaultPersonaOptions,
      generateImages: false, // Disabled for testing
    });
    
    console.log(`\n✅ Session created: ${sessionId}`);
    console.log(`📁 Session file: ${getSessionPath(sessionId)}`);
    
    await waitForApproval();
    
    let stepNumber = 1;
    let currentAgent: AgentType | null = 'historicalContext';
    
    // Main workflow loop
    while (currentAgent !== null) {
      const agentConfig = getAgentConfig(currentAgent);
      
      printHeader(agentConfig.name, stepNumber);
      
      // Read current session state
      const currentSession = readSession(sessionId);
      
      // Display input fields
      console.log('\n📥 INPUT:');
      agentConfig.inputFields.forEach(field => {
        const value = getNestedValue(currentSession, field.field);
        if (value !== undefined) {
          if (typeof value === 'object') {
            console.log(`   ${field.field}: [${field.description}]`);
          } else {
            console.log(`   ${field.field}: ${value}`);
          }
        } else if (field.required) {
          console.log(`   ${field.field}: ❌ MISSING (required)`);
        }
      });
      
      // Execute agent based on type
      console.log('\n🔄 Executing agent...');
      
      // Track whether user made a selection in this step
      let userMadeSelection = false;
      
      try {
        if (currentAgent === 'historicalContext') {
          const context = await generateHistoricalContext(sessionId);
          
          console.log('\n📤 OUTPUT:');
          printJSON('Historical Context', context, 600);
          
        } else if (currentAgent === 'personaGeneration') {
          const personas = await generatePersonaOptions(sessionId);
          
          console.log('\n📤 OUTPUT:');
          console.log(`Generated ${personas.options.length} persona options`);
          
          await waitForApproval();
          
          // User selects persona
          const selectedPersona = await selectPersona(personas.options);
          setSelectedPersona(sessionId, selectedPersona);
          
          console.log(`\n✅ Selected: ${selectedPersona.title}`);
          userMadeSelection = true; // User just made a selection
          
        } else if (currentAgent === 'lifelineGeneration') {
          const lifeline = await generateLifeline(sessionId);
          
          console.log('\n📤 OUTPUT:');
          console.log(`\nLifeline: Age ${lifeline.startAge} → ${lifeline.endAge}`);
          console.log(`\nNarrative:\n${lifeline.narrative}`);
          console.log(`\nKey Events:`);
          lifeline.events.forEach(event => {
            console.log(`  • Age ${event.age}: ${event.event} (${event.impact} impact)`);
          });
          console.log(`\nCharacter Development:`);
          console.log(`  Skills: ${lifeline.characterDevelopment.skills.join(', ')}`);
          console.log(`  Relationships: ${lifeline.characterDevelopment.relationships.join(', ')}`);
          console.log(`  Reputation: ${lifeline.characterDevelopment.reputation}`);
          
        } else if (currentAgent === 'pivotalMomentGeneration') {
          const moment = await generatePivotalMoment(sessionId);
          
          console.log('\n📤 OUTPUT:');
          console.log(`\n🎭 ${moment.title}`);
          console.log(`\nAge: ${moment.age} | Year: ${moment.year}`);
          console.log(`\nSituation:\n${moment.situation}`);
          console.log(`\nContext:\n${moment.context}`);
          console.log(`\nStakes:\n${moment.stakes}`);
          
          await waitForApproval();
          
          // User makes a choice
          const selectedChoice = await selectChoice(moment.choices);
          addUserChoice(sessionId, {
            pivotalMomentId: moment.id,
            choiceId: selectedChoice.id,
            choiceTitle: selectedChoice.title,
            timestamp: new Date().toISOString(),
          });
          
          console.log(`\n✅ You chose: ${selectedChoice.title}`);
          userMadeSelection = true; // User just made a selection
          
          // Check if we should end the game
          const updatedSession = readSession(sessionId);
          const pivotalMomentCount = updatedSession.pivotalMoments.length;
          const maxMoments = updatedSession.config.maxPivotalMoments || GAME_CONFIG.defaultPivotalMoments;
          
          if (pivotalMomentCount >= maxMoments) {
            console.log(`\n🏁 Reached maximum number of pivotal moments (${maxMoments})`);
            console.log('   The story will now conclude...');
            currentAgent = null;
            continue;
          }
        }
        
        console.log('\n✅ Agent execution completed');
        
      } catch (error) {
        console.error('\n❌ Agent execution failed:', error);
        throw error;
      }
      
      // Update metadata
      updateSessionMetadata(sessionId, {
        currentStep: agentConfig.name,
      });
      
      await waitForApproval();
      
      // Determine next agent, passing whether user made a selection
      const sessionData = readSession(sessionId);
      currentAgent = getNextAgent(currentAgent, sessionData, userMadeSelection);
      
      if (currentAgent) {
        console.log(`\n➡️  Next agent: ${getAgentConfig(currentAgent).name}`);
      }
      
      stepNumber++;
    }
    
    // End session
    printHeader('🎉 Game Complete');
    
    const finalSession = readSession(sessionId);
    endSession(sessionId, 'completed', 'max_moments');
    
    console.log('\n📊 Summary:');
    console.log(`   Location: ${finalSession.input.location}`);
    console.log(`   Date: ${finalSession.input.date}`);
    console.log(`   Persona: ${finalSession.selectedPersona?.title}`);
    console.log(`   Lifeline segments: ${finalSession.lifelines.length}`);
    console.log(`   Pivotal moments: ${finalSession.pivotalMoments.length}`);
    console.log(`   Choices made: ${finalSession.choices.length}`);
    console.log(`   Final age: ${finalSession.gameState.currentAge}`);
    console.log(`   Total steps executed: ${finalSession.metadata.totalSteps}`);
    
    console.log(`\n📁 Session saved to: ${getSessionPath(sessionId)}`);
    console.log('\nYou can review the complete session data in the JSON file.\n');
    
  } catch (error) {
    console.error('\n❌ Error:', error);
    process.exit(1);
  } finally {
    rl.close();
  }
}

/**
 * Helper function to get nested values
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

// Run the script
main().catch(console.error);

