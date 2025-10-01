---
"@centralinc/browseragent": patch
---

Improve pause/resume behavior to prevent unnecessary loop continuation

Fixes an issue where resuming from a paused `end_turn` state would cause an unnecessary additional LLM API call. When the agent is paused after task completion (`end_turn` response), resuming now correctly ends execution instead of continuing the loop.

**Changes:**
- Remove `stepIndex++` and `continue` after resume on `end_turn`
- Agent now properly ends when task is already complete
- Prevents wasteful extra API calls after resume
- Fixes potential step counter confusion in logs

**Behavior:**
- Before: Resume on `end_turn` → continue loop → extra LLM call → finally end
- After: Resume on `end_turn` → end immediately (task already complete)

