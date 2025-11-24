---
"@centralinc/browseragent": minor
---

Add support for space-separated keyboard sequences and repetition syntax

Fixes keyboard action handling to support space-separated key sequences like "Down Down Down" which previously failed with Playwright errors. The agent can now handle repeated key presses naturally.

**Changes:**
- Added `parseKeySequence()` method to handle space-separated keys
- Support for repetition syntax (e.g., `Down*3` = press Down 3 times)
- Automatic detection between key sequences (space-separated) and combinations (plus-separated)
- Enhanced error messages for invalid sequences

**Examples:**
```typescript
// Space-separated sequences (sequential key presses)
"Down Down Down"  // Press Down arrow 3 times
"Tab Tab Enter"   // Press Tab twice, then Enter

// Repetition syntax
"Down*3"         // Press Down 3 times
"Tab*5 Enter"    // Press Tab 5 times, then Enter

// Traditional key combinations (simultaneous)
"Ctrl+C"         // Hold Ctrl and press C
"Ctrl+Shift+A"   // Hold Ctrl+Shift and press A
```

**Technical Details:**
- Sequences use `keyboard.press()` for sequential actions
- Combinations use `keyboard.down()`/`keyboard.up()` for simultaneous keys
- Repetition count limited to 1-100 for safety
- Case-insensitive key name handling maintained

