# Workflow Branching Fix Summary

## Problem Description

The workflow was not properly handling user selections, causing it to skip the lifeline generation step after a pivotal moment was selected. Instead of the expected flow:

```
Pivotal Moment → User Choice → Lifeline → Pivotal Moment → ...
```

The actual flow was:

```
Pivotal Moment → User Choice → Pivotal Moment (skipping Lifeline)
```

## Root Cause

The `getNextAgent()` function in `src/config/agents.config.ts` was treating both `'always'` and `'userSelection'` conditions the same way. It didn't distinguish between:
1. Automatic progression (no user input needed)
2. User selection required (should pause until user acts)

The problematic code (line 305):
```typescript
if (rule.condition === 'always' || rule.condition === 'userSelection') {
  return rule.nextAgentId as AgentType;
}
```

This meant the workflow would immediately proceed to the next agent even when it should wait for user input.

## Solution

### 1. Updated `getNextAgent()` Function

Added a new parameter `userJustMadeSelection` to track whether the user has made a selection:

```typescript
export function getNextAgent(
  currentAgentId: AgentType,
  sessionData: SessionData,
  userJustMadeSelection: boolean = false
): AgentType | null
```

### 2. Added Logic to Pause for User Input

The function now checks if an agent requires user input and pauses the workflow until the user acts:

```typescript
// Check if current agent requires user input
if (currentAgent.requiresUserInput && !userJustMadeSelection) {
  // Agent requires user input but user hasn't made a selection yet
  // Return null to pause the workflow
  return null;
}
```

### 3. Separated Condition Handling

The function now properly distinguishes between different conditions:

```typescript
// Find applicable next agent rule
for (const rule of currentAgent.nextAgentRules) {
  if (rule.condition === 'always') {
    return rule.nextAgentId as AgentType;
  }
  
  // Only proceed on userSelection if user has made a selection
  if (rule.condition === 'userSelection' && userJustMadeSelection) {
    return rule.nextAgentId as AgentType;
  }
  
  if (rule.condition === 'endCondition') {
    continue;
  }
}
```

### 4. Updated Test Workflow Script

Modified `scripts/test-workflow.ts` to track when users make selections and pass this information to `getNextAgent()`:

```typescript
// Track whether user made a selection in this step
let userMadeSelection = false;

// After persona selection:
userMadeSelection = true;

// After pivotal moment choice:
userMadeSelection = true;

// When determining next agent:
currentAgent = getNextAgent(currentAgent, sessionData, userMadeSelection);
```

### 5. Added Type Safety

- Replaced `any` type with proper `SessionData` type for better type checking
- Added `characterDied?: boolean` field to `PivotalMoment` type for proper end condition checking

## How the Fixed Workflow Works

### Step-by-Step Flow

1. **Historical Context** → Always proceeds to Persona Generation
2. **Persona Generation** → Pauses (requiresUserInput: true)
   - User selects a persona
   - Proceeds to Lifeline Generation with `userJustMadeSelection: true`
3. **Lifeline Generation** → Always proceeds to Pivotal Moment Generation
4. **Pivotal Moment Generation** → Pauses (requiresUserInput: true)
   - User makes a choice
   - Proceeds to Lifeline Generation with `userJustMadeSelection: true`
5. **Repeat steps 3-4** until end condition (max moments or character death)

### Key Programming Concepts

#### 1. **State Machine Pattern**
The workflow acts as a state machine where:
- **States** = Different agents (historicalContext, personaGeneration, etc.)
- **Transitions** = Rules that determine the next agent
- **Guards** = Conditions that control when transitions can occur (e.g., user input)

#### 2. **Conditional Branching**
The `nextAgentRules` array defines multiple possible paths:
```typescript
nextAgentRules: [
  {
    condition: 'userSelection',
    nextAgentId: 'lifelineGeneration',
  },
  {
    condition: 'endCondition',
    nextAgentId: undefined, // End the workflow
  },
]
```

The system evaluates these rules in order and picks the first applicable one.

#### 3. **Pause/Resume Pattern**
By returning `null` from `getNextAgent()`, the workflow "pauses" and waits for:
- User interaction (selecting a persona or choice)
- External trigger to resume with the appropriate flag

This is similar to async/await patterns where execution pauses until a condition is met.

#### 4. **Type Safety with TypeScript**
Using proper types like `SessionData` instead of `any`:
- Catches errors at compile time
- Provides better IDE autocomplete
- Makes code more maintainable
- Prevents accessing non-existent properties

#### 5. **Boolean Flags for State Tracking**
The `userJustMadeSelection` parameter is a flag that carries state information:
- `false` (default) = No user action yet, may need to pause
- `true` = User just acted, proceed to next step

This is a simple but effective way to track state across function calls.

## Files Modified

1. **src/config/agents.config.ts**
   - Updated `getNextAgent()` function signature
   - Added logic to handle user selection conditions
   - Added proper TypeScript types

2. **scripts/test-workflow.ts**
   - Added `userMadeSelection` tracking variable
   - Updated calls to `getNextAgent()` with the new parameter

3. **src/types/pivotalMoment.types.ts**
   - Added `characterDied?: boolean` field to `PivotalMoment` interface

## Testing

To test the fixed workflow, run:

```bash
npx tsx scripts/test-workflow.ts
```

You should now see the correct flow:
1. Historical Context generation
2. Persona options generated → User selects
3. **Lifeline generated** (this was being skipped before)
4. Pivotal moment generated → User chooses
5. **Lifeline generated** (continuing the story)
6. Pivotal moment generated → User chooses
7. Repeat until end condition

## Future Considerations

For the web frontend, you'll need to:

1. **Store workflow state in the session**
   - Track which agent needs to run next
   - Track whether we're waiting for user input

2. **API endpoints for user actions**
   - POST /api/select-persona → triggers lifeline generation
   - POST /api/make-choice → triggers next lifeline generation

3. **Frontend state management**
   - Display the current step
   - Show/hide UI based on whether user input is needed
   - Poll or use websockets to get agent results

## Notes

- The `getNextAgent()` function is pure logic and doesn't have side effects
- All workflow state is stored in the session JSON file
- The workflow is deterministic given the same inputs
- User selections are recorded in the session for reproducibility

