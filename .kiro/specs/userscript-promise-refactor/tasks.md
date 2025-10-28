# Implementation Plan

- [x] 1. Add promise-based delay utility function
  - Create a delay function that returns a promise wrapping setTimeout
  - Place it near other utility functions in the script
  - _Requirements: 1.2_

- [x] 2. Refactor doActionsForGroup function to use async/await
  - Convert function signature to async
  - Replace setTimeout chains with await delay() calls
  - Maintain existing 2-second intervals between actions
  - Preserve all existing DOM manipulation logic
  - _Requirements: 1.1, 2.1_

- [x] 3. Refactor replayAll function to use async/await
  - Convert function signature to async
  - Replace for loop with setTimeout to for...of loop with await
  - Maintain 30-second intervals between groups
  - Add error handling for individual group failures
  - _Requirements: 1.1, 2.2_

- [x] 4. Refactor replayOnce function to use async/await
  - Convert function signature to async
  - Replace setTimeout with await delay()
  - Maintain existing functionality
  - _Requirements: 1.1, 2.1_

- [x] 5. Update event handlers to handle async functions
  - Modify button onclick handlers to properly call async functions
  - Add error handling to prevent unhandled promise rejections
  - Ensure UI remains responsive during async operations
  - _Requirements: 2.3_
