import { chromium } from 'playwright';
import { z } from 'zod';
import { ComputerUseAgent } from '../index';

async function signalsExample(): Promise<void> {
  const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
  if (!ANTHROPIC_API_KEY) {
    throw new Error('ANTHROPIC_API_KEY environment variable is required');
  }
  
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  await page.goto("https://news.ycombinator.com/");
  
  try {
    console.log('\n=== Signals Control Example ===');
    const agent = new ComputerUseAgent({
      apiKey: ANTHROPIC_API_KEY,
      page,
    });

    // Set up signal event listeners BEFORE starting execution
    agent.controller.on('onPause', ({ at, step }) => {
      console.log(`🟡 Agent paused at step ${step} (${at.toISOString()})`);
    });

    agent.controller.on('onResume', ({ at, step }) => {
      console.log(`🟢 Agent resumed at step ${step} (${at.toISOString()})`);
    });

    agent.controller.on('onCancel', ({ at, step, reason }) => {
      console.log(`🔴 Agent cancelled at step ${step} (${at.toISOString()})${reason ? `: ${reason}` : ''}`);
    });

    agent.controller.on('onError', ({ at, step, error }) => {
      console.log(`❌ Agent error at step ${step} (${at.toISOString()}):`, error);
    });

    // Auto-pause after 5 seconds for demonstration
    setTimeout(() => {
      console.log('⏸️ Triggering pause signal...');
      agent.controller.signal('pause');
    }, 5000);

    // Auto-resume after 8 seconds
    setTimeout(() => {
      console.log('▶️ Triggering resume signal...');
      agent.controller.signal('resume');
    }, 8000);

    // Auto-cancel after 15 seconds if still running
    setTimeout(() => {
      console.log('🛑 Triggering cancel signal...');
      agent.controller.signal('cancel');
    }, 15000);

    console.log('Starting agent execution...');
    
    // Start a long-running task
    const result = await agent.execute(
      'Get the titles of the top 10 stories on this page and describe each one briefly'
    );
    
    console.log('✅ Agent completed successfully!');
    console.log('Result:', result);
    
  } catch (error) {
    console.error('❌ Agent execution failed:', error);
  } finally {
    await browser.close();
  }
}

async function manualControlExample(): Promise<void> {
  const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
  if (!ANTHROPIC_API_KEY) {
    throw new Error('ANTHROPIC_API_KEY environment variable is required');
  }
  
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  await page.goto("https://news.ycombinator.com/");
  
  try {
    console.log('\n=== Manual Control Example ===');
    console.log('This example shows how you can control the agent from external code');
    
    const agent = new ComputerUseAgent({
      apiKey: ANTHROPIC_API_KEY,
      page,
    });

    // Set up listeners
    agent.controller.on('onPause', () => {
      console.log('Agent is now paused. You can inspect the page state.');
      console.log('Call agent.controller.signal("resume") to continue.');
    });

    agent.controller.on('onResume', () => {
      console.log('Agent execution resumed.');
    });

    // You could pause from anywhere in your code:
    // agent.controller.signal('pause');
    
    // Or from a different async context:
    // setTimeout(() => agent.controller.signal('pause'), 3000);
    
    // Or trigger based on external events:
    // process.on('SIGUSR1', () => agent.controller.signal('pause'));
    
    console.log('Starting analysis task...');
    const result = await agent.execute(
      'Find the story with the most comments on this page and tell me what it is about'
    );
    
    console.log('Analysis result:', result);
    
  } catch (error) {
    console.error('Error in manual control example:', error);
  } finally {
    await browser.close();
  }
}

async function structuredDataWithSignals(): Promise<void> {
  const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
  if (!ANTHROPIC_API_KEY) {
    throw new Error('ANTHROPIC_API_KEY environment variable is required');
  }
  
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  await page.goto("https://news.ycombinator.com/");
  
  try {
    console.log('\n=== Structured Data with Signals Example ===');
    
    const agent = new ComputerUseAgent({
      apiKey: ANTHROPIC_API_KEY,
      page,
    });

    // Set up a watchdog that cancels if it takes too long
    const watchdog = setTimeout(() => {
      console.log('⏰ Watchdog timeout - cancelling agent');
      agent.controller.signal('cancel');
    }, 30000); // 30 second timeout

    agent.controller.on('onCancel', () => {
      clearTimeout(watchdog);
    });

    // Define schema for structured response
    const StoriesSchema = z.array(z.object({
      title: z.string(),
      points: z.number(),
      author: z.string(),
      comments: z.number(),
    })).max(5);

    console.log('Extracting structured story data...');
    
    const stories = await agent.execute(
      'Get the top 5 stories with their titles, points, authors, and comment counts',
      StoriesSchema
    );
    
    clearTimeout(watchdog);
    console.log('✅ Structured data extraction completed!');
    console.log('Stories:', JSON.stringify(stories, null, 2));
    
  } catch (error) {
    console.error('Error in structured data example:', error);
  } finally {
    await browser.close();
  }
}

// Export all examples for individual testing
export {
  signalsExample,
  manualControlExample,
  structuredDataWithSignals,
};

// Run all examples
async function runSignalsExamples(): Promise<void> {
  console.log('🚀 Running Agent Signals Examples...\n');
  
  try {
    await signalsExample();
    console.log('\n' + '='.repeat(50) + '\n');
    
    await manualControlExample();
    console.log('\n' + '='.repeat(50) + '\n');
    
    await structuredDataWithSignals();
    
  } catch (error) {
    console.error('Failed to run examples:', error);
  }
  
  console.log('\n✅ All signals examples completed!');
}

// Run if called directly
runSignalsExamples().catch(console.error);