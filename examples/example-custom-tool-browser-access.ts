/**
 * Example: Custom Tool with Browser Access
 *
 * This example demonstrates how custom tools can access the browser context
 * to perform browser operations while leveraging the existing infrastructure
 * (proxies, anti-detection, session management).
 */

import { chromium } from "playwright";
import { z } from "zod";
import type {
  ComputerUseTool,
  ComputerUseToolDef,
  ToolResult,
  ToolExecutionContext,
} from "../index";

const NavigateAndCaptureParamsSchema = z.object({
  url: z.string().url(),
  waitForSelector: z.string().optional(),
});

type NavigateAndCaptureParams = z.infer<typeof NavigateAndCaptureParamsSchema>;

class NavigateAndCaptureTool implements ComputerUseTool {
  name = "navigate_and_capture";

  toParams(): ComputerUseToolDef {
    return {
      name: this.name,
      type: "custom",
      input_schema: {
        type: "object",
        properties: {
          url: {
            type: "string",
            description: "The URL to navigate to",
          },
          waitForSelector: {
            type: "string",
            description: "Optional CSS selector to wait for before capturing",
          },
        },
        required: ["url"],
      },
    };
  }

  async call(
    params: Record<string, unknown>,
    ctx?: ToolExecutionContext
  ): Promise<ToolResult> {
    const parsed = NavigateAndCaptureParamsSchema.safeParse(params);
    if (!parsed.success) {
      return { error: `Invalid parameters: ${parsed.error.message}` };
    }

    const { url, waitForSelector } = parsed.data;

    if (!ctx?.createPage) {
      return { error: "Browser context not available - createPage is required" };
    }

    const page = await ctx.createPage();
    try {
      await page.goto(url, { waitUntil: "domcontentloaded" });

      if (waitForSelector) {
        await page.waitForSelector(waitForSelector, { timeout: 10000 });
      }

      const title = await page.title();
      const screenshot = await page.screenshot({ type: "png" });
      const base64Image = screenshot.toString("base64");

      return {
        output: `Successfully navigated to "${title}" (${url})`,
        base64Image,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return { error: `Failed to navigate: ${message}` };
    } finally {
      await page.close();
    }
  }
}

const ActivationLinkParamsSchema = z.object({
  activationUrl: z.string().url(),
});

type ActivationLinkParams = z.infer<typeof ActivationLinkParamsSchema>;

class ActivationLinkTool implements ComputerUseTool {
  name = "click_activation_link";

  toParams(): ComputerUseToolDef {
    return {
      name: this.name,
      type: "custom",
      input_schema: {
        type: "object",
        properties: {
          activationUrl: {
            type: "string",
            description: "The activation URL to navigate to",
          },
        },
        required: ["activationUrl"],
      },
    };
  }

  async call(
    params: Record<string, unknown>,
    ctx?: ToolExecutionContext
  ): Promise<ToolResult> {
    const parsed = ActivationLinkParamsSchema.safeParse(params);
    if (!parsed.success) {
      return { error: `Invalid parameters: ${parsed.error.message}` };
    }

    const { activationUrl } = parsed.data;

    if (!ctx?.createPage) {
      return { error: "Browser context not available" };
    }

    const page = await ctx.createPage();
    try {
      const response = await page.goto(activationUrl, {
        waitUntil: "domcontentloaded",
      });

      const status = response?.status() ?? 0;
      const finalUrl = page.url();

      if (status >= 200 && status < 400) {
        return {
          output: `Activation successful! Navigated to ${finalUrl} (status: ${status})`,
        };
      } else {
        return {
          error: `Activation may have failed. Status: ${status}, URL: ${finalUrl}`,
        };
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return { error: `Failed to activate: ${message}` };
    } finally {
      await page.close();
    }
  }
}

class MultiPageComparisonTool implements ComputerUseTool {
  name = "compare_pages";

  toParams(): ComputerUseToolDef {
    return {
      name: this.name,
      type: "custom",
      input_schema: {
        type: "object",
        properties: {
          urls: {
            type: "array",
            items: { type: "string" },
            description: "URLs to compare (2-5 URLs)",
          },
        },
        required: ["urls"],
      },
    };
  }

