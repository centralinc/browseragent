import { chromium } from "playwright";
import { ComputerUseAgent, SimpleLogger, type RetryConfig } from "../index";

async function retryExample(): Promise<void> {
  const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
  if (!ANTHROPIC_API_KEY) {
    throw new Error("ANTHROPIC_API_KEY environment variable is required");
  }

  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  try {
    console.log("🔄 Retry Configuration Example");
    console.log("================================\n");

    // Example 1: Agent with custom retry configuration
    console.log("📊 Example 1: Custom Retry Configuration");
    console.log("----------------------------------------");

    const customRetryConfig: RetryConfig = {
      maxRetries: 5,
      initialDelayMs: 2000,
      maxDelayMs: 60000,
      backoffMultiplier: 2.5,
      preferIPv4: true, // Fix for Tailscale/VPN IPv6 connectivity issues
      retryableErrors: [
        "Connection error",
        "ECONNREFUSED",
        "ETIMEDOUT",
        "ECONNRESET",
        "socket hang up",
        "Network Error",
        "ENETUNREACH",
      ],
    };

    // Create logger to see retry attempts
    const logger = new SimpleLogger();

    const agentWithRetry = new ComputerUseAgent({
      apiKey: ANTHROPIC_API_KEY,
      page,
      logger,
      retryConfig: customRetryConfig,
    });

    console.log("✅ Agent configured with:");
    console.log(`   - Max retries: ${customRetryConfig.maxRetries}`);
    console.log(`   - Initial delay: ${customRetryConfig.initialDelayMs}ms`);
    console.log(`   - Max delay: ${customRetryConfig.maxDelayMs}ms`);
    console.log(`   - Backoff multiplier: ${customRetryConfig.backoffMultiplier}x`);
    console.log(`   - Prefer IPv4: ${customRetryConfig.preferIPv4} (fixes Tailscale/VPN issues)`);
    console.log(`   - Retryable errors: ${customRetryConfig.retryableErrors?.length ?? 0} types\n`);

    // Navigate to a test page
    await page.goto("https://example.com");

    // Execute task - connection errors will be automatically retried
    try {
      const result = await agentWithRetry.execute(
        "What is the main heading on this page?"
      );
      console.log("🎯 Result:", result);
    } catch (error) {
      if (error instanceof Error && error.message.includes("Connection error")) {
        console.log("❌ Connection failed after all retry attempts");
      } else {
        throw error;
      }
    }

    // Example 2: Default retry configuration
    console.log("\n📊 Example 2: Default Retry Configuration");
    console.log("-----------------------------------------");

    const defaultAgent = new ComputerUseAgent({
      apiKey: ANTHROPIC_API_KEY,
      page,
      // No retryConfig - uses built-in defaults:
      // - maxRetries: 3
      // - initialDelayMs: 1000ms
      // - maxDelayMs: 30000ms
      // - backoffMultiplier: 2
    });

    console.log("✅ Using default retry configuration");
    console.log("   - Max retries: 3");
    console.log("   - Initial delay: 1000ms");
    console.log("   - Max delay: 30000ms");
    console.log("   - Backoff multiplier: 2x\n");

    const result2 = await defaultAgent.execute(
      "List all the links visible on this page"
    );
    console.log("🎯 Result:", result2);

    // Example 3: Simulating retry behavior
    console.log("\n📊 Example 3: Understanding Retry Delays");
    console.log("----------------------------------------");
    
    console.log("With exponential backoff (multiplier 2.5):");
    let delay = customRetryConfig.initialDelayMs!;
    for (let i = 1; i <= customRetryConfig.maxRetries!; i++) {
      console.log(`   Retry ${i}: Wait ${delay}ms`);
      delay = Math.min(
        delay * customRetryConfig.backoffMultiplier!,
        customRetryConfig.maxDelayMs!
      );
    }

    console.log("\n✅ All examples completed!");

  } catch (error) {
    console.error("❌ Example failed:", error);
  } finally {
    await browser.close();
  }
}

// Helper function to demonstrate retry behavior during errors
async function demonstrateRetryBehavior(): Promise<void> {
  console.log("\n🧪 Retry Behavior Demonstration");
  console.log("================================");
  
  console.log("\nWhen a connection error occurs:");
  console.log("1. First attempt fails with 'Connection error'");
  console.log("2. Wait 2000ms (initial delay)");
  console.log("3. Retry attempt 1");
  console.log("4. If fails again, wait 5000ms (2000 * 2.5)");
  console.log("5. Retry attempt 2");
  console.log("6. If fails again, wait 12500ms (5000 * 2.5)");
  console.log("7. Continue until max retries reached...");
  
  console.log("\nThe retry mechanism helps with:");
  console.log("- Temporary network issues");
  console.log("- API rate limiting");
  console.log("- Server overload");
  console.log("- Intermittent connection problems");
}

// Run the example
if (require.main === module) {
  retryExample()
    .then(() => demonstrateRetryBehavior())
    .catch(console.error);
}
