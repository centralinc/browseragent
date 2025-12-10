/**
 * Test Extended Thinking / thinkingBudget functionality
 * 
 * This example verifies that extended thinking works correctly
 * without causing 400 errors from improper thinking block handling.
 */

import { config } from "dotenv";
config({ path: "./examples/.env" });
import { chromium } from "playwright";
import { ComputerUseAgent } from "../index";
import { SimpleLogger } from "../utils/logger";

const logger = new SimpleLogger();

async function main() {
  console.log("=== Extended Thinking Test ===\n");

  if (!process.env.ANTHROPIC_API_KEY) {
    console.error("ERROR: ANTHROPIC_API_KEY environment variable is required");
    process.exit(1);
  }

  console.log("1. Launching browser...");
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 },
  });
  const page = await context.newPage();
  console.log("   ✓ Browser launched\n");

  console.log("2. Navigating to test page...");
  await page.goto("https://example.com");
  console.log("   ✓ Page loaded\n");

  console.log("3. Creating agent with extended thinking enabled...");
  const agent = new ComputerUseAgent({
    apiKey: process.env.ANTHROPIC_API_KEY!,
    page,
    logger,
  });
  console.log("   ✓ Agent created\n");

  console.log("4. Executing task with thinkingBudget...\n");
  console.log("=" .repeat(60));

  try {
    const result = await agent.execute(
      "Look at this page and tell me: What is the title of the page and what is the main heading? Provide a brief summary.",
      undefined,
      {
        thinkingBudget: 2048,
        maxTokens: 8192,
      }
    );

    console.log("=" .repeat(60));
    console.log("\n5. Result:\n");
    console.log(result);
    console.log("\n✅ Extended thinking test PASSED!");
  } catch (error) {
    console.log("=" .repeat(60));
    console.error("\n❌ Extended thinking test FAILED!");
    console.error("\nError details:");
    if (error instanceof Error) {
      console.error(`  Message: ${error.message}`);
      if (error.message.includes("thinking")) {
        console.error("\n  This appears to be a thinking block handling issue.");
        console.error("  The fix may not be complete.");
      }
    } else {
      console.error(error);
    }
    process.exit(1);
  } finally {
    console.log("\n6. Closing browser...");
    await browser.close();
    console.log("   ✓ Browser closed");
  }
}

main().catch(console.error);
