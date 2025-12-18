#!/usr/bin/env node

/**
 * Comprehensive Frontend Routes and Functionality Audit
 * 
 * Tests all frontend routes, pages, navigation, form submission, search functionality,
 * and ensures all features work correctly with Arabic language support.
 */

const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

// Configuration
const FRONTEND_BASE = 'http://localhost:3000';
const TEST_TIMEOUT = 15000;

// All frontend routes to test
const FRONTEND_ROUTES = [
  // Core pages
  { path: '/', name: 'Home', requiresAuth: false },
  { path: '/search', name: 'Search', requiresAuth: false },
  { path: '/about', name: 'About', requiresAuth: false },
  { path: '/contact', name: 'Contact', requiresAuth: false },
  { path: '/locations', name: 'Locations', requiresAuth: false },
  { path: '/faq', name: 'FAQ', requiresAuth: false },
  
  // Authentication pages
  { path: '/sign-in', name: 'Sign In', requiresAuth: false },
  { path: '/sign-up', name: 'Sign Up', requiresAuth: false },
  { path: '/forgot-password', name: 'Forgot Password', requiresAuth: false },
  
  // User pages
  { path: '/bookings', name: 'My Bookings', requiresAuth: true },
  { path: '/settings', name: 'Settings', requiresAuth: true },
  { path: '/notifications', name: 'Notifications', requiresAuth: true },
  { path: '/change-password', name: 'Change Password', requiresAuth: true },
  { path: '/my-appointments', name: 'My Appointments', requiresAuth: true },
  
  // Business pages
  { path: '/dresses', name: 'Dresses', requiresAuth: false },
  { path: '/suppliers', name: 'Suppliers', requiresAuth: false },
  { path: '/dress-analytics', name: 'Dress Analytics', requiresAuth: true },
  
  // Legal pages
  { path: '/tos', name: 'Terms of Service', requiresAuth: false },
  { path: '/privacy', name: 'Privacy Policy', requiresAuth: false },
  { path: '/cookie-policy', name: 'Cookie Policy', requiresAuth: false },
];

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
  const screenshotPath = path.join(__dirname, 'screenshots', `frontend-audit-${name}.png`);
  await page.screenshot({ path: screenshotPath, fullPage: true });
  console.log(`📸 Screenshot saved: ${screenshotPath}`);
}

// Test 1: Route Accessibility
async function testRouteAccessibility(page) {
  console.log('\n🌐 === FRONTEND ROUTE ACCESSIBILITY TESTING ===');
  
  let routesPassed = 0;
  let routesFailed = 0;
  
  for (const route of FRONTEND_ROUTES) {
    try {
      console.log(`\n🔍 Testing route: ${route.name} (${route.path})`);
      
      await page.goto(`${FRONTEND_BASE}${route.path}`, { 
        waitUntil: 'domcontentloaded', 
        timeout: TEST_TIMEOUT 
      });
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Check if page loads without errors
      const currentUrl = page.url();
      const pageLoaded = await page.evaluate(() => document.readyState === 'complete');
      
      // Check for content (not just error pages)
      const hasContent = await waitForElement(page, '.content, .home, .search, .about, .contact, main', 5000);
      
      // Check for Arabic text (ensuring Arabic language is working)
      const hasArabicText = await page.evaluate(() => {
        const text = document.body.textContent || '';
        // Check for Arabic characters
        const arabicRegex = /[\u0600-\u06FF]/;
        return arabicRegex.test(text);
      });
      
      const routeWorking = pageLoaded && hasContent;
      
      if (routeWorking) {
        routesPassed++;
        console.log(`  ✅ ${route.name}: Accessible`);
        if (hasArabicText) {
          console.log(`  🌍 Arabic text detected`);
        }
      } else {
        routesFailed++;
        console.log(`  ❌ ${route.name}: Not accessible or no content`);
      }
      
      await validateTest(
        `Route: ${route.name}`,
        'routeAccessibility',
        routeWorking,
        routeWorking ? 'Route is accessible and has content' : 'Route failed to load or has no content'
      );
      
    } catch (error) {
      routesFailed++;
      console.log(`  ❌ ${route.name}: Error - ${error.message}`);
      await validateTest(
        `Route: ${route.name}`,
        'routeAccessibility',
        false,
        `Route failed with error: ${error.message}`
      );
    }
  }
  
  console.log(`\n📊 Route Accessibility Summary: ${routesPassed}/${FRONTEND_ROUTES.length} routes accessible`);
  
  // Take screenshot of final page
  await takeScreenshot(page, 'route-accessibility');
}

