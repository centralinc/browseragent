import { z } from "zod";
import zodToJsonSchema from "zod-to-json-schema";
import type { Page } from "playwright";
import { computerUseLoop } from "./loop";
import { SignalBus, type SignalEventPayloadMap } from "./signals/bus";
import type { ControlSignal, SignalEvent } from "./signals/bus";
import type { ExecutionConfig } from "./tools/types/base";
import type { PlaywrightCapabilityDef } from "./tools/playwright-capabilities";
import type { ComputerUseTool } from "./tools/types/base";
import type { Logger } from "./utils/logger";
import { NoOpLogger } from "./utils/logger";

/**
 * Event callback interfaces for agent controller
 */
export interface AgentControllerEvents {
  onPause: (data: { at: Date; step: number }) => void;
  onResume: (data: { at: Date; step: number }) => void;
  onCancel: (data: { at: Date; step: number; reason?: string }) => void;
  onError: (data: { at: Date; step: number; error: unknown }) => void;
}

/**
 * Controller interface for managing agent execution signals
 */
export interface AgentController {
  /** Send a control signal to the running agent */
  signal(signal: "pause" | "resume" | "cancel"): void;
  /** Subscribe to agent events - returns unsubscribe function */
  on<K extends keyof AgentControllerEvents>(
    event: K,
    callback: AgentControllerEvents[K]
  ): () => void;
}

/**
 * Implementation of AgentController that wraps a SignalBus
 */
export class AgentControllerImpl implements AgentController {
  constructor(private readonly bus: SignalBus) {}

  signal(signal: "pause" | "resume" | "cancel"): void {
    this.bus.send(signal as ControlSignal);
  }

  on<K extends keyof AgentControllerEvents>(
    event: K,
    callback: AgentControllerEvents[K]
  ): () => void {
    // Pass through the full payload from SignalBus
    return this.bus.on(event as SignalEvent, (payload) => {
      switch (event) {
        case "onPause":
          (callback as AgentControllerEvents["onPause"])(
            payload as SignalEventPayloadMap["onPause"]
          );
          break;
        case "onResume":
          (callback as AgentControllerEvents["onResume"])(
            payload as SignalEventPayloadMap["onResume"]
          );
          break;
        case "onCancel":
          (callback as AgentControllerEvents["onCancel"])(
            payload as SignalEventPayloadMap["onCancel"]
          );
          break;
        case "onError":
          (callback as AgentControllerEvents["onError"])(
            payload as SignalEventPayloadMap["onError"]
          );
          break;
      }
    });
  }
}

/**
 * Computer Use Agent for automating browser interactions with Claude
 *
 * This agent provides a clean interface to Anthropic's Computer Use capabilities,
 * allowing Claude to interact with web pages through Playwright.
 *
 * @see https://docs.anthropic.com/en/docs/agents-and-tools/tool-use/computer-use-tool
 */
export class ComputerUseAgent {
  private apiKey: string;
  private model: string;
  private page: Page;
  private signalBus: SignalBus;
  private executionConfig?: ExecutionConfig;
  private playwrightCapabilities: PlaywrightCapabilityDef[];
  private tools: ComputerUseTool[];
  private logger: Logger;

  /** Expose control-flow signals */
  public readonly controller: AgentController;

  /**
   * Create a new ComputerUseAgent instance
   *
   * @param options - Configuration options
   * @param options.apiKey - Anthropic API key (get one from https://console.anthropic.com/)
   * @param options.page - Playwright page instance to control
   * @param options.model - Anthropic model to use (defaults to claude-sonnet-4-20250514)
   * @param options.executionConfig - Tool behavior configuration (typing speed, screenshots, etc.)
   * @param options.playwrightCapabilities - Custom Playwright capabilities for this agent instance
   * @param options.tools - Additional tools for this agent instance
   *
   * @see https://docs.anthropic.com/en/docs/agents-and-tools/tool-use/computer-use-tool#model-compatibility
   */
  constructor({
    apiKey,
    page,
    model = "claude-sonnet-4-20250514",
    executionConfig,
    playwrightCapabilities = [],
    tools = [],
    logger,
  }: {
    /** Anthropic API key for authentication */
    apiKey: string;
    /** Playwright page instance to control */
    page: Page;
    /**
     * Anthropic model to use for computer use tasks
     * @default 'claude-sonnet-4-20250514'
     */
    model?: string;
    /**
     * Execution behavior configuration
     * Controls typing speed, screenshot settings, mouse behavior, etc.
     */
    executionConfig?: ExecutionConfig;
    /**
     * Custom Playwright capabilities for this agent instance
     * These are merged with built-in capabilities
     */
    playwrightCapabilities?: PlaywrightCapabilityDef[];
    /**
     * Additional tools for this agent instance
     * These can be any ComputerUseTool implementations
     */
    tools?: ComputerUseTool[];
    /**
     * Custom logger for agent operations
     * @default NoOpLogger (no logging)
     */
    logger?: Logger;
  }) {
    this.apiKey = apiKey;
    this.model = model;
    this.page = page;
    this.executionConfig = executionConfig ?? {};
    this.playwrightCapabilities = playwrightCapabilities;
    this.tools = tools;
    this.logger = logger ?? new NoOpLogger();

    // NEW: create the signal bus + controller up-front so callers can pause *during* first run
    this.signalBus = new SignalBus();
    this.controller = new AgentControllerImpl(this.signalBus);

    // Set up signal logging
    this.controller.on("onPause", (data) => {
      this.logger.signal("pause", data.step);
    });

    this.controller.on("onResume", (data) => {
      this.logger.signal("resume", data.step);
    });

    this.controller.on("onCancel", (data) => {
      this.logger.signal("cancel", data.step, data.reason);
    });

    this.controller.on("onError", (data) => {
      this.logger.debug(`Agent error at step ${data.step}`, {
        error: data.error,
      });
    });
  }

