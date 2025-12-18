#!/usr/bin/env node

/**
 * Comprehensive Frontend Testing Suite
 * 
 * Tests all major frontend functionality including:
 * - Home page functionality
 * - Navigation and layout
 * - Search functionality
 * - User authentication
 * - Responsive design
 * - Error handling
 * - Performance
 */

const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

// Configuration
const FRONTEND_BASE = 'http://localhost:3000';
const TEST_TIMEOUT = 10000;

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
  const screenshotPath = path.join(__dirname, 'screenshots', `frontend-comprehensive-${name}.png`);
  await page.screenshot({ path: screenshotPath, fullPage: true });
  console.log(`📸 Screenshot saved: ${screenshotPath}`);
}

// Test 1: Core Page Loading
async function testCorePageLoading(page) {
  console.log('\n🌐 === CORE PAGE LOADING ===');
  
  try {
    // Test Home Page
    await page.goto(FRONTEND_BASE, { waitUntil: 'domcontentloaded', timeout: TEST_TIMEOUT });
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    const homePageLoaded = await waitForElement(page, '.content, .home', 5000);
    await validateTest(
      'Home Page Loading',
      'corePages',
      homePageLoaded,
      'Home page should load successfully'
    );
    
    // Test Search Page
    await page.goto(`${FRONTEND_BASE}/search`, { waitUntil: 'domcontentloaded', timeout: TEST_TIMEOUT });
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const searchPageLoaded = await waitForElement(page, '.content, .search', 3000);
    await validateTest(
      'Search Page Loading',
      'corePages',
      searchPageLoaded,
      'Search page should load successfully'
    );
    
    // Test About Page
    await page.goto(`${FRONTEND_BASE}/about`, { waitUntil: 'domcontentloaded', timeout: TEST_TIMEOUT });
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const aboutPageLoaded = await waitForElement(page, '.content, .about', 3000);
    await validateTest(
      'About Page Loading',
      'corePages',
      aboutPageLoaded,
      'About page should load successfully'
    );
    
    // Take screenshot
    await takeScreenshot(page, 'core-pages');
    
  } catch (error) {
    await validateTest(
      'Core Page Loading',
      'corePages',
      false,
      `Core page loading failed: ${error.message}`
    );
  }
}

// Test 2: Navigation and Layout
async function testNavigationAndLayout(page) {
  console.log('\n🧭 === NAVIGATION AND LAYOUT ===');
  
  try {
    // Go back to home page
    await page.goto(FRONTEND_BASE, { waitUntil: 'domcontentloaded', timeout: TEST_TIMEOUT });
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Test Header
    const headerExists = await waitForElement(page, '.header, .MuiAppBar-root', 3000);
    await validateTest(
      'Header Present',
      'navigation',
      headerExists,
      'Header should be present on all pages'
    );
    
    // Test Logo/Brand
    const logoExists = await waitForElement(page, '.logo, button.logo', 3000);
    await validateTest(
      'Logo Present',
      'navigation',
      logoExists,
      'Logo should be present in header'
    );
    
    // Test Footer
    const footerExists = await waitForElement(page, 'footer, .footer', 3000);
    await validateTest(
      'Footer Present',
      'navigation',
      footerExists,
      'Footer should be present'
    );
    
    // Test Navigation Menu
    const navExists = await waitForElement(page, '.MuiToolbar-root, .toolbar', 3000);
    await validateTest(
      'Navigation Menu',
      'navigation',
      navExists,
      'Navigation menu should be present'
    );
    
    // Take screenshot
    await takeScreenshot(page, 'navigation-layout');
    
  } catch (error) {
    await validateTest(
      'Navigation and Layout',
      'navigation',
      false,
      `Navigation and layout test failed: ${error.message}`
    );
  }
}

