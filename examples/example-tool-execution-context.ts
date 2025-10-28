import { chromium } from "playwright";
import {
  ComputerUseAgent,
  type ComputerUseTool,
  type ToolResult,
  type ToolExecutionContext,
} from "../index";

class GreetingTool implements ComputerUseTool {
  name = "greet_user";

  toParams() {
    return {
      type: "custom" as const,
      name: this.name,
      input_schema: {
        type: "object" as const,
        properties: {
          name: { type: "string" },
        },
        required: ["name"],
      },
    };
  }

  async call(
    params: Record<string, unknown>,
    ctx?: ToolExecutionContext
  ): Promise<ToolResult> {
    const { name } = params as { name: string };
    
    const language = ctx?.language || "English";
    const sessionId = ctx?.sessionId || "unknown";
    
    console.log(`Session: ${sessionId}`);
    console.log(`Language: ${language}`);
    
    const greetings: Record<string, string> = {
      English: `Hello, ${name}!`,
      Spanish: `¡Hola, ${name}!`,
      French: `Bonjour, ${name}!`,
    };

    return {
      output: greetings[language as string] || greetings.English,
    };
  }
}

async function main() {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  const agent = new ComputerUseAgent({
    apiKey: process.env.ANTHROPIC_API_KEY!,
    page,
    tools: [new GreetingTool()],
  });

  try {
    await agent.execute(
      "Use the greet_user tool to greet Alice",
      undefined,
      {
        toolExecutionContext: {
          language: "Spanish",
          sessionId: "session_123",
        },
      }
    );

    console.log("✅ Done!");
  } finally {
    await browser.close();
  }
}

main();

