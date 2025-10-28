import { ComputerTool20241022, ComputerTool20250124 } from "./computer";
import type { PlaywrightActionParams } from "./playwright";
import { Action } from "./types/computer";
import type { ActionParams } from "./types/computer";
import type {
  ComputerUseTool,
  ComputerUseToolDef,
  ToolResult,
  ToolExecutionContext,
} from "./types/base";
import type { Page } from "playwright";

export type ToolVersion =
  | "computer_use_20250124"
  | "computer_use_20241022"
  | "computer_use_20250429";

export const DEFAULT_TOOL_VERSION: ToolVersion = "computer_use_20250429";

interface ToolGroup {
  readonly version: ToolVersion;
  readonly tools: (typeof ComputerTool20241022 | typeof ComputerTool20250124)[];
  readonly beta_flag: string;
}

export const TOOL_GROUPS: ToolGroup[] = [
  {
    version: "computer_use_20241022",
    tools: [ComputerTool20241022],
    beta_flag: "computer-use-2024-10-22",
  },
  {
    version: "computer_use_20250124",
    tools: [ComputerTool20250124],
    beta_flag: "computer-use-2025-01-24",
  },
  // 20250429 version inherits from 20250124
  {
    version: "computer_use_20250429",
    tools: [ComputerTool20250124],
    beta_flag: "computer-use-2025-01-24",
  },
];

export const TOOL_GROUPS_BY_VERSION: Record<ToolVersion, ToolGroup> =
  Object.fromEntries(
    TOOL_GROUPS.map((group) => [group.version, group]),
  ) as Record<ToolVersion, ToolGroup>;

export class ToolCollection {
  private tools: Map<string, ComputerUseTool>;
  private page?: Page;
  private context?: ToolExecutionContext;

  constructor(...tools: ComputerUseTool[]) {
    this.tools = new Map(tools.map((tool) => [tool.name, tool]));
  }

  toParams(): ComputerUseToolDef[] {
    return Array.from(this.tools.values()).map((tool) => tool.toParams());
  }

  setPage(page: Page): void {
    this.page = page;
  }

  setContext(context: ToolExecutionContext): void {
    this.context = context;
  }

  async run(
    name: string,
    toolInput: Record<string, unknown>,
  ): Promise<ToolResult> {
    const tool = this.tools.get(name);
    if (!tool) {
      throw new Error(`Tool ${name} not found`);
    }

    console.log(`\n=== Running tool: ${name} ===`);
    console.log("Input:", JSON.stringify(toolInput, null, 2));

    // Create tool call params with page if available
    const toolCallParams: Record<string, unknown> = { ...toolInput };
    if (this.page) {
      toolCallParams._page = this.page;
    }

    // Create execution context
    const ctx: ToolExecutionContext = {
      ...(this.page && { page: this.page }),
      ...this.context,
    };

    // Get tool definition to determine type
    const toolDef = tool.toParams();

    // Handle different tool types based on their expected input structure
    if (name === "playwright") {
      // Validate playwright tool input
      const playwrightInput = toolInput as PlaywrightActionParams;
      if (!playwrightInput.method || !Array.isArray(playwrightInput.args)) {
        throw new Error(
          `Invalid input for playwright tool: method and args are required`,
        );
      }
      return await tool.call(toolCallParams, ctx);
    } else if ("type" in toolDef && toolDef.type === "custom") {
      // This is a custom function tool - no action validation needed
      return await tool.call(toolCallParams, ctx);
    } else {
      // This is a computer tool - validate action parameter
      const computerInput = toolInput as ActionParams;
      if (
        !computerInput.action ||
        !Object.values(Action).includes(computerInput.action)
      ) {
        throw new Error(
          `Invalid action ${computerInput.action} for tool ${name}`,
        );
      }
      return await tool.call(toolCallParams, ctx);
    }
  }
}
