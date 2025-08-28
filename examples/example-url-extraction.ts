import { chromium } from "playwright";
import { ComputerUseAgent } from "../index";
import { z } from "zod";
async function urlExtractionExample(): Promise<void> {
  const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
  if (!ANTHROPIC_API_KEY) {
    throw new Error("ANTHROPIC_API_KEY environment variable is required");
  }

  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  try {
    console.log("=== URL Extraction Examples ===\n");

    // Example 1: Extract URL from a specific story on Hacker News
    await page.goto("https://news.ycombinator.com/");

    const agent = new ComputerUseAgent({
      apiKey: ANTHROPIC_API_KEY,
      page,
    });

    console.log("1. Extracting URL from the top story...");
    const result = await agent.execute(
      "Extract the URL from the top story on this page",
      z.object({
        url: z.string(),
      }),
    );
    console.log("Top story URL:", JSON.stringify(result, null, 2));
  } catch (error) {
    console.error("Error in URL extraction example:", error);
  } finally {
    await browser.close();
  }
}

// Run examples
async function runExamples(): Promise<void> {
  console.log("Running URL Extraction Examples...\n");

  await urlExtractionExample();
  // await structuredUrlExtractionExample();

  console.log("\nAll examples completed!");
}

runExamples().catch(console.error);
