---
"@centralinc/browseragent": patch
---

Fix critical message history management issues preventing 400 errors and infinite loops

**Three Major Fixes:**

1. **Extended Thinking Loop Prevention**: Fixed infinite loop where agents would repeat the same action (e.g., repeatedly calling `goto`). When Claude doesn't emit a thinking block, we now add a placeholder by reusing the most recent thinking block from history, instead of removing messages which caused context loss.

2. **Extended Thinking Block Validation**: When `thinkingBudget` is enabled, the API requires every assistant message to start with a thinking or redacted_thinking block. The fix adds placeholder thinking blocks to responses when Claude doesn't emit them, preventing 400 errors while preserving agent context.

3. **Tool Use/Result Pairing**: Fixed "unexpected tool_use_id found in tool_result blocks" error. The API requires each tool_result to have its corresponding tool_use in the IMMEDIATELY PREVIOUS message, not just anywhere in history. Rewrote `cleanMessageHistory()` to validate pairing on a per-message basis.

**Errors Fixed:**
- Infinite loops with extended thinking (agent repeating same actions)
- `"Expected thinking or redacted_thinking, but found text"`
- `"unexpected tool_use_id found in tool_result blocks: [id]. Each tool_result block must have a corresponding tool_use block in the previous message"`

**Testing:** 
- Extended thinking test passes with multiple tool uses in 27.5s (no loops)
- Properly handles missing thinking blocks by adding placeholders
- Message history stays clean with proper tool_use/tool_result pairing
