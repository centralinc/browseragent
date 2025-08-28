import { z } from "zod";
import { defineCapability } from "./decorators";
import type { ToolCapability } from "./types";

/**
 * Schema definitions for Playwright capability inputs
 */
export const PlaywrightSchemas = {
  goto: z.object({
    url: z.string().describe("The URL to navigate to"),
  }),

  extractUrl: z.object({
    selector: z
      .string()
      .describe("The text or CSS selector to find the element"),
  }),

  scrollToText: z.object({
    targetText: z.string().describe("The exact text to scroll to"),
  }),
};

/**
 * Pre-defined Playwright tool capabilities
 */
export const PLAYWRIGHT_CAPABILITIES: ToolCapability[] = [
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
        expectedOutput: "Successfully navigated to https://example.com",
      },
      {
        description: "Navigate to a domain (protocol added automatically)",
        input: { method: "goto", args: ["example.com"] },
        expectedOutput: "Successfully navigated to https://example.com",
      },
    ],
    performance: {
      speed: "fast",
      reliability: "high",
      notes:
        "Direct navigation is significantly faster than manual URL bar interaction",
    },
  }),

  defineCapability("playwright", "extract_url", {
    displayName: "Extract URL",
    description:
      "Extract URLs from visible text, links, or buttons on the page",
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
        expectedOutput:
          "Successfully extracted URL: https://example.com/learn-more",
      },
      {
        description: "Extract URL from button text",
        input: { method: "extract_url", args: ["Sign Up"] },
        expectedOutput:
          "Successfully extracted URL: https://example.com/signup",
      },
    ],
    performance: {
      speed: "fast",
      reliability: "medium",
      notes: "Reliability depends on page structure and text uniqueness",
    },
  }),

  defineCapability("playwright", "scroll_to_text", {
    displayName: "Scroll to Text",
    description:
      "Instantly scroll to specific text in dropdowns, lists, or on the page",
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
        expectedOutput: 'Scrolled to "United States"',
      },
      {
        description: "Scroll to text on page",
        input: { method: "scroll_to_text", args: ["Terms and Conditions"] },
        expectedOutput: 'Scrolled to "Terms and Conditions"',
      },
    ],
    performance: {
      speed: "instant",
      reliability: "high",
      notes: "Much faster than manual scrolling, especially for long lists",
    },
  }),
];

/**
 * Register Playwright capabilities in the tool registry
 */
export function registerPlaywrightCapabilities(): void {
  const { getToolRegistry } = require("./registry");
  const registry = getToolRegistry();

  PLAYWRIGHT_CAPABILITIES.forEach((capability) => {
    try {
      registry.register(capability);
    } catch {
      // Capability might already be registered
      console.debug(
        `Capability ${capability.tool}:${capability.method} already registered`,
      );
    }
  });
}
