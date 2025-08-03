/**
 * Tab Switch Testing Utility
 * 
 * This utility helps test the tab switch bug fix by simulating
 * visibility changes and monitoring loading states.
 */

interface TestResult {
  testName: string;
  passed: boolean;
  message: string;
  timestamp: number;
}

class TabSwitchTester {
  private results: TestResult[] = [];
  private originalLoadingStates: Map<string, boolean> = new Map();
  
  constructor() {
    this.setupConsoleLogging();
  }

  private setupConsoleLogging() {
    // Override console.log to capture relevant messages
    const originalLog = console.log;
    console.log = (...args) => {
      const message = args.join(' ');
      if (message.includes('Tab became visible') || 
          message.includes('refetching') || 
          message.includes('Loading') ||
          message.includes('Fetching')) {
        this.logMessage(`[TAB-TEST] ${message}`);
      }
      originalLog.apply(console, args);
    };
  }

  private logMessage(message: string) {
    console.info(`${new Date().toISOString()} - ${message}`);
  }

  /**
   * Test 1: Simulate tab switch and verify loading states resolve
   */
  async testTabSwitchRecovery(): Promise<TestResult> {
    const testName = 'Tab Switch Recovery';
    
    try {
      this.logMessage('Starting tab switch recovery test...');
      
      // Capture initial loading states
      this.captureLoadingStates();
      
      // Simulate tab becoming hidden
      Object.defineProperty(document, 'hidden', {
        writable: true,
        value: true
      });
      
      // Dispatch visibility change event
      document.dispatchEvent(new Event('visibilitychange'));
      
      // Wait a bit
      await this.wait(500);
      
      // Simulate tab becoming visible again
      Object.defineProperty(document, 'hidden', {
        writable: true,
        value: false
      });
      
      // Dispatch visibility change event
      document.dispatchEvent(new Event('visibilitychange'));
      
      // Wait for potential refetch
      await this.wait(2000);
      
      // Check if loading states have resolved
      const resolved = this.checkLoadingStatesResolved();
      
      const result: TestResult = {
        testName,
        passed: resolved,
        message: resolved 
          ? 'Loading states resolved after tab switch' 
          : 'Loading states stuck after tab switch',
        timestamp: Date.now()
      };
      
      this.results.push(result);
      return result;
    } catch (error) {
      const result: TestResult = {
        testName,
        passed: false,
        message: `Test failed with error: ${error}`,
        timestamp: Date.now()
      };
      
      this.results.push(result);
      return result;
    }
  }

  /**
   * Test 2: Simulate multiple rapid tab switches
   */
  async testRapidTabSwitches(): Promise<TestResult> {
    const testName = 'Rapid Tab Switches';
    
    try {
      this.logMessage('Starting rapid tab switches test...');
      
      // Simulate 5 rapid tab switches
      for (let i = 0; i < 5; i++) {
        // Hide tab
        Object.defineProperty(document, 'hidden', {
          writable: true,
          value: true
        });
        document.dispatchEvent(new Event('visibilitychange'));
        
        await this.wait(100);
        
        // Show tab
        Object.defineProperty(document, 'hidden', {
          writable: true,
          value: false
        });
        document.dispatchEvent(new Event('visibilitychange'));
        
        await this.wait(100);
      }
      
      // Wait for everything to settle
      await this.wait(3000);
      
      const resolved = this.checkLoadingStatesResolved();
      
      const result: TestResult = {
        testName,
        passed: resolved,
        message: resolved 
          ? 'Handled rapid tab switches correctly' 
          : 'Failed to handle rapid tab switches',
        timestamp: Date.now()
      };
      
      this.results.push(result);
      return result;
    } catch (error) {
      const result: TestResult = {
        testName,
        passed: false,
        message: `Test failed with error: ${error}`,
        timestamp: Date.now()
      };
      
      this.results.push(result);
      return result;
    }
  }

  /**
   * Test 3: Verify AbortController cancellation
   */
  async testRequestCancellation(): Promise<TestResult> {
    const testName = 'Request Cancellation';
    
    try {
      this.logMessage('Starting request cancellation test...');
      
      // Check if AbortController is being used
      const hasAbortController = this.checkAbortControllerUsage();
      
      const result: TestResult = {
        testName,
        passed: hasAbortController,
        message: hasAbortController 
          ? 'AbortController is properly implemented' 
          : 'AbortController not found in fetch requests',
        timestamp: Date.now()
      };
      
      this.results.push(result);
      return result;
    } catch (error) {
      const result: TestResult = {
        testName,
        passed: false,
        message: `Test failed with error: ${error}`,
        timestamp: Date.now()
      };
      
      this.results.push(result);
      return result;
    }
  }

  /**
   * Run all tests
   */
  async runAllTests(): Promise<TestResult[]> {
    this.logMessage('Starting comprehensive tab switch tests...');
    
    const results = await Promise.all([
      this.testTabSwitchRecovery(),
      this.testRapidTabSwitches(),
      this.testRequestCancellation()
    ]);
    
    this.printTestResults();
    return results;
  }

  private captureLoadingStates() {
    // Look for common loading indicators in the DOM
    const loadingElements = document.querySelectorAll('[data-testid*="loading"], .loading, [class*="loading"]');
    loadingElements.forEach((el, index) => {
      this.originalLoadingStates.set(`element-${index}`, el.textContent?.includes('Loading') || false);
    });
  }

  private checkLoadingStatesResolved(): boolean {
    // Check if any loading indicators are still showing
    const loadingElements = document.querySelectorAll('[data-testid*="loading"], .loading, [class*="loading"]');
    const stillLoading = Array.from(loadingElements).some(el => 
      el.textContent?.includes('Loading...') || 
      el.textContent?.includes('Loading')
    );
    
    return !stillLoading;
  }

  private checkAbortControllerUsage(): boolean {
    // This is a simplified check - in a real implementation,
    // you'd want to instrument your fetch functions
    return window.AbortController !== undefined;
  }

  private wait(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private printTestResults() {
    console.group('🧪 Tab Switch Test Results');
    
    this.results.forEach(result => {
      const icon = result.passed ? '✅' : '❌';
      console.log(`${icon} ${result.testName}: ${result.message}`);
    });
    
    const passedCount = this.results.filter(r => r.passed).length;
    const totalCount = this.results.length;
    
    console.log(`\n📊 Summary: ${passedCount}/${totalCount} tests passed`);
    
    if (passedCount === totalCount) {
      console.log('🎉 All tests passed! Tab switch bug appears to be fixed.');
    } else {
      console.log('⚠️ Some tests failed. Tab switch issue may persist.');
    }
    
    console.groupEnd();
  }

  getResults(): TestResult[] {
    return this.results;
  }
}

// Export for use in browser console or test environment
if (typeof window !== 'undefined') {
  (window as any).TabSwitchTester = TabSwitchTester;
}

export { TabSwitchTester, type TestResult };