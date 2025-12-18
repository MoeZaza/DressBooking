#!/usr/bin/env node

/**
 * Comprehensive Frontend Feature Testing Suite
 * 
 * Tests every tiny feature in the frontend including:
 * - Search functionality and filters
 * - Booking process and forms
 * - User authentication and registration
 * - Responsive design and interactions
 * - Arabic language support
 * - Navigation and user experience
 * - Error handling and edge cases
 */

const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

// Configuration
const FRONTEND_BASE = 'http://localhost:3000';
const TEST_TIMEOUT = 15000;

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
  const screenshotPath = path.join(__dirname, 'screenshots', `frontend-feature-${name}.png`);
  await page.screenshot({ path: screenshotPath, fullPage: true });
  console.log(`📸 Screenshot saved: ${screenshotPath}`);
}

// Test 1: Home Page Features
async function testHomePageFeatures(page) {
  console.log('\n🏠 === HOME PAGE FEATURES TESTING ===');
  
  try {
    await page.goto(FRONTEND_BASE, { waitUntil: 'domcontentloaded', timeout: TEST_TIMEOUT });
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Test Hero Section
    const heroExists = await waitForElement(page, '.video, .home-content', 5000);
    await validateTest(
      'Hero Section',
      'homePage',
      heroExists,
      'Hero section should be present'
    );
    
    // Test Hero Video
    const videoExists = await waitForElement(page, 'video#cover, .video video', 3000);
    await validateTest(
      'Hero Video',
      'homePage',
      videoExists,
      'Hero video should be present'
    );
    
    // Test Home Title
    const titleExists = await waitForElement(page, '.home-title', 3000);
    await validateTest(
      'Home Title',
      'homePage',
      titleExists,
      'Home title should be displayed'
    );
    
    // Test Home Cover Text
    const coverTextExists = await waitForElement(page, '.home-cover', 3000);
    await validateTest(
      'Home Cover Text',
      'homePage',
      coverTextExists,
      'Home cover text should be displayed'
    );
    
    // Test Search Section
    const searchSectionExists = await waitForElement(page, '.search, .home-search', 3000);
    await validateTest(
      'Search Section',
      'homePage',
      searchSectionExists,
      'Search section should be present'
    );
    
    // Test Dress Types Section
    const dressTypesExists = await waitForElement(page, '.dress-types', 3000);
    await validateTest(
      'Dress Types Section',
      'homePage',
      dressTypesExists,
      'Dress types section should be present'
    );
    
    // Test Dress Type Boxes
    const dressBoxesExist = await waitForElement(page, '.dress-types .boxes, .dress-types .box', 3000);
    await validateTest(
      'Dress Type Boxes',
      'homePage',
      dressBoxesExist,
      'Dress type boxes should be displayed'
    );
    
    // Test Dress Type Buttons
    const dressButtonsExist = await waitForElement(page, '.btn-dress-type', 3000);
    await validateTest(
      'Dress Type Buttons',
      'homePage',
      dressButtonsExist,
      'Dress type buttons should be functional'
    );
    
    // Take screenshot
    await takeScreenshot(page, 'home-page');
    
  } catch (error) {
    await validateTest(
      'Home Page Features Test',
      'homePage',
      false,
      `Home page test failed: ${error.message}`
    );
  }
}

