/**
 * Session Service
 * 
 * Manages session JSON files that serve as the communication medium between agents.
 * All agents read from and write to session files.
 */

import fs from 'fs';
import path from 'path';
import {
  SessionData,
  SessionInput,
  SessionConfig,
  createEmptySession,
  UserChoice,
  ImagePrompt,
  GeneratedImage,
  AgentExecutionLog,
} from '@/types/session.types';
import { HistoricalContext } from '@/types/context.types';
import { PersonaOptions, PersonaOption } from '@/types/persona.types';
import { Lifeline } from '@/types/lifeline.types';
import { PivotalMoment } from '@/types/pivotalMoment.types';

// Sessions directory path
const SESSIONS_DIR = path.join(process.cwd(), 'sessions');

/**
 * Ensure sessions directory exists
 */
function ensureSessionsDirectory(): void {
  if (!fs.existsSync(SESSIONS_DIR)) {
    fs.mkdirSync(SESSIONS_DIR, { recursive: true });
  }
}

/**
 * Generate a session ID with timestamp
 */
export function generateSessionId(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hour = String(now.getHours()).padStart(2, '0');
  const minute = String(now.getMinutes()).padStart(2, '0');
  const second = String(now.getSeconds()).padStart(2, '0');
  
  return `session-${year}${month}${day}-${hour}${minute}${second}`;
}

/**
 * Get the folder path for a session
 */
export function getSessionFolderPath(sessionId: string): string {
  return path.join(SESSIONS_DIR, sessionId);
}

/**
 * Get the JSON file path for a session (new folder structure)
 */
function getSessionFilePath(sessionId: string): string {
  return path.join(getSessionFolderPath(sessionId), 'session.json');
}

/**
 * Get the old flat file path for a session (for backward compatibility)
 */
function getOldSessionFilePath(sessionId: string): string {
  return path.join(SESSIONS_DIR, `${sessionId}.json`);
}

/**
 * Ensure session folder exists
 */
function ensureSessionFolder(sessionId: string): void {
  const folderPath = getSessionFolderPath(sessionId);
  if (!fs.existsSync(folderPath)) {
    fs.mkdirSync(folderPath, { recursive: true });
  }
}

/**
 * Create a new session
 */
export function createSession(
  input: SessionInput,
  config: SessionConfig = {}
): { sessionId: string; session: SessionData } {
  ensureSessionsDirectory();
  
  const sessionId = generateSessionId();
  const session = createEmptySession(sessionId, input, config);
  
  // Create session folder and write session.json file
  ensureSessionFolder(sessionId);
  const filePath = getSessionFilePath(sessionId);
  fs.writeFileSync(filePath, JSON.stringify(session, null, 2), 'utf-8');
  
  return { sessionId, session };
}

/**
 * Read a session from file
 * Supports both new folder structure and old flat file structure for backward compatibility
 */
export function readSession(sessionId: string): SessionData {
  let filePath = getSessionFilePath(sessionId);
  
  // Check new folder structure first
  if (!fs.existsSync(filePath)) {
    // Fall back to old flat file structure
    const oldPath = getOldSessionFilePath(sessionId);
    if (fs.existsSync(oldPath)) {
      filePath = oldPath;
    } else {
      throw new Error(`Session file not found: ${sessionId}`);
    }
  }
  
  const content = fs.readFileSync(filePath, 'utf-8');
  return JSON.parse(content) as SessionData;
}

/**
 * Write session data to file
 * Always writes to new folder structure
 */
export function writeSession(sessionId: string, session: SessionData): void {
  ensureSessionFolder(sessionId);
  const filePath = getSessionFilePath(sessionId);
  fs.writeFileSync(filePath, JSON.stringify(session, null, 2), 'utf-8');
}

/**
 * Update session with partial data
 */
export function updateSession(
  sessionId: string,
  updates: Partial<SessionData>
): SessionData {
  const session = readSession(sessionId);
  const updatedSession = { ...session, ...updates };
  writeSession(sessionId, updatedSession);
  return updatedSession;
}

/**
 * Update session metadata
 */
export function updateSessionMetadata(
  sessionId: string,
  updates: Partial<SessionData['metadata']>
): SessionData {
  const session = readSession(sessionId);
  session.metadata = { ...session.metadata, ...updates };
  writeSession(sessionId, session);
  return session;
}

/**
 * Add historical context to session
 */
export function addHistoricalContext(
  sessionId: string,
  context: HistoricalContext
): SessionData {
  const session = readSession(sessionId);
  session.historicalContext = context;
  writeSession(sessionId, session);
  return session;
}

/**
 * Add persona options to session
 */
export function addPersonaOptions(
  sessionId: string,
  options: PersonaOptions
): SessionData {
  const session = readSession(sessionId);
  session.personaOptions = options;
  writeSession(sessionId, session);
  return session;
}

/**
 * Set selected persona in session
 */
export function setSelectedPersona(
  sessionId: string,
  persona: PersonaOption
): SessionData {
  const session = readSession(sessionId);
  session.selectedPersona = persona;
  writeSession(sessionId, session);
  return session;
}

/**
 * Add a lifeline to session
 */
export function addLifeline(
  sessionId: string,
  lifeline: Lifeline
): SessionData {
  const session = readSession(sessionId);
  session.lifelines.push(lifeline);
  session.gameState.currentAge = lifeline.endAge;
  writeSession(sessionId, session);
  return session;
}

/**
 * Add a pivotal moment to session
 */
