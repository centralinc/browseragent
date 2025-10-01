---
"browseragent": patch
---

Fix pause/resume race condition in agent execution loop

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
