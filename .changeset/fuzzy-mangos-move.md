---
"@centralinc/browseragent": minor
---

Fix thinking budget causing API errors by removing default value

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