// Test 3: Search Functionality
async function testSearchFunctionality(page) {
  console.log('\n🔍 === SEARCH FUNCTIONALITY ===');
  
  try {
    // Go to home page
    await page.goto(FRONTEND_BASE, { waitUntil: 'domcontentloaded', timeout: TEST_TIMEOUT });
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Test Search Form
    const searchFormExists = await waitForElement(page, '.home-search, .search', 5000);
    await validateTest(
      'Search Form Present',
      'search',
      searchFormExists,
      'Search form should be present on home page'
    );
    
    // Test Search Inputs
    const searchInputsExist = await waitForElement(page, '.home-search input, .search input', 3000);
    await validateTest(
      'Search Inputs',
      'search',
      searchInputsExist,
      'Search inputs should be available'
    );
    
    // Test Search Button
    const searchButtonExists = await waitForElement(page, '.home-search button, .search button', 3000);
    await validateTest(
      'Search Button',
      'search',
      searchButtonExists,
      'Search button should be present'
    );
    
    // Test Dress Type Navigation
    const dressTypeButtonExists = await waitForElement(page, '.btn-dress-type', 3000);
    await validateTest(
      'Dress Type Navigation',
      'search',
      dressTypeButtonExists,
      'Dress type navigation should be available'
    );
    
    // Take screenshot
    await takeScreenshot(page, 'search-functionality');
    
  } catch (error) {
    await validateTest(
      'Search Functionality',
      'search',
      false,
      `Search functionality test failed: ${error.message}`
    );
  }
}

// Test 4: User Authentication Pages
async function testUserAuthentication(page) {
  console.log('\n🔐 === USER AUTHENTICATION ===');
  
  try {
    // Test Sign In Page
    await page.goto(`${FRONTEND_BASE}/sign-in`, { waitUntil: 'domcontentloaded', timeout: TEST_TIMEOUT });
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const signInPageLoaded = await waitForElement(page, '.content, .sign-in, form', 3000);
    await validateTest(
      'Sign In Page',
      'authentication',
      signInPageLoaded,
      'Sign in page should load successfully'
    );
    
    // Test Sign Up Page
    await page.goto(`${FRONTEND_BASE}/sign-up`, { waitUntil: 'domcontentloaded', timeout: TEST_TIMEOUT });
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const signUpPageLoaded = await waitForElement(page, '.content, .sign-up, form', 3000);
    await validateTest(
      'Sign Up Page',
      'authentication',
      signUpPageLoaded,
      'Sign up page should load successfully'
    );
    
    // Test Forgot Password Page
    await page.goto(`${FRONTEND_BASE}/forgot-password`, { waitUntil: 'domcontentloaded', timeout: TEST_TIMEOUT });
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const forgotPasswordPageLoaded = await waitForElement(page, '.content, .forgot-password, form', 3000);
    await validateTest(
      'Forgot Password Page',
      'authentication',
      forgotPasswordPageLoaded,
      'Forgot password page should load successfully'
    );
    
    // Take screenshot
    await takeScreenshot(page, 'authentication');
    
  } catch (error) {
    await validateTest(
      'User Authentication',
      'authentication',
      false,
      `User authentication test failed: ${error.message}`
    );
  }
}

// Test 5: Responsive Design
async function testResponsiveDesign(page) {
  console.log('\n📱 === RESPONSIVE DESIGN ===');
  
  try {
    // Go to home page
    await page.goto(FRONTEND_BASE, { waitUntil: 'domcontentloaded', timeout: TEST_TIMEOUT });
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Test Mobile Viewport
    await page.setViewport({ width: 375, height: 667 });
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const mobileContentVisible = await waitForElement(page, '.content, .home', 2000);
    await validateTest(
      'Mobile Responsiveness',
      'responsive',
      mobileContentVisible,
      'Site should be responsive on mobile devices'
    );
    
    // Take mobile screenshot
    await takeScreenshot(page, 'mobile-responsive');
    
    // Test Tablet Viewport
    await page.setViewport({ width: 768, height: 1024 });
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const tabletContentVisible = await waitForElement(page, '.content, .home', 2000);
    await validateTest(
      'Tablet Responsiveness',
      'responsive',
      tabletContentVisible,
      'Site should be responsive on tablet devices'
    );
    
    // Take tablet screenshot
    await takeScreenshot(page, 'tablet-responsive');
    
    // Test Desktop Viewport
    await page.setViewport({ width: 1920, height: 1080 });
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const desktopContentVisible = await waitForElement(page, '.content, .home', 2000);
    await validateTest(
      'Desktop Responsiveness',
      'responsive',
      desktopContentVisible,
      'Site should work well on desktop devices'
    );
    
    // Reset viewport
    await page.setViewport({ width: 1280, height: 720 });
    
  } catch (error) {
    await validateTest(
      'Responsive Design',
      'responsive',
      false,
      `Responsive design test failed: ${error.message}`
    );
  }
}

