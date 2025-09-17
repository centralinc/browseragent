# @centralinc/browseragent

## 1.4.5

### Patch Changes

- 5d03d6d: Fix CI workflow to properly publish with pnpm

  This fixes the "spawn pnpm ENOENT" error by updating the GitHub Actions workflow to use pnpm consistently instead of mixing npm and pnpm commands. The package should now properly publish to npm.

## 1.4.4

### Patch Changes

- 04f63bf: Trigger npm publish for zod peer dependencies fix

  This changeset ensures that version 1.4.3 with the zod peer dependencies fix gets properly published to npm, as the previous CI/CD run failed during the publish step due to git conflicts.

## 1.4.3

### Patch Changes

- 05a7f04: Fix zod-to-json-schema compatibility issues by moving zod and zod-to-json-schema to peer dependencies

  This change resolves the "def.shape is not a function" error that occurs when there are version mismatches between the browseragent's bundled zod/zod-to-json-schema and the consuming application's versions.

  **Breaking Change Note**: Applications using this library now need to install `zod` and `zod-to-json-schema` as direct dependencies if they haven't already.

  **Benefits**:

  - Eliminates version conflicts between bundled vs application versions
  - Ensures schema objects are created and processed by the same library versions
  - Reduces bundle size by avoiding duplicate dependencies
  - Gives consumers control over the exact versions used

  **Migration**: Add these dependencies to your application's package.json:

  ```json
  {
    "dependencies": {
      "zod": "^3.25.0",
      "zod-to-json-schema": "^3.23.0"
    }
  }
  ```

## 1.4.2

### Patch Changes

- 71b268c: Enhanced playwright goto capability with configurable waitUntil parameter

  Added support for users to specify waitUntil conditions through prompts when navigating to URLs. This enhancement allows agents to handle different website loading patterns more effectively.

  **New features:**

  - Optional waitUntil parameter in goto method arguments: `["url", "waitUntil"]`
  - Support for all Playwright waitUntil options:
    - `"domcontentloaded"` - Fast navigation, waits for DOM ready
    - `"load"` - Waits for all resources to load
    - `"networkidle"` - Waits for no network activity (default)
    - `"commit"` - Minimal wait, returns on network response
  - Backward compatible - existing calls work unchanged
  - Enhanced error handling and validation
  - Updated documentation with examples and use cases

  **Benefits:**

  - Faster navigation for enterprise portals using "domcontentloaded"
  - Better reliability for sites with continuous background activity
  - Reduced timeouts on complex web applications
  - User control over navigation timing strategy

## 1.4.1

### Patch Changes

- 62919e1: Add exports for ComputerUseTool interface, PlaywrightTool, ComputerTool implementations, and related types to enable external tool usage

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
