---
"@centralinc/browseragent": patch
---

Fix thinking budget default causing API errors

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