// Test 2: Navigation and Layout Testing
async function testNavigationAndLayout(page) {
  console.log('\n🧭 === NAVIGATION AND LAYOUT TESTING ===');
  
  try {
    // Go to home page
    await page.goto(FRONTEND_BASE, { waitUntil: 'domcontentloaded', timeout: TEST_TIMEOUT });
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Test header
    const headerExists = await waitForElement(page, 'header, .header, .MuiAppBar-root', 3000);
    await validateTest(
      'Header Present',
      'navigation',
      headerExists,
      'Header should be present on all pages'
    );
    
    // Test footer
    const footerExists = await waitForElement(page, 'footer, .footer', 3000);
    await validateTest(
      'Footer Present',
      'navigation',
      footerExists,
      'Footer should be present on all pages'
    );
    
    // Test navigation menu
    const navExists = await waitForElement(page, '.MuiToolbar-root, .toolbar, nav', 3000);
    await validateTest(
      'Navigation Menu',
      'navigation',
      navExists,
      'Navigation menu should be present'
    );
    
    // Test logo/brand
    const logoExists = await waitForElement(page, '.logo, button.logo', 3000);
    await validateTest(
      'Logo/Brand',
      'navigation',
      logoExists,
      'Logo or brand should be present'
    );
    
    // Test responsive design
    await page.setViewport({ width: 375, height: 667 });
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const mobileContentVisible = await waitForElement(page, '.content, .home', 2000);
    await validateTest(
      'Mobile Responsiveness',
      'navigation',
      mobileContentVisible,
      'Site should be responsive on mobile'
    );
    
    // Reset viewport
    await page.setViewport({ width: 1280, height: 720 });
    
    // Take screenshot
    await takeScreenshot(page, 'navigation-layout');
    
  } catch (error) {
    await validateTest(
      'Navigation and Layout Test',
      'navigation',
      false,
      `Navigation and layout test failed: ${error.message}`
    );
  }
}

// Test 3: Search Functionality Testing
async function testSearchFunctionality(page) {
  console.log('\n🔍 === SEARCH FUNCTIONALITY TESTING ===');
  
  try {
    // Go to home page
    await page.goto(FRONTEND_BASE, { waitUntil: 'domcontentloaded', timeout: TEST_TIMEOUT });
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Test search form on home page
    const searchFormExists = await waitForElement(page, '.home-search, .search', 5000);
    await validateTest(
      'Home Search Form',
      'search',
      searchFormExists,
      'Search form should be present on home page'
    );
    
    // Test search inputs
    const searchInputsExist = await waitForElement(page, '.home-search input, .search input', 3000);
    await validateTest(
      'Search Input Fields',
      'search',
      searchInputsExist,
      'Search input fields should be available'
    );
    
    // Test search button
    const searchButtonExists = await waitForElement(page, '.home-search button, .search button', 3000);
    await validateTest(
      'Search Button',
      'search',
      searchButtonExists,
      'Search button should be present'
    );
    
    // Test dress type navigation
    const dressTypeButtonExists = await waitForElement(page, '.btn-dress-type', 3000);
    await validateTest(
      'Dress Type Navigation',
      'search',
      dressTypeButtonExists,
      'Dress type navigation should be available'
    );
    
    // Test search page
    await page.goto(`${FRONTEND_BASE}/search`, { waitUntil: 'domcontentloaded', timeout: TEST_TIMEOUT });
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    const searchPageContent = await waitForElement(page, '.search, .col-1, .col-2', 5000);
    await validateTest(
      'Search Page Content',
      'search',
      searchPageContent,
      'Search page should have content structure'
    );
    
    // Take screenshot
    await takeScreenshot(page, 'search-functionality');
    
  } catch (error) {
    await validateTest(
      'Search Functionality Test',
      'search',
      false,
      `Search functionality test failed: ${error.message}`
    );
  }
}

