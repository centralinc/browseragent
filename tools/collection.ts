import { ComputerTool20241022, ComputerTool20250124 } from './computer';
import { Action } from './types/computer';
import type { ActionParams, ToolResult } from './types/computer';
import type { ActionParams } from './types/computer';
import type { ComputerUseTool, ComputerUseToolDef, ToolResult } from './types/base';
import type { Page } from 'playwright';

export type ToolVersion = 'computer_use_20250124' | 'computer_use_20241022' | 'computer_use_20250429';

export const DEFAULT_TOOL_VERSION: ToolVersion = 'computer_use_20250429';

interface ToolGroup {
  readonly version: ToolVersion;
  readonly tools: (typeof ComputerTool20241022 | typeof ComputerTool20250124)[];
  readonly beta_flag: string;
}

export const TOOL_GROUPS: ToolGroup[] = [
  {
    version: 'computer_use_20241022',
    tools: [ComputerTool20241022],
    beta_flag: 'computer-use-2024-10-22',
  },
  {
    version: 'computer_use_20250124',
    tools: [ComputerTool20250124],
    beta_flag: 'computer-use-2025-01-24',
  },
  // 20250429 version inherits from 20250124
  {
    version: 'computer_use_20250429',
    tools: [ComputerTool20250124],
    beta_flag: 'computer-use-2025-01-24',
  },
];

export const TOOL_GROUPS_BY_VERSION: Record<ToolVersion, ToolGroup> = Object.fromEntries(
  TOOL_GROUPS.map(group => [group.version, group])
) as Record<ToolVersion, ToolGroup>;

export class ToolCollection {
  private tools: Map<string, ComputerTool20241022 | ComputerTool20250124>;
  private tools: Map<string, ComputerUseTool>;
  private page?: Page;

  constructor(...tools: (ComputerTool20241022 | ComputerTool20250124)[]) {
    this.tools = new Map(tools.map(tool => [tool.name, tool]));
  }

  toParams(): ActionParams[] {
  /**
   * Set the Page object for browser-aware tools
   */
  setPage(page: Page): void {
    this.page = page;
  }

  toParams(): ComputerUseToolDef[] {
    return Array.from(this.tools.values()).map(tool => tool.toParams());
  }

  async run(name: string, toolInput: { action: Action } & Record<string, ActionParams>): Promise<ToolResult> {
    const tool = this.tools.get(name);
    if (!tool) {
      throw new Error(`Tool ${name} not found`);
    }

    if (!Object.values(Action).includes(toolInput.action)) {
      throw new Error(`Invalid action ${toolInput.action} for tool ${name}`);
    console.log(`\n=== Running tool: ${name} ===`);
    console.log('Input:', JSON.stringify(toolInput, null, 2));

    // Prepare params with Page object if available and tool is browser-aware
    let finalParams = toolInput;
    if (this.page && 'call' in tool) {
      // Add page to params for browser-aware tools
      finalParams = { ...toolInput, _page: this.page };
      console.log('🔗 Providing Page object to browser-aware tool');
    }

    // Handle different tool types based on their expected input structure
    if (name === 'playwright') {
      // Validate playwright tool input
      const playwrightInput = toolInput as PlaywrightActionParams;
      if (!playwrightInput.method || !Array.isArray(playwrightInput.args)) {
        throw new Error(`Invalid input for playwright tool: method and args are required`);
      }
      return await tool.call(toolInput);
    } else {
      // Validate computer tool input
      const computerInput = toolInput as ActionParams;
      if (!computerInput.action || !Object.values(Action).includes(computerInput.action)) {
        throw new Error(`Invalid action ${computerInput.action} for tool ${name}`);
      }
      return await tool.call(finalParams);
    }

    return await tool.call(toolInput);
  }
} 