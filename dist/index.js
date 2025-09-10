"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// tools/registry/registry.ts
var registry_exports = {};
__export(registry_exports, {
  DefaultToolRegistry: () => DefaultToolRegistry,
  getToolRegistry: () => getToolRegistry,
  resetToolRegistry: () => resetToolRegistry
});
function getToolRegistry(config) {
  if (!globalRegistry) {
    globalRegistry = new DefaultToolRegistry(config);
  }
  return globalRegistry;
}
function resetToolRegistry() {
  globalRegistry = null;
}
var import_zod2, DefaultToolRegistry, globalRegistry;
var init_registry = __esm({
  "tools/registry/registry.ts"() {
    "use strict";
    import_zod2 = require("zod");
    DefaultToolRegistry = class {
      constructor(config = {}) {
        this.capabilities = /* @__PURE__ */ new Map();
        this.config = {
          includeInSystemPrompt: true,
          validateInputs: true,
          ...config
        };
      }
      getCapabilityKey(tool, method) {
        return `${tool}:${method}`;
      }
      register(capability2) {
        var _a;
        const key = this.getCapabilityKey(capability2.tool, capability2.method);
        if (this.capabilities.has(key)) {
          throw new Error(`Capability '${key}' is already registered`);
        }
        if ((_a = this.config.overrides) == null ? void 0 : _a[key]) {
          capability2 = {
            ...capability2,
            ...this.config.overrides[key]
          };
        }
        if (this.config.filter && !this.config.filter(capability2)) {
          return;
        }
        this.capabilities.set(key, capability2);
      }
      get(tool, method) {
        return this.capabilities.get(this.getCapabilityKey(tool, method));
      }
      getToolCapabilities(tool) {
        return Array.from(this.capabilities.values()).filter(
          (cap) => cap.tool === tool
        );
      }
      getAll() {
        return Array.from(this.capabilities.values());
      }
      isEnabled(tool, method) {
        const capability2 = this.get(tool, method);
        return (capability2 == null ? void 0 : capability2.enabled) !== false;
      }
      getToolNames() {
        const tools = /* @__PURE__ */ new Set();
        this.capabilities.forEach((cap) => tools.add(cap.tool));
        return Array.from(tools);
      }
      validate(tool, method, args) {
        const capability2 = this.get(tool, method);
        if (!capability2) {
          return {
            valid: false,
            errors: [`Unknown capability: ${tool}:${method}`]
          };
        }
        if (!this.config.validateInputs) {
          return { valid: true };
        }
        try {
          if (capability2.schema) {
            if (args.length === 1 && typeof args[0] === "object" && !Array.isArray(args[0])) {
              capability2.schema.parse(args[0]);
            } else if (capability2.schema._def && capability2.schema._def.typeName === "ZodObject" && args.length > 0) {
              const obj = args.reduce((acc, val, idx) => {
                const keys = Object.keys(
                  capability2.schema._def.shape || {}
                );
                const key = keys[idx];
                if (key) {
                  acc[key] = val;
                }
                return acc;
              }, {});
              capability2.schema.parse(obj);
            } else {
              capability2.schema.parse(args);
            }
          }
          return { valid: true };
        } catch (error) {
          if (error instanceof import_zod2.z.ZodError) {
            return {
              valid: false,
              errors: error.errors.map((e) => `${e.path.join(".")}: ${e.message}`)
            };
          }
          return { valid: false, errors: [String(error)] };
        }
      }
      generateToolDocs(tool) {
        const capabilities = this.getToolCapabilities(tool).filter(
          (cap) => cap.enabled !== false
        );
        if (capabilities.length === 0) {
          return "";
        }
        const sections = [
          `${tool.toUpperCase()} TOOL CAPABILITIES:`,
          `* You have access to a '${tool}' tool that provides the following capabilities:`
        ];
        capabilities.forEach((cap) => {
          sections.push(`  - '${cap.method}': ${cap.description}`);
        });
        sections.push("");
        capabilities.forEach((cap) => {
          sections.push(this.generateCapabilityDoc(cap));
          sections.push("");
        });
        return sections.join("\n");
      }
      generateAllDocs() {
        const tools = this.getToolNames();
        if (tools.length === 0) {
          return "";
        }
        const sections = [];
        tools.forEach((tool) => {
          const toolDocs = this.generateToolDocs(tool);
          if (toolDocs) {
            sections.push(toolDocs);
            sections.push("");
          }
        });
        return sections.join("\n").trim();
      }
      generateCapabilityDoc(capability2) {
        const lines = [];
        lines.push(`HOW TO USE ${capability2.method.toUpperCase()}:`);
        const usageLines = capability2.usage.split("\n").map((line) => line.trim()).filter(Boolean);
        usageLines.forEach((line, index) => {
          lines.push(`${index + 1}. ${line}`);
        });
        return lines.join("\n");
      }
    };
    globalRegistry = null;
  }
});

// index.ts
var index_exports = {};
__export(index_exports, {
  Action: () => Action,
  ComputerTool: () => ComputerTool,
  ComputerTool20241022: () => ComputerTool20241022,
  ComputerTool20250124: () => ComputerTool20250124,
  ComputerUseAgent: () => ComputerUseAgent,
  NoOpLogger: () => NoOpLogger,
  PLAYWRIGHT_CAPABILITIES: () => PLAYWRIGHT_CAPABILITIES2,
  PlaywrightTool: () => PlaywrightTool,
  SimpleLogger: () => SimpleLogger,
  ToolCollection: () => ToolCollection,
  capability: () => capability,
  capabilitySchema: () => capabilitySchema,
  defineCapability: () => defineCapability,
  getToolRegistry: () => getToolRegistry,
  registerPlaywrightCapabilities: () => registerPlaywrightCapabilities,
  resetToolRegistry: () => resetToolRegistry,
  withCapabilities: () => withCapabilities
});
module.exports = __toCommonJS(index_exports);

// agent.ts
var import_zod_to_json_schema = __toESM(require("zod-to-json-schema"));

// loop.ts
var import_sdk = require("@anthropic-ai/sdk");
var import_luxon = require("luxon");

// tools/types/computer.ts
var Action = /* @__PURE__ */ ((Action2) => {
  Action2["MOUSE_MOVE"] = "mouse_move";
  Action2["LEFT_CLICK"] = "left_click";
  Action2["RIGHT_CLICK"] = "right_click";
  Action2["MIDDLE_CLICK"] = "middle_click";
  Action2["DOUBLE_CLICK"] = "double_click";
  Action2["TRIPLE_CLICK"] = "triple_click";
  Action2["LEFT_CLICK_DRAG"] = "left_click_drag";
  Action2["LEFT_MOUSE_DOWN"] = "left_mouse_down";
  Action2["LEFT_MOUSE_UP"] = "left_mouse_up";
  Action2["KEY"] = "key";
  Action2["TYPE"] = "type";
  Action2["HOLD_KEY"] = "hold_key";
  Action2["SCREENSHOT"] = "screenshot";
  Action2["CURSOR_POSITION"] = "cursor_position";
  Action2["SCROLL"] = "scroll";
  Action2["WAIT"] = "wait";
  Action2["EXTRACT_URL"] = "extract_url";
  return Action2;
})(Action || {});