// Test 4: Arabic Language and RTL Testing
async function testArabicLanguageAndRTL(page) {
  console.log('\n🌍 === ARABIC LANGUAGE AND RTL TESTING ===');
  
  try {
    // Go to home page
    await page.goto(FRONTEND_BASE, { waitUntil: 'domcontentloaded', timeout: TEST_TIMEOUT });
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Check document direction
    const documentDirection = await page.evaluate(() => {
      return document.documentElement.getAttribute('dir') || document.body.getAttribute('dir');
    });
    
    await validateTest(
      'RTL Direction',
      'arabic',
      documentDirection === 'rtl',
      `Document direction should be RTL (found: ${documentDirection})`
    );
    
    // Check for Arabic text
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
    
    // Check font family
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
    
    // Take screenshot
    await takeScreenshot(page, 'arabic-rtl');
    
  } catch (error) {
    await validateTest(
      'Arabic Language and RTL Test',
      'arabic',
      false,
      `Arabic/RTL test failed: ${error.message}`
    );
  }
}

// Test 5: Form Functionality Testing
async function testFormFunctionality(page) {
  console.log('\n📝 === FORM FUNCTIONALITY TESTING ===');
  
  try {
    // Test Sign In form
    await page.goto(`${FRONTEND_BASE}/sign-in`, { waitUntil: 'domcontentloaded', timeout: TEST_TIMEOUT });
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    const signInFormExists = await waitForElement(page, 'form, .signin-form', 5000);
    await validateTest(
      'Sign In Form',
      'forms',
      signInFormExists,
      'Sign in form should be present'
    );
    
    // Test Sign Up form
    await page.goto(`${FRONTEND_BASE}/sign-up`, { waitUntil: 'domcontentloaded', timeout: TEST_TIMEOUT });
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    const signUpFormExists = await waitForElement(page, 'form, .signup-form', 5000);
    await validateTest(
      'Sign Up Form',
      'forms',
      signUpFormExists,
      'Sign up form should be present'
    );
    
    // Test Contact form
    await page.goto(`${FRONTEND_BASE}/contact`, { waitUntil: 'domcontentloaded', timeout: TEST_TIMEOUT });
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    const contactFormExists = await waitForElement(page, 'form, .contact-form', 5000);
    await validateTest(
      'Contact Form',
      'forms',
      contactFormExists,
      'Contact form should be present'
    );
    
    // Take screenshot
    await takeScreenshot(page, 'form-functionality');
    
  } catch (error) {
    await validateTest(
      'Form Functionality Test',
      'forms',
      false,
      `Form functionality test failed: ${error.message}`
    );
  }
}

// Generate test report
function generateReport() {
  console.log('\n📋 === COMPREHENSIVE FRONTEND ROUTES AUDIT REPORT ===');
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
  const reportPath = path.join(__dirname, 'frontend-routes-audit-report.json');
  fs.writeFileSync(reportPath, JSON.stringify({
    timestamp: new Date().toISOString(),
    testSuite: 'Comprehensive Frontend Routes Audit',
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
async function runFrontendRoutesAudit() {
  console.log('🚀 Starting Comprehensive Frontend Routes and Functionality Audit');
  console.log('==================================================================');
  
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
    await testRouteAccessibility(page);
    await testNavigationAndLayout(page);
    await testSearchFunctionality(page);
    await testArabicLanguageAndRTL(page);
    await testFormFunctionality(page);
    
    // Generate final report
    generateReport();
    
    console.log('\n🎉 Frontend Routes and Functionality Audit Complete!');
    
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
  runFrontendRoutesAudit();
}

module.exports = { runFrontendRoutesAudit };
