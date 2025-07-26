# Computer Use Playwright SDK

> **Fork Notice**: This is a fork of [@onkernel/cu-playwright-ts](https://github.com/onkernel/cu-playwright-ts) with additional custom features.

A TypeScript SDK that combines Anthropic's Computer Use capabilities with Playwright for browser automation tasks. This SDK provides a clean, type-safe interface for automating browser interactions using Claude's computer use abilities.

This fork is **purpose-built for high-volume RPA scenarios**—think large insurance back-offices, government form-filling portals, and other data-heavy workflows.  
It runs **seamlessly inside Temporal workflows**: the agent's native `pause` / `resume` / `cancel` **signals** can be surfaced as **Temporal signals**, letting your orchestration layer coordinate long-running jobs while operators jump in when needed (no tight coupling between the human and Temporal itself).  
Our goal is to expose a **highly configurable, fine-grained agent**—dial it up for raw speed or dial it down for pixel-perfect, human-like precision.

## 🆕 Additional Features in This Fork

> **At-a-glance feature matrix**
>
> | ⚙️  Capability | What it does | Why it rocks |
> |--------------|--------------|--------------|
> | **Smart Scrolling** | 90 % viewport scrolls + instant text navigation | Turbo page traversal **and** zero-waste dropdown control |
> | **Typing Modes** | Fill, fast-character, human-character | Match CAPTCHA tolerances or burn through inputs |
> | **Signal Bus** | Pause / Resume / Cancel at any step | Add human QA checkpoints in production |
> | **URL Extractor** | Find links by visible text | Zero CSS selectors needed |
> | **Speed Tweaks** | Screenshot + delay optimisations | Cut multi-step flows from minutes to seconds |

Below are the flagship improvements shipped in the fork:

### 🔗 URL Extraction Tool

Extract URLs from any visible element - no CSS selectors needed! This feature is **unique to this fork**.

#### How It Works

The agent automatically uses the URL extraction tool when you ask for URLs by visible text:

```typescript
// Simple URL extraction - just ask naturally!
const url = await agent.execute(
  'Extract the URL from the "Learn More" link'
);

// Extract from article titles
const articleUrl = await agent.execute(
  'Get the URL from the article titled "Introduction to AI"'
);

// Extract multiple URLs with structured output
const urls = await agent.execute(
  'Extract URLs from the top 3 navigation links',
  z.array(z.object({
    linkText: z.string(),
    url: z.string(),
  }))
);
```

#### Advanced Capabilities

**Smart Search Strategies** (prioritized in order):
1. **Exact text matching** - Finds elements containing the exact visible text
2. **Partial text matching** - Matches text within larger content blocks
3. **Anchor tag detection** - Locates `<a>` tags containing the text
4. **CSS selector fallback** - Direct element selection if text is a valid selector
5. **Clickable element search** - Finds interactive elements with the text
6. **URL pattern extraction** - Detects URLs directly within text content

**Technical Features**:
- **Computer Use optimized** - Works seamlessly with Claude's visual perception
- **Multiple HTML structures** - Handles complex nested elements and dynamic content
- **Automatic URL normalization** - Converts relative to absolute URLs
- **Smart error handling** - Provides helpful feedback when elements aren't found
- **Logging and debugging** - Built-in console logging for troubleshooting

**Best Practices**:
- Use the exact visible text you can see on the page
- For buttons or links, use their label text (e.g., "Download", "Read More", "View Details")
- For articles or stories, use their title text
- The tool will automatically handle finding the associated URL

---

### 🎯 Instant Text Navigation

Jump directly to any text in dropdowns, lists, or scrollable containers - no multiple scroll attempts needed!

#### How It Works

The agent can use the `scroll_to_text` playwright method to instantly navigate to specific text:

```typescript
// The agent sees a state dropdown and needs Wyoming
await agent.execute(`
  Use the playwright scroll_to_text method to find "Wyoming" in the state picker
`);

// Behind the scenes, the agent calls:
// {"name": "playwright", "input": {"method": "scroll_to_text", "args": ["Wyoming"]}}
```

**Smart Features**:
- Automatically detects scrollable containers in viewport
- Searches visible containers first, then whole page
- Case-insensitive fallback if exact match not found
- Graceful fallback to regular scrolling if text not found
- No CSS selectors needed - just the visible text!

**When the agent uses this**:
- Finding specific options in dropdowns (states, countries, etc.)
- Navigating to products in long lists
- Jumping to specific items in sidebars
- Any scenario where exact text is known

**Example**: Instead of 10+ small scrolls to find "Wyoming", it's now a single instant jump!

---

### 🖱️ Smart Scrolling (90 % Viewport)

Speed through long pages while preserving precise control in small UI elements.

* **Default behaviour** &nbsp;→&nbsp; Scrolls ~90 % of the viewport with ~10 % overlap for maximum throughput.
* **Fine control** &nbsp;→&nbsp; `scroll_amount` between **5-20** performs tiny scrolls—perfect for dropdowns, lists, side-panels.
* **Configurable** &nbsp;→&nbsp; Accepts any `scroll_amount` 1-100 and degrades gracefully.

> **Why it matters**: Form-heavy portals (e.g. insurance claim systems) often require rapid page-level scrolling punctuated by pixel-perfect adjustments inside select widgets. This feature automatically handles both cases.

---

### ⚡ Speed Optimizations

Screenshots now capture **~5× faster** and post-action waits are shortened:

| Action                | Old Delay | New Delay |
|-----------------------|-----------|-----------|
| Screenshot wait       | 2 s       | 0.3 s     |
| Post-typing wait      | 0.5 s     | 0.1 s     |
| Post-scroll wait      | 0.5 s     | 0.1 s     |
| Mouse move pause      | 0.1 s     | 0.02 s    |

These cut **1-2 seconds** from each multi-step interaction.

> ⚠️  **Heads-up:** Some sites rely on human-like pacing for anti-bot checks. If you encounter captchas or missing render states, increase the delays via the new constructor parameters:
>
> ```ts
> const fastComputer = new ComputerTool(page, '20250124', /* screenshotDelay */ 0.5);
> // or adjust post-action waits inside ComputerTool if needed
> ```

---

### ⏯️ Agent Signals (Pause / Resume / Cancel)

Bring **human-in-the-loop control** to long-running automation workflows.

* **Pause** an active `agent.execute()` run to inspect or fix the page
* **Resume** from the exact step where you left off
* **Cancel** gracefully without killing the process
* Real-time events: `onPause`, `onResume`, `onCancel`, `onError`

```typescript
const agent = new ComputerUseAgent({ apiKey, page });

// Subscribe to events
agent.controller.on('onPause', ({ step }) => console.log('Paused at', step));
```

---

### ⚙️ Configurable Execution Behavior

This fork includes a powerful configuration system that allows you to customize how the agent executes browser automation tasks. You can control typing speed, screenshot timing, scrolling strategy, mouse behaviour, and other automation settings to optimise for raw speed **or** human-like interaction.

#### Available Configuration Options

```typescript
import type { ExecutionConfig } from '@onkernel/cu-playwright-ts';

const executionConfig: ExecutionConfig = {
  typing: {
    mode: 'fill' | 'character-by-character',
    characterDelay: 12, // milliseconds between characters (character-by-character mode)
    completionDelay: 100, // milliseconds to wait after typing completes
  },
  screenshot: {
    delay: 0.3, // seconds to wait before taking screenshots
    quality: 'low' | 'medium' | 'high',
  },
  mouse: {
    moveSpeed: 'instant' | 'fast' | 'normal' | 'slow',
    clickDelay: 50, // milliseconds to wait after clicks
  },
  scrolling: {
    /**
     * When no scroll_amount is provided the agent will use this mode
     * with ~90 % viewport coverage for page-level scrolling.
     */
    mode: 'percentage', // (future-proofed for pixel or element-based modes)
    /** Default percentage of the viewport to scroll. */
    percentage: 90,
    /** Overlap percentage to keep for context during large scrolls. */
    overlap: 10,
  },
};
```

#### Typing Mode Configuration

The most impactful configuration is the typing behavior. You can choose between two modes:

**🚀 Fill Mode (Fastest)** - Directly fills input fields bypassing keyboard events entirely:
```typescript
const fastAgent = new ComputerUseAgent({
  apiKey: process.env.ANTHROPIC_API_KEY!,
  page,
  executionConfig: {
    typing: { mode: 'fill', completionDelay: 50 }
  }
});
```

**⌨️ Character-by-Character Mode (Human-like)** - Types text one character at a time with configurable delays:
```typescript
const humanLikeAgent = new ComputerUseAgent({
  apiKey: process.env.ANTHROPIC_API_KEY!,
  page,
  executionConfig: {
    typing: {
      mode: 'character-by-character',
      characterDelay: 100, // 100ms between each character
      completionDelay: 200,
    }
  }
});
```

**⚡ Fast Character Mode (Balanced)** - Best of both worlds - visible typing but very fast:
```typescript
const balancedAgent = new ComputerUseAgent({
  apiKey: process.env.ANTHROPIC_API_KEY!,
  page,
  executionConfig: {
    typing: {
      mode: 'character-by-character',
      characterDelay: 5, // Very fast character typing
      completionDelay: 75,
    }
  }
});
```

**Performance Comparison:**

| Mode | Speed | Visibility | Use Case |
|------|--------|------------|----------|
| **Fill** | ⚡⚡⚡ Fastest | ❌ Instant | Production, speed-critical tasks |
| **Fast Character** | ⚡⚡ Very Fast | ✅ Visible | Development, debugging |
| **Slow Character** | ⚡ Human-like | ✅ Very visible | Demos, human-like automation |

#### Try the Example

Run the included example to see the performance differences:

```bash
# Run the typing configuration example (set ANTHROPIC_API_KEY first)
npx ts-node examples/example-typing-config.ts
agent.controller.on('onResume', () => console.log('Resumed'));

// Trigger a pause after 5 s
setTimeout(() => agent.controller.signal('pause'), 5_000);

// Start a task (the controller is available immediately)
await agent.execute('Get the titles of the top 10 stories');
```

Great for debugging, watchdog timeouts, and manual overrides.

---

## Features

- 🤖 **Simple API**: Single `ComputerUseAgent` class for all computer use tasks
- 🔄 **Dual Response Types**: Support for both text and structured (JSON) responses
- 🛡️ **Type Safety**: Full TypeScript support with Zod schema validation
- ⚡ **Optimized**: Clean error handling and robust JSON parsing
- 🎯 **Focused**: Clean API surface with sensible defaults

## Installation

```bash
npm install @onkernel/cu-playwright-ts
# or
yarn add @onkernel/cu-playwright-ts
# or
bun add @onkernel/cu-playwright-ts
```

## Quick Start

```typescript
import { chromium } from 'playwright';
import { ComputerUseAgent } from '@onkernel/cu-playwright-ts';

const browser = await chromium.launch({ headless: false });
const page = await browser.newPage();

// Navigate to Hacker News manually first
await page.goto("https://news.ycombinator.com/");

const agent = new ComputerUseAgent({
  apiKey: process.env.ANTHROPIC_API_KEY!,
  page,
});

// Simple text response
const answer = await agent.execute('Tell me the title of the top story');
console.log(answer);

await browser.close();
```

## API Reference

### `ComputerUseAgent`

The main class for computer use automation.

#### Constructor

```typescript
new ComputerUseAgent(options: {
  apiKey: string;
  page: Page;
  model?: string;
})
```

**Parameters:**
- `apiKey` (string): Your Anthropic API key. Get one from [Anthropic Console](https://console.anthropic.com/)
- `page` (Page): Playwright page instance to control
- `model` (string, optional): Anthropic model to use. Defaults to `'claude-sonnet-4-20250514'`

**Supported Models:**
See [Anthropic's Computer Use documentation](https://docs.anthropic.com/en/docs/agents-and-tools/tool-use/computer-use-tool#model-compatibility) for the latest model compatibility.

#### `execute()` Method

```typescript
async execute<T = string>(
  query: string,
  schema?: z.ZodSchema<T>,
  options?: {
    systemPromptSuffix?: string;
    thinkingBudget?: number;
  }
): Promise<T>
```

**Parameters:**

- **`query`** (string): The task description for Claude to execute
  
- **`schema`** (ZodSchema, optional): Zod schema for structured responses. When provided, the response will be validated against this schema
  
- **`options`** (object, optional):
  - **`systemPromptSuffix`** (string): Additional instructions appended to the system prompt
  - **`thinkingBudget`** (number): Token budget for Claude's internal reasoning process. Default: `1024`. See [Extended Thinking documentation](https://docs.anthropic.com/en/docs/build-with-claude/extended-thinking) for details

**Returns:** 
- `Promise<T>`: When `schema` is provided, returns validated data of type `T`
- `Promise<string>`: When no `schema` is provided, returns the text response

## Usage Examples

### Text Response

```typescript
import { ComputerUseAgent } from '@onkernel/cu-playwright-ts';

// Navigate to the target page first
await page.goto("https://news.ycombinator.com/");

const agent = new ComputerUseAgent({
  apiKey: process.env.ANTHROPIC_API_KEY!,
  page,
});

const result = await agent.execute(
  'Tell me the title of the top story on this page'
);
console.log(result); // "Title of the top story"
```

### Structured Response with Zod

```typescript
import { z } from 'zod';
import { ComputerUseAgent } from '@onkernel/cu-playwright-ts';

const agent = new ComputerUseAgent({
  apiKey: process.env.ANTHROPIC_API_KEY!,
  page,
});

const HackerNewsStory = z.object({
  title: z.string(),
  points: z.number(),
  author: z.string(),
  comments: z.number(),
  url: z.string().optional(),
});

const stories = await agent.execute(
  'Get the top 5 Hacker News stories with their details',
  z.array(HackerNewsStory).max(5)
);

console.log(stories);
// [
//   {
//     title: "Example Story",
//     points: 150,
//     author: "user123",
//     comments: 42,
//     url: "https://example.com"
//   },
//   ...
// ]
```

### Advanced Options

```typescript
const result = await agent.execute(
  'Complex task requiring more thinking',
  undefined, // No schema for text response
  {
    systemPromptSuffix: 'Be extra careful with form submissions.',
    thinkingBudget: 4096, // More thinking tokens for complex tasks
  }
);
```

## Environment Setup

1. **Anthropic API Key**: Set your API key as an environment variable:
   ```bash
   export ANTHROPIC_API_KEY=your_api_key_here
   ```

2. **Playwright**: Install Playwright and browser dependencies:
   ```bash
   npx playwright install
   ```

## Computer Use Parameters

This SDK leverages Anthropic's Computer Use API with the following key parameters:

### Model Selection
- **Claude 3.5 Sonnet**: Best balance of speed and capability for most tasks
- **Claude 4 Models**: Enhanced reasoning with extended thinking capabilities
- **Claude 3.7 Sonnet**: Advanced reasoning with thinking transparency

### Thinking Budget
The `thinkingBudget` parameter controls Claude's internal reasoning process:
- **1024 tokens** (default): Suitable for simple tasks
- **4096+ tokens**: Better for complex reasoning tasks
- **16k+ tokens**: Recommended for highly complex multi-step operations

See [Anthropic's Extended Thinking guide](https://docs.anthropic.com/en/docs/build-with-claude/extended-thinking#working-with-thinking-budgets) for optimization tips.

## Error Handling

The SDK includes built-in error handling:

```typescript
try {
  const result = await agent.execute('Your task here');
  console.log(result);
} catch (error) {
  if (error.message.includes('No response received')) {
    console.log('Agent did not receive a response from Claude');
  } else {
    console.log('Other error:', error.message);
  }
}
```

## Best Practices

1. **Use specific, clear instructions**: "Click the red 'Submit' button" vs "click submit"

2. **For complex tasks, break them down**: Use step-by-step instructions in your query

3. **Optimize thinking budget**: Start with default (1024) and increase for complex tasks

4. **Handle errors gracefully**: Implement proper error handling for production use

5. **Use structured responses**: When you need specific data format, use Zod schemas

6. **Test in headless: false**: During development, run with visible browser to debug

## Security Considerations

⚠️ **Important**: Computer use can interact with any visible application. Always:

- Run in isolated environments (containers/VMs) for production
- Avoid providing access to sensitive accounts or data
- Review Claude's actions in logs before production deployment
- Use allowlisted domains when possible

See [Anthropic's Computer Use Security Guide](https://docs.anthropic.com/en/docs/agents-and-tools/tool-use/computer-use-tool#security-considerations) for detailed security recommendations.

## Requirements

- Node.js 18+
- TypeScript 5+
- Playwright 1.52+
- Anthropic API key

## Related Resources

- [Anthropic Computer Use Documentation](https://docs.anthropic.com/en/docs/agents-and-tools/tool-use/computer-use-tool)
- [Extended Thinking Guide](https://docs.anthropic.com/en/docs/build-with-claude/extended-thinking)
- [Playwright Documentation](https://playwright.dev/)
- [Zod Documentation](https://zod.dev/)

## License

See [License](./LICENSE)