// tools/utils/keyboard.ts
var KeyboardUtils = class {
  static isModifierKey(key) {
    if (!key) return false;
    const normalizedKey = this.modifierKeyMap[key.toLowerCase()] || key;
    return ["Control", "Alt", "Shift", "Meta"].includes(normalizedKey);
  }
  static getPlaywrightKey(key) {
    if (!key) {
      throw new Error("Key cannot be undefined");
    }
    const normalizedKey = key.toLowerCase();
    if (normalizedKey in this.keyMap) {
      return this.keyMap[normalizedKey];
    }
    if (normalizedKey in this.modifierKeyMap) {
      return this.modifierKeyMap[normalizedKey];
    }
    return key;
  }
  static parseKeyCombination(combo) {
    if (!combo) {
      throw new Error("Key combination cannot be empty");
    }
    return combo.toLowerCase().split("+").map((key) => {
      const trimmedKey = key.trim();
      if (!trimmedKey) {
        throw new Error("Invalid key combination: empty key");
      }
      return this.getPlaywrightKey(trimmedKey);
    });
  }
};
// Only map alternative names to standard Playwright modifier keys
KeyboardUtils.modifierKeyMap = {
  ctrl: "Control",
  alt: "Alt",
  command: "Meta",
  win: "Meta"
};
// Essential key mappings for Playwright compatibility
KeyboardUtils.keyMap = {
  return: "Enter",
  space: " ",
  left: "ArrowLeft",
  right: "ArrowRight",
  up: "ArrowUp",
  down: "ArrowDown",
  home: "Home",
  end: "End",
  pageup: "PageUp",
  pagedown: "PageDown",
  delete: "Delete",
  backspace: "Backspace",
  tab: "Tab",
  esc: "Escape",
  escape: "Escape",
  insert: "Insert",
  super_l: "Meta",
  f1: "F1",
  f2: "F2",
  f3: "F3",
  f4: "F4",
  f5: "F5",
  f6: "F6",
  f7: "F7",
  f8: "F8",
  f9: "F9",
  f10: "F10",
  f11: "F11",
  f12: "F12"
};

// tools/types/base.ts
var ToolError = class extends Error {
  constructor(message) {
    super(message);
    this.name = "ToolError";
  }
};
var DEFAULT_EXECUTION_CONFIG = {
  typing: {
    mode: "character-by-character",
    characterDelay: 12,
    completionDelay: 100
  },
  screenshot: {
    delay: 0.3,
    quality: "medium"
  },
  mouse: {
    moveSpeed: "normal",
    clickDelay: 50
  },
  scrolling: {
    mode: "percentage",
    percentage: 90,
    overlap: 10
  }
};

// tools/utils/validator.ts
var ActionValidator = class {
  static validateText(text, required, action) {
    if (required && text === void 0) {
      throw new ToolError(`text is required for ${action}`);
    }
    if (text !== void 0 && typeof text !== "string") {
      throw new ToolError(`${text} must be a string`);
    }
  }
  static validateCoordinate(coordinate, required, action) {
    if (required && !coordinate) {
      throw new ToolError(`coordinate is required for ${action}`);
    }
    if (coordinate) {
      this.validateAndGetCoordinates(coordinate);
    }
  }
  static validateDuration(duration) {
    if (duration === void 0 || typeof duration !== "number") {
      throw new ToolError(`${duration} must be a number`);
    }
    if (duration < 0) {
      throw new ToolError(`${duration} must be non-negative`);
    }
    if (duration > 100) {
      throw new ToolError(`${duration} is too long`);
    }
  }
  static validateAndGetCoordinates(coordinate) {
    if (!Array.isArray(coordinate) || coordinate.length !== 2) {
      throw new ToolError(`${coordinate} must be a tuple of length 2`);
    }
    if (!coordinate.every((i) => typeof i === "number" && i >= 0)) {
      throw new ToolError(
        `${coordinate} must be a tuple of non-negative numbers`
      );
    }
    return coordinate;
  }
  static validateActionParams(params, mouseActions, keyboardActions) {
    const { action, text, coordinate, duration } = params;
    if (keyboardActions.has(action)) {
      this.validateText(text, true, action);
    } else {
      this.validateText(text, false, action);
    }
    if (mouseActions.has(action)) {
      this.validateCoordinate(coordinate, true, action);
    } else {
      this.validateCoordinate(coordinate, false, action);
    }
    if (action === "hold_key" /* HOLD_KEY */ || action === "wait" /* WAIT */) {
      this.validateDuration(duration);
    }
  }
};

