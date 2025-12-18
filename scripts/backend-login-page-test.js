#!/usr/bin/env node

/**
 * Backend Login Page Comprehensive Testing Suite
 * 
 * Tests all aspects of the login page functionality including:
 * - Page loading and layout
 * - Form validation
 * - Authentication flow
 * - Error handling
 * - UI responsiveness
 */

const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

// Configuration
const BACKEND_BASE = 'http://localhost:3001';
const TEST_TIMEOUT = 10000;

// Test credentials
const VALID_CREDENTIALS = {
  email: 'admin@bookdress.io',
  password: 'Un1corn2024!'
};

const INVALID_CREDENTIALS = {
  email: 'invalid@test.com',
  password: 'wrongpassword'
};

// Test results tracking
const testResults = {
  passed: 0,
  failed: 0,
  total: 0,
  details: []
};

// Helper function to validate test results
function validateTest(testName, category, condition, message) {
  testResults.total++;
  
  if (condition) {
    testResults.passed++;
    console.log(`✅ ${testName}: PASSED`);
    testResults.details.push({
      name: testName,
      category,
      status: 'PASSED',
      message
    });
  } else {
    testResults.failed++;
    console.log(`❌ ${testName}: FAILED - ${message}`);
    testResults.details.push({
      name: testName,
      category,
      status: 'FAILED',
      message
    });
  }
}

// Helper function to wait for element
async function waitForElement(page, selector, timeout = 5000) {
  try {
    await page.waitForSelector(selector, { timeout });
    return true;
  } catch (error) {
    return false;
  }
}

// Helper function to take screenshot
async function takeScreenshot(page, name) {
  const screenshotPath = path.join(__dirname, 'screenshots', `login-${name}.png`);
  await page.screenshot({ path: screenshotPath, fullPage: true });
  console.log(`📸 Screenshot saved: ${screenshotPath}`);
}

// Test 1: Page Loading and Layout
async function testPageLoading(page) {
  console.log('\n🌐 === LOGIN PAGE LOADING ===');
  
  try {
    await page.goto(BACKEND_BASE, { waitUntil: 'domcontentloaded', timeout: TEST_TIMEOUT });
    
    // Check if page loads
    const pageLoaded = await page.evaluate(() => document.readyState === 'complete');
    await validateTest(
      'Page Loading',
      'loading',
      pageLoaded,
      'Login page should load completely'
    );
    
    // Wait for the signin component to be visible
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Check for login form
    const loginFormExists = await waitForElement(page, '.signin-form form, form', 5000);
    await validateTest(
      'Login Form Present',
      'layout',
      loginFormExists,
      'Login form should be present on the page'
    );

    // Check for email field
    const emailFieldExists = await waitForElement(page, 'input[name="email"]', 3000);
    await validateTest(
      'Email Field Present',
      'layout',
      emailFieldExists,
      'Email input field should be present'
    );

    // Check for password field
    const passwordFieldExists = await waitForElement(page, 'input[name="password"]', 3000);
    await validateTest(
      'Password Field Present',
      'layout',
      passwordFieldExists,
      'Password input field should be present'
    );

    // Check for submit button
    const submitButtonExists = await waitForElement(page, 'button[type="submit"].btn-primary', 3000);
    await validateTest(
      'Submit Button Present',
      'layout',
      submitButtonExists,
      'Submit button should be present'
    );
    
    // Take screenshot
    await takeScreenshot(page, 'initial-load');
    
  } catch (error) {
    await validateTest(
      'Page Loading',
      'loading',
      false,
      `Failed to load login page: ${error.message}`
    );
  }
}

// Test 2: Form Field Validation
async function testFormValidation(page) {
  console.log('\n📝 === FORM VALIDATION TESTING ===');
  
  try {
    // Test empty form submission
    const submitButton = await page.$('button[type="submit"].btn-primary');
    if (submitButton) {
      await submitButton.click();
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Check if form prevents submission or shows validation errors
      const currentUrl = page.url();
      const stillOnLoginPage = currentUrl.includes('localhost:3001') && !currentUrl.includes('dashboard');

      await validateTest(
        'Empty Form Validation',
        'validation',
        stillOnLoginPage,
        'Form should prevent submission when fields are empty'
      );
    }

    // Test invalid email format
    const emailField = await page.$('input[name="email"]');
    const passwordField = await page.$('input[name="password"]');
    
    if (emailField && passwordField) {
      await emailField.click({ clickCount: 3 });
      await emailField.type('invalid-email');
      await passwordField.click({ clickCount: 3 });
      await passwordField.type('somepassword');
      
      await submitButton.click();
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const stillOnLoginPageAfterInvalid = page.url().includes('localhost:3001') && !page.url().includes('dashboard');
      await validateTest(
        'Invalid Email Format Validation',
        'validation',
        stillOnLoginPageAfterInvalid,
        'Form should reject invalid email formats'
      );
    }
    
    // Take screenshot
    await takeScreenshot(page, 'validation-test');
    
  } catch (error) {
    await validateTest(
      'Form Validation',
      'validation',
      false,
      `Form validation test failed: ${error.message}`
    );
  }
}