  async call(
    params: Record<string, unknown>,
    ctx?: ToolExecutionContext
  ): Promise<ToolResult> {
    const urls = params.urls as string[];

    if (!Array.isArray(urls) || urls.length < 2 || urls.length > 5) {
      return { error: "Please provide 2-5 URLs to compare" };
    }

    if (!ctx?.createPage) {
      return { error: "Browser context not available" };
    }

    const results: Array<{ url: string; title: string; status: number }> = [];
    const pages: import("playwright").Page[] = [];

    try {
      for (const url of urls) {
        const page = await ctx.createPage();
        pages.push(page);

        const response = await page.goto(url, {
          waitUntil: "domcontentloaded",
          timeout: 15000,
        });

        results.push({
          url,
          title: await page.title(),
          status: response?.status() ?? 0,
        });
      }

      const comparison = results
        .map((r, i) => `${i + 1}. [${r.status}] "${r.title}" - ${r.url}`)
        .join("\n");

      return {
        output: `Compared ${urls.length} pages:\n${comparison}`,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return { error: `Comparison failed: ${message}` };
    } finally {
      await Promise.all(pages.map((p) => p.close().catch(() => {})));
    }
  }
}

async function main() {
  console.log("=== Custom Tool Browser Access Example ===\n");

  console.log("1. Launching browser...");
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 },
  });
  const mainPage = await context.newPage();
  console.log("   ✓ Browser launched");

  console.log("2. Navigating main page to example.com...");
  await mainPage.goto("https://example.com");
  console.log("   ✓ Main page ready");

  console.log("3. Creating tools...");
  const navigateTool = new NavigateAndCaptureTool();
  const activationTool = new ActivationLinkTool();
  const comparisonTool = new MultiPageComparisonTool();
  console.log("   ✓ Tools created");

  console.log("\n4. Testing createPage functionality directly...\n");

  const mockContext: ToolExecutionContext = {
    page: mainPage,
    browserContext: context,
    createPage: async () => {
      console.log("   [createPage] Creating new page in browser context...");
      const newPage = await context.newPage();
      console.log("   [createPage] Applying anti-detection scripts...");
      await newPage.addInitScript(() => {
        Object.defineProperty(navigator, "webdriver", { get: () => undefined });
      });
      console.log("   [createPage] ✓ New page ready");
      return newPage;
    },
  };

  console.log("--- Test A: NavigateAndCaptureTool ---");
  const navigateResult = await navigateTool.call(
    { url: "https://httpbin.org/html" },
    mockContext
  );
  if (navigateResult.error) {
    console.log(`   ✗ Error: ${navigateResult.error}`);
  } else {
    console.log(`   ✓ Result: ${navigateResult.output}`);
    console.log(`   ✓ Screenshot captured: ${navigateResult.base64Image ? "yes" : "no"} (${navigateResult.base64Image?.length ?? 0} bytes)`);
  }

  console.log("\n--- Test B: ActivationLinkTool ---");
  const activationResult = await activationTool.call(
    { activationUrl: "https://httpbin.org/status/200" },
    mockContext
  );
  if (activationResult.error) {
    console.log(`   ✗ Error: ${activationResult.error}`);
  } else {
    console.log(`   ✓ Result: ${activationResult.output}`);
  }

  console.log("\n--- Test C: MultiPageComparisonTool ---");
  const comparisonResult = await comparisonTool.call(
    { urls: ["https://example.com", "https://httpbin.org/html"] },
    mockContext
  );
  if (comparisonResult.error) {
    console.log(`   ✗ Error: ${comparisonResult.error}`);
  } else {
    console.log(`   ✓ Result:\n${comparisonResult.output}`);
  }

  console.log("\n--- Test D: Tool without createPage (should fail gracefully) ---");
  const noContextResult = await navigateTool.call(
    { url: "https://example.com" },
    { page: mainPage }
  );
  if (noContextResult.error) {
    console.log(`   ✓ Correctly returned error: ${noContextResult.error}`);
  } else {
    console.log(`   ✗ Unexpected success: ${noContextResult.output}`);
  }

  console.log("\n5. Verifying main page is still intact...");
  const mainPageTitle = await mainPage.title();
  console.log(`   ✓ Main page title: "${mainPageTitle}"`);
  console.log(`   ✓ Main page URL: ${mainPage.url()}`);

  console.log("\n6. Closing browser...");
  await browser.close();
  console.log("   ✓ Browser closed");

  console.log("\n=== Example completed successfully ===");
}

main().catch(console.error);
