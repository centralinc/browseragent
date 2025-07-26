import { chromium } from 'playwright';
import { ComputerUseAgent } from '../index';
import path from 'path';

async function scrollToTextExample(): Promise<void> {
  const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
  if (!ANTHROPIC_API_KEY) {
    throw new Error('ANTHROPIC_API_KEY environment variable is required');
  }
  
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  // Load our test HTML file
  const testFilePath = path.resolve(__dirname, '../test-ui-elements.html');
  await page.goto(`file://${testFilePath}`);
  
  try {
    console.log('\n🎯 Intelligent Scrolling Example');
    console.log('===============================\n');
    console.log('Testing agent\'s ability to choose optimal scrolling strategies automatically\n');
    
    const agent = new ComputerUseAgent({
      apiKey: ANTHROPIC_API_KEY,
      page,
    });

    // Example 1: Find Wyoming in state picker
    console.log('📍 Example 1: Finding Wyoming in state dropdown...');
    const wyomingResult = await agent.execute(`
      Look at the state picker dropdown on the page.
      I need to find "Wyoming" in the list. Navigate to it efficiently.
      Tell me if you found it successfully.
    `);
    console.log('Result:', wyomingResult);
    
    await page.waitForTimeout(2000);

    // Example 2: Try to find something that doesn't exist
    console.log('\n❌ Example 2: Trying to find non-existent text...');
    const notFoundResult = await agent.execute(`
      I'm looking for "Narnia" in the state dropdown. Try to find it.
      If you can't find it, show me what states are actually available in the dropdown.
    `);
    console.log('Result:', notFoundResult);
    
    await page.waitForTimeout(2000);

    // Example 3: Find product in list
    console.log('\n📦 Example 3: Finding specific product...');
    const productResult = await agent.execute(`
      Navigate to the product list and find "Product 25: Mount" for me.
      Tell me if you successfully found it and what you can see.
    `);
    console.log('Result:', productResult);

    console.log('\n✅ Key Takeaways:');
    console.log('• Agent intelligently chooses instant text navigation when appropriate');
    console.log('• Falls back gracefully to regular scrolling when needed');
    console.log('• No manual tool selection required - agent decides based on context');
    console.log('• Optimized for finding specific items in dropdowns and lists');
    
  } catch (error) {
    console.error('❌ Example failed:', error);
  } finally {
    console.log('\n🔍 Browser will remain open for inspection...');
    console.log('Press Ctrl+C to close.');
    
    await new Promise(resolve => {
      process.on('SIGINT', () => {
        console.log('\n👋 Closing browser...');
        browser.close().then(resolve);
      });
    });
  }
}

// Run the example
scrollToTextExample().catch(console.error); 