/**
 * Types for historical context generation
 */

export interface HistoricalContextInput {
  date: string; // ISO date format or descriptive date (e.g., "1450-03-15" or "March 15, 1450")
  location: string; // Geographical location (e.g., "Florence, Italy" or "Tenochtitlan")
}

export interface HistoricalContext {
  country: string; // Country or equivalent political structure
  description: string; // Description of the place and time period
  politicalSituation: {
    rulers: string[]; // Names of rulers or leaders
    governance: string; // Type of governance (monarchy, republic, empire, etc.)
    details: string; // Additional political context
  };
  religion: {
    dominant: string; // Dominant religion(s)
    culturalBackground: string; // Religious and cultural context
  };
  socialStructure: string; // Class system, social hierarchy
  economy: string; // Economic situation and primary industries
  conflicts: string[]; // Ongoing wars, conflicts, or tensions
  culturalHighlights: string[]; // Notable cultural aspects of the time
  additionalContext: Record<string, unknown>; // Flexible field for other contextual information
}
