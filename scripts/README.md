# Test Workflow Script

This directory contains the interactive test script for the Time Travel Game agent workflow.

## Overview

The `test-workflow.ts` script allows you to test the complete agent system with:

- **Interactive console input** for initial parameters (date, location, time)
- **Step-by-step execution** with approval gates after each agent
- **Detailed logging** of inputs and outputs for each step
- **User selection** for personas and pivotal moment choices
- **Automatic looping** through multiple lifeline/pivotal moment cycles
- **Session data** saved to JSON files in the `sessions/` folder

## Prerequisites

Make sure you have the dependencies installed:

```bash
npm install
```

The script uses `tsx` to execute TypeScript directly. This is already added to `package.json`.

## Running the Test Script

```bash
npm run test-workflow
```

## Workflow Steps

The script will guide you through the following sequence:

### 1. Initial Setup
You will be prompted to enter:
- Historical date (e.g., `1789-07-14`)
- Location (e.g., `Paris, France`)
- Time of day (optional, e.g., `afternoon`)

### 2. Historical Context Generation
The first agent generates detailed historical context based on your inputs.

### 3. Persona Generation
Generates 4 persona options. You will be asked to select one.

### 4. Lifeline Generation (Repeatable)
Generates a life narrative from current age to the next pivotal moment.

### 5. Pivotal Moment (Repeatable)
Presents a critical decision with multiple choices. You select one.

### 6. Loop
Steps 4-5 repeat until:
- Maximum pivotal moments reached (default: 5)
- Character dies
- Other end condition met

## Session Files

Each test run creates a new session file in the `sessions/` folder with the format:

```
session-YYYYMMDD-HHMMSS.json
```

The session file contains:
- All inputs and outputs from each agent
- User selections (persona, choices)
- Execution logs with timestamps
- Complete game state

## Example Run

```bash
$ npm run test-workflow

=== Time Travel Game - Workflow Test ===

This script will guide you through the complete agent workflow.
You will be prompted for input and asked to approve each step.

Initial Setup
Enter historical date (e.g., 1789-07-14): 1789-07-14
Enter location (e.g., Paris, France): Paris
Enter time of day (optional, e.g., afternoon): afternoon

✅ Session created: session-20251101-143022
📁 Session file: /path/to/sessions/session-20251101-143022.json

⏸️  Press Enter to continue...

=== STEP 1: Historical Context Agent ===

📥 INPUT:
   input.date: 1789-07-14
   input.location: Paris

🔄 Executing agent...
   🔧 Using mock data (OpenAI calls not yet enabled)

📤 OUTPUT:
Historical Context: {...}

✅ Agent execution completed

⏸️  Press Enter to continue...

[continues through all steps...]
```

## Mock vs Real Data

Currently, the script uses **mock data** because OpenAI API calls are not yet enabled. To enable real OpenAI calls:

1. Set your `OPENAI_API_KEY` in `.env.local`
2. Uncomment the OpenAI call code in `src/services/agentExecutor.ts`

## Debugging

All agent executions are logged to the session JSON file with:
- Agent name
- Start/end timestamps
- Duration in milliseconds
- Input data
- Output data
- Success/failure status
- Error messages (if any)

You can review these logs in the session file for debugging.

## Customization

You can customize the workflow by modifying:

- **`src/config/agents.config.ts`** - Agent configurations, prompts, models
- **`src/config/workflow.config.ts`** - Game configuration (max moments, persona count, etc.)
- **`src/config/prompts.config.ts`** - AI prompts for each agent
- **`src/config/models.config.ts`** - Model selection and parameters

## Architecture

The new agent system uses:

- **Unified agent configuration** - All agents follow the same structure
- **Session-based communication** - Agents read/write through session JSON
- **Generic executor** - Single executor can run any configured agent
- **Branching logic** - Agents determine the next step dynamically

Historical context is now treated as a regular agent in the sequence, not a special service.

