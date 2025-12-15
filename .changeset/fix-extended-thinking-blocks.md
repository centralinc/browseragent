---
"@centralinc/browseragent": patch
---

Fix critical message history management issues preventing 400 errors

**Two Major Fixes:**

1. **Extended Thinking Block Validation**: When `thinkingBudget` is enabled, the API requires every assistant message to start with a thinking or redacted_thinking block. Added `ensureThinkingBlocksForExtendedThinking()` to filter out assistant messages without thinking blocks and their corresponding user messages to maintain conversation flow.

2. **Tool Use/Result Pairing**: Fixed "unexpected tool_use_id found in tool_result blocks" error. The API requires each tool_result to have its corresponding tool_use in the IMMEDIATELY PREVIOUS message, not just anywhere in history. Rewrote `cleanMessageHistory()` to validate pairing on a per-message basis.

**Errors Fixed:**
- `"Expected thinking or redacted_thinking, but found text"`
- `"unexpected tool_use_id found in tool_result blocks: [id]. Each tool_result block must have a corresponding tool_use block in the previous message"`

**Testing:** Extended thinking test passes with 15+ tool calls across multiple turns without errors.
