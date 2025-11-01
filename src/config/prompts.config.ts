/**
 * Configuration for all AI prompts used in the game
 * 
 * This file contains all the prompts as template strings with placeholders.
 * You can easily modify any prompt without touching the service code.
 * 
 * Placeholders are denoted with ${variableName} syntax
 */

/**
 * System prompts define the AI's role and behavior
 */
export const SYSTEM_PROMPTS = {
  historicalContext: `You are an expert historian with deep knowledge of world history across all time periods and cultures. 
Your role is to provide accurate, detailed historical context for any given date and location.
Focus on creating an immersive, factual description that captures the essence of the time and place.
Always prioritize historical accuracy over dramatization.`,

  personaGeneration: `You are a historical demographer and social historian.
Your role is to generate realistic personas of people who could have lived in a specific historical context.
Consider social structures, class systems, demographics, and typical life circumstances of the era.
Each persona should be plausible and grounded in historical reality.`,

  lifelineGeneration: `You are a creative historical storyteller and biographer.
Your role is to craft engaging, realistic life narratives that respect historical facts and social constraints.
Create vivid, documentary-style narratives that feel authentic to the time period.
Balance storytelling with historical accuracy, making the character's life feel real and relatable.`,

  pivotalMomentGeneration: `You are a dramatic historical writer specializing in critical decision points.
Your role is to identify and describe historically plausible pivotal moments in a character's life.
Create meaningful choices that have significant consequences and reflect the constraints and opportunities of the era.
Each choice should be compelling and force the player to consider historical context.`,

  imageGeneration: `Documentary-realistic historical photography style.`,
} as const;

/**
 * User prompts are the actual instructions sent to the AI
 * These use template strings with ${variableName} placeholders
 */
export const USER_PROMPTS = {
  historicalContext: `Generate detailed historical context for the following:
Date: \${date}
Location: \${location}

Provide comprehensive information about:
1. The country or political structure that controlled this area
2. A vivid description of the place and time
3. Political situation including rulers and governance
4. Religious and cultural background
5. Social structure and class system
6. Economic conditions
7. Any ongoing conflicts or tensions
8. Cultural highlights and notable aspects of the era

Return the information in a structured JSON format.`,

  personaGeneration: `Based on the following historical context, generate \${numberOfOptions} distinct persona options representing different types of people who could be born in these circumstances.

Historical Context:
\${historicalContextJson}

For each persona, provide:
1. Family background (social class, occupation, wealth, family size, location)
2. Birth circumstances
3. Initial attributes (gender, ethnicity, physical traits, early childhood)
4. Probability percentage of being born into this situation (ensure all probabilities sum to roughly 100%)
5. Opportunities available to this persona
6. Challenges they would likely face

Return the personas in a structured JSON format.`,

  lifelineGeneration: `Generate a life narrative for the following character until they reach a pivotal moment in their life.

Historical Context:
\${historicalContextJson}

Selected Persona:
\${personaJson}

\${previousLifelineSection}

Create a narrative that:
1. Covers a significant period of the character's life (typically 5-15 years)
2. Includes specific life events with dates and ages
3. Shows character development (skills, relationships, beliefs)
4. Builds toward a natural pivotal moment
5. Maintains historical accuracy and plausibility
6. Feels documentary-realistic and immersive

Return the lifeline in a structured JSON format, ending at a point where a major decision must be made.`,

  lifelineGenerationWithPreviousChoice: `\${previousLifelineSection}

The character chose: \${previousChoice}

Continue the narrative from this point, showing the consequences of this choice and leading to the next pivotal moment.`,

  pivotalMomentGeneration: `Generate a pivotal moment for the character based on their life so far.

Historical Context:
\${historicalContextJson}

Current Lifeline:
\${lifelineJson}

This is pivotal moment #\${momentNumber} in their life.

Create a dramatic, historically plausible pivotal moment that:
1. Emerges naturally from the character's circumstances
2. Presents 3-4 meaningful choices with different consequences
3. Each choice should have clear immediate consequences and potential long-term outcomes
4. Reflects the historical constraints and opportunities of the era
5. Forces the player to consider their values and the character's situation

Return the pivotal moment in a structured JSON format with all choice options.`,

  imageGeneration: `Create a documentary-realistic historical image depicting:

\${sceneDescription}

Historical Context:
\${contextDescription}

Style: Documentary photography, historically accurate, vivid details, \${additionalStyleInstructions}`,
} as const;

/**
 * Helper function to fill in a prompt template with actual values
 */
export function fillPromptTemplate(
  template: string,
  variables: Record<string, string>
): string {
  let filledPrompt = template;
  
  for (const [key, value] of Object.entries(variables)) {
    const placeholder = `\${${key}}`;
    filledPrompt = filledPrompt.replace(new RegExp(placeholder, 'g'), value);
  }
  
  return filledPrompt;
}

/**
 * Get both system and user prompts for a specific step
 */
export function getPromptsForStep(
  step: keyof typeof SYSTEM_PROMPTS,
  variables: Record<string, string> = {}
) {
  return {
    systemPrompt: SYSTEM_PROMPTS[step],
    userPrompt: fillPromptTemplate(USER_PROMPTS[step], variables),
  };
}