  /**
   * Execute a computer use task with Claude
   *
   * This method can return either text responses or structured data validated against a Zod schema.
   *
   * @template T - The expected return type (string by default, or inferred from schema)
   * @param query - The task description for Claude to execute
   * @param schema - Optional Zod schema for structured responses
   * @param options - Additional execution options
   * @param options.systemPromptSuffix - Additional instructions appended to the system prompt
   * @param options.thinkingBudget - Token budget for Claude's internal reasoning (default: 1024)
   *
   * @returns Promise that resolves to either a string (when no schema) or validated data of type T
   *
   * @example
   * ```typescript
   * // Text response
   * const result = await agent.execute('Tell me the page title');
   *
   * // Structured response
   * const data = await agent.execute(
   *   'Get user info',
   *   z.object({ name: z.string(), age: z.number() })
   * );
   * ```
   *
   * @see https://docs.anthropic.com/en/docs/build-with-claude/extended-thinking
   */
  async execute<T = string>(
    query: string,
    schema?: z.ZodSchema<T>,
    options?: {
      /** Additional instructions appended to the system prompt */
      systemPromptSuffix?: string;
      /**
       * Token budget for Claude's internal reasoning process
       * @default undefined (thinking disabled)
       * @see https://docs.anthropic.com/en/docs/build-with-claude/extended-thinking#working-with-thinking-budgets
       */
      thinkingBudget?: number;
      /**
       * Maximum tokens for the response
       * Must be greater than thinkingBudget
       * @default 4096
       */
      maxTokens?: number;
      /**
       * Limit number of recent images to include in context
       * Helps prevent "Too much media" errors in long-running tasks
       * @default undefined (no limit)
       */
      onlyNMostRecentImages?: number;
    }
  ): Promise<T> {
    const startTime = Date.now();

    const {
      systemPromptSuffix,
      thinkingBudget,
      maxTokens,
      onlyNMostRecentImages,
    } = options ?? {};

    // Log agent start
    this.logger.agentStart(query, this.model, {
      systemPromptSuffix,
      thinkingBudget,
      maxTokens,
      onlyNMostRecentImages,
      schema: schema ? "provided" : "none",
    });

    // Prepare query with schema instructions if schema is provided
    let finalQuery = query;
    if (schema) {
      const jsonSchema = zodToJsonSchema(schema);
      finalQuery = `${query}

Please respond with a valid JSON object that matches this JSON Schema:
\`\`\`json
${JSON.stringify(jsonSchema, null, 2)}
\`\`\`

Respond ONLY with the JSON object, no additional text.`;
    }

    try {
      // Execute the computer use loop
      const loopParams = {
        query: finalQuery,
        apiKey: this.apiKey,
        playwrightPage: this.page,
        model: this.model,
        ...(systemPromptSuffix && { systemPromptSuffix }),
        ...(thinkingBudget && { thinkingBudget }),
        ...(maxTokens && { maxTokens }),
        ...(onlyNMostRecentImages && { onlyNMostRecentImages }),
        signalBus: this.signalBus,
        ...(this.executionConfig &&
          Object.keys(this.executionConfig).length > 0 && {
            executionConfig: this.executionConfig,
          }),
        playwrightCapabilities: this.playwrightCapabilities,
        tools: this.tools,
        logger: this.logger, // Pass logger to the loop
      };
      const messages = await computerUseLoop(loopParams);

      const lastMessage = messages[messages.length - 1];
      if (!lastMessage) {
        throw new Error("No response received");
      }

      const response = this.extractTextFromMessage(lastMessage);

      // Log completion
      const duration = Date.now() - startTime;
      this.logger.agentComplete(query, duration, messages.length);

      // If no schema provided, return string response
      if (!schema) {
        return response as T;
      }

      // Parse and validate structured response
      const parsed = this.parseJsonResponse(response);
      return schema.parse(parsed);
    } catch (error) {
      // Log error
      const duration = Date.now() - startTime;
      this.logger.agentError(query, error as Error, duration);
      throw error;
    }
  }

  private extractTextFromMessage(message: {
    content: string | Array<{ type: string; text?: string }>;
  }): string {
    if (typeof message.content === "string") {
      return message.content;
    }

    if (Array.isArray(message.content)) {
      return message.content
        .filter((block) => block.type === "text")
        .map((block) => block.text || "")
        .join("");
    }

    return "";
  }

  private parseJsonResponse(response: string): unknown {
    // Example: "Here's the data:\n```json\n{\"name\": \"John\", \"age\": 30}\n```\nHope this helps!"
    // Example: "```\n{\"status\": \"success\"}\n```"
    const jsonMatch = response.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/);
    if (jsonMatch && jsonMatch[1]) {
      return JSON.parse(jsonMatch[1].trim());
    }

    // Example: "The user data is {\"name\": \"John\", \"age\": 30} as requested."
    // Example: "Result: {\"items\": [1, 2, 3], \"total\": 3}"
    const objectMatch = response.match(/\{[\s\S]*\}/);
    if (objectMatch && objectMatch[0]) {
      return JSON.parse(objectMatch[0]);
    }

    // Example: "{\"name\": \"John\", \"age\": 30}" (clean JSON response)
    // Example: "  {\"status\": \"ok\"}  " (JSON with whitespace)
    return JSON.parse(response.trim());
  }
}

// Re-export types from signals/bus for external use
export type { ControlSignal, SignalEvent } from "./signals/bus";
