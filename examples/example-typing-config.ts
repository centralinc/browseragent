import { chromium } from "playwright";
import { ComputerUseAgent } from "../index";
import type { ExecutionConfig } from "../tools/types/base";

async function typingConfigExample(): Promise<void> {
  const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
  if (!ANTHROPIC_API_KEY) {
    throw new Error("ANTHROPIC_API_KEY environment variable is required");
  }

  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  await page.goto("https://httpbin.org/forms/post");

  try {
    console.log("\n=== Typing Configuration Examples ===");

    // Example 1: Fill mode typing (maximum performance with locator.fill())
    console.log(
      "\n🚀 Testing FILL typing mode (fastest - directly fills input fields)...",
    );
    const fastTypingConfig: ExecutionConfig = {
      typing: {
        mode: "fill",
        completionDelay: 50,
      },
      screenshot: {
        delay: 0.1, // Faster screenshots for demo
      },
    };

    const fastAgent = new ComputerUseAgent({
      apiKey: ANTHROPIC_API_KEY,
      page,
      executionConfig: fastTypingConfig,
    });

    console.log(
      "Agent will fill text instantly using locator.fill() (fill mode)",
    );
    const fastResult = await fastAgent.execute(
      'Fill in the "Customer name" field with "John Smith" and the "Telephone" field with "555-0123"',
    );
    console.log("✅ Fill typing completed:", fastResult);

    // Wait a moment and clear the form
    await page.reload();
    await page.waitForTimeout(1000);

    // Example 2: Character-by-character typing (traditional)
    console.log(
      "\n⌨️ Testing CHARACTER-BY-CHARACTER typing mode (traditional)...",
    );
    const slowTypingConfig: ExecutionConfig = {
      typing: {
        mode: "character-by-character",
        characterDelay: 100, // Slower for demonstration
        completionDelay: 200,
      },
      screenshot: {
        delay: 0.2,
      },
    };

    const slowAgent = new ComputerUseAgent({
      apiKey: ANTHROPIC_API_KEY,
      page,
      executionConfig: slowTypingConfig,
    });

    console.log(
      "Agent will type character by character (100ms delay between characters)",
    );
    const slowResult = await slowAgent.execute(
      'Fill in the "Customer name" field with "Jane Doe" and the "Telephone" field with "555-0456"',
    );
    console.log("✅ Slow typing completed:", slowResult);

    console.log("\n📊 Performance Comparison Summary:");
    console.log(
      "• Fill mode: Fastest overall typing (directly fills input fields)",
    );
    console.log("• Character-by-character: Most human-like but slower");
    console.log("\n💡 Choose based on your needs:");
    console.log("• Use fill mode for maximum speed in production");
    console.log(
      "• Use character-by-character for debugging/demos or human-like interaction",
    );
  } catch (error) {
    console.error("❌ Typing configuration example failed:", error);
  } finally {
    await browser.close();
  }
}

// Run the example
typingConfigExample().catch(console.error);
