import type { Page } from 'playwright';
import { ToolError, type ToolResult, type ComputerUseTool, type FunctionToolDef, type ActionParams } from './types/base';
import { 
  PLAYWRIGHT_CAPABILITIES, 
  generatePlaywrightDocs,
  type PlaywrightCapabilityDef 
} from './playwright-capabilities';

export type PlaywrightActionParams = ActionParams & {
  method: string;
  args: string[];
}

export class PlaywrightTool implements ComputerUseTool {
  name: 'playwright' = 'playwright';
  protected page: Page;
  protected capabilities: Map<string, PlaywrightCapabilityDef>;

  constructor(page: Page) {
    this.page = page;
    this.capabilities = PLAYWRIGHT_CAPABILITIES;
  }

  /**
   * Get capability documentation for including in system prompt
   */
  static getCapabilityDocs(): string {
    return generatePlaywrightDocs();
  }

  toParams(): FunctionToolDef {
    const enabledCapabilities = Array.from(this.capabilities.keys());

    return {
      name: this.name,
      type: 'custom',
      input_schema: {
        type: 'object',
        properties: {
          method: {
            type: 'string',
            description: 'The playwright function to call.',
            enum: enabledCapabilities,
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

  async call(params: PlaywrightActionParams): Promise<ToolResult> {
    const { method, args } = params as PlaywrightActionParams;

    const capability = this.capabilities.get(method);
    if (!capability) {
      const supportedMethods = Array.from(this.capabilities.keys());
      throw new ToolError(
        `Unsupported method: ${method}. Supported methods: ${supportedMethods.join(', ')}`
      );
    }

    if (!Array.isArray(args)) {
      throw new ToolError('args must be an array');
    }

    // Validate arguments against capability schema
    try {
      capability.schema.parse(args);
    } catch (error) {
      throw new ToolError(`Invalid arguments for ${method}: ${error}`);
    }

    // Execute the capability handler
    try {
      return await capability.handler(this.page, args);
    } catch (error) {
      throw new ToolError(`Failed to execute ${method}: ${error}`);
    }
  }
}