// tools/computer.ts
var ComputerTool = class {
  constructor(page, version = "20250124", config) {
    this.name = "computer";
    this.mouseActions = /* @__PURE__ */ new Set([
      "left_click" /* LEFT_CLICK */,
      "right_click" /* RIGHT_CLICK */,
      "middle_click" /* MIDDLE_CLICK */,
      "double_click" /* DOUBLE_CLICK */,
      "triple_click" /* TRIPLE_CLICK */,
      "mouse_move" /* MOUSE_MOVE */,
      "left_click_drag" /* LEFT_CLICK_DRAG */,
      "left_mouse_down" /* LEFT_MOUSE_DOWN */,
      "left_mouse_up" /* LEFT_MOUSE_UP */
    ]);
    this.keyboardActions = /* @__PURE__ */ new Set([
      "key" /* KEY */,
      "type" /* TYPE */,
      "hold_key" /* HOLD_KEY */
    ]);
    this.systemActions = /* @__PURE__ */ new Set([
      "screenshot" /* SCREENSHOT */,
      "cursor_position" /* CURSOR_POSITION */,
      "scroll" /* SCROLL */,
      "wait" /* WAIT */,
      "extract_url" /* EXTRACT_URL */
    ]);
    this.page = page;
    this.version = version;
    this.config = {
      typing: {
        ...DEFAULT_EXECUTION_CONFIG.typing,
        ...(config == null ? void 0 : config.typing) || {}
      },
      screenshot: {
        ...DEFAULT_EXECUTION_CONFIG.screenshot,
        ...(config == null ? void 0 : config.screenshot) || {}
      },
      mouse: {
        ...DEFAULT_EXECUTION_CONFIG.mouse,
        ...(config == null ? void 0 : config.mouse) || {}
      },
      scrolling: {
        ...DEFAULT_EXECUTION_CONFIG.scrolling,
        ...(config == null ? void 0 : config.scrolling) || {}
      }
    };
  }
  get apiType() {
    return this.version === "20241022" ? "computer_20241022" : "computer_20250124";
  }
  toParams() {
    const params = {
      name: this.name,
      type: this.apiType,
      display_width_px: 1280,
      display_height_px: 720,
      display_number: null
    };
    return params;
  }
  getMouseButton(action) {
    switch (action) {
      case "left_click" /* LEFT_CLICK */:
      case "double_click" /* DOUBLE_CLICK */:
      case "triple_click" /* TRIPLE_CLICK */:
      case "left_click_drag" /* LEFT_CLICK_DRAG */:
      case "left_mouse_down" /* LEFT_MOUSE_DOWN */:
      case "left_mouse_up" /* LEFT_MOUSE_UP */:
        return "left";
      case "right_click" /* RIGHT_CLICK */:
        return "right";
      case "middle_click" /* MIDDLE_CLICK */:
        return "middle";
      default:
        throw new ToolError(`Invalid mouse action: ${action}`);
    }
  }
  async handleMouseAction(action, coordinate) {
    const [x, y] = ActionValidator.validateAndGetCoordinates(coordinate);
    await this.page.mouse.move(x, y);
    await this.page.waitForTimeout(20);
    if (action === "left_mouse_down" /* LEFT_MOUSE_DOWN */) {
      await this.page.mouse.down();
    } else if (action === "left_mouse_up" /* LEFT_MOUSE_UP */) {
      await this.page.mouse.up();
    } else {
      const button = this.getMouseButton(action);
      if (action === "double_click" /* DOUBLE_CLICK */) {
        await this.page.mouse.dblclick(x, y, { button });
      } else if (action === "triple_click" /* TRIPLE_CLICK */) {
        await this.page.mouse.click(x, y, { button, clickCount: 3 });
      } else {
        await this.page.mouse.click(x, y, { button });
      }
    }
    await this.page.waitForTimeout(100);
    return await this.screenshot();
  }
  async handleKeyboardAction(action, text, duration) {
    var _a;
    if (action === "hold_key" /* HOLD_KEY */) {
      const key = KeyboardUtils.getPlaywrightKey(text);
      await this.page.keyboard.down(key);
      await new Promise((resolve) => setTimeout(resolve, duration * 1e3));
      await this.page.keyboard.up(key);
    } else if (action === "key" /* KEY */) {
      const keys = KeyboardUtils.parseKeyCombination(text);
      for (const key of keys) {
        await this.page.keyboard.down(key);
      }
      for (const key of keys.reverse()) {
        await this.page.keyboard.up(key);
      }
    } else {
      const typingConfig = this.config.typing;
      if (typingConfig.mode === "fill") {
        try {
          const focusedElement = await this.page.locator(":focus").first();
          if (await focusedElement.count() > 0) {
            await focusedElement.fill(text);
          } else {
            await this.page.keyboard.type(text, { delay: 0 });
          }
        } catch {
          await this.page.keyboard.type(text, { delay: 0 });
        }
      } else {
        await this.page.keyboard.type(text, {
          delay: typingConfig.characterDelay || 12
        });
      }
    }
    const completionDelay = ((_a = this.config.typing) == null ? void 0 : _a.completionDelay) || 100;
    await this.page.waitForTimeout(completionDelay);
    return await this.screenshot();
  }
  async screenshot() {
    var _a;
    try {
      console.log("Starting screenshot...");
      const screenshotDelay = ((_a = this.config.screenshot) == null ? void 0 : _a.delay) || 0.3;
      await new Promise(
        (resolve) => setTimeout(resolve, screenshotDelay * 1e3)
      );
      const screenshot = await this.page.screenshot({
        type: "png",
        fullPage: false
        // viewport only for speed
      });
      console.log("Screenshot taken, size:", screenshot.length, "bytes");
      return {
        base64Image: screenshot.toString("base64")
      };
    } catch (error) {
      throw new ToolError(`Failed to take screenshot: ${error}`);
    }
  }
  async call(params) {
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
      this.keyboardActions
    );
    if (action === "screenshot" /* SCREENSHOT */) {
      return await this.screenshot();
    }
    if (action === "cursor_position" /* CURSOR_POSITION */) {
      const position = await this.page.evaluate(() => {
        const selection = window.getSelection();
        const range = selection == null ? void 0 : selection.getRangeAt(0);
        const rect = range == null ? void 0 : range.getBoundingClientRect();
        return rect ? { x: rect.x, y: rect.y } : null;
      });
      if (!position) {
        throw new ToolError("Failed to get cursor position");
      }
      return { output: `X=${position.x},Y=${position.y}` };
    }
    if (action === "scroll" /* SCROLL */) {
      if (this.version !== "20250124") {
        throw new ToolError(`${action} is only available in version 20250124`);
      }
      const scrollDirection = scrollDirectionParam || kwargs.scroll_direction;
      const scrollAmountValue = scrollAmount || scroll_amount;
      if (!scrollDirection || !["up", "down", "left", "right"].includes(scrollDirection)) {
        throw new ToolError(
          `Scroll direction "${scrollDirection}" must be 'up', 'down', 'left', or 'right'`
        );
      }
      if (typeof scrollAmountValue !== "number" || scrollAmountValue < 0) {
        throw new ToolError(
          `Scroll amount "${scrollAmountValue}" must be a non-negative number`
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
      let scrollFactor = 0.9;
      if (scrollAmountValue !== void 0) {
        scrollFactor = Math.min(Math.max(scrollAmountValue / 100, 0.05), 1);
        if (scrollAmountValue <= 20) {
          scrollFactor = scrollAmountValue / 100;
        } else if (scrollAmountValue >= 80) {
          scrollFactor = Math.min(scrollAmountValue / 100, 0.95);
        } else {
          scrollFactor = scrollAmountValue / 100;
        }
      }
      if (scrollDirection === "down" || scrollDirection === "up") {
        const amount = pageDimensions.h * scrollFactor;
        await this.page.mouse.wheel(
          0,
          scrollDirection === "down" ? amount : -amount
        );
      } else {
        const amount = pageDimensions.w * scrollFactor;
        await this.page.mouse.wheel(
          scrollDirection === "right" ? amount : -amount,
          0
        );
      }
      await this.page.waitForTimeout(100);
      return await this.screenshot();
    }
    if (action === "wait" /* WAIT */) {
      if (this.version !== "20250124") {
        throw new ToolError(`${action} is only available in version 20250124`);
      }
      await new Promise((resolve) => setTimeout(resolve, duration * 1e3));
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
};
var ComputerTool20241022 = class extends ComputerTool {
  constructor(page, config) {
    super(page, "20241022", config);
  }
};
var ComputerTool20250124 = class extends ComputerTool {
  constructor(page, config) {
    super(page, "20250124", config);
  }
};

// tools/collection.ts
var DEFAULT_TOOL_VERSION = "computer_use_20250429";
var TOOL_GROUPS = [
  {
    version: "computer_use_20241022",
    tools: [ComputerTool20241022],
    beta_flag: "computer-use-2024-10-22"
  },
  {
    version: "computer_use_20250124",
    tools: [ComputerTool20250124],
    beta_flag: "computer-use-2025-01-24"
  },
  // 20250429 version inherits from 20250124
  {
    version: "computer_use_20250429",
    tools: [ComputerTool20250124],
    beta_flag: "computer-use-2025-01-24"
  }
];
var TOOL_GROUPS_BY_VERSION = Object.fromEntries(
  TOOL_GROUPS.map((group) => [group.version, group])
);
var ToolCollection = class {
  constructor(...tools) {
    this.tools = new Map(tools.map((tool) => [tool.name, tool]));
  }
  toParams() {
    return Array.from(this.tools.values()).map((tool) => tool.toParams());
  }
  setPage(page) {
    this.page = page;
  }
  async run(name, toolInput) {
    const tool = this.tools.get(name);
    if (!tool) {
      throw new Error(`Tool ${name} not found`);
    }
    console.log(`
=== Running tool: ${name} ===`);
    console.log("Input:", JSON.stringify(toolInput, null, 2));
    const toolCallParams = { ...toolInput };
    if (this.page) {
      toolCallParams._page = this.page;
    }
    const toolDef = tool.toParams();
    if (name === "playwright") {
      const playwrightInput = toolInput;
      if (!playwrightInput.method || !Array.isArray(playwrightInput.args)) {
        throw new Error(
          `Invalid input for playwright tool: method and args are required`
        );
      }
      return await tool.call(toolCallParams);
    } else if ("type" in toolDef && toolDef.type === "custom") {
      return await tool.call(toolCallParams);
    } else {
      const computerInput = toolInput;
      if (!computerInput.action || !Object.values(Action).includes(computerInput.action)) {
        throw new Error(
          `Invalid action ${computerInput.action} for tool ${name}`
        );
      }
      return await tool.call(toolCallParams);
    }
  }
};

// utils/message-processing.ts
function responseToParams(response) {
  return response.content.map((block) => {
    if (block.type === "text" && block.text) {
      return {
        type: "text",
        text: block.text,
        citations: block.citations || null
      };
    }
    if (block.type === "thinking") {
      const { thinking, signature, ...rest } = block;
      return { ...rest, thinking, signature: signature || "" };
    }
    return block;
  });
}
function maybeFilterToNMostRecentImages(messages, imagesToKeep, minRemovalThreshold) {
  if (!imagesToKeep) return;
  const toolResultBlocks = messages.flatMap(
    (message) => Array.isArray(message == null ? void 0 : message.content) ? message.content : []
  ).filter(
    (item) => typeof item === "object" && item.type === "tool_result"
  );
  const totalImages = toolResultBlocks.reduce((count, toolResult) => {
    if (!Array.isArray(toolResult.content)) return count;
    return count + toolResult.content.filter(
      (content) => typeof content === "object" && content.type === "image"
    ).length;
  }, 0);
  let imagesToRemove = Math.floor((totalImages - imagesToKeep) / minRemovalThreshold) * minRemovalThreshold;
  for (const toolResult of toolResultBlocks) {
    if (Array.isArray(toolResult.content)) {
      toolResult.content = toolResult.content.filter((content) => {
        if (typeof content === "object" && content.type === "image") {
          if (imagesToRemove > 0) {
            imagesToRemove--;
            return false;
          }
        }
        return true;
      });
    }
  }
}
var PROMPT_CACHING_BETA_FLAG = "prompt-caching-2024-07-31";
function injectPromptCaching(messages) {
  let breakpointsRemaining = 3;
  for (let i = messages.length - 1; i >= 0; i--) {
    const message = messages[i];
    if (!message) continue;
    if (message.role === "user" && Array.isArray(message.content)) {
      if (breakpointsRemaining > 0) {
        breakpointsRemaining--;
        const lastContent = message.content[message.content.length - 1];
        if (lastContent) {
          lastContent.cache_control = {
            type: "ephemeral"
          };
        }
      } else {
        const lastContent = message.content[message.content.length - 1];
        if (lastContent) {
          delete lastContent.cache_control;
        }
        break;
      }
    }
  }
}
function truncateMessageHistory(messages, maxMessages = 20, preserveSystemMessage = true) {
  if (messages.length <= maxMessages) return;
  const messagesToRemove = messages.length - maxMessages;
  if (preserveSystemMessage && messages.length > 0) {
    const firstUserMessage = messages.find((msg) => msg.role === "user");
    if (firstUserMessage) {
      const firstUserIndex = messages.indexOf(firstUserMessage);
      const keepFromIndex = Math.max(firstUserIndex + 1, messagesToRemove);
      messages.splice(1, keepFromIndex - 1);
    } else {
      messages.splice(0, messagesToRemove);
    }
  } else {
    messages.splice(0, messagesToRemove);
  }
  for (const message of messages) {
    if (message.role === "assistant" && Array.isArray(message.content)) {
      const thinkingBlocks = message.content.filter(
        (block) => typeof block === "object" && (block.type === "thinking" || block.type === "redacted_thinking")
      );
      const textBlocks = message.content.filter(
        (block) => typeof block === "object" && block.type === "text"
      );
      const toolUseBlocks = message.content.filter(
        (block) => typeof block === "object" && block.type === "tool_use"
      );
      const toolResultBlocks = message.content.filter(
        (block) => typeof block === "object" && block.type === "tool_result"
      );
      message.content = [
        ...thinkingBlocks,
        ...textBlocks,
        ...toolUseBlocks,
        ...toolResultBlocks
      ];
    }
  }
}
function cleanMessageHistory(messages) {
  const toolUseIds = /* @__PURE__ */ new Set();
  for (const message of messages) {
    if (Array.isArray(message.content)) {
      for (const block of message.content) {
        if (typeof block === "object" && block.type === "tool_use" && block.id) {
          toolUseIds.add(block.id);
        }
      }
    }
  }
  for (const message of messages) {
    if (Array.isArray(message.content)) {
      let cleanedContent = message.content.filter((block) => {
        if (typeof block === "object" && block.type === "tool_result" && block.tool_use_id) {
          return toolUseIds.has(block.tool_use_id);
        }
        return true;
      });
      if (message.role === "assistant") {
        const thinkingBlocks = cleanedContent.filter(
          (block) => typeof block === "object" && (block.type === "thinking" || block.type === "redacted_thinking")
        );
        const textBlocks = cleanedContent.filter(
          (block) => typeof block === "object" && block.type === "text"
        );
        const toolUseBlocks = cleanedContent.filter(
          (block) => typeof block === "object" && block.type === "tool_use"
        );
        const toolResultBlocks = cleanedContent.filter(
          (block) => typeof block === "object" && block.type === "tool_result"
        );
        cleanedContent = [
          ...thinkingBlocks,
          ...textBlocks,
          ...toolUseBlocks,
          ...toolResultBlocks
        ];
      }
      message.content = cleanedContent;
    }
  }
}

// utils/tool-results.ts
function makeApiToolResult(result, toolUseId) {
  const toolResultContent = [];
  let isError = false;
  if (result.error) {
    isError = true;
    toolResultContent.push({
      type: "text",
      text: maybePrependSystemToolResult(result, result.error)
    });
  } else {
    if (result.output) {
      toolResultContent.push({
        type: "text",
        text: maybePrependSystemToolResult(result, result.output)
      });
    }
    if (result.base64Image) {
      toolResultContent.push({
        type: "image",
        source: {
          type: "base64",
          media_type: "image/png",
          data: result.base64Image
        }
      });
    }
  }
  return {
    type: "tool_result",
    content: toolResultContent,
    tool_use_id: toolUseId,
    is_error: isError
  };
}
function maybePrependSystemToolResult(result, resultText) {
  if (result.system) {
    return `<system>${result.system}</system>
${resultText}`;
  }
  return resultText;
}

// utils/logger.ts
var SimpleLogger = class {
  constructor(includeData = true) {
    this.includeData = includeData;
  }
  log(type, message, data) {
    const timestamp = (/* @__PURE__ */ new Date()).toISOString();
    let logMessage = `[${timestamp}] ${type.toUpperCase()}: ${message}`;
    if (this.includeData && data) {
      const truncatedData = this.truncateScreenshots(data);
      logMessage += ` | ${JSON.stringify(truncatedData, null, 2)}`;
    }
    console.log(logMessage);
  }
  truncateScreenshots(data) {
    if (typeof data !== "object" || data === null) {
      return data;
    }
    if (Array.isArray(data)) {
      return data.map((item) => this.truncateScreenshots(item));
    }
    const result = {};
    for (const [key, value] of Object.entries(data)) {
      if (typeof value === "string") {
        if (value.startsWith("data:image/") && value.length > 100) {
          const [prefix, ...rest] = value.split(",");
          const base64Data = rest.join(",");
          result[key] = `${prefix},<base64-image-data-${base64Data.length}-bytes>`;
        } else if (value.length > 500) {
          result[key] = `${value.substring(0, 500)}...<truncated-${value.length}-chars>`;
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
  agentStart(query, model, options) {
    this.log(
      "agent",
      `\u{1F916} Started execution: "${query}" (model: ${model})`,
      options
    );
  }
  agentComplete(query, duration, messageCount) {
    const seconds = (duration / 1e3).toFixed(2);
    this.log(
      "agent",
      `\u2705 Completed: "${query}" in ${seconds}s (${messageCount} messages)`
    );
  }
  agentError(query, error, duration) {
    const seconds = (duration / 1e3).toFixed(2);
    this.log(
      "agent",
      `\u274C Failed: "${query}" after ${seconds}s - ${error.message}`,
      { stack: error.stack }
    );
  }
  llmResponse(stopReason, step, content) {
    this.log(
      "llm",
      `\u{1F9E0} Response received [step ${step}] (stop: ${stopReason})`,
      content
    );
  }
  toolStart(toolName, step, input) {
    this.log("tool", `\u{1F527} Starting ${toolName} [step ${step}]`, input);
  }
  toolComplete(toolName, step, duration, output) {
    this.log(
      "tool",
      `\u2705 Completed ${toolName} [step ${step}] (${duration}ms)`,
      output
    );
  }
  toolError(toolName, step, error, duration) {
    this.log(
      "tool",
      `\u274C Failed ${toolName} [step ${step}] (${duration}ms) - ${error.message}`
    );
  }
  signal(signal, step, reason) {
    const emoji = signal === "pause" ? "\u23F8\uFE0F" : signal === "resume" ? "\u25B6\uFE0F" : "\u{1F6D1}";
    const reasonStr = reason ? ` (${reason})` : "";
    this.log(
      "signal",
      `${emoji} ${signal.toUpperCase()} [step ${step}]${reasonStr}`
    );
  }
  debug(message, data) {
    this.log("debug", `\u{1F41B} ${message}`, data);
  }
};
var NoOpLogger = class {
  log() {
  }
  agentStart() {
  }
  agentComplete() {
  }
  agentError() {
  }
  llmResponse() {
  }
  toolStart() {
  }
  toolComplete() {
  }
  toolError() {
  }
  signal() {
  }
  debug() {
  }
};

// tools/playwright-capabilities.ts
var import_zod = require("zod");
var PLAYWRIGHT_CAPABILITIES = /* @__PURE__ */ new Map();
PLAYWRIGHT_CAPABILITIES.set("goto", {
  method: "goto",
  displayName: "Navigate to URL",
  description: "Navigate directly to any URL or website",
  usage: `Use this to navigate to any website directly without using the URL bar
Call format: {"name": "playwright", "input": {"method": "goto", "args": ["url or domain"]}}
The tool will automatically add https:// if no protocol is specified
This is faster and more reliable than using ctrl+l and typing in the URL bar`,
  schema: import_zod.z.tuple([import_zod.z.string()]),
  handler: async (page, args) => {
    if (args.length !== 1) {
      throw new Error("goto method requires exactly one argument: the URL");
    }
    const url = args[0];
    if (!url || typeof url !== "string") {
      throw new Error("URL must be a non-empty string");
    }
    let normalizedURL;
    try {
      const urlObj = new URL(url);
      normalizedURL = urlObj.href;
    } catch {
      try {
        const urlObj = new URL(`https://${url}`);
        normalizedURL = urlObj.href;
      } catch {
        throw new Error(`Invalid URL format: ${url}`);
      }
    }
    await page.goto(normalizedURL, {
      waitUntil: "networkidle",
      timeout: 3e4
    });
    await page.waitForTimeout(1e3);
    const currentURL = page.url();
    const title = await page.title();
    return {
      output: `Successfully navigated to ${currentURL}. Page title: "${title}"`
    };
  }
});
PLAYWRIGHT_CAPABILITIES.set("extract_url", {
  method: "extract_url",
  displayName: "Extract URL",
  description: "Extract URLs from visible text, links, or buttons on the page",
  usage: `First, take a screenshot to see what's on the page
Identify the visible text of the link/button you want to extract the URL from
Call format: {"name": "playwright", "input": {"method": "extract_url", "args": ["exact visible text"]}}
The tool will search for the text and extract the associated URL`,
  schema: import_zod.z.tuple([import_zod.z.string()]),
  handler: async (page, args) => {
    if (args.length !== 1) {
      throw new Error("extract_url method requires exactly one argument");
    }
    const selector = args[0];
    console.log(`
=== Extract URL: Looking for text: "${selector}" ===`);
    let url = null;
    let elementInfo = "";
    const textElement = await page.locator(`text="${selector}"`).first();
    if (await textElement.count() > 0) {
      url = await textElement.getAttribute("href");
      if (!url) {
        const parentAnchor = await textElement.locator("xpath=ancestor::a[1]").first();
        if (await parentAnchor.count() > 0) {
          url = await parentAnchor.getAttribute("href");
          elementInfo = "parent anchor of element with exact text";
        }
      } else {
        elementInfo = "element with exact matching text";
      }
    }
    if (!url) {
      const anchorWithText = await page.locator(`a:has-text("${selector}")`).first();
      if (await anchorWithText.count() > 0) {
        url = await anchorWithText.getAttribute("href");
        elementInfo = "anchor tag with text";
      }
    }
    if (!url) {
      throw new Error(
        `Could not find any URL associated with text: "${selector}"`
      );
    }
    if (url.startsWith("/")) {
      const baseUrl = new URL(page.url());
      url = `${baseUrl.origin}${url}`;
    }
    return {
      output: `Successfully extracted URL: ${url} (from ${elementInfo})`
    };
  }
});
PLAYWRIGHT_CAPABILITIES.set("scroll_to_text", {
  method: "scroll_to_text",
  displayName: "Scroll to Text",
  description: "Instantly scroll to specific text in dropdowns, lists, or on the page",
  usage: `When you need to find specific text in a dropdown/list, use this FIRST
Call format: {"name": "playwright", "input": {"method": "scroll_to_text", "args": ["exact text"]}}
Only provide the text you're looking for - no CSS selectors needed
This instantly scrolls the text into view without multiple attempts
If it fails, fall back to regular computer scroll`,
  schema: import_zod.z.tuple([import_zod.z.string()]),
  handler: async (page, args) => {
    const [targetText] = args;
    if (!targetText) {
      throw new Error("target_text argument is required");
    }
    console.log(`[scroll_to_text] Looking for text: "${targetText}"`);
    const scrolled = await page.evaluate(
      ({ targetText: targetText2 }) => {
        let foundElement = null;
        const walker = document.createTreeWalker(
          document.body,
          NodeFilter.SHOW_TEXT,
          {
            acceptNode: (node) => {
              if (node.textContent && node.textContent.includes(targetText2)) {
                return NodeFilter.FILTER_ACCEPT;
              }
              return NodeFilter.FILTER_REJECT;
            }
          }
        );
        let textNode = walker.nextNode();
        if (textNode && textNode.parentElement) {
          foundElement = textNode.parentElement;
        }
        if (!foundElement) {
          return { success: false, message: `Text "${targetText2}" not found` };
        }
        foundElement.scrollIntoView({
          behavior: "smooth",
          block: "center",
          inline: "center"
        });
        return {
          success: true,
          message: `Scrolled to "${targetText2}"`
        };
      },
      { targetText }
    );
    if (!scrolled.success) {
      return {
        output: `${scrolled.message}. Consider using regular computer scroll instead.`
      };
    }
    await page.waitForTimeout(800);
    return {
      output: scrolled.message
    };
  }
});
function getPlaywrightCapabilities() {
  return Array.from(PLAYWRIGHT_CAPABILITIES.values());
}
function generatePlaywrightDocs(capabilities) {
  const capsToUse = capabilities || getPlaywrightCapabilities();
  const sections = [
    "PLAYWRIGHT TOOL CAPABILITIES:",
    "* You have access to a 'playwright' tool that provides browser automation capabilities:"
  ];
  capsToUse.forEach((cap) => {
    sections.push(`  - '${cap.method}': ${cap.description}`);
  });
  sections.push("");
  capsToUse.forEach((cap) => {
    sections.push(`HOW TO USE ${cap.method.toUpperCase()}:`);
    const usageLines = cap.usage.split("\n").filter(Boolean);
    usageLines.forEach((line, index) => {
      sections.push(`${index + 1}. ${line}`);
    });
    sections.push("");
  });
  return sections.join("\n");
}

// tools/playwright.ts
var PlaywrightTool = class {
  constructor(page, instanceCapabilities = []) {
    this.name = "playwright";
    this.page = page;
    this.capabilities = new Map(PLAYWRIGHT_CAPABILITIES);
    for (const capability2 of instanceCapabilities) {
      this.capabilities.set(capability2.method, capability2);
    }
  }
  /**
   * Get capability documentation for including in system prompt
   */
  getCapabilityDocs() {
    return generatePlaywrightDocs(Array.from(this.capabilities.values()));
  }
  /**
   * Static method to get capability docs (for system prompt generation)
   */
  static getCapabilityDocs() {
    return generatePlaywrightDocs();
  }
  toParams() {
    const enabledCapabilities = Array.from(this.capabilities.keys());
    return {
      name: this.name,
      type: "custom",
      input_schema: {
        type: "object",
        properties: {
          method: {
            type: "string",
            description: "The playwright function to call.",
            enum: enabledCapabilities
          },
          args: {
            type: "array",
            description: "The required arguments",
            items: {
              type: "string",
              description: "The argument to pass to the function"
            }
          }
        },
        required: ["method", "args"]
      }
    };
  }
  async call(params) {
    const { method, args } = params;
    const capability2 = this.capabilities.get(method);
    if (!capability2) {
      const supportedMethods = Array.from(this.capabilities.keys());
      throw new ToolError(
        `Unsupported method: ${method}. Supported methods: ${supportedMethods.join(", ")}`
      );
    }
    if (!Array.isArray(args)) {
      throw new ToolError("args must be an array");
    }
    try {
      capability2.schema.parse(args);
    } catch (error) {
      throw new ToolError(`Invalid arguments for ${method}: ${error}`);
    }
    try {
      return await capability2.handler(this.page, args);
    } catch (error) {
      throw new ToolError(`Failed to execute ${method}: ${error}`);
    }
  }
};

// loop.ts
var SYSTEM_PROMPT = `<SYSTEM_CAPABILITY>
* You are utilising an Ubuntu virtual machine using ${process.arch} architecture with internet access.
* When you connect to the display, CHROMIUM IS ALREADY OPEN. The url bar is not visible but it is there.
* If you need to navigate to a new page, you can use the playwright 'goto' method for faster navigation.
* When viewing a page it can be helpful to zoom out so that you can see everything on the page.
* Either that, or make sure you scroll down to see everything before deciding something isn't available.
* When using your computer function calls, they take a while to run and send back to you.
* For efficient page navigation, use LARGE scroll amounts (80-90) to quickly move through content.
* Only use small scroll amounts (5-15) when scrolling within specific UI elements like dropdowns or small lists.
* Page-level scrolling with scroll_amount 80-90 shows mostly new content while keeping some overlap for context.
* The current date is ${import_luxon.DateTime.now().toFormat("EEEE, MMMM d, yyyy")}
</SYSTEM_CAPABILITY>

<IMPORTANT>
* When using Chromium, if a startup wizard appears, IGNORE IT. Do not even click "skip this step".
* Instead, click on the search bar on the center of the screen where it says "Search or enter address", and enter the appropriate search term or URL there.
* For faster navigation, prefer using the playwright 'goto' method over manually typing URLs.
</IMPORTANT>`;
async function samplingLoop({
  model,
  systemPromptSuffix,
  messages,
  apiKey,
  onlyNMostRecentImages,
  maxTokens = 4096,
  toolVersion,
  thinkingBudget,
  tokenEfficientToolsBeta = false,
  playwrightPage,
  signalBus,
  executionConfig,
  playwrightCapabilities = [],
  tools = [],
  logger = new NoOpLogger()
}) {
  const selectedVersion = toolVersion || DEFAULT_TOOL_VERSION;
  const toolGroup = TOOL_GROUPS_BY_VERSION[selectedVersion];
  const computerTools = toolGroup.tools.map(
    (Tool) => new Tool(playwrightPage, executionConfig)
  );
  const playwrightTool = new PlaywrightTool(
    playwrightPage,
    playwrightCapabilities
  );
  const toolCollection = new ToolCollection(
    ...computerTools,
    playwrightTool,
    ...tools
  );
  toolCollection.setPage(playwrightPage);
  const capabilityDocs = playwrightCapabilities.length > 0 ? playwrightTool.getCapabilityDocs() : PlaywrightTool.getCapabilityDocs();
  const system = {
    type: "text",
    text: `${SYSTEM_PROMPT}${systemPromptSuffix ? " " + systemPromptSuffix : ""}

${capabilityDocs}`
  };
  let stepIndex = 0;
  while (true) {
    if (signalBus) {
      signalBus.setStep(stepIndex);
      if (signalBus.isCancelling()) {
        console.log("Agent execution was cancelled");
        break;
      }
      if (signalBus.getState() === "paused") {
        await signalBus.waitUntilResumed();
        if (signalBus.isCancelling()) {
          console.log("Agent execution was cancelled during pause");
          break;
        }
      }
    }
    const betas = toolGroup.beta_flag ? [toolGroup.beta_flag] : [];
    if (tokenEfficientToolsBeta) {
      betas.push("token-efficient-tools-2025-02-19");
    }
    let imageTruncationThreshold = onlyNMostRecentImages || 20;
    const client = new import_sdk.Anthropic({ apiKey, maxRetries: 4 });
    const enablePromptCaching = true;
    if (enablePromptCaching) {
      betas.push(PROMPT_CACHING_BETA_FLAG);
      injectPromptCaching(messages);
      onlyNMostRecentImages = 0;
      system.cache_control = { type: "ephemeral" };
    }
    truncateMessageHistory(messages, 15);
    cleanMessageHistory(messages);
    if (onlyNMostRecentImages) {
      maybeFilterToNMostRecentImages(
        messages,
        onlyNMostRecentImages,
        imageTruncationThreshold
      );
    }
    const extraBody = {};
    if (thinkingBudget) {
      extraBody.thinking = { type: "enabled", budget_tokens: thinkingBudget };
    }
    const toolParams = toolCollection.toParams();
    const response = await client.beta.messages.create({
      max_tokens: maxTokens,
      messages,
      model,
      system: [system],
      tools: toolParams,
      betas,
      ...extraBody
    });
    const responseParams = responseToParams(response);
    const loggableContent = responseParams.map((block) => {
      if (block.type === "tool_use") {
        console.log(`
=== TOOL USE: ${block.name} ===`);
        console.log("Full input:", JSON.stringify(block.input, null, 2));
        return {
          type: "tool_use",
          name: block.name,
          input: block.input
        };
      }
      return block;
    });
    console.log("=== LLM RESPONSE ===");
    console.log("Stop reason:", response.stop_reason);
    console.log(loggableContent);
    console.log("===");
    logger.llmResponse(response.stop_reason ?? "unknown", stepIndex, loggableContent);
    messages.push({
      role: "assistant",
      content: responseParams
    });
    if (response.stop_reason === "end_turn") {
      console.log("LLM has completed its task, ending loop");
      return messages;
    }
    stepIndex++;
    const toolResultContent = [];
    let hasToolUse = false;
    for (const contentBlock of responseParams) {
      if (contentBlock.type === "tool_use" && contentBlock.name && contentBlock.input && typeof contentBlock.input === "object") {
        const input = contentBlock.input;
        hasToolUse = true;
        const toolStartTime = Date.now();
        logger.toolStart(contentBlock.name, stepIndex, input);
        try {
          const result = await toolCollection.run(contentBlock.name, input);
          const toolDuration = Date.now() - toolStartTime;
          logger.toolComplete(
            contentBlock.name,
            stepIndex,
            toolDuration,
            result
          );
          const toolResult = makeApiToolResult(result, contentBlock.id);
          toolResultContent.push(toolResult);
        } catch (error) {
          console.error(error);
          const toolDuration = Date.now() - toolStartTime;
          logger.toolError(
            contentBlock.name,
            stepIndex,
            error,
            toolDuration
          );
          if (signalBus) {
            signalBus.emitError(error);
          }
          throw error;
        }
      }
    }
    if (toolResultContent.length === 0 && !hasToolUse && response.stop_reason !== "tool_use") {
      console.log(
        "No tool use or results, and not waiting for tool use, ending loop"
      );
      return messages;
    }
    if (toolResultContent.length > 0) {
      messages.push({
        role: "user",
        content: toolResultContent
      });
    }
  }
  return messages;
}
async function computerUseLoop({
  query,
  apiKey,
  playwrightPage,
  model = "claude-sonnet-4-20250514",
  systemPromptSuffix,
  maxTokens = 4096,
  toolVersion,
  thinkingBudget,
  tokenEfficientToolsBeta = false,
  onlyNMostRecentImages,
  signalBus,
  executionConfig,
  playwrightCapabilities = [],
  tools = [],
  logger = new NoOpLogger()
}) {
  const startTime = Date.now();
  const samplingParams = {
    model,
    ...systemPromptSuffix && { systemPromptSuffix },
    messages: [
      {
        role: "user",
        content: query
      }
    ],
    apiKey,
    ...maxTokens && { maxTokens },
    ...toolVersion && { toolVersion },
    ...thinkingBudget && { thinkingBudget },
    tokenEfficientToolsBeta,
    ...onlyNMostRecentImages && { onlyNMostRecentImages },
    playwrightPage,
    ...signalBus && { signalBus },
    ...executionConfig && { executionConfig },
    playwrightCapabilities,
    tools,
    logger
  };
  const messages = await samplingLoop(samplingParams);
  const elapsed = ((Date.now() - startTime) / 1e3).toFixed(2);
  console.log(`\u23F1\uFE0F  Agent finished in ${elapsed}s`);
  return messages;
}

// signals/bus.ts
var SignalBus = class {
  constructor() {
    this.state = "running";
    this.listeners = /* @__PURE__ */ new Map();
    this.resumePromise = null;
    this.resumeResolve = null;
    this.abortController = new AbortController();
    this.currentStep = 0;
    this.listeners.set("onPause", /* @__PURE__ */ new Set());
    this.listeners.set("onResume", /* @__PURE__ */ new Set());
    this.listeners.set("onCancel", /* @__PURE__ */ new Set());
    this.listeners.set("onError", /* @__PURE__ */ new Set());
  }
  /**
   * Send a control signal to the agent
   */
  send(signal, reason) {
    switch (signal) {
      case "pause":
        if (this.state === "running") {
          this.state = "paused";
        }
        break;
      case "resume":
        if (this.state === "paused") {
          this.state = "running";
          if (this.resumeResolve) {
            this.resumeResolve();
            this.resumeResolve = null;
            this.resumePromise = null;
          }
          this.emit("onResume", { at: /* @__PURE__ */ new Date(), step: this.currentStep });
        }
        break;
      case "cancel":
        this.state = "cancelling";
        this.abortController.abort();
        this.emit("onCancel", {
          at: /* @__PURE__ */ new Date(),
          step: this.currentStep,
          ...reason && { reason }
        });
        if (this.resumeResolve) {
          this.resumeResolve();
          this.resumeResolve = null;
          this.resumePromise = null;
        }
        break;
    }
  }
  /**
   * Subscribe to signal events
   */
  on(event, listener) {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      eventListeners.add(listener);
    }
    return () => {
      const eventListeners2 = this.listeners.get(event);
      if (eventListeners2) {
        eventListeners2.delete(listener);
      }
    };
  }
  /**
   * Emit a signal event to all listeners
   */
  emit(event, payload) {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      Promise.allSettled(
        Array.from(eventListeners).map((listener) => {
          try {
            const result = listener(payload);
            return result instanceof Promise ? result : Promise.resolve();
          } catch (error) {
            return Promise.reject(error);
          }
        })
      ).catch((errors) => {
        console.error("Error in signal event listeners:", errors);
      });
    }
  }
  /**
   * Get current state
   */
  getState() {
    return this.state;
  }
  /**
   * Wait until resumed (used by the loop when paused)
   */
  async waitUntilResumed() {
    if (this.state !== "paused") {
      return;
    }
    this.emit("onPause", { at: /* @__PURE__ */ new Date(), step: this.currentStep });
    if (!this.resumePromise) {
      this.resumePromise = new Promise((resolve) => {
        this.resumeResolve = resolve;
      });
    }
    return this.resumePromise;
  }
  /**
   * Update the current step index (called by the loop)
   */
  setStep(step) {
    this.currentStep = step;
  }
  /**
   * Get the abort signal for cancellation
   */
  getAbortSignal() {
    return this.abortController.signal;
  }
  /**
   * Check if cancellation was requested
   */
  isCancelling() {
    return this.state === "cancelling";
  }
  /**
   * Emit an error event
   */
  emitError(error) {
    this.emit("onError", { at: /* @__PURE__ */ new Date(), step: this.currentStep, error });
  }
};

// agent.ts
var AgentControllerImpl = class {
  constructor(bus) {
    this.bus = bus;
  }
  signal(signal) {
    this.bus.send(signal);
  }
  on(event, callback) {
    return this.bus.on(event, (payload) => {
      switch (event) {
        case "onPause":
          callback(
            payload
          );
          break;
        case "onResume":
          callback(
            payload
          );
          break;
        case "onCancel":
          callback(
            payload
          );
          break;
        case "onError":
          callback(
            payload
          );
          break;
      }
    });
  }
};
var ComputerUseAgent = class {
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
    logger
  }) {
    this.apiKey = apiKey;
    this.model = model;
    this.page = page;
    this.executionConfig = executionConfig ?? {};
    this.playwrightCapabilities = playwrightCapabilities;
    this.tools = tools;
    this.logger = logger ?? new NoOpLogger();
    this.signalBus = new SignalBus();
    this.controller = new AgentControllerImpl(this.signalBus);
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
        error: data.error
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
  async execute(query, schema, options) {
    const startTime = Date.now();
    const {
      systemPromptSuffix,
      thinkingBudget,
      maxTokens,
      onlyNMostRecentImages
    } = options ?? {};
    this.logger.agentStart(query, this.model, {
      systemPromptSuffix,
      thinkingBudget,
      maxTokens,
      onlyNMostRecentImages,
      schema: schema ? "provided" : "none"
    });
    let finalQuery = query;
    if (schema) {
      const jsonSchema = (0, import_zod_to_json_schema.default)(schema);
      finalQuery = `${query}

Please respond with a valid JSON object that matches this JSON Schema:
\`\`\`json
${JSON.stringify(jsonSchema, null, 2)}
\`\`\`

Respond ONLY with the JSON object, no additional text.`;
    }
    try {
      const loopParams = {
        query: finalQuery,
        apiKey: this.apiKey,
        playwrightPage: this.page,
        model: this.model,
        ...systemPromptSuffix && { systemPromptSuffix },
        ...thinkingBudget && { thinkingBudget },
        ...maxTokens && { maxTokens },
        ...onlyNMostRecentImages && { onlyNMostRecentImages },
        signalBus: this.signalBus,
        ...this.executionConfig && Object.keys(this.executionConfig).length > 0 && {
          executionConfig: this.executionConfig
        },
        playwrightCapabilities: this.playwrightCapabilities,
        tools: this.tools,
        logger: this.logger
        // Pass logger to the loop
      };
      const messages = await computerUseLoop(loopParams);
      const lastMessage = messages[messages.length - 1];
      if (!lastMessage) {
        throw new Error("No response received");
      }
      const response = this.extractTextFromMessage(lastMessage);
      const duration = Date.now() - startTime;
      this.logger.agentComplete(query, duration, messages.length);
      if (!schema) {
        return response;
      }
      const parsed = this.parseJsonResponse(response);
      return schema.parse(parsed);
    } catch (error) {
      const duration = Date.now() - startTime;
      this.logger.agentError(query, error, duration);
      throw error;
    }
  }
  extractTextFromMessage(message) {
    if (typeof message.content === "string") {
      return message.content;
    }
    if (Array.isArray(message.content)) {
      return message.content.filter((block) => block.type === "text").map((block) => block.text || "").join("");
    }
    return "";
  }
  parseJsonResponse(response) {
    const jsonMatch = response.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/);
    if (jsonMatch && jsonMatch[1]) {
      return JSON.parse(jsonMatch[1].trim());
    }
    const objectMatch = response.match(/\{[\s\S]*\}/);
    if (objectMatch && objectMatch[0]) {
      return JSON.parse(objectMatch[0]);
    }
    return JSON.parse(response.trim());
  }
};

// tools/registry/index.ts
init_registry();

// tools/registry/decorators.ts
var import_reflect_metadata = require("reflect-metadata");
var import_zod3 = require("zod");
init_registry();
function capability(options) {
  return function(target, propertyKey, descriptor) {
    const metadata = Reflect.getMetadata("capability:metadata", target, propertyKey) || {};
    Reflect.defineMetadata(
      "capability:metadata",
      { ...metadata, ...options },
      target,
      propertyKey
    );
    Reflect.defineMetadata("capability:method", true, target, propertyKey);
    return descriptor;
  };
}
function capabilitySchema(schema) {
  return function(target, propertyKey, descriptor) {
    Reflect.defineMetadata("capability:schema", schema, target, propertyKey);
    return descriptor;
  };
}
function registerCapabilities(instance, toolName) {
  const registry = getToolRegistry();
  const prototype = Object.getPrototypeOf(instance);
  const methodNames = Object.getOwnPropertyNames(prototype).filter(
    (name) => name !== "constructor" && typeof prototype[name] === "function"
  );
  methodNames.forEach((methodName) => {
    if (!Reflect.getMetadata("capability:method", prototype, methodName)) {
      return;
    }
    const metadata = Reflect.getMetadata("capability:metadata", prototype, methodName) || {};
    const schema = Reflect.getMetadata(
      "capability:schema",
      prototype,
      methodName
    );
    const tool = toolName || metadata.tool || instance.name || "unknown";
    const method = methodName.replace(/^execute/, "").toLowerCase();
    const capability2 = {
      tool,
      method,
      displayName: metadata.displayName || method,
      description: metadata.description || "",
      usage: metadata.usage || "",
      schema: schema || import_zod3.z.unknown(),
      enabled: metadata.enabled !== false
    };
    registry.register(capability2);
  });
}
function withCapabilities(constructor) {
  return class extends constructor {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    constructor(...args) {
      super(...args);
      const instance = this;
      const toolName = instance.name || constructor.name.toLowerCase().replace(/tool$/, "");
      registerCapabilities(this, toolName);
    }
  };
}
function defineCapability(tool, method, options) {
  return {
    tool,
    method,
    displayName: options.displayName,
    description: options.description,
    usage: options.usage,
    schema: options.schema || import_zod3.z.unknown(),
    enabled: options.enabled !== false
  };
}

// tools/registry/playwright-capabilities.ts
var import_zod4 = require("zod");
var PlaywrightSchemas = {
  goto: import_zod4.z.object({
    url: import_zod4.z.string().describe("The URL to navigate to")
  }),
  extractUrl: import_zod4.z.object({
    selector: import_zod4.z.string().describe("The text or CSS selector to find the element")
  }),
  scrollToText: import_zod4.z.object({
    targetText: import_zod4.z.string().describe("The exact text to scroll to")
  })
};
var PLAYWRIGHT_CAPABILITIES2 = [
  defineCapability("playwright", "goto", {
    displayName: "Navigate to URL",
    description: "Navigate directly to any URL or website",
    usage: `Use this to navigate to any website directly without using the URL bar
Call format: {"name": "playwright", "input": {"method": "goto", "args": ["url or domain"]}}
The tool will automatically add https:// if no protocol is specified
This is faster and more reliable than using ctrl+l and typing in the URL bar`,
    category: "navigation",
    enabled: true,
    schema: PlaywrightSchemas.goto,
    examples: [
      {
        description: "Navigate to a full URL",
        input: { method: "goto", args: ["https://example.com"] },
        expectedOutput: "Successfully navigated to https://example.com"
      },
      {
        description: "Navigate to a domain (protocol added automatically)",
        input: { method: "goto", args: ["example.com"] },
        expectedOutput: "Successfully navigated to https://example.com"
      }
    ],
    performance: {
      speed: "fast",
      reliability: "high",
      notes: "Direct navigation is significantly faster than manual URL bar interaction"
    }
  }),
  defineCapability("playwright", "extract_url", {
    displayName: "Extract URL",
    description: "Extract URLs from visible text, links, or buttons on the page",
    usage: `First, take a screenshot to see what's on the page
Identify the visible text of the link/button you want to extract the URL from
Call format: {"name": "playwright", "input": {"method": "extract_url", "args": ["exact visible text"]}}
The tool will search for the text and extract the associated URL`,
    category: "extraction",
    enabled: true,
    schema: PlaywrightSchemas.extractUrl,
    examples: [
      {
        description: "Extract URL from link text",
        input: { method: "extract_url", args: ["Click here to learn more"] },
        expectedOutput: "Successfully extracted URL: https://example.com/learn-more"
      },
      {
        description: "Extract URL from button text",
        input: { method: "extract_url", args: ["Sign Up"] },
        expectedOutput: "Successfully extracted URL: https://example.com/signup"
      }
    ],
    performance: {
      speed: "fast",
      reliability: "medium",
      notes: "Reliability depends on page structure and text uniqueness"
    }
  }),
  defineCapability("playwright", "scroll_to_text", {
    displayName: "Scroll to Text",
    description: "Instantly scroll to specific text in dropdowns, lists, or on the page",
    usage: `When you need to find specific text in a dropdown/list, use this FIRST
Call format: {"name": "playwright", "input": {"method": "scroll_to_text", "args": ["exact text"]}}
Only provide the text you're looking for - no CSS selectors needed
This instantly scrolls the text into view without multiple attempts
If it fails, fall back to regular computer scroll`,
    category: "interaction",
    enabled: true,
    schema: PlaywrightSchemas.scrollToText,
    examples: [
      {
        description: "Scroll to text in a dropdown",
        input: { method: "scroll_to_text", args: ["United States"] },
        expectedOutput: 'Scrolled to "United States"'
      },
      {
        description: "Scroll to text on page",
        input: { method: "scroll_to_text", args: ["Terms and Conditions"] },
        expectedOutput: 'Scrolled to "Terms and Conditions"'
      }
    ],
    performance: {
      speed: "instant",
      reliability: "high",
      notes: "Much faster than manual scrolling, especially for long lists"
    }
  })
];
function registerPlaywrightCapabilities() {
  const { getToolRegistry: getToolRegistry2 } = (init_registry(), __toCommonJS(registry_exports));
  const registry = getToolRegistry2();
  PLAYWRIGHT_CAPABILITIES2.forEach((capability2) => {
    try {
      registry.register(capability2);
    } catch {
      console.debug(
        `Capability ${capability2.tool}:${capability2.method} already registered`
      );
    }
  });
}

// tools/registry/index.ts
init_registry();
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  Action,
  ComputerTool,
  ComputerTool20241022,
  ComputerTool20250124,
  ComputerUseAgent,
  NoOpLogger,
  PLAYWRIGHT_CAPABILITIES,
  PlaywrightTool,
  SimpleLogger,
  ToolCollection,
  capability,
  capabilitySchema,
  defineCapability,
  getToolRegistry,
  registerPlaywrightCapabilities,
  resetToolRegistry,
  withCapabilities
});
