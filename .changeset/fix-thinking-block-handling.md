---
"@centralinc/browseragent": patch
---

Fix thinking block handling to prevent 400 errors when using extended thinking

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
