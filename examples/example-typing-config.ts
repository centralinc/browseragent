import { chromium } from 'playwright';
import { ComputerUseAgent } from '../index';
import type { ExecutionConfig } from '../tools/types/base';

async function typingConfigExample(): Promise<void> {
  const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
  if (!ANTHROPIC_API_KEY) {
    throw new Error('ANTHROPIC_API_KEY environment variable is required');
  }
  
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  await page.goto("https://httpbin.org/forms/post");
  
  try {
    console.log('\n=== Typing Configuration Examples ===');
    
    // Example 1: Fast bulk typing (all text at once)
    console.log('\n🚀 Testing BULK typing mode (fast)...');
    const fastTypingConfig: ExecutionConfig = {
      typing: {
        mode: 'bulk',
        completionDelay: 50,
      },
      screenshot: {
        delay: 0.1, // Faster screenshots for demo
      }
    };

    const fastAgent = new ComputerUseAgent({
      apiKey: ANTHROPIC_API_KEY,
      page,
      executionConfig: fastTypingConfig,
    });

    console.log('Agent will type text instantly (bulk mode)');
    const fastResult = await fastAgent.execute(
      'Fill in the "Customer name" field with "John Smith" and the "Telephone" field with "555-0123"'
    );
    console.log('✅ Fast typing completed:', fastResult);

    // Wait a moment and clear the form
    await page.reload();
    await page.waitForTimeout(1000);

    // Example 2: Character-by-character typing (traditional)
    console.log('\n⌨️ Testing CHARACTER-BY-CHARACTER typing mode (traditional)...');
    const slowTypingConfig: ExecutionConfig = {
      typing: {
        mode: 'character-by-character',
        characterDelay: 100, // Slower for demonstration
        completionDelay: 200,
      },
      screenshot: {
        delay: 0.2,
      }
    };

    const slowAgent = new ComputerUseAgent({
      apiKey: ANTHROPIC_API_KEY,
      page,
      executionConfig: slowTypingConfig,
    });

    console.log('Agent will type character by character (100ms delay between characters)');
    const slowResult = await slowAgent.execute(
      'Fill in the "Customer name" field with "Jane Doe" and the "Telephone" field with "555-0456"'
    );
    console.log('✅ Slow typing completed:', slowResult);

    // Example 3: Fast character typing (balanced)
    await page.reload();
    await page.waitForTimeout(1000);

    console.log('\n⚡ Testing FAST CHARACTER-BY-CHARACTER typing mode (balanced)...');
    const balancedTypingConfig: ExecutionConfig = {
      typing: {
        mode: 'character-by-character',
        characterDelay: 5, // Very fast but still character-by-character
        completionDelay: 75,
      },
      screenshot: {
        delay: 0.15,
      }
    };

    const balancedAgent = new ComputerUseAgent({
      apiKey: ANTHROPIC_API_KEY,
      page,
      executionConfig: balancedTypingConfig,
    });

    console.log('Agent will type character by character but very fast (5ms delay)');
    const balancedResult = await balancedAgent.execute(
      'Fill in the "Customer name" field with "Alex Johnson" and the "Telephone" field with "555-0789"'
    );
    console.log('✅ Balanced typing completed:', balancedResult);

    console.log('\n📊 Performance Comparison Summary:');
    console.log('• Bulk mode: Fastest overall typing');
    console.log('• Fast character-by-character: Good balance of speed and visibility');
    console.log('• Slow character-by-character: Most human-like but slowest');
    console.log('\n💡 Choose based on your needs:');
    console.log('• Use bulk for maximum speed in production');
    console.log('• Use character-by-character for debugging/demos');
    console.log('• Use fast character-by-character for best of both worlds');
    
  } catch (error) {
    console.error('❌ Typing configuration example failed:', error);
  } finally {
    await browser.close();
  }
}

// Run the example
typingConfigExample().catch(console.error); 