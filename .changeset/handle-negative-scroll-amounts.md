---
"@centralinc/browseragent": patch
---

Fix: Handle negative scroll amounts without throwing errors

- Convert negative scroll amounts to positive values with appropriate direction
- Override conflicting scroll directions when negative amounts are provided
- Add guidance in system prompt to use positive scroll amounts with direction parameter
- Supports both vertical (up/down) and horizontal (left/right) scrolling with negative amounts
