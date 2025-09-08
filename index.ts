export { ComputerUseAgent } from "./agent";
export type { BetaMessageParam, BetaTextBlock } from "./types/beta";
export type { ToolVersion } from "./tools/collection";
export { Action } from "./tools/types/computer";
export type {
  ToolResult,
  ExecutionConfig,
  TypingConfig,
  ScreenshotConfig,
  MouseConfig,
  ScrollingConfig,
} from "./tools/types/base";
export type {
  AgentController,
  AgentControllerEvents,
  ControlSignal,
  SignalEvent,
} from "./agent";

// Export tool registry system
export {
  getToolRegistry,
  resetToolRegistry,
  defineCapability,
  capability,
  capabilitySchema,
  withCapabilities,
  registerPlaywrightCapabilities,
  PLAYWRIGHT_CAPABILITIES,
} from "./tools/registry";
export type {
  ToolCapability,
  ToolRegistry,
  ToolRegistryConfig,
  CapabilityDecoratorOptions,
  RegistryAwareTool,
} from "./tools/registry";

// Export playwright-specific types
export type { PlaywrightCapabilityDef } from "./tools/playwright-capabilities";
export type { PlaywrightActionParams } from "./tools/playwright";