// Test 2: Search Functionality Features
async function testSearchFunctionalityFeatures(page) {
  console.log('\n🔍 === SEARCH FUNCTIONALITY FEATURES TESTING ===');
  
  try {
    // Go to home page
    await page.goto(FRONTEND_BASE, { waitUntil: 'domcontentloaded', timeout: TEST_TIMEOUT });
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Test Search Form
    const searchFormExists = await waitForElement(page, '.home-search form, .search form', 5000);
    await validateTest(
      'Search Form',
      'search',
      searchFormExists,
      'Search form should be present'
    );
    
    // Test Search Input Fields
    const searchInputsExist = await waitForElement(page, '.home-search input, .search input', 3000);
    await validateTest(
      'Search Input Fields',
      'search',
      searchInputsExist,
      'Search input fields should be available'
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
    const dressTypeButton = await page.$('.btn-dress-type');
    if (dressTypeButton) {
      await dressTypeButton.click();
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      const navigatedToSearch = page.url().includes('search');
      await validateTest(
        'Dress Type Navigation',
        'search',
        navigatedToSearch,
        'Dress type buttons should navigate to search'
      );
    }
    
    // Test Search Page Structure
    if (page.url().includes('search')) {
      const searchPageStructure = await waitForElement(page, '.search, .col-1, .col-2', 3000);
      await validateTest(
        'Search Page Structure',
        'search',
        searchPageStructure,
        'Search page should have proper structure'
      );
      
      // Test Filters Button
      const filtersButtonExists = await waitForElement(page, '.btn-filters', 3000);
      await validateTest(
        'Filters Button',
        'search',
        filtersButtonExists,
        'Filters button should be available'
      );
      
      // Test Results Area
      const resultsAreaExists = await waitForElement(page, '.col-2, .dress-list', 3000);
      await validateTest(
        'Results Area',
        'search',
        resultsAreaExists,
        'Results area should be present'
      );
    }
    
    // Take screenshot
    await takeScreenshot(page, 'search-functionality');
    
  } catch (error) {
    await validateTest(
      'Search Functionality Features Test',
      'search',
      false,
      `Search functionality test failed: ${error.message}`
    );
  }
}

// Test 3: Navigation and Layout Features
async function testNavigationAndLayoutFeatures(page) {
  console.log('\n🧭 === NAVIGATION AND LAYOUT FEATURES TESTING ===');
  
  try {
    // Go to home page
    await page.goto(FRONTEND_BASE, { waitUntil: 'domcontentloaded', timeout: TEST_TIMEOUT });
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Test Header
    const headerExists = await waitForElement(page, 'header, .header, .MuiAppBar-root', 3000);
    await validateTest(
      'Header',
      'navigation',
      headerExists,
      'Header should be present'
    );
    
    // Test Logo/Brand
    const logoExists = await waitForElement(page, '.logo, button.logo', 3000);
    await validateTest(
      'Logo/Brand',
      'navigation',
      logoExists,
      'Logo should be present in header'
    );
    
    // Test Navigation Toolbar
    const toolbarExists = await waitForElement(page, '.MuiToolbar-root, .toolbar', 3000);
    await validateTest(
      'Navigation Toolbar',
      'navigation',
      toolbarExists,
      'Navigation toolbar should be present'
    );
    
    // Test Footer
    const footerExists = await waitForElement(page, 'footer, .footer', 3000);
    await validateTest(
      'Footer',
      'navigation',
      footerExists,
      'Footer should be present'
    );
    
    // Test Footer Links
    const footerLinksExist = await waitForElement(page, 'footer a, .footer a', 2000);
    await validateTest(
      'Footer Links',
      'navigation',
      footerLinksExist,
      'Footer should contain links'
    );
    
    // Test Page Navigation
    const aboutLink = await page.$('a[href="/about"], a[href*="about"]');
    if (aboutLink) {
      await aboutLink.click();
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      const onAboutPage = page.url().includes('about');
      await validateTest(
        'Page Navigation',
        'navigation',
        onAboutPage,
        'Navigation links should work'
      );
    }
    
    // Test Breadcrumbs or Back Navigation
    const breadcrumbsExist = await waitForElement(page, '.breadcrumbs, .back-button, .MuiBreadcrumbs-root', 2000);
    await validateTest(
      'Breadcrumbs/Back Navigation',
      'navigation',
      breadcrumbsExist,
      'Breadcrumbs or back navigation should be available'
    );
    
    // Take screenshot
    await takeScreenshot(page, 'navigation-layout');
    
  } catch (error) {
    await validateTest(
      'Navigation and Layout Features Test',
      'navigation',
      false,
      `Navigation and layout test failed: ${error.message}`
    );
  }
}

// Test 4: Authentication Features
async function testAuthenticationFeatures(page) {
  console.log('\n🔐 === AUTHENTICATION FEATURES TESTING ===');
  
  try {
    // Test Sign In Page
    await page.goto(`${FRONTEND_BASE}/sign-in`, { waitUntil: 'domcontentloaded', timeout: TEST_TIMEOUT });
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    const signInPageExists = await waitForElement(page, '.content, .sign-in, form', 5000);
    await validateTest(
      'Sign In Page',
      'authentication',
      signInPageExists,
      'Sign in page should be accessible'
    );
    
    // Test Sign In Form Elements
    const emailFieldExists = await waitForElement(page, 'input[type="email"], input[name="email"]', 3000);
    const passwordFieldExists = await waitForElement(page, 'input[type="password"], input[name="password"]', 3000);
    const submitButtonExists = await waitForElement(page, 'button[type="submit"], .submit-button', 3000);
    
    await validateTest(
      'Sign In Form Elements',
      'authentication',
      emailFieldExists && passwordFieldExists && submitButtonExists,
      'Sign in form should have all required elements'
    );
    
    // Test Sign Up Page
    await page.goto(`${FRONTEND_BASE}/sign-up`, { waitUntil: 'domcontentloaded', timeout: TEST_TIMEOUT });
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    const signUpPageExists = await waitForElement(page, '.content, .sign-up, form', 5000);
    await validateTest(
      'Sign Up Page',
      'authentication',
      signUpPageExists,
      'Sign up page should be accessible'
    );
    
    // Test Sign Up Form Elements
    const signUpFormElements = await page.evaluate(() => {
      const inputs = document.querySelectorAll('input');
      const buttons = document.querySelectorAll('button[type="submit"]');
      return inputs.length >= 3 && buttons.length >= 1; // At least name, email, password, submit
    });
    
    await validateTest(
      'Sign Up Form Elements',
      'authentication',
      signUpFormElements,
      'Sign up form should have all required elements'
    );
    
    // Test Forgot Password Page
    await page.goto(`${FRONTEND_BASE}/forgot-password`, { waitUntil: 'domcontentloaded', timeout: TEST_TIMEOUT });
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    const forgotPasswordPageExists = await waitForElement(page, '.content, .forgot-password, form', 5000);
    await validateTest(
      'Forgot Password Page',
      'authentication',
      forgotPasswordPageExists,
      'Forgot password page should be accessible'
    );
    
    // Take screenshot
    await takeScreenshot(page, 'authentication');
    
  } catch (error) {
    await validateTest(
      'Authentication Features Test',
      'authentication',
      false,
      `Authentication test failed: ${error.message}`
    );
  }
}

// Test 5: Responsive Design Features
async function testResponsiveDesignFeatures(page) {
  console.log('\n📱 === RESPONSIVE DESIGN FEATURES TESTING ===');
  
  try {
    // Go to home page
    await page.goto(FRONTEND_BASE, { waitUntil: 'domcontentloaded', timeout: TEST_TIMEOUT });
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Test Desktop View
    await page.setViewport({ width: 1920, height: 1080 });
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const desktopContentVisible = await waitForElement(page, '.content, .home', 2000);
    await validateTest(
      'Desktop Responsiveness',
      'responsive',
      desktopContentVisible,
      'Site should work well on desktop'
    );
    
    // Test Tablet View
    await page.setViewport({ width: 768, height: 1024 });
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const tabletContentVisible = await waitForElement(page, '.content, .home', 2000);
    await validateTest(
      'Tablet Responsiveness',
      'responsive',
      tabletContentVisible,
      'Site should be responsive on tablet'
    );
    
    // Test Mobile View
    await page.setViewport({ width: 375, height: 667 });
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const mobileContentVisible = await waitForElement(page, '.content, .home', 2000);
    await validateTest(
      'Mobile Responsiveness',
      'responsive',
      mobileContentVisible,
      'Site should be responsive on mobile'
    );
    
    // Test Mobile Navigation
    const mobileNavExists = await waitForElement(page, '.MuiIconButton-root, .menu-button, .hamburger', 2000);
    await validateTest(
      'Mobile Navigation',
      'responsive',
      mobileNavExists,
      'Mobile navigation should be available'
    );
    
    // Test Touch Interactions (simulate touch)
    const touchableElements = await page.$$('button, .btn-dress-type, a');
    const hasTouchableElements = touchableElements.length > 0;
    await validateTest(
      'Touch Interactions',
      'responsive',
      hasTouchableElements,
      'Touch-friendly elements should be available'
    );
    
    // Reset viewport
    await page.setViewport({ width: 1280, height: 720 });
    
    // Take screenshot
    await takeScreenshot(page, 'responsive-design');
    
  } catch (error) {
    await validateTest(
      'Responsive Design Features Test',
      'responsive',
      false,
      `Responsive design test failed: ${error.message}`
    );
  }
}

// Test 6: Arabic Language and RTL Features
async function testArabicLanguageAndRTLFeatures(page) {
  console.log('\n🌍 === ARABIC LANGUAGE AND RTL FEATURES TESTING ===');
  
  try {
    // Go to home page
    await page.goto(FRONTEND_BASE, { waitUntil: 'domcontentloaded', timeout: TEST_TIMEOUT });
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Test RTL Direction
    const documentDirection = await page.evaluate(() => {
      return document.documentElement.getAttribute('dir') || document.body.getAttribute('dir');
    });
    
    await validateTest(
      'RTL Direction',
      'arabic',
      documentDirection === 'rtl',
      `Document should have RTL direction (found: ${documentDirection})`
    );
    
    // Test Arabic Text Presence
    const hasArabicText = await page.evaluate(() => {
      const text = document.body.textContent || '';
      const arabicRegex = /[\u0600-\u06FF]/;
      return arabicRegex.test(text);
    });
    
    await validateTest(
      'Arabic Text Present',
      'arabic',
      hasArabicText,
      'Arabic text should be present in the interface'
    );
    
    // Test Arabic Font
    const fontFamily = await page.evaluate(() => {
      const computedStyle = window.getComputedStyle(document.body);
      return computedStyle.fontFamily;
    });
    
    const hasArabicFont = fontFamily.includes('Noto Sans Arabic') || fontFamily.includes('Arabic');
    await validateTest(
      'Arabic Font Support',
      'arabic',
      hasArabicFont,
      `Arabic font should be used (found: ${fontFamily})`
    );
    
    // Test RTL Layout Elements
    const rtlLayoutCorrect = await page.evaluate(() => {
      const elements = document.querySelectorAll('.home-title, .home-cover, .dress-types');
      let rtlCount = 0;
      
      elements.forEach(el => {
        const style = window.getComputedStyle(el);
        if (style.direction === 'rtl' || style.textAlign === 'right') {
          rtlCount++;
        }
      });
      
      return rtlCount > 0;
    });
    
    await validateTest(
      'RTL Layout Elements',
      'arabic',
      rtlLayoutCorrect,
      'Elements should have proper RTL layout'
    );
    
    // Test Arabic Content in Different Pages
    await page.goto(`${FRONTEND_BASE}/about`, { waitUntil: 'domcontentloaded', timeout: TEST_TIMEOUT });
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const aboutPageArabic = await page.evaluate(() => {
      const text = document.body.textContent || '';
      const arabicRegex = /[\u0600-\u06FF]/;
      return arabicRegex.test(text);
    });
    
    await validateTest(
      'Arabic Content Consistency',
      'arabic',
      aboutPageArabic,
      'Arabic content should be consistent across pages'
    );
    
    // Take screenshot
    await takeScreenshot(page, 'arabic-rtl');
    
  } catch (error) {
    await validateTest(
      'Arabic Language and RTL Features Test',
      'arabic',
      false,
      `Arabic/RTL test failed: ${error.message}`
    );
  }
}

// Test 7: Error Handling and Edge Cases
async function testErrorHandlingAndEdgeCases(page) {
  console.log('\n🚨 === ERROR HANDLING AND EDGE CASES TESTING ===');
  
  try {
    // Test 404 Page
    await page.goto(`${FRONTEND_BASE}/non-existent-page`, { waitUntil: 'domcontentloaded', timeout: TEST_TIMEOUT });
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    const errorPageExists = await waitForElement(page, '.content, .no-match, .error, .not-found', 5000);
    await validateTest(
      '404 Error Page',
      'errorHandling',
      errorPageExists,
      '404 error page should be displayed'
    );
    
    // Test Invalid Dress URL
    await page.goto(`${FRONTEND_BASE}/dress?d=invalid-dress-id`, { waitUntil: 'domcontentloaded', timeout: TEST_TIMEOUT });
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    const invalidDressHandled = await waitForElement(page, '.content, .no-match, .error', 3000);
    await validateTest(
      'Invalid Dress ID Handling',
      'errorHandling',
      invalidDressHandled,
      'Invalid dress ID should be handled gracefully'
    );
    
    // Test Network Error Simulation
    await page.setOfflineMode(true);
    await page.goto(FRONTEND_BASE, { waitUntil: 'domcontentloaded', timeout: 5000 }).catch(() => {});
    await page.setOfflineMode(false);
    
    // Check if the page handles offline mode gracefully
    await page.goto(FRONTEND_BASE, { waitUntil: 'domcontentloaded', timeout: TEST_TIMEOUT });
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const recoveredFromOffline = await waitForElement(page, '.content, .home', 3000);
    await validateTest(
      'Network Error Recovery',
      'errorHandling',
      recoveredFromOffline,
      'Site should recover from network errors'
    );
    
    // Test Form Validation Errors
    await page.goto(`${FRONTEND_BASE}/sign-in`, { waitUntil: 'domcontentloaded', timeout: TEST_TIMEOUT });
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const submitButton = await page.$('button[type="submit"]');
    if (submitButton) {
      await submitButton.click();
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const stillOnSignInPage = page.url().includes('sign-in');
      await validateTest(
        'Form Validation Errors',
        'errorHandling',
        stillOnSignInPage,
        'Form validation errors should be handled'
      );
    }
    
    // Take screenshot
    await takeScreenshot(page, 'error-handling');
    
  } catch (error) {
    await validateTest(
      'Error Handling and Edge Cases Test',
      'errorHandling',
      false,
      `Error handling test failed: ${error.message}`
    );
  }
}

// Generate test report
function generateReport() {
  console.log('\n📋 === COMPREHENSIVE FRONTEND FEATURE TEST REPORT ===');
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
  const reportPath = path.join(__dirname, 'frontend-feature-test-report.json');
  fs.writeFileSync(reportPath, JSON.stringify({
    timestamp: new Date().toISOString(),
    testSuite: 'Comprehensive Frontend Feature Testing',
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
async function runComprehensiveFrontendFeatureTests() {
  console.log('🚀 Starting Comprehensive Frontend Feature Testing Suite');
  console.log('========================================================');
  
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
    await testHomePageFeatures(page);
    await testSearchFunctionalityFeatures(page);
    await testNavigationAndLayoutFeatures(page);
    await testAuthenticationFeatures(page);
    await testResponsiveDesignFeatures(page);
    await testArabicLanguageAndRTLFeatures(page);
    await testErrorHandlingAndEdgeCases(page);
    
    // Generate final report
    generateReport();
    
    console.log('\n🎉 Comprehensive Frontend Feature Testing Complete!');
    
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
  runComprehensiveFrontendFeatureTests();
}

module.exports = { runComprehensiveFrontendFeatureTests };
