import { z } from 'zod';
import type { ToolResult } from './types/base';
import type { Page } from 'playwright';

/**
 * Simple interface for defining Playwright capabilities
 */
export interface PlaywrightCapabilityDef {
  method: string;
  displayName: string;
  description: string;
  usage: string;
  schema: z.ZodSchema<any>;
  handler: (page: Page, args: string[]) => Promise<ToolResult>;
}

/**
 * Built-in Playwright capabilities
 */
export const PLAYWRIGHT_CAPABILITIES: Map<string, PlaywrightCapabilityDef> = new Map();

// GOTO capability
PLAYWRIGHT_CAPABILITIES.set('goto', {
  method: 'goto',
  displayName: 'Navigate to URL',
  description: 'Navigate directly to any URL or website',
  usage: `Use this to navigate to any website directly without using the URL bar
Call format: {"name": "playwright", "input": {"method": "goto", "args": ["url or domain"]}}
The tool will automatically add https:// if no protocol is specified
This is faster and more reliable than using ctrl+l and typing in the URL bar`,
  schema: z.tuple([z.string()]),
  handler: async (page: Page, args: string[]): Promise<ToolResult> => {
    if (args.length !== 1) {
      throw new Error('goto method requires exactly one argument: the URL');
    }

    const url = args[0];
    if (!url || typeof url !== 'string') {
      throw new Error('URL must be a non-empty string');
    }

    // Normalize URL
    let normalizedURL: string;
    try {
      const urlObj = new URL(url);
      normalizedURL = urlObj.href;
    } catch {
      try {
        const urlObj = new URL(`https://${url}`);
        normalizedURL = urlObj.href;
      } catch {
        throw new Error(`Invalid URL format: ${url}`);
      }
    }

    await page.goto(normalizedURL, { 
      waitUntil: 'networkidle',
      timeout: 30000 
    });
    
    await page.waitForTimeout(1000);
    
    const currentURL = page.url();
    const title = await page.title();
    
    return {
      output: `Successfully navigated to ${currentURL}. Page title: "${title}"`,
    };
  }
});

// EXTRACT_URL capability
PLAYWRIGHT_CAPABILITIES.set('extract_url', {
  method: 'extract_url',
  displayName: 'Extract URL',
  description: 'Extract URLs from visible text, links, or buttons on the page',
  usage: `First, take a screenshot to see what's on the page
Identify the visible text of the link/button you want to extract the URL from
Call format: {"name": "playwright", "input": {"method": "extract_url", "args": ["exact visible text"]}}
The tool will search for the text and extract the associated URL`,
  schema: z.tuple([z.string()]),
  handler: async (page: Page, args: string[]): Promise<ToolResult> => {
    if (args.length !== 1) {
      throw new Error('extract_url method requires exactly one argument');
    }

    const selector = args[0];
    console.log(`\n=== Extract URL: Looking for text: "${selector}" ===`);

    let url: string | null = null;
    let elementInfo: string = '';

    // Try to find element by text
    const textElement = await page.locator(`text="${selector}"`).first();
    if (await textElement.count() > 0) {
      url = await textElement.getAttribute('href');
      if (!url) {
        const parentAnchor = await textElement.locator('xpath=ancestor::a[1]').first();
        if (await parentAnchor.count() > 0) {
          url = await parentAnchor.getAttribute('href');
          elementInfo = 'parent anchor of element with exact text';
        }
      } else {
        elementInfo = 'element with exact matching text';
      }
    }

    if (!url) {
      const anchorWithText = await page.locator(`a:has-text("${selector}")`).first();
      if (await anchorWithText.count() > 0) {
        url = await anchorWithText.getAttribute('href');
        elementInfo = 'anchor tag with text';
      }
    }

    if (!url) {
      throw new Error(`Could not find any URL associated with text: "${selector}"`);
    }

    // Normalize relative URLs
    if (url.startsWith('/')) {
      const baseUrl = new URL(page.url());
      url = `${baseUrl.origin}${url}`;
    }

    return {
      output: `Successfully extracted URL: ${url} (from ${elementInfo})`,
    };
  }
});

// SCROLL_TO_TEXT capability
PLAYWRIGHT_CAPABILITIES.set('scroll_to_text', {
  method: 'scroll_to_text',
  displayName: 'Scroll to Text',
  description: 'Instantly scroll to specific text in dropdowns, lists, or on the page',
  usage: `When you need to find specific text in a dropdown/list, use this FIRST
Call format: {"name": "playwright", "input": {"method": "scroll_to_text", "args": ["exact text"]}}
Only provide the text you're looking for - no CSS selectors needed
This instantly scrolls the text into view without multiple attempts
If it fails, fall back to regular computer scroll`,
  schema: z.tuple([z.string()]),
  handler: async (page: Page, args: string[]): Promise<ToolResult> => {
    const [targetText] = args;
    
    if (!targetText) {
      throw new Error('target_text argument is required');
    }

    console.log(`[scroll_to_text] Looking for text: "${targetText}"`);

    const scrolled = await page.evaluate(({ targetText }) => {
      // Implementation from original scroll_to_text
      let foundElement: Element | null = null;
      
      // Find text in document
      const walker = document.createTreeWalker(
        document.body,
        NodeFilter.SHOW_TEXT,
        {
          acceptNode: (node) => {
            if (node.textContent && node.textContent.includes(targetText)) {
              return NodeFilter.FILTER_ACCEPT;
            }
            return NodeFilter.FILTER_REJECT;
          }
        }
      );
      
      let textNode = walker.nextNode();
      if (textNode && textNode.parentElement) {
        foundElement = textNode.parentElement;
      }
      
      if (!foundElement) {
        return { success: false, message: `Text "${targetText}" not found` };
      }
      
      foundElement.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
        inline: 'center'
      });
      
      return { 
        success: true, 
        message: `Scrolled to "${targetText}"`,
      };
    }, { targetText });

    if (!scrolled.success) {
      return {
        output: `${scrolled.message}. Consider using regular computer scroll instead.`,
      };
    }

    await page.waitForTimeout(800);
    
    return {
      output: scrolled.message,
    };
  }
});

/**
 * Register a new Playwright capability
 */
export function registerPlaywrightCapability(capability: PlaywrightCapabilityDef): void {
  if (PLAYWRIGHT_CAPABILITIES.has(capability.method)) {
    throw new Error(`Capability '${capability.method}' is already registered`);
  }
  PLAYWRIGHT_CAPABILITIES.set(capability.method, capability);
}

/**
 * Get all Playwright capabilities
 */
export function getPlaywrightCapabilities(): PlaywrightCapabilityDef[] {
  return Array.from(PLAYWRIGHT_CAPABILITIES.values());
}

/**
 * Generate documentation for Playwright capabilities
 */
export function generatePlaywrightDocs(): string {
  const capabilities = getPlaywrightCapabilities();
  const sections: string[] = [
    'PLAYWRIGHT TOOL CAPABILITIES:',
    '* You have access to a \'playwright\' tool that provides browser automation capabilities:'
  ];

  // Brief overview
  capabilities.forEach(cap => {
    sections.push(`  - '${cap.method}': ${cap.description}`);
  });
  sections.push('');

  // Detailed usage
  capabilities.forEach(cap => {
    sections.push(`HOW TO USE ${cap.method.toUpperCase()}:`);
    const usageLines = cap.usage.split('\n').filter(Boolean);
    usageLines.forEach((line, index) => {
      sections.push(`${index + 1}. ${line}`);
    });
    sections.push('');
  });

  return sections.join('\n');
}
