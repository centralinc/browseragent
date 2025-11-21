---
"@centralinc/browseragent": patch
---

Fix missing shift modifier mapping

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

