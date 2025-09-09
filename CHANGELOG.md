# @centralinc/browseragent

## 1.4.0

### Minor Changes

- e8f03a4: Add logger system
- 45ddbc6: Fix thinking budget causing API errors by removing default value

  Remove the default value of 1024 for `thinkingBudget` parameter. This fixes 400 errors from Anthropic's API when thinking blocks aren't properly formatted.

  **Changes:**

  - `thinkingBudget` no longer defaults to 1024 in computerUseLoop
  - Thinking mode is now disabled by default (when undefined)
  - Users must explicitly set `thinkingBudget` to enable thinking

  **Fixes:**

  - Resolves "Expected `thinking` or `redacted_thinking`, but found `text`" API errors
  - Prevents unintended thinking mode activation
  - Improves reliability for standard agent usage

  **Migration:**

  ```typescript
  // To enable thinking (if previously relying on default)
  await agent.execute("task", undefined, { thinkingBudget: 1024 });
  ```

### Patch Changes

- 6094998: Fix thinking budget default causing API errors

  Remove the default value of 1024 for `thinkingBudget` parameter in `computerUseLoop` function. Previously, thinking was always enabled even when not explicitly requested, causing 400 errors from Anthropic's API due to improper thinking block formatting.

  **What changed:**

  - `thinkingBudget` parameter no longer defaults to 1024
  - Thinking is now disabled by default (when `thinkingBudget` is undefined)
  - Updated documentation to reflect new behavior

  **Breaking change:**
  Users who relied on the default thinking budget (1024) will now need to explicitly set it:

  ```typescript
  // Before (thinking was enabled by default)
  await agent.execute("task");

  // After (to enable thinking, explicitly set thinkingBudget)
  await agent.execute("task", undefined, { thinkingBudget: 1024 });
  ```

  **Fixes:**

  - Resolves 400 API errors: "Expected `thinking` or `redacted_thinking`, but found `text`"
  - Prevents unintended thinking mode activation
  - Improves API reliability for standard use cases

## 1.2.1

### Patch Changes

- 3c19d5c: Add logger system

## 1.2.0

### Minor Changes

- Add comprehensive logging system with SimpleLogger and custom logger support

### Patch Changes

- 92bd90b: fix changeset
- 378531d: migrate to changeset and automated deploys