// Test 3: Invalid Credentials
async function testInvalidCredentials(page) {
  console.log('\n🔒 === INVALID CREDENTIALS TESTING ===');
  
  try {
    const emailField = await page.$('input[name="email"]');
    const passwordField = await page.$('input[name="password"]');
    const submitButton = await page.$('button[type="submit"].btn-primary');
    
    if (emailField && passwordField && submitButton) {
      // Clear fields and enter invalid credentials
      await emailField.click({ clickCount: 3 });
      await emailField.type(INVALID_CREDENTIALS.email);
      await passwordField.click({ clickCount: 3 });
      await passwordField.type(INVALID_CREDENTIALS.password);
      
      await submitButton.click();
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Check if still on login page (authentication failed)
      const currentUrl = page.url();
      const authenticationFailed = currentUrl.includes('localhost:3001') && !currentUrl.includes('dashboard');
      
      await validateTest(
        'Invalid Credentials Rejection',
        'authentication',
        authenticationFailed,
        'Invalid credentials should be rejected'
      );
      
      // Check for error message
      const errorMessageExists = await waitForElement(page, '.error, .alert-danger, .error-message, [class*="error"]', 2000);
      await validateTest(
        'Error Message Display',
        'authentication',
        errorMessageExists,
        'Error message should be displayed for invalid credentials'
      );
    }
    
    // Take screenshot
    await takeScreenshot(page, 'invalid-credentials');
    
  } catch (error) {
    await validateTest(
      'Invalid Credentials Test',
      'authentication',
      false,
      `Invalid credentials test failed: ${error.message}`
    );
  }
}

// Test 4: Valid Credentials and Successful Login
async function testValidCredentials(page) {
  console.log('\n✅ === VALID CREDENTIALS TESTING ===');
  
  try {
    const emailField = await page.$('input[name="email"]');
    const passwordField = await page.$('input[name="password"]');
    const submitButton = await page.$('button[type="submit"].btn-primary');
    
    if (emailField && passwordField && submitButton) {
      // Clear fields and enter valid credentials
      await emailField.click({ clickCount: 3 });
      await emailField.type(VALID_CREDENTIALS.email);
      await passwordField.click({ clickCount: 3 });
      await passwordField.type(VALID_CREDENTIALS.password);
      
      await submitButton.click();
      
      // Wait for navigation
      try {
        await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 10000 });
      } catch (navError) {
        // Navigation might not trigger if it's a SPA
        await new Promise(resolve => setTimeout(resolve, 3000));
      }
      
      // Check if redirected to dashboard or main page
      const currentUrl = page.url();
      const loginSuccessful = !currentUrl.includes('login') || currentUrl.includes('dashboard') || currentUrl.includes('bookings');
      
      await validateTest(
        'Valid Credentials Authentication',
        'authentication',
        loginSuccessful,
        'Valid credentials should allow successful login'
      );
      
      // Check for dashboard elements
      const dashboardElementExists = await waitForElement(page, '.dashboard, .bookings, .main-content, nav, .navigation', 5000);
      await validateTest(
        'Dashboard Access',
        'authentication',
        dashboardElementExists,
        'Should have access to dashboard after successful login'
      );
    }
    
    // Take screenshot
    await takeScreenshot(page, 'successful-login');
    
  } catch (error) {
    await validateTest(
      'Valid Credentials Test',
      'authentication',
      false,
      `Valid credentials test failed: ${error.message}`
    );
  }
}

