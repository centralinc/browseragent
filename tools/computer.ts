import type { Page } from "playwright";
import { Action } from "./types/computer";
import type { ActionParams } from "./types/computer";
import { KeyboardUtils } from "./utils/keyboard";
import { ActionValidator } from "./utils/validator";
import {
  ToolError,
  type ToolResult,
  type ComputerUseTool,
  type ComputerToolDef,
  type ExecutionConfig,
  DEFAULT_EXECUTION_CONFIG,
  type TypingConfig,
  type ScreenshotConfig,
  type MouseConfig,
  type ScrollingConfig,
} from "./types/base";

export class ComputerTool implements ComputerUseTool {
  name: "computer" = "computer";
  protected page: Page;
  protected version: "20241022" | "20250124";
  protected config: ExecutionConfig;

  private readonly mouseActions = new Set([
    Action.LEFT_CLICK,
    Action.RIGHT_CLICK,
    Action.MIDDLE_CLICK,
    Action.DOUBLE_CLICK,
    Action.TRIPLE_CLICK,
    Action.MOUSE_MOVE,
    Action.LEFT_CLICK_DRAG,
    Action.LEFT_MOUSE_DOWN,
    Action.LEFT_MOUSE_UP,
  ]);

  private readonly keyboardActions = new Set([
    Action.KEY,
    Action.TYPE,
    Action.HOLD_KEY,
  ]);

  private readonly systemActions = new Set([
    Action.SCREENSHOT,
    Action.CURSOR_POSITION,
    Action.SCROLL,
    Action.WAIT,
    Action.EXTRACT_URL,
  ]);

  constructor(
    page: Page,
    version: "20241022" | "20250124" = "20250124",
    config?: ExecutionConfig,
  ) {
    this.page = page;
    this.version = version;

    // Deep merge each config section to preserve defaults while allowing overrides
    this.config = {
      typing: {
        ...DEFAULT_EXECUTION_CONFIG.typing!,
        ...(config?.typing || {}),
      } as Required<TypingConfig>,
      screenshot: {
        ...DEFAULT_EXECUTION_CONFIG.screenshot!,
        ...(config?.screenshot || {}),
      } as Required<ScreenshotConfig>,
      mouse: {
        ...DEFAULT_EXECUTION_CONFIG.mouse!,
        ...(config?.mouse || {}),
      } as Required<MouseConfig>,
      scrolling: {
        ...DEFAULT_EXECUTION_CONFIG.scrolling!,
        ...(config?.scrolling || {}),
      } as Required<ScrollingConfig>,
    };
  }

  get apiType(): "computer_20241022" | "computer_20250124" {
    return this.version === "20241022"
      ? "computer_20241022"
      : "computer_20250124";
  }

  toParams(): ComputerToolDef {
    const params = {
      name: this.name,
      type: this.apiType,
      display_width_px: 1280,
      display_height_px: 720,
      display_number: null,
    };
    return params as ComputerToolDef;
  }

  private getMouseButton(action: Action): "left" | "right" | "middle" {
    switch (action) {
      case Action.LEFT_CLICK:
      case Action.DOUBLE_CLICK:
      case Action.TRIPLE_CLICK:
      case Action.LEFT_CLICK_DRAG:
      case Action.LEFT_MOUSE_DOWN:
      case Action.LEFT_MOUSE_UP:
        return "left";
      case Action.RIGHT_CLICK:
        return "right";
      case Action.MIDDLE_CLICK:
        return "middle";
      default:
        throw new ToolError(`Invalid mouse action: ${action}`);
    }
  }

