# @centralinc/browseragent

## 1.9.1

### Patch Changes

- 3947312: Fix thinking block handling to prevent 400 errors when using extended thinking

  **Problem:** Using `thinkingBudget` caused 400 errors from Anthropic's API with the message: "Expected thinking or redacted_thinking, but found text. When thinking is enabled, a final assistant message must start with a thinking block."

  **Root Cause:** The `BetaThinkingBlock` type incorrectly defined `thinking` as a config object instead of a string containing the actual thinking content.

  **Changes:**

  - Fixed `BetaThinkingBlock` type: `thinking` is now correctly typed as `string`
  - Added `BetaRedactedThinkingBlock` type for handling redacted thinking responses
  - Updated `responseToParams` to properly parse both `thinking` and `redacted_thinking` blocks
  - Added explicit block ordering when constructing assistant messages to ensure thinking blocks always come first (API requirement)
  - Added test examples for extended thinking validation

  **Usage:** Extended thinking now works correctly across multi-turn conversations:

  ```typescript
  const result = await agent.execute(
    "Complex task requiring reasoning",
    undefined,
    {
      thinkingBudget: 4096,
      maxTokens: 16384,
    }
  );
  ```

## 1.9.0

### Minor Changes

- ebe5c2f: Expose browser context and createPage to custom tools

  Custom tools can now access the browser infrastructure via `ToolExecutionContext`, allowing them to perform browser operations while leveraging existing session configuration (proxies, anti-detection, cookies, etc.).

  **New properties on `ToolExecutionContext`:**

  - `browserContext`: Direct access to the Playwright `BrowserContext` for advanced operations
  - `createPage()`: Creates new pages with anti-detection scripts automatically applied

  **Features:**

  - Pages created via `createPage()` are tracked and automatically cleaned up on errors
  - Custom init scripts can be passed to `ComputerUseAgent` constructor via `initScripts` option
  - Main page remains unaffected by tool operations

  **Usage:**

  ```typescript
  class MyCustomTool implements ComputerUseTool {
    async call(
      params: Record<string, unknown>,
      ctx?: ToolExecutionContext
    ): Promise<ToolResult> {
      if (!ctx?.createPage) {
        return { error: "Browser context not available" };
      }

      const page = await ctx.createPage();
      try {
        await page.goto(url, { waitUntil: "domcontentloaded" });
        // ... perform operations
        return { output: "Success" };
      } finally {
        await page.close();
      }
    }
  }
  ```

  This is useful for tools that need to:

  - Navigate to URLs (activation links, OAuth callbacks)
  - Capture screenshots or PDFs in isolation
  - Execute JavaScript in a separate page context
  - Perform operations without affecting the main agent page

## 1.8.1

### Patch Changes

- 3a1092d: Fix missing shift modifier mapping

  Fixes "Unknown key: shift" error that occurred when the AI agent sent lowercase "shift" in key combinations. The modifier was not being mapped to the correct Playwright key name "Shift".

  **Changes:**

  - Added `shift: "Shift"` to modifierKeyMap
  - Updated tests to verify shift key mapping works correctly

  **Bug Fix:**
  This resolves production errors like:

  ```
  keyboard.down: Unknown key: "shift"
  ```

  The agent can now correctly handle key combinations with shift:

  - `"shift+a"` → `["Shift", "a"]` ✅
  - `"Shift+Tab"` → `["Shift", "Tab"]` ✅

## 1.8.0

### Minor Changes

- b8a418b: Add support for space-separated keyboard sequences and repetition syntax

  Fixes keyboard action handling to support space-separated key sequences like "Down Down Down" which previously failed with Playwright errors. The agent can now handle repeated key presses naturally.

  **Changes:**

  - Added `parseKeySequence()` method to handle space-separated keys
  - Support for repetition syntax (e.g., `Down*3` = press Down 3 times)
  - Automatic detection between key sequences (space-separated) and combinations (plus-separated)
  - Enhanced error messages for invalid sequences

  **Examples:**

  ```typescript
  // Space-separated sequences (sequential key presses)
  "Down Down Down"; // Press Down arrow 3 times
  "Tab Tab Enter"; // Press Tab twice, then Enter

  // Repetition syntax
  "Down*3"; // Press Down 3 times
  "Tab*5 Enter"; // Press Tab 5 times, then Enter

  // Traditional key combinations (simultaneous)
  "Ctrl+C"; // Hold Ctrl and press C
  "Ctrl+Shift+A"; // Hold Ctrl+Shift and press A
  ```

  **Technical Details:**

  - Sequences use `keyboard.press()` for sequential actions
  - Combinations use `keyboard.down()`/`keyboard.up()` for simultaneous keys
  - Repetition count limited to 1-100 for safety
  - Case-insensitive key name handling maintained

