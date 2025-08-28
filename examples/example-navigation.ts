import { chromium } from "playwright";
import { z } from "zod";
import { ComputerUseAgent } from "../index";

/**
 * Example demonstrating navigation through prompts using the Playwright tool
 */
async function navigationExample(): Promise<void> {
  const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
  if (!ANTHROPIC_API_KEY) {
    throw new Error("ANTHROPIC_API_KEY environment variable is required");
  }

  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  try {
    console.log("\n=== Navigation Through Prompt Example ===");
    const agent = new ComputerUseAgent({
      apiKey: ANTHROPIC_API_KEY,
      page,
    });

    // Navigate to a website using the prompt - the agent will use the playwright goto method
    console.log("Navigating to Hacker News...");
    await agent.execute("Navigate to news.ycombinator.com");

    // Verify we're on the right page
    const pageTitle = await agent.execute("What is the title of this webpage?");
    console.log("Page title:", pageTitle);

    // Navigate to another page
    console.log("\nNavigating to GitHub...");
    await agent.execute("Go to github.com");

    // Get structured information about the current page
    const PageInfo = z.object({
      url: z.string(),
      title: z.string(),
      description: z.string(),
    });

    const githubInfo = await agent.execute(
      "Get the current URL, page title, and a brief description of what this website is",
      PageInfo,
    );
    console.log("GitHub info:", JSON.stringify(githubInfo, null, 2));

    // Navigate using a full URL
    console.log("\nNavigating to a specific GitHub repo...");
    await agent.execute(
      "Navigate to https://github.com/anthropics/anthropic-sdk-typescript",
    );

    // Extract information from the page
    const repoInfo = await agent.execute(
      "What repository am I looking at and what is it for?",
    );
    console.log("Repository info:", repoInfo);

    // Test navigation with link clicking
    console.log("\nNavigating by clicking a link...");
    await agent.execute('Click on the "Code" tab if visible');

    // Complex navigation task
    console.log("\nPerforming a search...");
    await agent.execute(
      'Go to google.com and search for "playwright automation"',
    );

    const searchResults = await agent.execute(
      "What are the top 3 search results?",
      z
        .array(
          z.object({
            title: z.string(),
            description: z.string(),
            url: z.string().optional(),
          }),
        )
        .max(3),
    );
    console.log("Search results:", JSON.stringify(searchResults, null, 2));
  } catch (error) {
    console.error("Error in navigation example:", error);
  } finally {
    await browser.close();
  }
}

// Run the example
async function run(): Promise<void> {
  console.log("Running Navigation Example...");
  await navigationExample();
  console.log("\nExample completed!");
}

run().catch(console.error);
