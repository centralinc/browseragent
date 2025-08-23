/**
 * Example: Instance-Specific Playwright Capabilities
 *
 * This shows how to create ComputerUseAgent instances with custom Playwright capabilities
 * and browser-aware external tools that can access the Page object.
 */

import { chromium } from 'playwright';
import { z } from 'zod';
import { ComputerUseAgent } from '../agent';
import type { PlaywrightCapabilityDef, ToolResult, ComputerUseTool, FunctionToolDef, ToolCallParams } from '../tools/types/base';

// Define custom capabilities as objects (instance-specific)
const customCapabilities: PlaywrightCapabilityDef[] = [
  // Example 1: Add a capability to fill forms quickly
  {
    method: 'fill_form',
    displayName: 'Fill Form Fields',
    description: 'Fill multiple form fields at once',
    usage: `Fill multiple form fields in a single operation
Call format: {"name": "playwright", "input": {"method": "fill_form", "args": ["selector1", "value1", "selector2", "value2", ...]}}
Pairs of selector and value are provided as arguments`,
    schema: z.array(z.string()).refine(arr => arr.length % 2 === 0, {
      message: 'Arguments must be in pairs of selector and value',
    }),
    handler: async (page, args) => {
      const pairs: string[] = [];
      for (let i = 0; i < args.length; i += 2) {
        const selector = args[i];
        const value = args[i + 1];
        await page.fill(selector, value);
        pairs.push(`${selector} = "${value}"`);
      }
      return {
        output: `Filled ${pairs.length} form fields: ${pairs.join(', ')}`,
      };
    },
  },

  // Example 2: Add a capability to wait for specific text
  {
    method: 'wait_for_text',
    displayName: 'Wait for Text',
    description: 'Wait for specific text to appear on the page',
    usage: `Wait until specific text appears on the page
Call format: {"name": "playwright", "input": {"method": "wait_for_text", "args": ["text to wait for", "timeout in seconds (optional)"]}}
Useful for waiting for dynamic content to load`,
    schema: z.tuple([
      z.string(),
      z.string().optional(),
    ]),
    handler: async (page, args) => {
      const [text, timeoutStr] = args;
      const timeout = timeoutStr ? parseInt(timeoutStr) * 1000 : 30000;

      await page.waitForSelector(`text="${text}"`, { timeout });

      return {
        output: `Text "${text}" appeared`,
      };
    },
  },

  // Example 3: Add a capability to take element screenshots
  {
    method: 'screenshot_element',
    displayName: 'Screenshot Element',
    description: 'Take a screenshot of a specific element',
    usage: `Capture a screenshot of a specific element on the page
Call format: {"name": "playwright", "input": {"method": "screenshot_element", "args": ["selector"]}}
Returns a base64 encoded image of the element`,
    schema: z.tuple([z.string()]),
    handler: async (page, args) => {
      const [selector] = args;
      const element = await page.locator(selector).first();

      if (!(await element.count())) {
        throw new Error(`Element ${selector} not found`);
      }

      const screenshot = await element.screenshot();
      const base64 = screenshot.toString('base64');

      return {
        output: `Screenshot of ${selector} captured`,
        base64Image: base64,
      };
    },
  }
];

// Usage example
async function demonstrateInstanceCapabilities() {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  // Create agent with instance-specific capabilities
  const agent = new ComputerUseAgent({
    apiKey: 'your-api-key',
    page,
    playwrightCapabilities: customCapabilities, // 👈 Instance-specific capabilities
  });

  // Navigate to a page
  await agent.execute('Navigate to https://example.com');

  // Use our custom fill_form capability (automatically available)
  console.log('\n=== Using fill_form capability ===');
  try {
    await agent.execute('Fill the form with email test@example.com and name John Doe');
  } catch (error) {
    console.log('Fill form error (expected on example.com):', error.message);
  }

  // Use wait_for_text capability
  console.log('\n=== Using wait_for_text capability ===');
  await agent.execute('Wait for the text "Example Domain" to appear');

  // Use screenshot_element capability
  console.log('\n=== Using screenshot_element capability ===');
  await agent.execute('Take a screenshot of the main heading (h1 element)');
  
  await browser.close();
}

// Run the example
if (require.main === module) {
  demonstrateInstanceCapabilities().catch(console.error);
}
