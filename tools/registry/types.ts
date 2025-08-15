import { z } from 'zod';

/**
 * Tool capability configuration
 * Generic interface that can be used by any tool (Playwright, Computer, etc.)
 */
export interface ToolCapability {
  /** Tool name (e.g., 'playwright', 'computer') */
  tool: string;
  /** Method/action name identifier */
  method: string;
  /** Human-readable display name */
  displayName: string;
  /** Short description of what this capability does */
  description: string;
  /** Detailed usage instructions and examples */
  usage: string;
  /** Input parameter schema using Zod for validation */
  schema: z.ZodSchema<unknown>;
  /** Whether this capability is enabled by default */
  enabled?: boolean;
}



/**
 * Tool registry interface
 */
export interface ToolRegistry {
  /** Register a new capability */
  register(capability: ToolCapability): void;
  /** Get a capability by tool and method name */
  get(tool: string, method: string): ToolCapability | undefined;
  /** Get all capabilities for a specific tool */
  getToolCapabilities(tool: string): ToolCapability[];
  /** Get all registered capabilities */
  getAll(): ToolCapability[];
  /** Check if a capability is enabled */
  isEnabled(tool: string, method: string): boolean;
  /** Generate documentation for a specific tool */
  generateToolDocs(tool: string): string;
  /** Generate documentation for all tools */
  generateAllDocs(): string;
  /** Validate method arguments against capability schema */
  validate(tool: string, method: string, args: unknown[]): { valid: boolean; errors?: string[] };
  /** Get all registered tool names */
  getToolNames(): string[];
}

/**
 * Decorator metadata for capability registration
 */
export interface CapabilityDecoratorOptions {
  tool: string;
  displayName: string;
  description: string;
  usage: string;
  enabled?: boolean;
}

/**
 * Configuration options for the tool registry
 */
export interface ToolRegistryConfig {
  /** Whether to include capability documentation in system prompts */
  includeInSystemPrompt?: boolean;
  /** Whether to validate inputs before execution */
  validateInputs?: boolean;
  /** Custom capability filter function */
  filter?: (capability: ToolCapability) => boolean;
  /** Override default enabled state for specific capabilities */
  overrides?: Record<string, { enabled: boolean }>; // format: "tool:method"
}

/**
 * Base interface for tools that use the registry
 */
export interface RegistryAwareTool {
  /** Tool name identifier */
  name: string;
  /** Get the tool registry instance */
  getRegistry(): ToolRegistry;
  /** Get documentation for this tool's capabilities */
  getCapabilityDocs(): string;
}
