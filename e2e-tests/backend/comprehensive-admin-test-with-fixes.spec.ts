import { test, expect } from '@playwright/test';

/**
 * Comprehensive Backend E2E Test with Admin Login and Issue Fixing
 * This test logs in as admin and systematically tests each page,
 * identifying and documenting issues for immediate fixing.
 */

test.describe('Comprehensive Backend Admin Test with Issue Fixing', () => {
  
  // Global variables to track issues
  let globalIssues = [];
  let testResults = {
    passed: [],
    failed: [],
    issues: []
  };

  test.beforeEach(async ({ page }) => {
    // Set longer timeout for login
    page.setDefaultTimeout(60000);

    // Login as admin before each test
    console.log('🔐 Logging in as admin...');

    try {
      await page.goto('http://localhost:3001/sign-in?lang=ar', { timeout: 30000 });
      await page.waitForLoadState('networkidle', { timeout: 30000 });
      await page.waitForSelector('form', { timeout: 15000 });

      // Fill admin credentials
      await page.fill('input[name="email"]', 'admin@bookdress.com');
      await page.fill('input[name="password"]', 'admin123');

      // Submit login
      await page.click('button[type="submit"]');
      await page.waitForTimeout(5000);

      // Verify login success with retry
      let loginSuccess = false;
      for (let i = 0; i < 3; i++) {
        const currentUrl = page.url();
        if (!currentUrl.includes('/sign-in')) {
          loginSuccess = true;
          break;
        }
        await page.waitForTimeout(2000);
      }

      if (!loginSuccess) {
        throw new Error('❌ Admin login failed - still on login page after retries');
      }

      console.log('✅ Admin login successful');
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  });

  // Helper function to test a page and identify issues
  async function testPageWithIssueDetection(page, pageInfo) {
    const issues = [];
    const pageResult = {
      name: pageInfo.name,
      path: pageInfo.path,
      category: pageInfo.category,
      status: 'unknown',
      issues: [],
      elements: {},
      performance: {}
    };

    try {
      console.log(`\n📄 Testing: ${pageInfo.name} (${pageInfo.path})`);

      // Navigate to page with timeout handling
      const startTime = Date.now();
      try {
        await page.goto(`http://localhost:3001${pageInfo.path}?lang=ar`, { timeout: 30000 });
        await page.waitForLoadState('networkidle', { timeout: 20000 });
        await page.waitForTimeout(3000);
      } catch (navError: any) {
        console.warn(`Navigation warning for ${pageInfo.path}:`, navError.message);
        // Continue with testing even if navigation has issues
      }
      const loadTime = Date.now() - startTime;
      
      pageResult.performance.loadTime = loadTime;
      
      // Check for basic page accessibility
      const pageContent = await page.textContent('body');
      const contentLength = pageContent?.length || 0;
      
      // Issue Detection 1: Page not loading properly
      if (contentLength < 100) {
        issues.push({
          type: 'PAGE_LOAD',
          severity: 'HIGH',
          description: `Page content too short (${contentLength} chars)`,
          fix: 'Check if page component is rendering correctly'
        });
      }
      
      // Issue Detection 2: Error messages on page
      const errorSelectors = [
        '.error',
        '.MuiAlert-standardError',
        '[role="alert"]',
        '.error-message',
        '.MuiFormHelperText-error'
      ];
      
      for (const selector of errorSelectors) {
        const errorElements = await page.locator(selector).count();
        if (errorElements > 0) {
          const errorText = await page.locator(selector).first().textContent();
          issues.push({
            type: 'ERROR_MESSAGE',
            severity: 'HIGH',
            description: `Error message found: ${errorText}`,
            fix: 'Investigate and fix the underlying error'
          });
        }
      }
      
      // Issue Detection 3: Missing expected content
      const hasExpectedContent = pageInfo.expected?.some(expected => 
        pageContent?.includes(expected)
      );
      
      if (pageInfo.expected && !hasExpectedContent) {
        issues.push({
          type: 'MISSING_CONTENT',
          severity: 'MEDIUM',
          description: `Expected content not found: ${pageInfo.expected.join(', ')}`,
          fix: 'Check if page is loading correct content and translations'
        });
      }
      
      // Issue Detection 4: UI Elements availability
      const uiElements = {
        dataGrid: await page.locator('.MuiDataGrid-root').isVisible(),
        addButton: await page.locator('[data-testid*="new-"], [id*="new-"], button:has-text("جديد"), button:has-text("New")').first().isVisible(),
        searchInput: await page.locator('input[type="search"], input[placeholder*="بحث"], input[placeholder*="search"]').isVisible(),
        form: await page.locator('form').isVisible(),
        navigation: await page.locator('nav, .MuiDrawer-root').isVisible(),
        loading: await page.locator('.MuiCircularProgress-root, .loading').isVisible()
      };
      
      pageResult.elements = uiElements;
      
      // Issue Detection 5: Performance issues
      if (loadTime > 5000) {
        issues.push({
          type: 'PERFORMANCE',
          severity: 'MEDIUM',
          description: `Slow page load time: ${loadTime}ms`,
          fix: 'Optimize page loading, check for unnecessary API calls'
        });
      }
      
      // Issue Detection 6: Console errors
      const consoleErrors = [];
      page.on('console', msg => {
        if (msg.type() === 'error') {
          consoleErrors.push(msg.text());
        }
      });
      
      if (consoleErrors.length > 0) {
        issues.push({
          type: 'CONSOLE_ERROR',
          severity: 'HIGH',
          description: `Console errors: ${consoleErrors.join(', ')}`,
          fix: 'Fix JavaScript errors in browser console'
        });
      }
      
      // Issue Detection 7: Network failures
      const failedRequests = [];
      page.on('response', response => {
        if (response.status() >= 400) {
          failedRequests.push(`${response.status()} ${response.url()}`);
        }
      });
      
      if (failedRequests.length > 0) {
        issues.push({
          type: 'NETWORK_ERROR',
          severity: 'HIGH',
          description: `Failed requests: ${failedRequests.join(', ')}`,
          fix: 'Check API endpoints and server connectivity'
        });
      }
      
      // Determine page status
      if (issues.filter(i => i.severity === 'HIGH').length > 0) {
        pageResult.status = 'FAILED';
      } else if (issues.length > 0) {
        pageResult.status = 'WARNING';
      } else {
        pageResult.status = 'PASSED';
      }
      
      pageResult.issues = issues;
      
      // Log results
      console.log(`   Status: ${pageResult.status}`);
      console.log(`   Load time: ${loadTime}ms`);
      console.log(`   Content length: ${contentLength} chars`);
      console.log(`   Issues found: ${issues.length}`);
      
      if (issues.length > 0) {
        console.log('   🔍 Issues detected:');
        issues.forEach((issue, index) => {
          console.log(`     ${index + 1}. [${issue.severity}] ${issue.type}: ${issue.description}`);
        });
      }
      
      return pageResult;
      
    } catch (error) {
      pageResult.status = 'ERROR';
      pageResult.issues.push({
        type: 'EXCEPTION',
        severity: 'HIGH',
        description: error.message,
        fix: 'Debug the exception and fix the underlying issue'
      });
      
      console.log(`   ❌ ERROR: ${error.message}`);
      return pageResult;
    }
  }

  test('should test all backend pages with admin login and identify issues', async ({ page }) => {
    console.log('🚀 Starting comprehensive backend testing with admin login...');
    
    // Complete list of backend pages to test
    const backendPages = [
      // Core Pages
      { path: '/', name: 'Bookings Dashboard', expected: ['حجز جديد', 'New Booking'], category: 'Core' },
      { path: '/dashboard', name: 'Admin Dashboard', expected: ['لوحة التحكم', 'Dashboard'], category: 'Core' },
      
      // Management Pages
      { path: '/suppliers', name: 'Suppliers Management', expected: ['مورد جديد', 'New Supplier'], category: 'Management' },
      { path: '/locations', name: 'Locations Management', expected: ['موقع جديد', 'New Location'], category: 'Management' },
      { path: '/dresses', name: 'Dresses Management', expected: ['فستان جديد', 'New Dress'], category: 'Management' },
      { path: '/users', name: 'Users Management', expected: ['مستخدم جديد', 'New User'], category: 'Management' },
      
      // Creation Pages
      { path: '/create-booking', name: 'Create Booking', expected: ['Customer Information', 'معلومات العميل'], category: 'Creation' },
      { path: '/create-dress', name: 'Create Dress', expected: ['Create', 'إنشاء'], category: 'Creation' },
      { path: '/create-user', name: 'Create User', expected: ['Create', 'إنشاء'], category: 'Creation' },
      { path: '/create-supplier', name: 'Create Supplier', expected: ['Create', 'إنشاء'], category: 'Creation' },
      { path: '/create-location', name: 'Create Location', expected: ['Create', 'إنشاء'], category: 'Creation' }
    ];
    
    console.log(`📋 Testing ${backendPages.length} backend pages...`);
    
    // Test each page
    for (const pageInfo of backendPages) {
      const result = await testPageWithIssueDetection(page, pageInfo);
      
      if (result.status === 'PASSED') {
        testResults.passed.push(result);
      } else {
        testResults.failed.push(result);
      }
      
      // Collect all issues
      testResults.issues.push(...result.issues);
      globalIssues.push(...result.issues);
    }
    
    // Generate comprehensive report
    console.log('\n📊 COMPREHENSIVE TEST RESULTS');
    console.log('=' * 80);
    console.log(`✅ Passed: ${testResults.passed.length}/${backendPages.length}`);
    console.log(`❌ Failed: ${testResults.failed.length}/${backendPages.length}`);
    console.log(`⚠️ Total Issues: ${testResults.issues.length}`);
    
    // Group issues by type and severity
    const issuesByType = {};
    const issuesBySeverity = { HIGH: [], MEDIUM: [], LOW: [] };
    
    testResults.issues.forEach(issue => {
      if (!issuesByType[issue.type]) {
        issuesByType[issue.type] = [];
      }
      issuesByType[issue.type].push(issue);
      issuesBySeverity[issue.severity].push(issue);
    });
    
    console.log('\n🔍 ISSUES BY SEVERITY:');
    Object.keys(issuesBySeverity).forEach(severity => {
      const issues = issuesBySeverity[severity];
      if (issues.length > 0) {
        console.log(`${severity}: ${issues.length} issues`);
        issues.forEach((issue, index) => {
          console.log(`  ${index + 1}. ${issue.type}: ${issue.description}`);
          console.log(`     💡 Fix: ${issue.fix}`);
        });
      }
    });
    
    console.log('\n🔧 IMMEDIATE FIXES NEEDED:');
    const highPriorityIssues = issuesBySeverity.HIGH;
    if (highPriorityIssues.length > 0) {
      highPriorityIssues.forEach((issue, index) => {
        console.log(`${index + 1}. [URGENT] ${issue.type}: ${issue.description}`);
        console.log(`   🛠️ Action: ${issue.fix}`);
      });
    } else {
      console.log('✅ No high-priority issues found!');
    }
    
    // Test should pass if we have more passed than failed pages
    expect(testResults.passed.length).toBeGreaterThan(testResults.failed.length);
  });
});
