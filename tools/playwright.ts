import type { Page } from 'playwright';
import { ToolError, type ToolResult, type ComputerUseTool, type FunctionToolDef, type ActionParams } from './types/base';

// Supported Playwright methods
const SUPPORTED_METHODS = ['extract_url', 'scroll_to_text'] as const;
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

  private async executeScrollToText(args: string[]): Promise<ToolResult> {
    const [targetText] = args;
    
    if (!targetText) {
      throw new ToolError('target_text argument is required');
    }

    console.log(`[scroll_to_text] Looking for text: "${targetText}"`);

    try {
      const scrolled = await this.page.evaluate(({ targetText }) => {
        // First, try to identify if we're dealing with a scrollable container based on current viewport
        let possibleContainers: Element[] = [];
        
        // Find all elements that are scrollable and visible in viewport
        const allElements = document.querySelectorAll('*');
        for (let i = 0; i < allElements.length; i++) {
          const el = allElements[i];
          if (!el) continue;
          const rect = el.getBoundingClientRect();
          const style = window.getComputedStyle(el);
          
          // Check if element is visible and scrollable
          if (rect.width > 0 && rect.height > 0 && 
              rect.top < window.innerHeight && rect.bottom > 0 &&
              (style.overflowY === 'auto' || style.overflowY === 'scroll')) {
            possibleContainers.push(el);
            console.log('[scroll_to_text] Found scrollable container:', {
              tag: el.tagName,
              id: el.id,
              class: el.className,
              height: rect.height
            });
          }
        }
        
        // Search strategy: First try in visible scrollable containers, then whole document
        let searchScopes = possibleContainers.length > 0 ? [...possibleContainers, document.body] : [document.body];
        let foundElement: Element | null = null;
        
        console.log('[scroll_to_text] Searching in', searchScopes.length, 'containers');
        
        for (const scope of searchScopes) {
          // Find all text nodes containing the target text
          const walker = document.createTreeWalker(
            scope,
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
          if (!textNode) {
            // Try case-insensitive search
            const walkerCI = document.createTreeWalker(
              scope,
              NodeFilter.SHOW_TEXT,
              {
                acceptNode: (node) => {
                  if (node.textContent && node.textContent.toLowerCase().includes(targetText.toLowerCase())) {
                    return NodeFilter.FILTER_ACCEPT;
                  }
                  return NodeFilter.FILTER_REJECT;
                }
              }
            );
            textNode = walkerCI.nextNode();
          }
          
          if (textNode && textNode.parentElement) {
            foundElement = textNode.parentElement;
            break;
          }
        }
        
        if (!foundElement) {
          console.log('[scroll_to_text] Text not found in any container');
          return { success: false, message: `Text "${targetText}" not found` };
        }
        
        const element = foundElement;
        console.log('[scroll_to_text] Found element:', {
          tag: element.tagName,
          text: element.textContent?.substring(0, 50)
        });
        
        // Find the scrollable container for this element
        let scrollContainer = element;
        while (scrollContainer && scrollContainer !== document.body) {
          const style = window.getComputedStyle(scrollContainer);
          if (style.overflow === 'auto' || style.overflow === 'scroll' || 
              style.overflowY === 'auto' || style.overflowY === 'scroll') {
            console.log('[scroll_to_text] Found element\'s scroll container:', {
              tag: scrollContainer.tagName,
              id: scrollContainer.id,
              class: scrollContainer.className
            });
            break;
          }
          scrollContainer = scrollContainer.parentElement || scrollContainer;
        }
        
        let needsContainerScroll = false;
        
        // If element is in a scrollable container, scroll within that container
        if (scrollContainer && scrollContainer !== document.body && scrollContainer !== element) {
          const containerRect = scrollContainer.getBoundingClientRect();
          
          // First, ensure the scrollable container itself is visible in viewport
          if (containerRect.bottom < 0 || containerRect.top > window.innerHeight) {
            console.log('[scroll_to_text] Container not in viewport, scrolling container into view first');
            needsContainerScroll = true;
            scrollContainer.scrollIntoView({
              behavior: 'smooth',
              block: 'center'
            });
          }
          
          const elementRect = element.getBoundingClientRect();
          
          // Calculate scroll position to center the element in the container
          const scrollTop = scrollContainer.scrollTop + (elementRect.top - containerRect.top) - (containerRect.height / 2) + (elementRect.height / 2);
          
          console.log('[scroll_to_text] Scrolling container to position:', scrollTop);
          scrollContainer.scrollTop = scrollTop;
        } else {
          // No scrollable container, use scrollIntoView
          console.log('[scroll_to_text] Using scrollIntoView for element');
          element.scrollIntoView({
            behavior: 'smooth',
            block: 'center',
            inline: 'center'
          });
        }
        
        return { 
          success: true, 
          message: `Scrolled to "${targetText}"`,
          containerScrolled: needsContainerScroll,
          elementInfo: {
            tagName: element.tagName,
            className: element.className,
            id: element.id
          }
        };
      }, { targetText });

      if (!scrolled.success) {
        return {
          output: `${scrolled.message}. Consider using regular computer scroll instead.`,
        };
      }

      // Wait for scroll to complete - longer if container was scrolled first
      const waitTime = scrolled.containerScrolled ? 1200 : 800;
      await this.page.waitForTimeout(waitTime);
      
      return {
        output: scrolled.elementInfo 
          ? `${scrolled.message} (element: ${scrolled.elementInfo.tagName}${scrolled.elementInfo.id ? '#' + scrolled.elementInfo.id : ''}${scrolled.elementInfo.className ? '.' + scrolled.elementInfo.className : ''})`
          : scrolled.message,
      };
    } catch (error) {
      if (error instanceof ToolError) {
        throw error;
      }
      throw new ToolError(`Failed to scroll to text "${targetText}": ${error}`);
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
      case 'scroll_to_text':
        return await this.executeScrollToText(args);
      default:
        throw new ToolError(`Method ${method} is not implemented`);
    }
  }
} 