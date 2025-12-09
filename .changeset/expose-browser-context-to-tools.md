---
"@centralinc/browseragent": minor
---

Expose browser context and createPage to custom tools

Custom tools can now access the browser infrastructure via `ToolExecutionContext`, allowing them to perform browser operations while leveraging existing session configuration (proxies, anti-detection, cookies, etc.).

**New properties on `ToolExecutionContext`:**
- `browserContext`: Direct access to the Playwright `BrowserContext` for advanced operations
- `createPage()`: Creates new pages with anti-detection scripts automatically applied

**Features:**
- Pages created via `createPage()` are tracked and automatically cleaned up on errors
- Custom init scripts can be passed to `ComputerUseAgent` constructor via `initScripts` option
- Main page remains unaffected by tool operations

**Usage:**

```typescript
class MyCustomTool implements ComputerUseTool {
  async call(params: Record<string, unknown>, ctx?: ToolExecutionContext): Promise<ToolResult> {
    if (!ctx?.createPage) {
      return { error: 'Browser context not available' };
    }

    const page = await ctx.createPage();
    try {
      await page.goto(url, { waitUntil: 'domcontentloaded' });
      // ... perform operations
      return { output: 'Success' };
    } finally {
      await page.close();
    }
  }
}
```

This is useful for tools that need to:
- Navigate to URLs (activation links, OAuth callbacks)
- Capture screenshots or PDFs in isolation
- Execute JavaScript in a separate page context
- Perform operations without affecting the main agent page
