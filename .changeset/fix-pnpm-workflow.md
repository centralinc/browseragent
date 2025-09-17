---
"@centralinc/browseragent": patch
---

Fix CI workflow to properly publish with pnpm

This fixes the "spawn pnpm ENOENT" error by updating the GitHub Actions workflow to use pnpm consistently instead of mixing npm and pnpm commands. The package should now properly publish to npm.
