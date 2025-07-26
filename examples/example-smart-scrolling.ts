import { chromium } from 'playwright';
import { ComputerUseAgent } from '../index';

async function smartScrollingExample(): Promise<void> {
  const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
  if (!ANTHROPIC_API_KEY) {
    throw new Error('ANTHROPIC_API_KEY environment variable is required');
  }
  
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  await page.goto("https://news.ycombinator.com/");
  
  try {
    console.log('\n=== Smart Scrolling Examples ===');
    
    const agent = new ComputerUseAgent({
      apiKey: ANTHROPIC_API_KEY,
      page,
    });

    console.log('\n📋 Testing different scroll scenarios:');
    console.log('• Large scroll amounts (80-90) = Efficient page navigation');
    console.log('• Small scroll amounts (5-15) = Precise UI element scrolling');
    console.log('• Medium scroll amounts (21-79) = Standard scrolling\n');

    // Example 1: Efficient page navigation
    console.log('🚀 Testing LARGE scroll for efficient page navigation...');
    console.log('Using scroll_amount 85 for fast page scanning');
    
    const pageNavigationResult = await agent.execute(`
      Scroll down the page using scroll_amount 85 to quickly scan through the stories.
      Look for any stories about AI or machine learning.
      After scrolling, tell me what you can see.
    `);
    console.log('✅ Page navigation result:', pageNavigationResult);

    await page.waitForTimeout(2000);

    // Example 2: Precise UI scrolling (if there are any scrollable elements)
    console.log('\n🎯 Testing SMALL scroll for precise navigation...');
    console.log('Using scroll_amount 10 for precise movement');
    
    const preciseScrollResult = await agent.execute(`
      Use a small scroll_amount of 10 to carefully scroll and look for a "More" link or pagination.
      This should scroll just a small amount to fine-tune the view.
    `);
    console.log('✅ Precise scroll result:', preciseScrollResult);

    await page.waitForTimeout(2000);

    // Example 3: Go back to top and demonstrate the difference
    console.log('\n🔄 Going back to top to show the difference...');
    
    await agent.execute(`
      Press the Home key or scroll to the very top of the page.
    `);

    await page.waitForTimeout(1000);

    // Example 4: Compare different scroll amounts
    console.log('\n📊 Comparing scroll amounts:');
    
    console.log('Small scroll (scroll_amount 15):');
    const smallScrollResult = await agent.execute(`
      Scroll down with scroll_amount 15 and describe what you see.
      This should be a small, precise movement.
    `);
    console.log('Small scroll showed:', smallScrollResult);

    await page.waitForTimeout(1000);

    console.log('\nLarge scroll (scroll_amount 90):');
    const largeScrollResult = await agent.execute(`
      Now scroll down with scroll_amount 90 and describe what you see.
      This should move much further down the page efficiently.
    `);
    console.log('Large scroll showed:', largeScrollResult);

    console.log('\n📈 Performance Benefits:');
    console.log('• Large scrolls (80-90): Cover ~90% of viewport - great for content discovery');
    console.log('• Small scrolls (5-15): Cover ~5-15% of viewport - perfect for precise navigation');
    console.log('• Smart default: 90% viewport coverage when no amount specified');
    console.log('• 10% overlap maintained for context in large scrolls');

    console.log('\n💡 Usage Guidelines:');
    console.log('• Use scroll_amount 80-90 for: Page scanning, content discovery, long articles');
    console.log('• Use scroll_amount 5-15 for: Dropdowns, small lists, fine positioning');
    console.log('• Use scroll_amount 21-79 for: Standard navigation between these extremes');
    
  } catch (error) {
    console.error('❌ Smart scrolling example failed:', error);
  } finally {
    await browser.close();
  }
}

// Run the example
smartScrollingExample().catch(console.error); 