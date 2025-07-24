import type { Page } from 'playwright';
import { ToolError, type ToolResult, type ComputerUseTool, type FunctionToolDef, type ActionParams } from './types/base';

// Supported Playwright methods
const SUPPORTED_METHODS = ['extract_url'] as const;
type SupportedMethod = typeof SUPPORTED_METHODS[number];

export type PlaywrightActionParams = ActionParams & {
  method: string;
  args: string[];
}

export class PlaywrightTool implements ComputerUseTool {
  name: 'playwright' = 'playwright';
  protected page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  toParams(): FunctionToolDef {
    return {
      name: this.name,
      type: 'custom',
      input_schema: {
        type: 'object',
        properties: {
          method: {
            type: 'string',
            description: 'The playwright function to call.',
            enum: SUPPORTED_METHODS,
          },
          args: {
            type: 'array',
            description: 'The required arguments',
            items: {
              type: 'string',
              description: 'The argument to pass to the function',
            },
          },
        },
        required: ['method', 'args'],
      },
    };
  }

  private validateMethod(method: string): method is SupportedMethod {
    return SUPPORTED_METHODS.includes(method as SupportedMethod);
  }

  private async executeExtractUrl(args: string[]): Promise<ToolResult> {
    if (args.length !== 1) {
      throw new ToolError('extract_url method requires exactly one argument: the selector or text to find the element');
    }

    const selector = args[0];
    if (!selector || typeof selector !== 'string') {
      throw new ToolError('Selector must be a non-empty string');
    }

    console.log(`\n=== Extract URL: Looking for text: "${selector}" ===`);

    try {
      // Try multiple strategies to find the element and extract URL
      let url: string | null = null;
      let elementInfo: string = '';

      // Strategy 1: Find element by exact or partial text match (prioritized since Computer Use sees text)
      const textElement = await this.page.locator(`text="${selector}"`).first();
      const partialTextElement = await this.page.locator(`text=/.*${selector}.*/i`).first();
      
      if (await textElement.count() > 0) {
        // Check if the element itself has an href
        url = await textElement.getAttribute('href');
        if (url) {
          elementInfo = 'element with exact matching text';
        } else {
          // Check if it's wrapped in an anchor
          const parentAnchor = await textElement.locator('xpath=ancestor::a[1]').first();
          if (await parentAnchor.count() > 0) {
            url = await parentAnchor.getAttribute('href');
            elementInfo = 'parent anchor of element with exact text';
          } else {
            // Check if there's a sibling or nearby anchor
            const nearbyAnchor = await textElement.locator('xpath=following-sibling::a[1] | preceding-sibling::a[1]').first();
            if (await nearbyAnchor.count() > 0) {
              url = await nearbyAnchor.getAttribute('href');
              elementInfo = 'anchor near element with exact text';
            }
          }
        }
      } else if (await partialTextElement.count() > 0) {
        // Try with partial match
        url = await partialTextElement.getAttribute('href');
        if (url) {
          elementInfo = 'element with partial matching text';
        } else {
          const parentAnchor = await partialTextElement.locator('xpath=ancestor::a[1]').first();
          if (await parentAnchor.count() > 0) {
            url = await parentAnchor.getAttribute('href');
            elementInfo = 'parent anchor of element with partial text match';
          }
        }
      }

      // Strategy 2: Look for anchor tags containing the text
      if (!url) {
        const anchorWithText = await this.page.locator(`a:has-text("${selector}")`).first();
        if (await anchorWithText.count() > 0) {
          url = await anchorWithText.getAttribute('href');
          const text = await anchorWithText.textContent();
          elementInfo = `anchor tag with text: "${text?.trim() || 'N/A'}"`;
        }
      }

      // Strategy 3: Direct selector match (if user provides CSS selector)
      if (!url && (selector.includes('.') || selector.includes('#') || selector.includes('[') || selector.includes('>'))) {
        try {
          const element = await this.page.locator(selector).first();
          if (await element.count() > 0) {
            url = await element.getAttribute('href');
            if (!url) {
              // Check for other URL attributes
              url = await element.getAttribute('data-url') || 
                    await element.getAttribute('data-href') || 
                    await element.getAttribute('data-link');
            }
            if (url) {
              elementInfo = 'element matching CSS selector';
            }
          }
        } catch {
          // Selector might be invalid, continue with other strategies
        }
      }

      // Strategy 4: Look for clickable elements with the text that might have onclick handlers
      if (!url) {
        const clickableElements = await this.page.locator(`button:has-text("${selector}"), [role="button"]:has-text("${selector}"), [role="link"]:has-text("${selector}")`).first();
        if (await clickableElements.count() > 0) {
          // Check for data attributes that might contain URLs
          url = await clickableElements.getAttribute('data-url') || 
                await clickableElements.getAttribute('data-href') || 
                await clickableElements.getAttribute('data-link') ||
                await clickableElements.getAttribute('data-target');
          if (url) {
            elementInfo = 'clickable element with URL in data attribute';
          }
        }
      }

      // Strategy 5: Check if the text itself contains a URL
      if (!url) {
        const elements = await this.page.locator(`*:has-text("${selector}")`).all();
        for (const el of elements) {
          const textContent = await el.textContent();
          if (textContent) {
            // Look for URL patterns in text
            const urlMatch = textContent.match(/https?:\/\/[^\s<>"{}|\\^`[\]]+/);
            if (urlMatch) {
              url = urlMatch[0];
              elementInfo = 'URL found in text content';
              break;
            }
          }
        }
      }

      if (!url) {
        throw new ToolError(`Could not find any URL associated with text or selector: "${selector}". Try being more specific about the link text you can see on the page.`);
      }

      // Normalize relative URLs to absolute
      if (url.startsWith('/')) {
        const baseUrl = new URL(this.page.url());
        url = `${baseUrl.origin}${url}`;
      } else if (!url.startsWith('http')) {
        // Handle protocol-relative URLs
        if (url.startsWith('//')) {
          const baseUrl = new URL(this.page.url());
          url = `${baseUrl.protocol}${url}`;
        } else {
          // Relative URL without leading slash
          const baseUrl = new URL(this.page.url());
          url = new URL(url, baseUrl.href).href;
        }
      }

      return {
        output: `Successfully extracted URL: ${url} (from ${elementInfo})`,
      };
    } catch (error) {
      if (error instanceof ToolError) {
        throw error;
      }
      throw new ToolError(`Failed to extract URL for selector "${selector}": ${error}`);
    }
  }

  async call(params: PlaywrightActionParams): Promise<ToolResult> {
    const { method, args } = params as PlaywrightActionParams;

    if (!this.validateMethod(method)) {
      throw new ToolError(
        `Unsupported method: ${method}. Supported methods: ${SUPPORTED_METHODS.join(', ')}`
      );
    }

    if (!Array.isArray(args)) {
      throw new ToolError('args must be an array');
    }

    switch (method) {
      case 'extract_url':
        return await this.executeExtractUrl(args);
      default:
        throw new ToolError(`Method ${method} is not implemented`);
    }
  }
} 