import { z } from 'zod';
import type { 
  ToolCapability, 
  ToolRegistry, 
  ToolRegistryConfig
} from './types';

/**
 * Default implementation of the tool registry
 */
export class DefaultToolRegistry implements ToolRegistry {
  private capabilities: Map<string, ToolCapability> = new Map();
  private config: ToolRegistryConfig;

  constructor(config: ToolRegistryConfig = {}) {
    this.config = {
      includeInSystemPrompt: true,
      validateInputs: true,
      ...config,
    };
  }

  private getCapabilityKey(tool: string, method: string): string {
    return `${tool}:${method}`;
  }

  register(capability: ToolCapability): void {
    const key = this.getCapabilityKey(capability.tool, capability.method);
    
    if (this.capabilities.has(key)) {
      throw new Error(`Capability '${key}' is already registered`);
    }
    
    // Apply configuration overrides
    if (this.config.overrides?.[key]) {
      capability = {
        ...capability,
        ...this.config.overrides[key],
      };
    }
    
    // Apply filter if provided
    if (this.config.filter && !this.config.filter(capability)) {
      return;
    }
    
    this.capabilities.set(key, capability);
  }

  get(tool: string, method: string): ToolCapability | undefined {
    return this.capabilities.get(this.getCapabilityKey(tool, method));
  }

  getToolCapabilities(tool: string): ToolCapability[] {
    return Array.from(this.capabilities.values())
      .filter(cap => cap.tool === tool);
  }

  getAll(): ToolCapability[] {
    return Array.from(this.capabilities.values());
  }



  isEnabled(tool: string, method: string): boolean {
    const capability = this.get(tool, method);
    return capability?.enabled !== false;
  }

  getToolNames(): string[] {
    const tools = new Set<string>();
    this.capabilities.forEach(cap => tools.add(cap.tool));
    return Array.from(tools);
  }

  validate(tool: string, method: string, args: unknown[]): { valid: boolean; errors?: string[] } {
    const capability = this.get(tool, method);
    if (!capability) {
      return { valid: false, errors: [`Unknown capability: ${tool}:${method}`] };
    }

    if (!this.config.validateInputs) {
      return { valid: true };
    }

    try {
      // Validate arguments against capability schema
      if (capability.schema) {
        // If schema expects an object but we have an array, convert
        if (args.length === 1 && typeof args[0] === 'object' && !Array.isArray(args[0])) {
          capability.schema.parse(args[0]);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } else if (capability.schema._def && (capability.schema._def as any).typeName === 'ZodObject' && args.length > 0) {
          // For methods expecting named parameters
          const obj = args.reduce((acc: Record<string, unknown>, val, idx) => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const keys = Object.keys((capability.schema._def as any).shape || {});
            if (keys[idx]) {
              acc[keys[idx]] = val;
            }
            return acc;
          }, {});
          capability.schema.parse(obj);
        } else {
          // For methods expecting array input
          capability.schema.parse(args);
        }
      }
      
      return { valid: true };
    } catch (error) {
      if (error instanceof z.ZodError) {
        return { 
          valid: false, 
          errors: error.errors.map(e => `${e.path.join('.')}: ${e.message}`)
        };
      }
      return { valid: false, errors: [String(error)] };
    }
  }

  generateToolDocs(tool: string): string {
    const capabilities = this.getToolCapabilities(tool)
      .filter(cap => cap.enabled !== false);
    
    if (capabilities.length === 0) {
      return '';
    }

    const sections: string[] = [
      `${tool.toUpperCase()} TOOL CAPABILITIES:`,
      `* You have access to a '${tool}' tool that provides the following capabilities:`
    ];

    // Add brief overview
    capabilities.forEach(cap => {
      sections.push(`  - '${cap.method}': ${cap.description}`);
    });
    sections.push('');

    // Add detailed usage for each capability
    capabilities.forEach(cap => {
      sections.push(this.generateCapabilityDoc(cap));
      sections.push('');
    });

    return sections.join('\n');
  }

  generateAllDocs(): string {
    const tools = this.getToolNames();
    if (tools.length === 0) {
      return '';
    }

    const sections: string[] = [];
    tools.forEach(tool => {
      const toolDocs = this.generateToolDocs(tool);
      if (toolDocs) {
        sections.push(toolDocs);
        sections.push(''); // Add spacing between tools
      }
    });

    return sections.join('\n').trim();
  }

  private generateCapabilityDoc(capability: ToolCapability): string {
    const lines: string[] = [];
    
    lines.push(`HOW TO USE ${capability.method.toUpperCase()}:`);
    
    // Add usage instructions
    const usageLines = capability.usage.split('\n').map(line => line.trim()).filter(Boolean);
    usageLines.forEach((line, index) => {
      lines.push(`${index + 1}. ${line}`);
    });
    
    return lines.join('\n');
  }
}

// Singleton instance
let globalRegistry: ToolRegistry | null = null;

/**
 * Get or create the global tool registry
 */
export function getToolRegistry(config?: ToolRegistryConfig): ToolRegistry {
  if (!globalRegistry) {
    globalRegistry = new DefaultToolRegistry(config);
  }
  return globalRegistry;
}

/**
 * Reset the global registry (useful for testing)
 */
export function resetToolRegistry(): void {
  globalRegistry = null;
}
