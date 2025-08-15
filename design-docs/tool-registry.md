# Tool Registry System

The Tool Registry provides a flexible, type-safe system for managing tool capabilities across different automation tools. It ensures users don't forget important capabilities and provides automatic documentation generation.

## Key Features

- **Universal Tool Support**: Works with any tool (Playwright, Slack, Discord, etc.)
- **Type-Safe Configuration**: Uses Zod schemas for input validation
- **Automatic Documentation**: Generates capability docs for system prompts
- **Simple Registration**: Easy-to-use API for adding capabilities
- **Runtime Configuration**: Enable/disable capabilities dynamically

## Basic Usage

### 1. Registering Playwright Capabilities

```typescript
import { registerPlaywrightCapability } from '@onkernel/cu-playwright/tools/playwright-capabilities';
import { z } from 'zod';

// Add a custom Playwright capability
registerPlaywrightCapability({
  method: 'fill_form',
  displayName: 'Fill Form Fields',
  description: 'Fill multiple form fields at once',
  usage: `Fill multiple form fields in a single operation
Call format: {"name": "playwright", "input": {"method": "fill_form", "args": ["selector1", "value1", "selector2", "value2", ...]}}
Pairs of selector and value are provided as arguments`,
  schema: z.array(z.string()).refine(arr => arr.length % 2 === 0),
  handler: async (page, args) => {
    // Implementation
  },
});
```

### 2. Creating Capabilities for Other Tools

The registry supports any tool. Here's how to create Slack capabilities:

```typescript
import { getToolRegistry, defineCapability } from '@onkernel/cu-playwright/tools/registry';
import { z } from 'zod';
import type { ToolResult } from '@onkernel/cu-playwright';

// Define Slack capabilities
const slackCapabilities = [
  defineCapability('slack', 'send_message', {
    displayName: 'Send Slack Message',
    description: 'Send a message to a Slack channel',
    usage: `Send a message to any Slack channel
Call format: {"name": "slack", "input": {"method": "send_message", "args": ["channel", "message"]}}
Channel can be a channel name (#general) or ID`,
    schema: z.tuple([z.string(), z.string()]),
    enabled: true,
  }),
  
  defineCapability('slack', 'create_thread', {
    displayName: 'Create Thread Reply',
    description: 'Reply to a message in a thread',
    usage: `Reply to an existing Slack message in a thread
Call format: {"name": "slack", "input": {"method": "create_thread", "args": ["channel", "thread_ts", "message"]}}
Requires the timestamp of the parent message`,
    schema: z.tuple([z.string(), z.string(), z.string()]),
    enabled: true,
  }),
  
  defineCapability('slack', 'upload_file', {
    displayName: 'Upload File',
    description: 'Upload a file to a Slack channel',
    usage: `Upload a file with optional message to a Slack channel
Call format: {"name": "slack", "input": {"method": "upload_file", "args": ["channel", "file_path", "message (optional)"]}}`,
    schema: z.tuple([z.string(), z.string(), z.string().optional()]),
    enabled: true,
  }),
];

// Register all Slack capabilities
const registry = getToolRegistry();
slackCapabilities.forEach(cap => registry.register(cap));
```

## Real-World Example: Slack Integration Agent

Here's a complete example of creating a Slack agent that responds to natural language prompts:

```typescript
import { WebClient } from '@slack/web-api';
import type { Page } from 'playwright';
import type { ComputerUseTool, ToolResult, FunctionToolDef } from '@onkernel/cu-playwright';
import { ComputerUseAgent } from '@onkernel/cu-playwright';

// Slack tool implementation
class SlackTool implements ComputerUseTool {
  name: 'slack' = 'slack';
  private client: WebClient;
  private capabilities = new Map<string, any>();

  constructor(token: string) {
    this.client = new WebClient(token);
    this.setupCapabilities();
  }

  private setupCapabilities() {
    // Send message capability
    this.capabilities.set('send_message', async (args: string[]) => {
      const [channel, text] = args;
      const result = await this.client.chat.postMessage({
        channel,
        text,
      });
      return {
        output: `Message sent to ${channel}: "${text}" (ts: ${result.ts})`,
      };
    });

    // Create thread capability
    this.capabilities.set('create_thread', async (args: string[]) => {
      const [channel, thread_ts, text] = args;
      const result = await this.client.chat.postMessage({
        channel,
        text,
        thread_ts,
      });
      return {
        output: `Thread reply sent (ts: ${result.ts})`,
      };
    });

    // Upload file capability
    this.capabilities.set('upload_file', async (args: string[]) => {
      const [channels, file, initial_comment] = args;
      const result = await this.client.files.uploadV2({
        channels,
        file,
        initial_comment,
      });
      return {
        output: `File uploaded to ${channels}`,
      };
    });
  }

  toParams(): FunctionToolDef {
    return {
      name: this.name,
      type: 'custom',
      input_schema: {
        type: 'object',
        properties: {
          method: {
            type: 'string',
            enum: Array.from(this.capabilities.keys()),
          },
          args: {
            type: 'array',
            items: { type: 'string' },
          },
        },
        required: ['method', 'args'],
      },
    };
  }

