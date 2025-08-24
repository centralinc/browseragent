import 'reflect-metadata';
import { z } from 'zod';
import type { CapabilityDecoratorOptions, ToolCapability } from './types';
import { getToolRegistry } from './registry';

/**
 * Method decorator for registering tool capabilities
 * 
 * @example
 * ```typescript
 * class PlaywrightTool {
 *   @capability({
 *     tool: 'playwright',
 *     displayName: 'Navigate to URL',
 *     description: 'Navigate directly to any URL or website',
 *     usage: 'Use this to navigate to any website directly without using the URL bar'
 *   })
 *   @capabilitySchema(z.object({ url: z.string() }))
 *   async executeGoto(args: string[]): Promise<ToolResult> {
 *     // implementation
 *   }
 * }
 * ```
 */
export function capability(options: CapabilityDecoratorOptions): MethodDecorator {
  return function (target: object, propertyKey: string | symbol, descriptor: PropertyDescriptor): PropertyDescriptor {
    // Store metadata on the method
    const metadata = Reflect.getMetadata('capability:metadata', target, propertyKey) || {};
    Reflect.defineMetadata('capability:metadata', { ...metadata, ...options }, target, propertyKey);
    
    // Mark method as a capability
    Reflect.defineMetadata('capability:method', true, target, propertyKey);
    
    return descriptor;
  };
}

/**
 * Parameter schema decorator for capability methods
 */
export function capabilitySchema(schema: z.ZodSchema<unknown>): MethodDecorator {
  return function (target: object, propertyKey: string | symbol, descriptor: PropertyDescriptor): PropertyDescriptor {
    Reflect.defineMetadata('capability:schema', schema, target, propertyKey);
    return descriptor;
  };
}

/**
 * Register all decorated capabilities from a class instance
 */
export function registerCapabilities(instance: object, toolName?: string): void {
  const registry = getToolRegistry();
  const prototype = Object.getPrototypeOf(instance);
  
  // Get all method names
  const methodNames = Object.getOwnPropertyNames(prototype)
    .filter(name => name !== 'constructor' && typeof prototype[name] === 'function');
  
  methodNames.forEach(methodName => {
    // Check if method is marked as a capability
    if (!Reflect.getMetadata('capability:method', prototype, methodName)) {
      return;
    }
    
    // Get metadata
    const metadata = Reflect.getMetadata('capability:metadata', prototype, methodName) || {};
    const schema = Reflect.getMetadata('capability:schema', prototype, methodName);
    
    // Use provided tool name or extract from metadata or instance
    const tool = toolName || metadata.tool || (instance as { name?: string }).name || 'unknown';
    
    // Extract method name from the function name
    // Assuming pattern like 'executeGoto' -> 'goto'
    const method = methodName.replace(/^execute/, '').toLowerCase();
    
    // Create capability object
    const capability: ToolCapability = {
      tool,
      method,
      displayName: metadata.displayName || method,
      description: metadata.description || '',
      usage: metadata.usage || '',
      schema: schema || z.unknown(),
      enabled: metadata.enabled !== false,
    };
    
    registry.register(capability);
  });
}

/**
 * Class decorator to automatically register capabilities
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function withCapabilities<T extends { new(...args: any[]): object }>(constructor: T): T {
  return class extends constructor {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    constructor(...args: any[]) {
      super(...args);
      const instance = this as unknown as { name?: string };
      const toolName = instance.name || constructor.name.toLowerCase().replace(/tool$/, '');
      registerCapabilities(this, toolName);
    }
  } as T;
}

/**
 * Helper to create a tool capability configuration
 */
export function defineCapability(
  tool: string,
  method: string,
  options: Omit<CapabilityDecoratorOptions, 'tool'> & {
    schema?: z.ZodSchema<unknown>;
  }
): ToolCapability {
  return {
    tool,
    method,
    displayName: options.displayName,
    description: options.description,
    usage: options.usage,
    schema: options.schema || z.unknown(),
    enabled: options.enabled !== false,
  };
}
