import type {
  BetaToolComputerUse20241022,
  BetaToolComputerUse20250124,
  BetaTool,
} from "@anthropic-ai/sdk/resources/beta";

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
    this.name = "ToolError";
  }
}

// Standard function tool definition for custom tools like Playwright
export interface FunctionToolDef {
  name: string;
  type: "custom";
  input_schema: BetaTool.InputSchema;
}

// Computer tool definition (uses Anthropic's exact computer tool types)
export type ComputerToolDef =
  | BetaToolComputerUse20241022
  | BetaToolComputerUse20250124;

// Union type for all possible tool definitions
export type ComputerUseToolDef = ComputerToolDef | FunctionToolDef;

/**
 * Runtime context passed to tools during execution
 */
export interface ToolExecutionContext {
  page?: import("playwright").Page;
  [key: string]: unknown;
}

// Simple base interface for all tools
export interface ComputerUseTool {
  name: string;
  toParams(): ComputerUseToolDef;
  call(params: Record<string, unknown>, context?: ToolExecutionContext): Promise<ToolResult>;
}

/**
 * Tool call parameters that may include browser access
 */
export interface ToolCallParams extends Record<string, unknown> {
  _page?: import("playwright").Page;
}

/**
 * Configuration options for agent execution behavior
 */
export interface ExecutionConfig {
  /** Typing behavior configuration */
  typing?: TypingConfig;
  /** Screenshot settings */
  screenshot?: ScreenshotConfig;
  /** Mouse interaction settings */
  mouse?: MouseConfig;
  /** Scrolling behavior settings */
  scrolling?: ScrollingConfig;
}

/**
 * Typing behavior configuration
 */
export interface TypingConfig {
  /**
   * Typing mode with performance characteristics:
   * - 'fill': Fastest - directly fills input fields bypassing keyboard events entirely (6x+ faster than character-by-character)
   * - 'character-by-character': Human-like - simulates realistic keyboard events with configurable delays
   */
  mode: "character-by-character" | "fill";
  /** Delay between characters when using character-by-character mode (in milliseconds) */
  characterDelay?: number;
  /** Delay after typing completion (in milliseconds) */
  completionDelay?: number;
}

/**
 * Screenshot configuration
 */
export interface ScreenshotConfig {
  /** Delay before taking screenshot (in seconds) */
  delay?: number;
  /** Screenshot quality settings */
  quality?: "low" | "medium" | "high";
}

/**
 * Mouse interaction configuration
 */
export interface MouseConfig {
  /** Speed of mouse movements */
  moveSpeed?: "instant" | "fast" | "normal" | "slow";
  /** Click behavior settings */
  clickDelay?: number;
}

/**
 * Scrolling behavior configuration
 */
export interface ScrollingConfig {
  /** Scrolling mode */
  mode?: "percentage";
  /** Default percentage of viewport to scroll */
  percentage?: number;
  /** Overlap percentage for context */
  overlap?: number;
}

/**
 * Default execution configuration
 */
export const DEFAULT_EXECUTION_CONFIG: ExecutionConfig = {
  typing: {
    mode: "character-by-character",
    characterDelay: 12,
    completionDelay: 100,
  },
  screenshot: {
    delay: 0.3,
    quality: "medium",
  },
  mouse: {
    moveSpeed: "normal",
    clickDelay: 50,
  },
  scrolling: {
    mode: "percentage",
    percentage: 90,
    overlap: 10,
  },
};
