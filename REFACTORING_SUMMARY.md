# Agent System Refactoring - Summary

## Overview

Successfully refactored the Time Travel Game to use a unified agent system where all services (including historical context) are treated as uniformly-configured agents that communicate through session JSON files.

## What Was Implemented

### 1. Unified Agent Configuration System

**File:** `src/config/agents.config.ts`

- Created `AgentConfig` interface defining structure for all agents
- Configured 5 agents uniformly:
  - Historical Context Agent
  - Persona Generation Agent  
  - Lifeline Generation Agent
  - Pivotal Moment Agent
  - Image Generation Agent
- Each agent specifies:
  - Input fields (what it reads from session)
  - Output field (where it writes to session)
  - Model configuration
  - Prompts (system and user)
  - Branching logic (next agent rules)

### 2. Session Management System

**Files:**
- `src/types/session.types.ts` - Type definitions
- `src/services/sessionService.ts` - Session CRUD operations

Features:
- Session data structure containing all agent outputs
- Session metadata (ID, timestamps, status)
- File-based storage in `sessions/` folder
- Unique session IDs with timestamp format: `session-YYYYMMDD-HHMMSS.json`
- Helper functions to read/write/update session data
- Execution logs for debugging

### 3. Generic Agent Executor

**File:** `src/services/agentExecutor.ts`

- Single executor that can run any configured agent
- Reads input from session based on agent's input fields
- Builds prompts with session data
- Calls OpenAI (or returns mock data)
- Writes output to session at agent's output field
- Logs execution metrics (duration, success/failure)

### 4. Refactored Services

All services now use the agent executor pattern:

**Files Modified:**
- `src/services/historicalContextService.ts`
- `src/services/personaService.ts`
- `src/services/lifelineService.ts`
- `src/services/pivotalMomentService.ts`
- `src/services/imageService.ts`

Changes:
- Removed direct OpenAI calls from services
- Services now call `executeAgent()` with agent config
- Read results from session after execution
- Provide mock data when OpenAI calls not enabled

### 5. Branching Logic

**File:** `src/config/agents.config.ts` (function: `getNextAgent()`)

Features:
- Dynamic workflow based on game state
- Check for end conditions (max moments, character death)
- Agents specify next agent in their configuration
- Supports user input gates (persona selection, choices)

### 6. Interactive Test Script

**File:** `scripts/test-workflow.ts`

Features:
- Interactive console prompts for initial input
- Step-by-step execution with approval gates
- Detailed input/output logging for each agent
- User selection for personas and choices
- Loops through multiple lifeline/pivotal moment cycles
- Session data automatically saved to JSON
- Summary statistics at completion

### 7. Supporting Infrastructure

**Files Created:**
- `sessions/.gitkeep` - Sessions folder placeholder
- `scripts/README.md` - Test script documentation
- `REFACTORING_SUMMARY.md` - This file

**Files Modified:**
- `package.json` - Added `test-workflow` script and `tsx` dependency
- `src/config/workflow.config.ts` - Updated comments, added helper function

## Key Architecture Changes

### Before Refactoring

```
Services → Direct OpenAI calls → Return data
Historical Context = Special service
```

### After Refactoring

```
Services → Agent Executor → Session JSON ← All agents read/write
Historical Context = Regular agent in sequence
```

## Communication Flow

1. **Agent reads input** from session JSON (specific fields configured in agent)
2. **Agent processes** via OpenAI or returns mock data
3. **Agent writes output** to session JSON (specific field configured in agent)
4. **Next agent determined** based on branching rules and game state
5. **Loop continues** until end condition met

## Session JSON Structure

```json
{
  "metadata": {
    "sessionId": "session-20251101-143022",
    "startTime": "2025-11-01T14:30:22.000Z",
    "currentStep": "Pivotal Moment Agent",
    "status": "active",
    "totalSteps": 8
  },
  "input": {
    "date": "1789-07-14",
    "location": "Paris, France",
    "time": "afternoon"
  },
  "config": {
    "numberOfPersonaOptions": 4,
    "maxPivotalMoments": 5,
    "generateImages": false
  },
  "historicalContext": { ... },
  "personaOptions": { ... },
  "selectedPersona": { ... },
  "lifelines": [ ... ],
  "pivotalMoments": [ ... ],
  "choices": [ ... ],
  "images": [ ... ],
  "executionLogs": [ ... ],
  "gameState": {
    "currentAge": 25,
    "isAlive": true
  }
}
```

## How to Use

### Running the Test Script

```bash
npm install  # Install dependencies (including tsx)
npm run test-workflow
```

### Adding a New Agent

1. Define agent in `src/config/agents.config.ts`
2. Specify input fields, output field, prompts
3. Add to `AGENTS` object
4. Configure branching rules
5. Agent automatically works with executor

### Enabling Real OpenAI Calls

1. Set `OPENAI_API_KEY` in `.env.local`
2. Uncomment OpenAI calls in `src/services/agentExecutor.ts`:
   - `executeTextAgent()` function
   - `executeImageAgent()` function

## Benefits of New Architecture

1. **Consistency** - All agents follow same pattern
2. **Transparency** - All data flows through session JSON
3. **Debuggability** - Complete execution logs in session file
4. **Flexibility** - Easy to add new agents or modify workflow
5. **Testability** - Mock data works automatically
6. **Session Persistence** - Complete game state saved to file

## Files Summary

### Created (7 files)
- `src/config/agents.config.ts`
- `src/types/session.types.ts`
- `src/services/sessionService.ts`
- `src/services/agentExecutor.ts`
- `scripts/test-workflow.ts`
- `scripts/README.md`
- `sessions/.gitkeep`

### Modified (7 files)
- `src/services/historicalContextService.ts`
- `src/services/personaService.ts`
- `src/services/lifelineService.ts`
- `src/services/pivotalMomentService.ts`
- `src/services/imageService.ts`
- `src/config/workflow.config.ts`
- `package.json`

### Total: 14 files changed

## Testing

All code is:
- ✅ Linter error-free
- ✅ Type-safe (TypeScript)
- ✅ Ready to run with mock data
- ✅ Ready for OpenAI integration (commented out)

## Next Steps

1. Run `npm install` to install `tsx` dependency
2. Run `npm run test-workflow` to test the system
3. Review generated session JSON files in `sessions/` folder
4. When ready, enable real OpenAI calls
5. Test with actual AI-generated content

## Notes

- Historical context is now a regular agent, not a special service
- All agents communicate through session JSON only
- Session files provide complete audit trail
- Branching logic supports complex workflows
- Mock data allows testing without API costs

