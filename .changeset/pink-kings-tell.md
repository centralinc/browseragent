---
"@centralinc/browseragent": patch
---

Enhanced playwright goto capability with configurable waitUntil parameter

Added support for users to specify waitUntil conditions through prompts when navigating to URLs. This enhancement allows agents to handle different website loading patterns more effectively.

**New features:**
- Optional waitUntil parameter in goto method arguments: `["url", "waitUntil"]`
- Support for all Playwright waitUntil options:
  - `"domcontentloaded"` - Fast navigation, waits for DOM ready
  - `"load"` - Waits for all resources to load  
  - `"networkidle"` - Waits for no network activity (default)
  - `"commit"` - Minimal wait, returns on network response
- Backward compatible - existing calls work unchanged
- Enhanced error handling and validation
- Updated documentation with examples and use cases

**Benefits:**
- Faster navigation for enterprise portals using "domcontentloaded"
- Better reliability for sites with continuous background activity
- Reduced timeouts on complex web applications
- User control over navigation timing strategy
