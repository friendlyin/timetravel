# Lifeline Continuation Fix

## Problem Summary

After a user selected a pivotal moment choice, the second lifeline generation:
1. **Regenerated from age 0-15** (same as the first lifeline) instead of continuing from age 15+
2. **Ignored the user's choice** at the pivotal moment
3. **Pivotal moment had wrong age** (showed age 25 when lifeline only went to 15)

## Root Cause Analysis

### Issue 1: Hardcoded Example Ages in Prompts

The LLM prompt templates contained hardcoded example values that the AI was copying literally:

**In `lifelineGeneration` prompt:**
```json
{
  "startAge": 0,      // ❌ Always shows 0
  "endAge": 15,       // ❌ Always shows 15
  ...
}
```

**In `pivotalMomentGeneration` prompt:**
```json
{
  "age": 25,          // ❌ Hardcoded to 25
  ...
}
```

### Issue 2: No Continuation Context

The prompt didn't distinguish between:
- **First lifeline** (birth to first pivotal moment)
- **Continuation lifeline** (after user makes a choice)

The LLM had no instructions to:
- Continue from the previous lifeline's end age
- Incorporate the consequences of the user's choice
- Advance the timeline forward

### Issue 3: Missing Dynamic Variables

The `buildPromptVariables()` function didn't provide:
- `expectedStartAge` - what age to start from
- `yearsToAdvance` - how many years to cover
- `continuationContext` - explanation that this is continuing a story
- `currentAge` - for pivotal moment generation

## The Fix

### 1. Updated Lifeline Generation Prompt

**Changed from hardcoded examples to dynamic placeholders:**

```typescript
{
  "startAge": MUST_BE_NUMBER (use ${expectedStartAge} as the starting age),
  "endAge": MUST_BE_NUMBER (advance ${yearsToAdvance} years from startAge),
  ...
}
```

**Added continuation context section:**
```
${continuationContext}
```

**Added explicit age instructions:**
```
IMPORTANT:
- Start at age ${expectedStartAge} and advance ${yearsToAdvance} years
- Include 3-5 specific life events within this age range
...
${ageRangeWarning}
```

### 2. Updated Pivotal Moment Prompt

**Changed from hardcoded age:**
```json
{
  "age": MUST_BE_NUMBER (use the character's current age from the lifeline endAge: ${currentAge}),
  ...
}
```

**Added age validation:**
```
IMPORTANT:
- The pivotal moment MUST occur at the character's current age: ${currentAge}
...
```

### 3. Enhanced buildPromptVariables Function

**Added age calculation logic:**

```typescript
// Calculate expected age range for lifeline generation
let expectedStartAge = 0;
let yearsToAdvance = 10;

if (session.lifelines.length > 0) {
  // Continuing from previous lifeline
  const lastLifeline = session.lifelines[session.lifelines.length - 1];
  expectedStartAge = lastLifeline.endAge;  // Start where we left off!
  
  // Vary years based on character age (shorter intervals as they age)
  if (characterAge < 20) {
    yearsToAdvance = 10-15 years
  } else if (characterAge < 40) {
    yearsToAdvance = 7-12 years
  } else {
    yearsToAdvance = 5-10 years
  }
} else {
  // First lifeline - start from birth
  expectedStartAge = 0;
  yearsToAdvance = 10-15 years
}
```

**Added continuation context for subsequent lifelines:**

```typescript
if (session.lifelines.length > 0 && session.choices.length > 0) {
  variables['continuationContext'] = `CONTINUATION CONTEXT:
- The character is now ${expectedStartAge} years old
- Previous pivotal moment: "${lastPivotalMoment.title}"
- The character chose: "${lastChoice.choiceTitle}"
- You MUST continue the story from age ${expectedStartAge}, NOT from birth
- Show the consequences and outcomes of their choice
- Advance the narrative approximately ${yearsToAdvance} years forward`;
  
  variables['ageRangeWarning'] = `⚠️ CRITICAL: You MUST start at age ${expectedStartAge} (not 0). This is a CONTINUATION of an existing life story.`;
}
```

**Added current age for pivotal moments:**

```typescript
// Add current age for pivotal moment generation
if (session.lifelines.length > 0) {
  const latestLifeline = session.lifelines[session.lifelines.length - 1];
  variables['currentAge'] = String(latestLifeline.endAge);
}
```

## How It Works Now

### First Lifeline Generation
```
Input:
- Historical context
- Selected persona

Processing:
- expectedStartAge = 0 (birth)
- yearsToAdvance = 10-15 years
- continuationContext = "This is the character's first lifeline, starting from birth (age 0)."

Output:
- Lifeline from age 0 to ~12
- Narrative of childhood and early life
- Ends at a pivotal moment
```

