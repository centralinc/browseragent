import { chromium } from 'playwright';
import { ComputerUseAgent } from '../index';
import path from 'path';

async function testSmartScrolling(): Promise<void> {
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
    console.log('\n🧪 Testing Smart Scrolling Implementation');
    console.log('==========================================\n');
    
    const agent = new ComputerUseAgent({
      apiKey: ANTHROPIC_API_KEY,
      page,
    });

    // Test 1: Large scrolls for page navigation
    console.log('📊 TEST 1: Large Scrolls for Page Navigation');
    console.log('---------------------------------------------');
    
    console.log('✅ Starting at Section 1...');
    await page.waitForTimeout(1000);
    
    console.log('🚀 Testing large scroll (85) to navigate between page sections...');
    const largeScrollResult1 = await agent.execute(`
      Use scroll_amount 85 to scroll down and find Section 2. 
      Tell me what section you can see and confirm the large scroll worked efficiently.
    `);
    console.log('Result:', largeScrollResult1);
    
    await page.waitForTimeout(2000);
    
    console.log('🚀 Testing another large scroll (90) to continue navigation...');
    const largeScrollResult2 = await agent.execute(`
      Use scroll_amount 90 to scroll down further and find Section 3 or the UI Elements section.
      Tell me what you can see now.
    `);
    console.log('Result:', largeScrollResult2);
    
    await page.waitForTimeout(2000);

    // Test 2: Small scrolls for UI elements
    console.log('\n🎯 TEST 2: Small Scrolls for UI Elements');
    console.log('----------------------------------------');
    
    console.log('🔍 Testing smart scroll to text within the state picker dropdown...');
    const smartScrollResult1 = await agent.execute(`
      Find the state picker dropdown and use the playwright tool to scroll directly to "Wyoming".
      Use scroll_to_text method to instantly navigate to Wyoming without multiple scroll attempts.
      Tell me if you successfully found Wyoming.
    `);
    console.log('Result:', smartScrollResult1);
    
    await page.waitForTimeout(2000);
    
    console.log('🔍 Testing smart scroll to text within the product list...');
    const smartScrollResult2 = await agent.execute(`
      Now find the long product list and use the playwright tool to scroll directly to "Product 25: Mount".
      Use scroll_to_text method for instant navigation.
      Tell me what you found.
    `);
    console.log('Result:', smartScrollResult2);
    
    await page.waitForTimeout(2000);

    // Test 3: Default scrolling (no amount specified)
    console.log('\n⚙️ TEST 3: Default Scrolling (No Amount)');
    console.log('---------------------------------------');
    
    console.log('📍 Testing default scroll behavior...');
    const defaultScrollResult = await agent.execute(`
      Scroll down without specifying any scroll_amount. This should use the default 90% viewport.
      Tell me what section you can see and how much the page moved.
    `);
    console.log('Result:', defaultScrollResult);
    
    await page.waitForTimeout(2000);

    // Test 4: Medium scroll amounts
    console.log('\n📏 TEST 4: Medium Scroll Amounts');
    console.log('-------------------------------');
    
    console.log('📊 Testing medium scroll (50) for standard navigation...');
    const mediumScrollResult = await agent.execute(`
      Use scroll_amount 50 to scroll down. This should be between small and large scrolls.
      Tell me what you can see and how this compares to the previous scrolls.
    `);
    console.log('Result:', mediumScrollResult);

    // Test 5: Verify we can still reach specific targets
    console.log('\n🎯 TEST 5: Target Finding Verification');
    console.log('------------------------------------');
    
    console.log('🔍 Going back to top to test complete navigation...');
    await agent.execute(`Press the Home key to go to the top of the page.`);
    
    await page.waitForTimeout(1000);
    
    console.log('🎯 Testing complete workflow: large scrolls + smart text scrolling...');
    const completeWorkflowResult = await agent.execute(`
      1. Use large scrolls (scroll_amount 85-90) to efficiently navigate to the UI Elements section
      2. Once you find the state picker, use playwright's scroll_to_text to instantly find "Wyoming"
      3. Then use playwright's scroll_to_text in the product list to find "Product 25: Mount"
      Tell me step by step what you found and confirm both approaches worked efficiently.
    `);
    console.log('Complete workflow result:', completeWorkflowResult);

    console.log('\n✅ TEST SUMMARY');
    console.log('================');
    console.log('✓ Large scrolls (80-90): Should efficiently navigate between page sections');
    console.log('✓ Playwright scroll_to_text: Should instantly find text in UI elements');
    console.log('✓ Default scroll: Should use 90% viewport for efficient navigation');
    console.log('✓ Medium scrolls (21-79): Should provide standard navigation');
    
    console.log('\n📋 Expected Behavior:');
    console.log('• Large scrolls show ~90% new content with 10% overlap');
    console.log('• Playwright scroll_to_text instantly navigates to specific text');
    console.log('• LLM prioritizes playwright for finding text, falls back to regular scrolls');
    console.log('• Zero wasted scroll attempts when finding specific options');

    console.log('\n🎯 Manual Verification:');
    console.log('• Check that large scrolls move efficiently between colored sections');
    console.log('• Check that small scrolls work precisely within the state dropdown');
    console.log('• Check that small scrolls work precisely within the product list');
    console.log('• Verify no UI elements become unreachable due to scroll changes');
    
  } catch (error) {
    console.error('❌ Smart scrolling test failed:', error);
  } finally {
    console.log('\n🔍 Browser will remain open for manual inspection...');
    console.log('Press Ctrl+C when you\'re done examining the results.');
    
    // Keep browser open for manual inspection
    await new Promise(resolve => {
      process.on('SIGINT', () => {
        console.log('\n👋 Closing browser...');
        browser.close().then(resolve);
      });
    });
  }
}

// Run the test
testSmartScrolling().catch(console.error); 