  async call(params: any): Promise<ToolResult> {
    const { method, args } = params;
    const handler = this.capabilities.get(method);
    if (!handler) {
      throw new Error(`Unknown method: ${method}`);
    }
    return await handler(args);
  }
}

// Usage with ComputerUseAgent
async function runSlackAgent() {
  const SLACK_TOKEN = process.env.SLACK_TOKEN!;
  const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY!;
  
  // Create browser and Slack tool
  const browser = await chromium.launch();
  const page = await browser.newPage();
  const slackTool = new SlackTool(SLACK_TOKEN);
  
  // Create agent with both Playwright and Slack capabilities
  const agent = new ComputerUseAgent({
    apiKey: ANTHROPIC_API_KEY,
    page,
    additionalTools: [slackTool],
  });
  
  // Natural language prompts that use Slack
  await agent.execute('Send a message to #general channel saying "Hello team! The daily standup is starting in 5 minutes."');
  
  await agent.execute('Navigate to our team dashboard at dashboard.example.com, take a screenshot of the metrics, and share it in the #metrics channel with a message about today\'s performance');
  
  await agent.execute('Check if there are any error messages on this page, and if so, send them to #engineering-alerts channel');
  
  await browser.close();
}
```

## Advanced Example: Multi-Tool Orchestration

Here's how to combine multiple tools for complex workflows:

```typescript
// Register capabilities for different tools
const registry = getToolRegistry();

// Email tool capabilities
registry.register(defineCapability('email', 'send', {
  displayName: 'Send Email',
  description: 'Send an email message',
  usage: 'Send email with subject and body',
  schema: z.object({
    to: z.string(),
    subject: z.string(),
    body: z.string(),
  }),
}));

// Database tool capabilities
registry.register(defineCapability('database', 'query', {
  displayName: 'Query Database',
  description: 'Execute a database query',
  usage: 'Run SQL queries and return results',
  schema: z.object({
    query: z.string(),
    params: z.array(z.any()).optional(),
  }),
}));

// Agent that orchestrates multiple tools
const agent = new ComputerUseAgent({
  apiKey: ANTHROPIC_API_KEY,
  page,
  additionalTools: [slackTool, emailTool, databaseTool],
});

// Complex multi-tool workflow
await agent.execute(`
  1. Go to analytics.example.com
  2. Extract the daily revenue number
  3. Query the database for yesterday's revenue
  4. Calculate the percentage change
  5. If revenue increased by more than 10%, send a celebration message to #wins channel
  6. Email the CEO with a summary of the revenue data
`);
```

## Built-in Playwright Capabilities

The following capabilities are pre-registered for Playwright:

### Navigation
- **goto**: Navigate directly to any URL or website
  - Example: `{"method": "goto", "args": ["https://example.com"]}`

### Extraction
- **extract_url**: Extract URLs from visible text, links, or buttons
  - Example: `{"method": "extract_url", "args": ["Click here"]}`

### Interaction
- **scroll_to_text**: Instantly scroll to specific text
  - Example: `{"method": "scroll_to_text", "args": ["Terms and Conditions"]}`

## API Reference

### Core Functions

- `defineCapability(tool, method, options)`: Create a capability definition
- `getToolRegistry()`: Get the global registry instance
- `registerPlaywrightCapability(capability)`: Register a Playwright capability

### ToolCapability Interface

```typescript
interface ToolCapability {
  tool: string;              // Tool name (e.g., 'slack', 'playwright')
  method: string;            // Method name (e.g., 'send_message')
  displayName: string;       // Human-readable name
  description: string;       // Short description
  usage: string;            // Detailed usage instructions
  schema: ZodSchema;        // Input validation schema
  enabled?: boolean;        // Whether enabled (default: true)
}
```

## Best Practices

1. **Clear Usage Instructions**: Write detailed usage strings that explain the expected format
2. **Validate Inputs**: Always use Zod schemas to validate inputs
3. **Descriptive Names**: Use clear, action-oriented method names
4. **Error Handling**: Provide helpful error messages in your handlers
5. **Documentation**: Keep usage instructions up-to-date with implementation

## Integration Patterns

### 1. Chat Operations (Slack, Discord, Teams)
```typescript
defineCapability('chat', 'send', {
  displayName: 'Send Message',
  description: 'Send a message to a chat platform',
  usage: 'Send message to specified channel or user',
  schema: z.object({ channel: z.string(), message: z.string() }),
});
```

### 2. Data Operations (Database, API)
```typescript
defineCapability('data', 'fetch', {
  displayName: 'Fetch Data',
  description: 'Retrieve data from external source',
  usage: 'Fetch data using query parameters',
  schema: z.object({ source: z.string(), query: z.any() }),
});
```

### 3. File Operations (S3, FTP, Local)
```typescript
defineCapability('files', 'upload', {
  displayName: 'Upload File',
  description: 'Upload file to storage',
  usage: 'Upload file to specified destination',
  schema: z.object({ path: z.string(), destination: z.string() }),
});
```

The Tool Registry makes it easy to extend your agents with any external service while maintaining type safety and clear documentation.