  private async handleMouseAction(
    action: Action,
    coordinate: [number, number],
  ): Promise<ToolResult> {
    const [x, y] = ActionValidator.validateAndGetCoordinates(coordinate);
    await this.page.mouse.move(x, y);
    await this.page.waitForTimeout(20);

    if (action === Action.LEFT_MOUSE_DOWN) {
      await this.page.mouse.down();
    } else if (action === Action.LEFT_MOUSE_UP) {
      await this.page.mouse.up();
    } else {
      const button = this.getMouseButton(action);
      if (action === Action.DOUBLE_CLICK) {
        await this.page.mouse.dblclick(x, y, { button });
      } else if (action === Action.TRIPLE_CLICK) {
        await this.page.mouse.click(x, y, { button, clickCount: 3 });
      } else {
        await this.page.mouse.click(x, y, { button });
      }
    }

    await this.page.waitForTimeout(100);
    return await this.screenshot();
  }

  private async handleKeyboardAction(
    action: Action,
    text: string,
    duration?: number,
  ): Promise<ToolResult> {
    if (action === Action.HOLD_KEY) {
      const key = KeyboardUtils.getPlaywrightKey(text);
      await this.page.keyboard.down(key);
      await new Promise((resolve) => setTimeout(resolve, duration! * 1000));
      await this.page.keyboard.up(key);
    } else if (action === Action.KEY) {
      const keys = KeyboardUtils.parseKeyCombination(text);
      for (const key of keys) {
        await this.page.keyboard.down(key);
      }
      for (const key of keys.reverse()) {
        await this.page.keyboard.up(key);
      }
    } else {
      // Handle configurable typing behavior
      const typingConfig = this.config.typing!;

      if (typingConfig.mode === "fill") {
        // Use locator.fill() for maximum performance - bypasses keyboard events entirely
        // This directly sets the input value without simulating keystrokes
        try {
          const focusedElement = await this.page.locator(":focus").first();
          if ((await focusedElement.count()) > 0) {
            await focusedElement.fill(text);
          } else {
            // Fallback to keyboard.type if no focused element
            await this.page.keyboard.type(text, { delay: 0 });
          }
        } catch {
          // Fallback to keyboard.type if fill() fails
          await this.page.keyboard.type(text, { delay: 0 });
        }
      } else {
        // Type character by character with configurable delay
        await this.page.keyboard.type(text, {
          delay: typingConfig.characterDelay || 12,
        });
      }
    }

    // Wait for completion using configurable delay
    const completionDelay = this.config.typing?.completionDelay || 100;
    await this.page.waitForTimeout(completionDelay);
    return await this.screenshot();
  }

  async screenshot(): Promise<ToolResult> {
    try {
      console.log("Starting screenshot...");
      const screenshotDelay = this.config.screenshot?.delay || 0.3;
      await new Promise((resolve) =>
        setTimeout(resolve, screenshotDelay * 1000),
      );
      const screenshot = await this.page.screenshot({
        type: "png",
        fullPage: false, // viewport only for speed
      });
      console.log("Screenshot taken, size:", screenshot.length, "bytes");

      return {
        base64Image: screenshot.toString("base64"),
      };
    } catch (error) {
      throw new ToolError(`Failed to take screenshot: ${error}`);
    }
  }