## 1.7.0

### Minor Changes

- 461584d: Add tool execution context support

  Adds optional `toolExecutionContext` parameter to pass runtime state to custom tools during execution. Custom tools can access this context via the second parameter in their `call()` method. Built-in tools ignore the context, ensuring no breaking changes.

  **Changes:**

  - New `ToolExecutionContext` interface for passing arbitrary context data
  - Tools can optionally read context during execution
  - Available through `agent.execute()` options

  **Usage:**

  ```typescript
  await agent.execute("task", undefined, {
    toolExecutionContext: {
      /* your data */
    },
  });
  ```

## 1.6.2

### Patch Changes

- 02c36a5: Improve pause/resume behavior to prevent unnecessary loop continuation

  Fixes an issue where resuming from a paused `end_turn` state would cause an unnecessary additional LLM API call. When the agent is paused after task completion (`end_turn` response), resuming now correctly ends execution instead of continuing the loop.

  **Changes:**

  - Remove `stepIndex++` and `continue` after resume on `end_turn`
  - Agent now properly ends when task is already complete
  - Prevents wasteful extra API calls after resume
  - Fixes potential step counter confusion in logs

  **Behavior:**

  - Before: Resume on `end_turn` → continue loop → extra LLM call → finally end
  - After: Resume on `end_turn` → end immediately (task already complete)

## 1.6.1

### Patch Changes

- f40804a: Fix pause/resume race condition in agent execution loop

  Fixes a race condition where pause signals sent after LLM responds with `end_turn` were ignored, causing the agent to complete execution despite being paused. This was particularly noticeable with Claude 4-5 model due to faster response times.

  **Changes:**

  - Added pause state checking after LLM `end_turn` response but before loop exit
  - Agent now waits for resume signal when paused, even at completion
  - Prevents premature execution completion when pause signal arrives after `end_turn`
  - Maintains proper cancellation handling during pause state

  **Behavior:**

  - Before: Agent would exit immediately on `end_turn`, ignoring late pause signals
  - After: Agent checks pause state and waits for resume before completing execution

  This fix eliminates timing-dependent behavior and ensures pause/resume works reliably across all Claude model versions.

## 1.6.0

### Minor Changes

- bcdb2a2: feat: Add preferIPv4 option to resolve Tailscale/VPN IPv6 connectivity issues

  - Add `preferIPv4` option to `RetryConfig` interface (renamed from `forceIPv4`)
  - Implement IPv4-only DNS resolution using custom HTTP agents
  - Fix `ENETUNREACH` errors when IPv6 addresses can't be reached on VPN networks
  - Clean implementation without global environment variable modifications
  - Update documentation with Tailscale/VPN usage guidance
  - Add comprehensive example demonstrating retry configuration with IPv4 preference

## 1.5.0

### Minor Changes

- 5c4206a: feat: Add retry configuration for handling connection errors

  - Add configurable retry logic with exponential backoff for API calls
  - Create RetryConfig interface with customizable retry parameters
  - Implement withRetry wrapper function for automatic retries on connection errors
  - Support custom retry configuration in ComputerUseAgent constructor
  - Default retry behavior: 3 attempts, 1s initial delay, 2x backoff multiplier
  - Retryable errors include: Connection error, ECONNREFUSED, ETIMEDOUT, ECONNRESET, socket errors
  - Add example demonstrating retry configuration usage
  - Export RetryConfig type from main index

## 1.4.6

### Patch Changes

- 946f793: Fix: Handle negative scroll amounts without throwing errors

  - Convert negative scroll amounts to positive values with appropriate direction
  - Override conflicting scroll directions when negative amounts are provided
  - Add guidance in system prompt to use positive scroll amounts with direction parameter
  - Supports both vertical (up/down) and horizontal (left/right) scrolling with negative amounts

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
