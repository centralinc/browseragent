---
"@centralinc/browseragent": patch
---

Fix zod-to-json-schema compatibility issues by moving zod and zod-to-json-schema to peer dependencies

This change resolves the "def.shape is not a function" error that occurs when there are version mismatches between the browseragent's bundled zod/zod-to-json-schema and the consuming application's versions.

**Breaking Change Note**: Applications using this library now need to install `zod` and `zod-to-json-schema` as direct dependencies if they haven't already.

**Benefits**:
- Eliminates version conflicts between bundled vs application versions
- Ensures schema objects are created and processed by the same library versions
- Reduces bundle size by avoiding duplicate dependencies
- Gives consumers control over the exact versions used

**Migration**: Add these dependencies to your application's package.json:
```json
{
  "dependencies": {
    "zod": "^3.25.0",
    "zod-to-json-schema": "^3.23.0"
  }
}
```
