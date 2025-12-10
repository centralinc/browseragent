/**
 * Test Extended Thinking with Multi-Turn Tool Use
 * 
 * This test exercises the thinking block handling across multiple tool calls,
 * which is where the original 400 error would occur (issue #12).
 * 
 * The agent needs to:
 * 1. Navigate to a page (tool use)
 * 2. Take screenshot and analyze (tool use) 
 * 3. Click on something (tool use)
 * 4. Verify the result (tool use)
 * 
 * Each turn with thinking enabled requires proper thinking block ordering.
 */

import { config } from "dotenv";
config({ path: "./examples/.env" });

import { chromium } from "playwright";
import { ComputerUseAgent } from "../index";
import { SimpleLogger } from "../utils/logger";

async function main() {
  console.log("=== Extended Thinking Multi-Turn Test ===\n");

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

  console.log("2. Navigating to Wikipedia...");
  await page.goto("https://en.wikipedia.org/wiki/Main_Page");
  await page.waitForLoadState("networkidle");
  console.log("   ✓ Page loaded\n");

  console.log("3. Creating agent with extended thinking...");
  const logger = new SimpleLogger();
  const agent = new ComputerUseAgent({
    apiKey: process.env.ANTHROPIC_API_KEY!,
    page,
    logger,
  });
  console.log("   ✓ Agent created\n");

  console.log("4. Executing multi-step task with thinkingBudget...\n");
  console.log("   Task: Find and click the 'Random article' link, then report the article title\n");
  console.log("=" .repeat(70));

  const startTime = Date.now();

  try {
    const result = await agent.execute(
      `You are on Wikipedia's main page. Please do the following:
       1. First, take a screenshot to see the current page
       2. Find and click on the "Random article" link (it's usually in the left sidebar)
       3. Wait for the new page to load
       4. Take another screenshot
       5. Tell me the title of the random article you landed on
       
       Be thorough in your reasoning.`,
      undefined,
      {
        thinkingBudget: 4096,
        maxTokens: 16384,
      }
    );

    const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
    
    console.log("=" .repeat(70));
    console.log(`\n5. Result (completed in ${elapsed}s):\n`);
    console.log(result);
    console.log("\n✅ Multi-turn extended thinking test PASSED!");
    
  } catch (error) {
    console.log("=" .repeat(70));
    console.error("\n❌ Multi-turn extended thinking test FAILED!");
    console.error("\nError details:");
    if (error instanceof Error) {
      console.error(`  Message: ${error.message}`);
      
      // Check for the specific thinking block error
      if (error.message.includes("thinking") || error.message.includes("redacted_thinking")) {
        console.error("\n  🔴 This is a THINKING BLOCK HANDLING issue!");
        console.error("  The fix in issue #12 may not be complete.");
      }
      
      if (error.message.includes("400")) {
        console.error("\n  🔴 400 error from Anthropic API");
        console.error("  This usually indicates improper message construction.");
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