// Test 5: UI Responsiveness
async function testResponsiveness(page) {
  console.log('\n📱 === RESPONSIVENESS TESTING ===');
  
  try {
    // Test mobile viewport
    await page.setViewport({ width: 375, height: 667 });
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const mobileFormVisible = await waitForElement(page, 'form', 2000);
    await validateTest(
      'Mobile Responsiveness',
      'responsiveness',
      mobileFormVisible,
      'Login form should be visible on mobile viewport'
    );
    
    // Take mobile screenshot
    await takeScreenshot(page, 'mobile-view');
    
    // Test tablet viewport
    await page.setViewport({ width: 768, height: 1024 });
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const tabletFormVisible = await waitForElement(page, 'form', 2000);
    await validateTest(
      'Tablet Responsiveness',
      'responsiveness',
      tabletFormVisible,
      'Login form should be visible on tablet viewport'
    );
    
    // Take tablet screenshot
    await takeScreenshot(page, 'tablet-view');
    
    // Reset to desktop viewport
    await page.setViewport({ width: 1280, height: 720 });
    
  } catch (error) {
    await validateTest(
      'Responsiveness Test',
      'responsiveness',
      false,
      `Responsiveness test failed: ${error.message}`
    );
  }
}

// Generate test report
function generateReport() {
  console.log('\n📋 === LOGIN PAGE TEST REPORT ===');
  console.log(`Total Tests: ${testResults.total}`);
  console.log(`Passed: ${testResults.passed}`);
  console.log(`Failed: ${testResults.failed}`);
  console.log(`Success Rate: ${((testResults.passed / testResults.total) * 100).toFixed(2)}%`);
  
  // Group by category
  const categories = {};
  testResults.details.forEach(test => {
    if (!categories[test.category]) {
      categories[test.category] = { passed: 0, failed: 0, total: 0 };
    }
    categories[test.category].total++;
    if (test.status === 'PASSED') {
      categories[test.category].passed++;
    } else {
      categories[test.category].failed++;
    }
  });
  
  console.log('\n📊 Results by Category:');
  Object.entries(categories).forEach(([category, stats]) => {
    const rate = ((stats.passed / stats.total) * 100).toFixed(2);
    console.log(`  ${category}: ${stats.passed}/${stats.total} (${rate}%)`);
  });
  
  // Save detailed report
  const reportPath = path.join(__dirname, 'login-page-test-report.json');
  fs.writeFileSync(reportPath, JSON.stringify({
    timestamp: new Date().toISOString(),
    page: 'Login Page',
    summary: {
      total: testResults.total,
      passed: testResults.passed,
      failed: testResults.failed,
      successRate: (testResults.passed / testResults.total) * 100
    },
    categories,
    details: testResults.details
  }, null, 2));
  
  console.log(`\n📄 Detailed report saved to: ${reportPath}`);
  
  if (testResults.failed > 0) {
    console.log('\n❌ FAILED TESTS:');
    testResults.details
      .filter(test => test.status === 'FAILED')
      .forEach(test => {
        console.log(`  - ${test.name}: ${test.message}`);
      });
  }
}

// Main test execution
async function runLoginPageTests() {
  console.log('🚀 Starting Backend Login Page Comprehensive Tests');
  console.log('==================================================');
  
  // Create screenshots directory
  const screenshotsDir = path.join(__dirname, 'screenshots');
  if (!fs.existsSync(screenshotsDir)) {
    fs.mkdirSync(screenshotsDir, { recursive: true });
  }
  
  let browser;
  let page;
  
  try {
    // Launch browser
    browser = await puppeteer.launch({
      headless: true, // Use headless mode for faster testing
      defaultViewport: { width: 1280, height: 720 },
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
    });
    
    page = await browser.newPage();
    page.setDefaultTimeout(TEST_TIMEOUT);
    
    // Run all test suites
    await testPageLoading(page);
    await testFormValidation(page);
    await testInvalidCredentials(page);
    await testValidCredentials(page);
    await testResponsiveness(page);
    
    // Generate final report
    generateReport();
    
    console.log('\n🎉 Login Page Testing Complete!');
    
  } catch (error) {
    console.error('\n💥 Test execution failed:', error);
    testResults.failed++;
  } finally {
    if (browser) {
      await browser.close();
    }
    
    // Exit with appropriate code
    process.exit(testResults.failed > 0 ? 1 : 0);
  }
}

// Run tests if this script is executed directly
if (require.main === module) {
  runLoginPageTests();
}

module.exports = { runLoginPageTests };
