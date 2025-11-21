import { chromium } from "playwright";
import { ComputerUseAgent } from "../index";
import path from "path";

async function keyboardSequenceExample(): Promise<void> {
  const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
  if (!ANTHROPIC_API_KEY) {
    throw new Error("ANTHROPIC_API_KEY environment variable is required");
  }

  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  const testFilePath = path.resolve(__dirname, "../test-ui-elements.html");
  await page.goto(`file://${testFilePath}`);

  try {
    console.log("\n=== Keyboard Sequence Examples ===");
    console.log("Testing enhanced keyboard action support:\n");

    const agent = new ComputerUseAgent({
      apiKey: ANTHROPIC_API_KEY,
      page,
    });

    console.log("1. Testing space-separated key sequence (Down Down Down)...");
    const result1 = await agent.execute(
      "Click on the state picker dropdown, then press Down 3 times to navigate through the list",
    );
    console.log("Result:", result1);

    await page.waitForTimeout(2000);

    console.log("\n2. Testing traditional key combination (Ctrl+A)...");
    await page.goto("https://httpbin.org/forms/post");
    const result2 = await agent.execute(
      'Focus on the "Customer name" field and select all text using Ctrl+A',
    );
    console.log("Result:", result2);

    await page.waitForTimeout(2000);

    console.log("\n3. Testing repetition syntax (Tab*3)...");
    const result3 = await agent.execute(
      "Navigate through the form fields by pressing Tab 3 times",
    );
    console.log("Result:", result3);

    await page.waitForTimeout(2000);

    console.log("\n4. Testing mixed navigation (Up Up Enter)...");
    await page.goto(`file://${testFilePath}`);
    const result4 = await agent.execute(
      "Click the state dropdown, navigate with arrow keys, and select an option",
    );
    console.log("Result:", result4);

    console.log("\n✅ All keyboard sequence tests completed!");
  } catch (error) {
    console.error("Error in keyboard sequence example:", error);
  } finally {
    await browser.close();
  }
}

keyboardSequenceExample().catch(console.error);

