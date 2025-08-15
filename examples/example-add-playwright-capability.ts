/**
 * Example: Adding new Playwright capabilities without inheritance
 * 
 * This shows how to add custom Playwright methods without extending the class
 */

import { chromium } from 'playwright';
import { z } from 'zod';
import { registerPlaywrightCapability } from '../tools/playwright-capabilities';
import { PlaywrightTool } from '../tools/playwright';
import type { ToolResult } from '../tools/types/base';

// Example 1: Add a capability to fill forms quickly
registerPlaywrightCapability({
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
    const pairs = [];
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
});

// Example 2: Add a capability to wait for specific text
registerPlaywrightCapability({
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
});

// Example 3: Add a capability to take element screenshots
registerPlaywrightCapability({
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
});

// Usage example
async function demonstrateCustomCapabilities() {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  // Create the tool - it automatically has all registered capabilities
  const tool = new PlaywrightTool(page);
  
  // Navigate to a page
  await tool.call({
    method: 'goto',
    args: ['https://example.com'],
  });
  
  // Use our custom fill_form capability
  console.log('\n=== Using fill_form capability ===');
  try {
    const result = await tool.call({
      method: 'fill_form',
      args: ['input[name="email"]', 'test@example.com', 'input[name="name"]', 'John Doe'],
    });
    console.log(result.output);
  } catch (error) {
    console.log('Fill form error (expected on example.com):', error.message);
  }
  
  // Use wait_for_text capability
  console.log('\n=== Using wait_for_text capability ===');
  const waitResult = await tool.call({
    method: 'wait_for_text',
    args: ['Example Domain', '5'],
  });
  console.log(waitResult.output);
  
  // Use screenshot_element capability
  console.log('\n=== Using screenshot_element capability ===');
  const screenshotResult = await tool.call({
    method: 'screenshot_element',
    args: ['h1'],
  });
  console.log(screenshotResult.output);
  console.log('Base64 image length:', screenshotResult.base64Image?.length || 0);
  
  // Show all available capabilities
  console.log('\n=== All Available Capabilities ===');
  console.log(PlaywrightTool.getCapabilityDocs());
  
  await browser.close();
}

// Run the example
if (require.main === module) {
  demonstrateCustomCapabilities().catch(console.error);
}
