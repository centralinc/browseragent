import { chromium } from "playwright";
import { ComputerUseAgent, SimpleLogger } from "../index";

async function loggerExample(): Promise<void> {
  const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
  if (!ANTHROPIC_API_KEY) {
    throw new Error("ANTHROPIC_API_KEY environment variable is required");
  }

  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  try {
    console.log("\n=== Custom Logger Example ===");

    // Create a simple logger that logs everything
    const logger = new SimpleLogger();

    // You can also create a logger without detailed data logging
    // const logger = new SimpleLogger(false);

    const agent = new ComputerUseAgent({
      apiKey: ANTHROPIC_API_KEY,
      page,
      logger, // Pass the logger to the agent
    });

    // Navigate to a page
    await page.goto("https://news.ycombinator.com/");

    // Execute a task - all agent operations will be logged
    console.log("\n📝 Starting task with full logging...\n");

    const result = await agent.execute(
      "Get the title of the top story on this page"
    );

    console.log("\n✅ Task completed!");
    console.log("Result:", result);
  } catch (error) {
    console.error("❌ Example failed:", error);
  } finally {
    await browser.close();
  }
}

async function customLoggerExample(): Promise<void> {
  const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
  if (!ANTHROPIC_API_KEY) {
    throw new Error("ANTHROPIC_API_KEY environment variable is required");
  }

  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  try {
    console.log("\n=== Custom Logger Implementation Example ===");

    // Create a custom logger that only logs important events
    const customLogger = {
      log: (type: string, message: string, data?: any) => {
        // Only log agent start/complete and errors
        if (type === "agent" || type === "tool") {
          const timestamp = new Date().toISOString();
          console.log(`🔍 [${timestamp}] ${type.toUpperCase()}: ${message}`);
        }
      },
      agentStart: (query: string, model: string) => {
        console.log(`🚀 Starting task: "${query}" with ${model}`);
      },
      agentComplete: (
        query: string,
        duration: number,
        messageCount: number
      ) => {
        console.log(`✅ Task completed in ${(duration / 1000).toFixed(2)}s`);
      },
      agentError: (query: string, error: Error, duration: number) => {
        console.log(`❌ Task failed: ${error.message}`);
      },
      llmResponse: (stopReason: string, step: number) => {
        console.log(`🧠 LLM responded at step ${step} (${stopReason})`);
      },
      toolStart: (toolName: string, step: number) => {
        console.log(`🔧 Tool ${toolName} starting at step ${step}`);
      },
      toolComplete: (toolName: string, step: number, duration: number) => {
        console.log(`✅ Tool ${toolName} completed in ${duration}ms`);
      },
      toolError: (toolName: string, step: number, error: Error) => {
        console.log(`❌ Tool ${toolName} failed: ${error.message}`);
      },
      signal: (signal: string, step: number) => {
        console.log(`📡 Signal: ${signal} at step ${step}`);
      },
      debug: (message: string) => {
        console.log(`🐛 Debug: ${message}`);
      },
    };

    const agent = new ComputerUseAgent({
      apiKey: ANTHROPIC_API_KEY,
      page,
      logger: customLogger, // Use your custom logger
    });

    // Navigate to a page
    await page.goto("https://example.com");

    // Execute a task with custom logging
    console.log("\n📝 Starting task with custom logging...\n");

    const result = await agent.execute("Tell me what this page is about");

    console.log("\n✅ Task completed!");
    console.log("Result:", result);
  } catch (error) {
    console.error("❌ Example failed:", error);
  } finally {
    await browser.close();
  }
}

async function run(): Promise<void> {
  console.log("🚀 Running Logger Examples...\n");

  await loggerExample();

  console.log("\n" + "=".repeat(50) + "\n");

  await customLoggerExample();

  console.log("\n✅ All logger examples completed!");
}

if (require.main === module) {
  run().catch(console.error);
}

export { loggerExample, customLoggerExample };
