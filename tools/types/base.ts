import type { BetaTool, BetaToolComputerUse20241022, BetaToolComputerUse20250124 } from '../../types/beta';

export type ActionParams = Record<string, unknown>;

export interface ToolResult {
  output?: string;
  error?: string;
  base64Image?: string;
  system?: string;
}

export class ToolError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ToolError';
  }
} 

// Standard function tool definition for custom tools like Playwright
export interface FunctionToolDef {
  name: string;
  type: 'custom';
  input_schema: BetaTool.InputSchema;
}

// Computer tool definition (uses Anthropic's exact computer tool types)
export type ComputerToolDef = BetaToolComputerUse20241022 | BetaToolComputerUse20250124;

// Union type for all possible tool definitions
export type ComputerUseToolDef = ComputerToolDef | FunctionToolDef;

// Simple base interface for all tools
export interface ComputerUseTool {
  name: string;
  toParams(): ComputerUseToolDef;
  call(params: Record<string, unknown>): Promise<ToolResult>;
} 