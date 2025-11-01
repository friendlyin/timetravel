/**
 * Pivotal Moment Service
 * 
 * This service generates pivotal moments in a character's life - critical
 * decision points that significantly impact their future. Now uses the unified agent executor system.
 */

import { PivotalMoment } from '@/types/pivotalMoment.types';
import { getAgentConfig } from '@/config/agents.config';
import { executeAgent } from './agentExecutor';
import { readSession } from './sessionService';

/**
 * Generate a pivotal moment with multiple choice options
 * 
 * This function can be called multiple times throughout a character's life,
 * creating different pivotal moments at different ages.
 * 
 * @param sessionId - The session ID
 * @returns A pivotal moment with multiple choice options
 */
export async function generatePivotalMoment(
  sessionId: string
): Promise<PivotalMoment> {
  // Get agent configuration
  const agentConfig = getAgentConfig('pivotalMomentGeneration');
  
  // Execute agent (reads from session, writes to session)
  const result = await executeAgent(agentConfig, sessionId);
  
  // If agent didn't return data (mock mode), generate and add mock data
  if (!result) {
    const session = readSession(sessionId);
    const currentLifeline = session.lifelines[session.lifelines.length - 1];
    const momentNumber = session.pivotalMoments.length + 1;
    
    const mockMoment: PivotalMoment = {
      id: `pivotal-moment-${Date.now()}`,
      age: currentLifeline?.endAge || 15,
      year: session.input.date,
      title: `Critical Decision #${momentNumber}`,
      situation: `At age ${currentLifeline?.endAge || 15}, you face a critical moment that will shape your future. The world around you is changing, and you must decide how to respond.`,
      context: `This moment emerges from your circumstances and the historical period. Your choices will have lasting consequences.`,
      stakes: 'Your future direction, relationships, and opportunities hang in the balance.',
      choices: [
        {
          id: 'choice-1',
          title: 'Take the Safe Path',
          description: 'Continue with tradition and maintain stability. Follow the expected course for someone of your background.',
          immediateConsequences: [
            'Maintain current relationships',
            'Avoid immediate risks',
          ],
          potentialOutcomes: [
            'Steady but limited progress',
            'Community approval',
          ],
          risk: 'low',
          alignment: ['safety', 'tradition', 'duty'],
        },
        {
          id: 'choice-2',
          title: 'Seize an Opportunity',
          description: 'Take a risk to improve your situation. This could lead to advancement but comes with uncertainty.',
          immediateConsequences: [
            'Some relationships strained',
            'Immediate challenges to overcome',
          ],
          potentialOutcomes: [
            'Potential for advancement',
            'New connections and skills',
            'Risk of failure',
          ],
          risk: 'medium',
          alignment: ['ambition', 'change', 'courage'],
        },
        {
          id: 'choice-3',
          title: 'Break with Convention',
          description: 'Make a bold choice that goes against expectations. High risk, high reward.',
          immediateConsequences: [
            'Social disapproval',
            'Immediate hardship',
          ],
          potentialOutcomes: [
            'Possibility of great success',
            'Complete change of circumstances',
            'Risk of ostracism or worse',
          ],
          risk: 'high',
          alignment: ['independence', 'rebellion', 'vision'],
        },
      ],
      timeConstraint: 'You must decide soon, as circumstances are forcing your hand.',
      influencingFactors: [
        'Your family\'s expectations',
        'The historical context of the time',
        'Your own skills and character',
      ],
      imagePrompt: `A person at a crossroads at age ${currentLifeline?.endAge || 15} in ${session.input.location}, ${session.input.date}`,
    };
    return mockMoment;
  }
  
  // Read the result from session and get latest moment
  const session = readSession(sessionId);
  return session.pivotalMoments[session.pivotalMoments.length - 1];
}

