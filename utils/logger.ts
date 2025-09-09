/**
 * Simple logger that logs everything in one place
 */
export interface Logger {
  /** Log any event with type, message and optional data */
  log(type: string, message: string, data?: unknown): void;
}

/**
 * Simple console logger that logs everything with timestamps
 */
export class SimpleLogger implements Logger {
  constructor(private includeData = true) {}

  log(type: string, message: string, data?: unknown): void {
    const timestamp = new Date().toISOString();
    let logMessage = `[${timestamp}] ${type.toUpperCase()}: ${message}`;

    if (this.includeData && data) {
      // Truncate large data like screenshots
      const truncatedData = this.truncateScreenshots(data);
      logMessage += ` | ${JSON.stringify(truncatedData, null, 2)}`;
    }

    console.log(logMessage);
  }

  private truncateScreenshots(data: unknown): unknown {
    if (typeof data !== "object" || data === null) {
      return data;
    }

    if (Array.isArray(data)) {
      return data.map((item) => this.truncateScreenshots(item));
    }

    const result: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(data)) {
      if (typeof value === "string") {
        // Truncate base64 image data (screenshots)
        if (value.startsWith("data:image/") && value.length > 100) {
          const [prefix, ...rest] = value.split(",");
          const base64Data = rest.join(",");
          result[
            key
          ] = `${prefix},<base64-image-data-${base64Data.length}-bytes>`;
        }
        // Truncate very long strings
        else if (value.length > 500) {
          result[key] = `${value.substring(0, 500)}...<truncated-${
            value.length
          }-chars>`;
        } else {
          result[key] = value;
        }
      } else if (typeof value === "object") {
        result[key] = this.truncateScreenshots(value);
      } else {
        result[key] = value;
      }
    }
    return result;
  }

  // Convenience methods for common log types
  agentStart(query: string, model: string, options?: unknown): void {
    this.log(
      "agent",
      `🤖 Started execution: "${query}" (model: ${model})`,
      options
    );
  }

  agentComplete(query: string, duration: number, messageCount: number): void {
    const seconds = (duration / 1000).toFixed(2);
    this.log(
      "agent",
      `✅ Completed: "${query}" in ${seconds}s (${messageCount} messages)`
    );
  }

  agentError(query: string, error: Error, duration: number): void {
    const seconds = (duration / 1000).toFixed(2);
    this.log(
      "agent",
      `❌ Failed: "${query}" after ${seconds}s - ${error.message}`,
      { stack: error.stack }
    );
  }

  llmResponse(stopReason: string, step: number, content?: unknown): void {
    this.log(
      "llm",
      `🧠 Response received [step ${step}] (stop: ${stopReason})`,
      content
    );
  }

  toolStart(toolName: string, step: number, input?: unknown): void {
    this.log("tool", `🔧 Starting ${toolName} [step ${step}]`, input);
  }

  toolComplete(
    toolName: string,
    step: number,
    duration: number,
    output?: unknown
  ): void {
    this.log(
      "tool",
      `✅ Completed ${toolName} [step ${step}] (${duration}ms)`,
      output
    );
  }

  toolError(
    toolName: string,
    step: number,
    error: Error,
    duration: number
  ): void {
    this.log(
      "tool",
      `❌ Failed ${toolName} [step ${step}] (${duration}ms) - ${error.message}`
    );
  }

  signal(signal: string, step: number, reason?: string): void {
    const emoji = signal === "pause" ? "⏸️" : signal === "resume" ? "▶️" : "🛑";
    const reasonStr = reason ? ` (${reason})` : "";
    this.log(
      "signal",
      `${emoji} ${signal.toUpperCase()} [step ${step}]${reasonStr}`
    );
  }

  debug(message: string, data?: unknown): void {
    this.log("debug", `🐛 ${message}`, data);
  }
}

/**
 * No-op logger for when logging is disabled
 */
export class NoOpLogger implements Logger {
  log(): void {}
  agentStart(): void {}
  agentComplete(): void {}
  agentError(): void {}
  llmResponse(): void {}
  toolStart(): void {}
  toolComplete(): void {}
  toolError(): void {}
  signal(): void {}
  debug(): void {}
}
