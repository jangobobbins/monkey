# Design Document

## Overview

This design outlines the refactoring of the Facebook Group Poster userscript from setTimeout-based timing to promise-based async/await patterns. The refactor will improve code readability while maintaining all existing functionality.

## Architecture

The refactor will maintain the existing architecture but modernize the asynchronous execution patterns:

- **Utility Layer**: Add a promise-based delay function
- **Action Layer**: Convert timing-dependent functions to async/await
- **UI Layer**: Maintain existing UI with updated event handlers

## Components and Interfaces

### Delay Utility Function

```javascript
function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
```

### Refactored Functions

1. **doActionsForGroup(groupName)** → **async doActionsForGroup(groupName)**
   - Convert to async function
   - Replace setTimeout chains with await delay() calls
   - Maintain existing 2-second intervals between actions

2. **replayAll()** → **async replayAll()**
   - Convert to async function
   - Use for...of loop with await for sequential group processing
   - Maintain 30-second intervals between groups

3. **replayOnce()** → **async replayOnce()**
   - Convert to async function
   - Use await for single group execution

## Data Models

No changes to existing data structures:
- `elementPathsArray` remains unchanged
- `groupNames` array remains unchanged
- UI state variables remain unchanged

## Error Handling

### Promise-based Error Handling

```javascript
try {
    await doActionsForGroup(groupName);
} catch (error) {
    console.error('Error posting to group:', groupName, error);
}
```

### Graceful Degradation

- If DOM elements are not found, log error and continue to next group
- If timing fails, provide fallback behavior
- Maintain existing console logging for debugging

## Testing Strategy

### Manual Testing Approach

1. **Functional Testing**
   - Verify all UI elements render correctly
   - Test element selection workflow
   - Verify single group posting works
   - Verify batch posting works with proper timing

2. **Timing Verification**
   - Confirm 2-second delays between actions within a group
   - Confirm 30-second delays between different groups
   - Verify no race conditions or timing issues

3. **Error Scenarios**
   - Test with missing DOM elements
   - Test with network interruptions
   - Verify error logging and recovery

### Code Quality Checks

- Ensure all setTimeout calls are replaced
- Verify proper async/await usage
- Check for memory leaks or hanging promises
- Validate error handling coverage