### First Pivotal Moment
```
Input:
- Latest lifeline (age 0-12)
- currentAge = 12

Processing:
- Generates pivotal moment AT age 12 (not 25!)
- Presents 3-4 choices

Output:
- Pivotal moment with correct age
- User selects one choice
```

### Continuation Lifeline Generation
```
Input:
- Previous lifelines
- User's choice

Processing:
- expectedStartAge = 12 (from previous lifeline's endAge)
- yearsToAdvance = 10-15 years
- continuationContext = Detailed context about choice and consequences

Output:
- Lifeline from age 12 to ~25
- Narrative showing consequences of choice
- Character development
- Ends at next pivotal moment
```

### Second Pivotal Moment
```
Input:
- Latest lifeline (age 12-25)
- currentAge = 25

Processing:
- Generates pivotal moment AT age 25

Output:
- Pivotal moment at character's actual age
- New set of choices
```

## Key Programming Concepts

### 1. **Dynamic Prompt Engineering**
The prompts now use **template variables** instead of hardcoded examples:
- Bad: `"age": 25` (LLM copies this)
- Good: `"age": MUST_BE_NUMBER (use ${currentAge})` (LLM inserts actual value)

### 2. **State-Aware Context Building**
The `buildPromptVariables` function examines the session state to determine:
- Is this the first lifeline or a continuation?
- What age should we start from?
- What choice did the user make?
- What pivotal moment are we responding to?

### 3. **Conditional Logic in String Templates**
```typescript
if (session.lifelines.length > 0 && session.choices.length > 0) {
  // Continuation path
  variables['continuationContext'] = "...continuation instructions...";
} else {
  // First-time path  
  variables['continuationContext'] = "...first lifeline instructions...";
}
```

This allows the SAME prompt template to handle different scenarios.

### 4. **Age Progression Logic**
The code calculates appropriate time jumps based on character age:
- **Young (< 20)**: 10-15 year jumps (childhood/adolescence change quickly)
- **Middle (20-40)**: 7-12 year jumps (establishing career/family)
- **Older (> 40)**: 5-10 year jumps (life more settled, fewer pivotal moments)

This creates more realistic pacing.

### 5. **Explicit LLM Instructions**
Instead of assuming the LLM will figure things out, we provide:
- **WARNING messages**: `⚠️ CRITICAL: You MUST start at age X`
- **Explicit context**: "CONTINUATION CONTEXT:"
- **Clear requirements**: "use ${expectedStartAge} as the starting age"

LLMs work better with explicit, clear instructions.

## Files Modified

1. **src/config/prompts.config.ts**
   - Updated `lifelineGeneration` prompt with dynamic age placeholders
   - Updated `pivotalMomentGeneration` prompt with current age variable
   - Added continuation context and warnings

2. **src/services/agentExecutor.ts**
   - Enhanced `buildPromptVariables()` function
   - Added age calculation logic
   - Added continuation context building
   - Added current age variable for pivotal moments

## Testing

To verify the fix works:

1. Run a new session: `npx tsx scripts/test-workflow.ts`
2. Complete the first lifeline (should start at age 0)
3. Select a persona
4. First pivotal moment should be at the lifeline's end age (e.g., age 15)
5. Make a choice
6. **Second lifeline should:**
   - Start at age 15 (not 0!)
   - Show consequences of your choice
   - Advance ~10-15 years
   - End at age ~25-30
7. **Second pivotal moment should:**
   - Be at age ~25-30 (matching lifeline end)
   - Reference the previous choice and its outcomes

## Why This Issue Occurred

This is a common issue when working with LLMs:

1. **LLMs are pattern matchers** - They see `"startAge": 0` in the template and copy it
2. **Lack of explicit context** - Without being told it's a continuation, the LLM defaults to starting over
3. **Hardcoded examples are dangerous** - What we intend as "examples" become literal instructions

### Best Practices Learned

✅ **DO**: Use placeholder variables: `${variableName}`
✅ **DO**: Provide explicit context: "CONTINUATION CONTEXT:"
✅ **DO**: Add warnings for critical requirements
✅ **DO**: Use MUST_BE_NUMBER instead of example numbers

❌ **DON'T**: Use hardcoded example values in JSON templates
❌ **DON'T**: Assume the LLM will "understand" from context
❌ **DON'T**: Use the same prompt for different scenarios without distinguishing them

## Future Improvements

Consider adding:
1. Birth year tracking to calculate exact historical years
2. Death probability based on age and historical life expectancy
3. Major historical events affecting age ranges (wars, famines, etc.)
4. Character traits affecting longevity (health, social class, location)