export function addPivotalMoment(
  sessionId: string,
  moment: PivotalMoment
): SessionData {
  const session = readSession(sessionId);
  session.pivotalMoments.push(moment);
  writeSession(sessionId, session);
  return session;
}

/**
 * Add a user choice to session
 */
export function addUserChoice(
  sessionId: string,
  choice: UserChoice
): SessionData {
  const session = readSession(sessionId);
  session.choices.push(choice);
  writeSession(sessionId, session);
  return session;
}

/**
 * Add an image prompt to session
 */
export function addImagePrompt(
  sessionId: string,
  imagePrompt: ImagePrompt
): SessionData {
  const session = readSession(sessionId);
  session.imagePrompts.push(imagePrompt);
  writeSession(sessionId, session);
  return session;
}

/**
 * Add an image to session
 */
export function addImage(
  sessionId: string,
  image: GeneratedImage
): SessionData {
  const session = readSession(sessionId);
  session.images.push(image);
  writeSession(sessionId, session);
  return session;
}

/**
 * Add an execution log entry
 */
export function addExecutionLog(
  sessionId: string,
  log: AgentExecutionLog
): SessionData {
  const session = readSession(sessionId);
  session.executionLogs.push(log);
  session.metadata.totalSteps = session.executionLogs.length;
  writeSession(sessionId, session);
  return session;
}

/**
 * End the session (mark as completed or failed)
 */
export function endSession(
  sessionId: string,
  status: 'completed' | 'failed',
  reason?: string
): SessionData {
  const session = readSession(sessionId);
  session.metadata.status = status;
  session.metadata.endTime = new Date().toISOString();
  
  if (reason) {
    session.gameState.endReason = reason;
  }
  
  if (status === 'completed') {
    session.gameState.isAlive = session.gameState.endReason !== 'death';
  }
  
  writeSession(sessionId, session);
  return session;
}

/**
 * Get input data for a specific agent from session
 */
export function getAgentInput(
  sessionId: string,
  inputFields: Array<{ field: string; required: boolean }>
): Record<string, any> {
  const session = readSession(sessionId);
  const input: Record<string, any> = {};
  
  for (const { field, required } of inputFields) {
    const value = getNestedValue(session, field);
    
    if (required && value === undefined) {
      throw new Error(`Required input field missing: ${field}`);
    }
    
    if (value !== undefined) {
      input[field] = value;
    }
  }
  
  return input;
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
 * Set a nested value in an object using dot notation
 */
export function setNestedValue(obj: any, path: string, value: any): void {
  const keys = path.split('.');
  const lastKey = keys.pop()!;
  let current = obj;
  
  for (const key of keys) {
    if (!(key in current)) {
      current[key] = {};
    }
    current = current[key];
  }
  
  current[lastKey] = value;
}

/**
 * Write agent output to session
 */
export function writeAgentOutput(
  sessionId: string,
  outputField: string,
  output: any
): SessionData {
  const session = readSession(sessionId);
  
  // Handle array fields (lifelines, pivotalMoments, images, etc.)
  if (outputField === 'lifelines' || 
      outputField === 'pivotalMoments' || 
      outputField === 'images' ||
      outputField === 'imagePrompts' ||
      outputField === 'choices') {
    if (!Array.isArray(session[outputField as keyof SessionData])) {
      (session as any)[outputField] = [];
    }
    (session as any)[outputField].push(output);
  } else {
    // Handle single value fields
    setNestedValue(session, outputField, output);
  }
  
  writeSession(sessionId, session);
  return session;
}

/**
 * List all session files (supports both old and new structures)
 */
export function listSessions(): string[] {
  ensureSessionsDirectory();
  
  const items = fs.readdirSync(SESSIONS_DIR);
  const sessions: string[] = [];
  
  for (const item of items) {
    const itemPath = path.join(SESSIONS_DIR, item);
    const stat = fs.statSync(itemPath);
    
    if (stat.isDirectory() && item.startsWith('session-')) {
      // New folder structure
      sessions.push(item);
    } else if (stat.isFile() && item.startsWith('session-') && item.endsWith('.json')) {
      // Old flat file structure
      sessions.push(item.replace('.json', ''));
    }
  }
  
  return sessions;
}

/**
 * Get session file path for external use
 */
export function getSessionPath(sessionId: string): string {
  return getSessionFilePath(sessionId);
}

/**
 * Get the path for saving an image file in the session folder
 */
export function getImageFilePath(sessionId: string, imageId: string): string {
  const folderPath = getSessionFolderPath(sessionId);
  return path.join(folderPath, `${imageId}.png`);
}

/**
 * Migrate an old flat-file session to the new folder structure
 */
export function migrateSessionToFolder(sessionId: string): boolean {
  const oldPath = getOldSessionFilePath(sessionId);
  
  // Check if old file exists
  if (!fs.existsSync(oldPath)) {
    return false;
  }
  
  // Check if already migrated
  const newPath = getSessionFilePath(sessionId);
  if (fs.existsSync(newPath)) {
    return true; // Already migrated
  }
  
  try {
    // Read old session data
    const content = fs.readFileSync(oldPath, 'utf-8');
    const session = JSON.parse(content) as SessionData;
    
    // Create new folder structure
    ensureSessionFolder(sessionId);
    
    // Write to new location
    fs.writeFileSync(newPath, JSON.stringify(session, null, 2), 'utf-8');
    
    // Optionally delete old file (commented out for safety)
    // fs.unlinkSync(oldPath);
    
    console.log(`✅ Migrated session ${sessionId} to folder structure`);
    return true;
  } catch (error) {
    console.error(`Failed to migrate session ${sessionId}:`, error);
    return false;
  }
}

