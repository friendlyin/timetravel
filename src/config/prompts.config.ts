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
Always prioritize historical accuracy over dramatization.
You must respond with valid JSON only.`,

    personaGeneration: `You are a historical demographer and social historian.
Your role is to generate realistic personas of people who could have lived in a specific historical context.
Consider social structures, class systems, demographics, and typical life circumstances of the era.
Each persona should be plausible and grounded in historical reality.
You must respond with valid JSON only.`,

    lifelineGeneration: `You are a creative historical storyteller and biographer.
Your role is to craft engaging, realistic life narratives that respect historical facts and social constraints.
Create vivid, documentary-style narratives that feel authentic to the time period.
Balance storytelling with historical accuracy, making the character's life feel real and relatable.
You must respond with valid JSON only.`,

    pivotalMomentGeneration: `You are a dramatic historical writer specializing in critical decision points.
Your role is to identify and describe historically plausible pivotal moments in a character's life.
Create meaningful choices that have significant consequences and reflect the constraints and opportunities of the era.
Each choice should be compelling and force the player to consider historical context.
You must respond with valid JSON only.`,

    imagePromptGeneration: `You are an expert in historical visualization and documentary photography.
Your role is to create detailed, historically accurate image prompts that capture specific scenes from a character's life.
Focus on visual details that are authentic to the time period, including clothing, architecture, objects, lighting, and atmosphere.
Your prompts should be vivid and specific enough to guide accurate image generation in a documentary-realistic style.
You must respond with valid JSON only.`,

    imageGeneration: `Documentary-realistic historical photography style.`,

    locationResolution: `You are a meticulous historical toponymist.
Resolve modern coordinates and years into accurate historical place names.
Prefer historically appropriate country or polity names for the given year.
Return concise, factual information and note uncertainty when data is sparse.`
} as const

/**
 * User prompts are the actual instructions sent to the AI
 * These use template strings with ${variableName} placeholders
 */
export const USER_PROMPTS = {
  historicalContext: `Generate detailed historical context for the following specific date and location:
Date: \${date}
Location: \${location}

You must provide ACTUAL historical information (not templates or placeholders) in this EXACT JSON structure:

{
  "country": "The actual country or political entity that controlled this location at this time",
  "description": "A vivid, specific description of this place during this exact time period",
  "politicalSituation": {
    "rulers": ["Actual names of rulers/leaders at this time"],
    "governance": "The actual type of governance (e.g., 'Constitutional Republic', 'Monarchy')",
    "details": "Specific political context and events happening at this time"
  },
  "religion": {
    "dominant": "The actual dominant religion(s)",
    "culturalBackground": "Specific religious and cultural context of this time and place"
  },
  "socialStructure": "Detailed description of the actual class system and social hierarchy",
  "economy": "Specific economic conditions, industries, and trade of this time and place",
  "conflicts": ["Actual wars, conflicts, or tensions happening at this time"],
  "culturalHighlights": ["Specific notable cultural aspects, achievements, or figures of this era"],
  "additionalContext": {
    "key": "Any other relevant historical details"
  }
}

IMPORTANT: Provide real, specific historical data for \${location} on \${date}. Do NOT use placeholders, templates, or generic descriptions.`,

    personaGeneration: `Based on the following historical context, generate \${numberOfOptions} distinct persona options representing different types of people who could be born in these circumstances.

Historical Context:
\${historicalContextJson}

You must return EXACTLY this JSON structure with ACTUAL data for each persona:

{
  "options": [
    {
      "id": "persona-1",
      "title": "Brief descriptive title (e.g., 'Wealthy Merchant's Son')",
      "familyBackground": {
        "socialClass": "Specific social class",
        "occupation": "Family's actual occupation",
        "wealth": "poor" | "modest" | "comfortable" | "wealthy" | "very wealthy",
        "familySize": 5,
        "parentalStatus": "Both parents alive/Single parent/Orphan/etc.",
        "location": "Specific location within the area"
      },
      "birthCircumstances": "Specific circumstances of birth",
      "initialAttributes": {
        "gender": "male" | "female" | "other",
        "ethnicity": "Specific ethnicity",
        "physicalTraits": ["trait 1", "trait 2"],
        "earlyChildhood": "Description of early childhood"
      },
      "probability": 25,
      "opportunities": ["Specific opportunity 1", "opportunity 2"],
      "challenges": ["Specific challenge 1", "challenge 2"]
    }
  ],
  "timestamp": "2025-11-01T00:00:00.000Z"
}

IMPORTANT: 
- Generate exactly \${numberOfOptions} personas
- All probabilities must sum to roughly 100%
- Provide realistic, historically accurate personas based on the context
- Use real social classes, occupations, and circumstances from that era`,

    lifelineGeneration: `Generate a life narrative for the following character until they reach a pivotal moment in their life.

Historical Context:
\${historicalContextJson}

Selected Persona:
\${personaJson}

\${previousLifelineSection}

\${continuationContext}

You must return EXACTLY this JSON structure with ACTUAL narrative and events:

{
  "id": "lifeline-unique-id",
  "startAge": MUST_BE_NUMBER (use \${expectedStartAge} as the starting age),
  "endAge": MUST_BE_NUMBER (advance \${yearsToAdvance} years from startAge),
  "narrative": "A detailed, immersive narrative covering this period of life in 2-3 paragraphs. Write as if documenting a real person's life with specific details and experiences.",
  "events": [
    {
      "age": MUST_BE_NUMBER,
      "year": "Actual year",
      "event": "Specific event description",
      "impact": "minor" | "moderate" | "significant" | "major",
      "location": "Where it happened"
    }
  ],
  "characterDevelopment": {
    "skills": ["Specific skills learned"],
    "relationships": ["Key relationships formed"],
    "beliefs": ["Values and beliefs developed"],
    "reputation": "Their standing in community",
    "physicalCondition": "Their health and physical state",
    "mentalState": "Their mental and emotional state"
  },
  "pivotalMomentReached": true,
  "imagePrompt": "Scene description for image generation"
}

IMPORTANT:
- Start at age \${expectedStartAge} and advance \${yearsToAdvance} years
- Include 3-5 specific life events within this age range
- Build toward a natural decision point
- Maintain historical accuracy
- Write vivid, documentary-realistic narrative
\${ageRangeWarning}`,

    lifelineGenerationWithPreviousChoice: `\${previousLifelineSection}

The character chose: \${previousChoice}

Continue the narrative from this point, showing the consequences of this choice and leading to the next pivotal moment.`,

    pivotalMomentGeneration: `Generate a pivotal moment for the character based on their life so far.

Historical Context:
\${historicalContextJson}

Current Lifeline:
\${lifelineJson}

This is pivotal moment #\${momentNumber} in their life.

You must return EXACTLY this JSON structure with ACTUAL dramatic choices:

{
  "id": "pivotal-moment-unique-id",
  "age": MUST_BE_NUMBER (use the character's current age from the lifeline endAge: \${currentAge}),
  "year": "Actual year (calculate from birth year and current age)",
  "title": "Compelling title of the pivotal moment",
  "situation": "Detailed 2-3 sentence description of the situation the character faces",
  "context": "Why this moment is pivotal and what led to it",
  "stakes": "What is at stake - what could be lost or gained",
  "choices": [
    {
      "id": "choice-1",
      "title": "Short title for this choice",
      "description": "Detailed description of what this choice entails",
      "immediateConsequences": ["What happens right away", "Immediate result 2"],
      "potentialOutcomes": ["Possible long-term outcome 1", "outcome 2"],
      "risk": "low" | "medium" | "high" | "extreme",
      "alignment": ["Values this represents: duty, ambition, survival, etc."]
    }
  ],
  "timeConstraint": "Any time pressure or urgency",
  "influencingFactors": ["Factor 1", "Factor 2", "Factor 3"],
  "imagePrompt": "Scene description for visualization"
}

IMPORTANT:
- The pivotal moment MUST occur at the character's current age: \${currentAge}
- Present 3-4 meaningful choices
- Make each choice dramatically different
- Ensure choices emerge naturally from circumstances
- Reflect historical constraints and opportunities
- Make consequences clear and compelling`,

    imagePromptGeneration: `Generate a detailed image prompt for a documentary-realistic historical photograph.

Historical Context:
\${historicalContextJson}

\${sceneContext}

Create a prompt that describes ONE specific visual scene from the character's life that would make a powerful documentary photograph. The prompt must:
1. Describe a concrete moment in time (not abstract concepts)
2. Include specific visual details: clothing, setting, lighting, atmosphere, objects
3. Be historically accurate for the time period and location
4. Capture the emotional or dramatic essence of the moment
5. Be suitable for realistic photography style (not illustration or painting)

You must return EXACTLY this JSON structure:

{
  "id": "prompt-\${timestamp}",
  "prompt": "A detailed, specific description of the scene in 2-3 sentences, rich with visual details. Must be 150-300 characters and include specific period details.",
  "sourceType": "\${sourceType}",
  "sourceId": "\${sourceId}",
  "timestamp": "ISO timestamp"
}

IMPORTANT:
- The prompt should be 150-300 characters
- Focus on what can be SEEN in a photograph
- Include period-accurate details (clothing, architecture, objects, lighting)
- Specify the documentary-realistic style within the prompt
- Do not include abstract concepts or emotions that can't be visually shown`,

    imageGeneration: `Create a documentary-realistic historical image depicting:

\${sceneDescription}

Historical Context:
\${contextDescription}

Style: Documentary photography, historically accurate, vivid details, \${additionalStyleInstructions}`,

    locationResolution: `Given the following inputs, identify the historically appropriate place names.

Longitude: \${lon}
Latitude: \${lat}
Year: \${year}

Respond as strict JSON with keys:
- area (string, required)
- country (string | null)
- settlement (string | null)
- confidence (0-1 number; how confident you are)
- notes (string | null; caveats or data limitations)

Keep strings concise (max ~60 characters).`
} as const

/**
 * Helper function to fill in a prompt template with actual values
 */
export function fillPromptTemplate(
  template: string,
  variables: Record<string, string>
): string {
  let filledPrompt = template;

  for (const [key, value] of Object.entries(variables)) {
    // The template uses ${key} (literal characters), so we need to escape the regex special chars
    const placeholder = `\\$\\{${key}\\}`;
    filledPrompt = filledPrompt.replace(new RegExp(placeholder, "g"), value);
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
