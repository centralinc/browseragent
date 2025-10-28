---
"@centralinc/browseragent": minor
---

Add tool execution context support

Adds optional `toolExecutionContext` parameter to pass runtime state to custom tools during execution. Custom tools can access this context via the second parameter in their `call()` method. Built-in tools ignore the context, ensuring no breaking changes.

**Changes:**
- New `ToolExecutionContext` interface for passing arbitrary context data
- Tools can optionally read context during execution
- Available through `agent.execute()` options

**Usage:**
```typescript
await agent.execute("task", undefined, {
  toolExecutionContext: { /* your data */ }
});
```