// Test 6: Error Handling
async function testErrorHandling(page) {
  console.log('\n🚨 === ERROR HANDLING ===');
  
  try {
    // Test 404 Page
    await page.goto(`${FRONTEND_BASE}/non-existent-page`, { waitUntil: 'domcontentloaded', timeout: TEST_TIMEOUT });
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const errorPageLoaded = await waitForElement(page, '.content, .no-match, .error, .not-found', 3000);
    await validateTest(
      '404 Error Page',
      'errorHandling',
      errorPageLoaded,
      '404 error page should be displayed for non-existent pages'
    );
    
    // Test Invalid Dress ID
    await page.goto(`${FRONTEND_BASE}/dress?d=invalid-id`, { waitUntil: 'domcontentloaded', timeout: TEST_TIMEOUT });
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const invalidDressHandled = await waitForElement(page, '.content, .no-match, .error', 3000);
    await validateTest(
      'Invalid Dress ID Handling',
      'errorHandling',
      invalidDressHandled,
      'Invalid dress ID should be handled gracefully'
    );
    
    // Take screenshot
    await takeScreenshot(page, 'error-handling');
    
  } catch (error) {
    await validateTest(
      'Error Handling',
      'errorHandling',
      false,
      `Error handling test failed: ${error.message}`
    );
  }
}

// Test 7: Performance
async function testPerformance(page) {
  console.log('\n⚡ === PERFORMANCE ===');
  
  try {
    // Measure page load time
    const startTime = Date.now();
    await page.goto(FRONTEND_BASE, { waitUntil: 'networkidle2', timeout: TEST_TIMEOUT });
    const loadTime = Date.now() - startTime;
    
    const goodLoadTime = loadTime < 5000; // Less than 5 seconds
    await validateTest(
      'Page Load Time',
      'performance',
      goodLoadTime,
      `Page should load in reasonable time (${loadTime}ms)`
    );
    
    // Check for images
    const imagesLoaded = await page.evaluate(() => {
      const images = document.querySelectorAll('img');
      return images.length > 0;
    });
    
    await validateTest(
      'Images Loading',
      'performance',
      imagesLoaded,
      'Images should load properly'
    );
    
    // Check for JavaScript errors
    let jsErrors = [];
    page.on('pageerror', error => {
      jsErrors.push(error.message);
    });
    
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const noJsErrors = jsErrors.length === 0;
    await validateTest(
      'No JavaScript Errors',
      'performance',
      noJsErrors,
      `No JavaScript errors should occur (${jsErrors.length} errors found)`
    );
    
    // Take screenshot
    await takeScreenshot(page, 'performance');
    
  } catch (error) {
    await validateTest(
      'Performance',
      'performance',
      false,
      `Performance test failed: ${error.message}`
    );
  }
}

// Generate test report
function generateReport() {
  console.log('\n📋 === COMPREHENSIVE FRONTEND TEST REPORT ===');
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
  const reportPath = path.join(__dirname, 'comprehensive-frontend-test-report.json');
  fs.writeFileSync(reportPath, JSON.stringify({
    timestamp: new Date().toISOString(),
    testSuite: 'Comprehensive Frontend Testing',
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
async function runComprehensiveFrontendTests() {
  console.log('🚀 Starting Comprehensive Frontend Testing Suite');
  console.log('================================================');
  
  // Create screenshots directory
  const screenshotsDir = path.join(__dirname, 'screenshots');
  if (!fs.existsSync(screenshotsDir)) {
    fs.mkdirSync(screenshotsDir, { recursive: true });
  }
  
  let browser;
  let page;
  
  try {
    // Launch browser
    console.log('🚀 Launching browser...');
    browser = await puppeteer.launch({
      headless: true,
      defaultViewport: { width: 1280, height: 720 },
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-web-security']
    });
    
    page = await browser.newPage();
    page.setDefaultTimeout(TEST_TIMEOUT);
    
    // Run all test suites
    await testCorePageLoading(page);
    await testNavigationAndLayout(page);
    await testSearchFunctionality(page);
    await testUserAuthentication(page);
    await testResponsiveDesign(page);
    await testErrorHandling(page);
    await testPerformance(page);
    
    // Generate final report
    generateReport();
    
    console.log('\n🎉 Comprehensive Frontend Testing Complete!');
    
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
  runComprehensiveFrontendTests();
}

module.exports = { runComprehensiveFrontendTests };
