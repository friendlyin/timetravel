/**
 * Persona Service
 * 
 * This service generates possible personas (character options) based on
 * the historical context. Now uses the unified agent executor system.
 */

import { PersonaOptions } from '@/types/persona.types';
import { getAgentConfig } from '@/config/agents.config';
import { executeAgent } from './agentExecutor';
import { readSession } from './sessionService';
import { GAME_CONFIG } from '@/config/workflow.config';

/**
 * Generate persona options based on historical context
 * 
 * @param sessionId - The session ID
 * @returns Multiple persona options for the player to choose from
 */
export async function generatePersonaOptions(
  sessionId: string
): Promise<PersonaOptions> {
  // Get agent configuration
  const agentConfig = getAgentConfig('personaGeneration');
  
  // Execute agent (reads from session, writes to session)
  const result = await executeAgent(agentConfig, sessionId);
  
  // If agent didn't return data (mock mode), generate and add mock data
  if (!result) {
    const session = readSession(sessionId);
    const numberOfOptions = session.config.numberOfPersonaOptions || GAME_CONFIG.defaultPersonaOptions;
    const mockOptions: PersonaOptions = {
      options: [
        {
          id: 'persona-1',
          title: 'Noble Merchant\'s Child',
          familyBackground: {
            socialClass: 'Upper Middle Class',
            occupation: 'Merchant',
            wealth: 'wealthy',
            familySize: 5,
            parentalStatus: 'Both parents alive',
            location: session.input.location,
          },
          birthCircumstances: 'Born into a prosperous merchant family',
          initialAttributes: {
            gender: 'male',
            ethnicity: 'Local',
            physicalTraits: ['Healthy', 'Well-fed'],
            earlyChildhood: 'Comfortable upbringing with education',
          },
          probability: 20,
          opportunities: ['Education', 'Business connections', 'Travel'],
          challenges: ['Maintaining family reputation', 'Political instability'],
        },
        {
          id: 'persona-2',
          title: 'Peasant Farmer\'s Child',
          familyBackground: {
            socialClass: 'Lower Class',
            occupation: 'Farmer',
            wealth: 'poor',
            familySize: 8,
            parentalStatus: 'Both parents alive',
            location: session.input.location,
          },
          birthCircumstances: 'Born into a large farming family',
          initialAttributes: {
            gender: 'female',
            ethnicity: 'Local',
            physicalTraits: ['Hardy', 'Strong'],
            earlyChildhood: 'Hard work from young age',
          },
          probability: 50,
          opportunities: ['Community support', 'Land inheritance'],
          challenges: ['Poverty', 'Disease', 'Taxes', 'Limited social mobility'],
        },
        {
          id: 'persona-3',
          title: 'Artisan\'s Apprentice',
          familyBackground: {
            socialClass: 'Middle Class',
            occupation: 'Artisan',
            wealth: 'modest',
            familySize: 4,
            parentalStatus: 'Both parents alive',
            location: session.input.location,
          },
          birthCircumstances: 'Born to a skilled craftsperson',
          initialAttributes: {
            gender: 'male',
            ethnicity: 'Local',
            physicalTraits: ['Dexterous hands', 'Good eyesight'],
            earlyChildhood: 'Learning trade from parents',
          },
          probability: 25,
          opportunities: ['Skill development', 'Guild membership', 'Urban life'],
          challenges: ['Economic competition', 'Guild restrictions'],
        },
        {
          id: 'persona-4',
          title: 'Orphan',
          familyBackground: {
            socialClass: 'Lower Class',
            occupation: 'Various',
            wealth: 'poor',
            familySize: 0,
            parentalStatus: 'Orphan',
            location: session.input.location,
          },
          birthCircumstances: 'Parents died in circumstances unknown',
          initialAttributes: {
            gender: 'female',
            ethnicity: 'Local',
            physicalTraits: ['Malnourished', 'Scrappy'],
            earlyChildhood: 'Survival on the streets',
          },
          probability: 5,
          opportunities: ['Freedom from obligations', 'Adaptability'],
          challenges: ['Lack of support', 'Hunger', 'Danger', 'No education'],
        },
      ].slice(0, numberOfOptions),
      timestamp: new Date().toISOString(),
    };
    return mockOptions;
  }
  
  // Read the result from session
  const session = readSession(sessionId);
  return session.personaOptions!;
}

