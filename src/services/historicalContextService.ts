/**
 * Historical Context Service
 *
 * This service generates detailed historical context based on a date and location.
 * Now uses the unified agent executor system.
 */

import { HistoricalContext } from "@/types/context.types";
import { getAgentConfig } from "@/config/agents.config";
import { executeAgent } from "./agentExecutor";
import { readSession } from "./sessionService";

/**
 * Generate historical context from date and location
 *
 * @param sessionId - The session ID
 * @returns Structured historical context
 */
export async function generateHistoricalContext(
  sessionId: string
): Promise<HistoricalContext> {
  // Get agent configuration
  const agentConfig = getAgentConfig("historicalContext");

  // Execute agent (reads from session, writes to session)
  const result = await executeAgent(agentConfig, sessionId);

  // If agent didn't return data (mock mode), generate and add mock data
  if (!result) {
    const session = readSession(sessionId);
    const mockContext: HistoricalContext = {
      country: "Mock Country",
      description: `Historical context for ${session.input.location} in ${session.input.date}`,
      politicalSituation: {
        rulers: ["Mock Ruler"],
        governance: "Mock Governance System",
        details: "Mock political details",
      },
      religion: {
        dominant: "Mock Religion",
        culturalBackground: "Mock cultural background",
      },
      socialStructure: "Mock social structure",
      economy: "Mock economy",
      conflicts: ["Mock conflict"],
      culturalHighlights: ["Mock cultural highlight"],
      additionalContext: {
        note: "This is a placeholder. Replace with actual OpenAI call.",
      },
    };
    return mockContext;
  }

  // Read the result from session
  const session = readSession(sessionId);
  return session.historicalContext!;
}