  async call(params: ActionParams): Promise<ToolResult> {
    const {
      action,
      text,
      coordinate,
      scrollDirection: scrollDirectionParam,
      scroll_amount,
      scrollAmount,
      duration,
      ...kwargs
    } = params;

    ActionValidator.validateActionParams(
      params,
      this.mouseActions,
      this.keyboardActions,
    );

    if (action === Action.SCREENSHOT) {
      return await this.screenshot();
    }

    if (action === Action.CURSOR_POSITION) {
      const position = await this.page.evaluate(() => {
        const selection = window.getSelection();
        const range = selection?.getRangeAt(0);
        const rect = range?.getBoundingClientRect();
        return rect ? { x: rect.x, y: rect.y } : null;
      });

      if (!position) {
        throw new ToolError("Failed to get cursor position");
      }

      return { output: `X=${position.x},Y=${position.y}` };
    }

    if (action === Action.SCROLL) {
      if (this.version !== "20250124") {
        throw new ToolError(`${action} is only available in version 20250124`);
      }

      let scrollDirection = scrollDirectionParam || kwargs.scroll_direction;
      let scrollAmountValue = scrollAmount || scroll_amount;

      // Handle negative scroll amounts by converting to positive with appropriate direction
      if (typeof scrollAmountValue === "number" && scrollAmountValue < 0) {
        scrollAmountValue = Math.abs(scrollAmountValue);
        
        // If scroll direction is already set and conflicts with negative amount, handle appropriately
        if (scrollDirection === "down" || scrollDirection === "right") {
          // Override the direction since negative amount indicates opposite direction
          scrollDirection = scrollDirection === "down" ? "up" : "left";
        } else if (!scrollDirection) {
          // Default to up for vertical scrolling when no direction specified
          scrollDirection = "up";
        }
      }

      if (
        !scrollDirection ||
        !["up", "down", "left", "right"].includes(scrollDirection as string)
      ) {
        throw new ToolError(
          `Scroll direction "${scrollDirection}" must be 'up', 'down', 'left', or 'right'`,
        );
      }
      if (typeof scrollAmountValue !== "number" || scrollAmountValue < 0) {
        throw new ToolError(
          `Scroll amount "${scrollAmountValue}" must be a non-negative number`,
        );
      }

      if (coordinate) {
        const [x, y] = ActionValidator.validateAndGetCoordinates(coordinate);
        await this.page.mouse.move(x, y);
        await this.page.waitForTimeout(100);
      }

      const pageDimensions = await this.page.evaluate(() => {
        return { h: window.innerHeight, w: window.innerWidth };
      });

      let scrollFactor = 0.9; // Default to 90% of viewport for efficient navigation

      if (scrollAmountValue !== undefined) {
        // Convert LLM scroll amount (1-100) to viewport percentage
        // Small amounts (1-20) = precise scrolling for UI elements
        // Large amounts (80-90) = efficient page navigation
        scrollFactor = Math.min(Math.max(scrollAmountValue / 100, 0.05), 1.0);

        // For very small amounts (<=20), use more precise scrolling
        if (scrollAmountValue <= 20) {
          scrollFactor = scrollAmountValue / 100; // 1-20% of viewport
        }
        // For large amounts (>=80), ensure efficient page navigation
        else if (scrollAmountValue >= 80) {
          scrollFactor = Math.min(scrollAmountValue / 100, 0.95); // Up to 95% of viewport
        }
        // Medium amounts (21-79) use direct percentage
        else {
          scrollFactor = scrollAmountValue / 100;
        }
      }

      if (scrollDirection === "down" || scrollDirection === "up") {
        const amount = pageDimensions.h * scrollFactor;
        await this.page.mouse.wheel(
          0,
          scrollDirection === "down" ? amount : -amount,
        );
      } else {
        const amount = pageDimensions.w * scrollFactor;
        await this.page.mouse.wheel(
          scrollDirection === "right" ? amount : -amount,
          0,
        );
      }

      await this.page.waitForTimeout(100);
      return await this.screenshot();
    }

    if (action === Action.WAIT) {
      if (this.version !== "20250124") {
        throw new ToolError(`${action} is only available in version 20250124`);
      }
      await new Promise((resolve) => setTimeout(resolve, duration! * 1000));
      return await this.screenshot();
    }

    if (this.mouseActions.has(action)) {
      if (!coordinate) {
        throw new ToolError(`coordinate is required for ${action}`);
      }
      return await this.handleMouseAction(action, coordinate);
    }

    if (this.keyboardActions.has(action)) {
      if (!text) {
        throw new ToolError(`text is required for ${action}`);
      }
      return await this.handleKeyboardAction(action, text, duration);
    }

    throw new ToolError(`Invalid action: ${action}`);
  }
}

// For backward compatibility
export class ComputerTool20241022 extends ComputerTool {
  constructor(page: Page, config?: ExecutionConfig) {
    super(page, "20241022", config);
  }
}

export class ComputerTool20250124 extends ComputerTool {
  constructor(page: Page, config?: ExecutionConfig) {
    super(page, "20250124", config);
  }
}
