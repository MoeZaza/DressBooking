#!/usr/bin/env node

/**
 * Comprehensive Backend Routes and Functionality Audit
 * 
 * Tests all backend routes, pages, navigation, form submission, CRUD operations,
 * and ensures all functionality works correctly with Arabic language support.
 */

const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

// Configuration
const BACKEND_BASE = 'http://localhost:3001';
const TEST_TIMEOUT = 15000;

// Test credentials
const ADMIN_CREDENTIALS = {
  email: 'admin@bookdress.io',
  password: 'Un1corn2024!'
};

// All backend routes to test
const BACKEND_ROUTES = [
  // Authentication routes
  { path: '/', name: 'Dashboard/Bookings', requiresAuth: true },
  { path: '/sign-in', name: 'Sign In', requiresAuth: false },
  { path: '/sign-up', name: 'Sign Up', requiresAuth: false },
  { path: '/forgot-password', name: 'Forgot Password', requiresAuth: false },
  
  // Core business routes
  { path: '/dresses', name: 'Dresses List', requiresAuth: true },
  { path: '/create-dress', name: 'Create Dress', requiresAuth: true },
  { path: '/dress-search', name: 'Dress Search', requiresAuth: true },
  { path: '/create-booking', name: 'Create Booking', requiresAuth: true },
  
  // Management routes
  { path: '/suppliers', name: 'Suppliers', requiresAuth: true },
  { path: '/create-supplier', name: 'Create Supplier', requiresAuth: true },
  { path: '/locations', name: 'Locations', requiresAuth: true },
  { path: '/create-location', name: 'Create Location', requiresAuth: true },
  
  // User management
  { path: '/users', name: 'Users', requiresAuth: true },
  { path: '/create-user', name: 'Create User', requiresAuth: true },
  { path: '/settings', name: 'Settings', requiresAuth: true },
  { path: '/change-password', name: 'Change Password', requiresAuth: true },
  
  // Analytics and reporting
  { path: '/analytics-dashboard', name: 'Analytics Dashboard', requiresAuth: true },
  { path: '/business-intelligence', name: 'Business Intelligence', requiresAuth: true },
  { path: '/admin-booking-dashboard', name: 'Admin Booking Dashboard', requiresAuth: true },
  { path: '/inventory-management', name: 'Inventory Management', requiresAuth: true },
  
  // Financial management
  { path: '/payment-management', name: 'Payment Management', requiresAuth: true },
  { path: '/accounting-dashboard', name: 'Accounting Dashboard', requiresAuth: true },
  { path: '/bank-details', name: 'Bank Details', requiresAuth: true },
  { path: '/pricing', name: 'Pricing', requiresAuth: true },
  
  // Additional features
  { path: '/scheduler', name: 'Scheduler', requiresAuth: true },
  { path: '/fitting-appointments', name: 'Fitting Appointments', requiresAuth: true },
  { path: '/countries', name: 'Countries', requiresAuth: true },
  { path: '/notifications', name: 'Notifications', requiresAuth: true },
  
  // Static pages
  { path: '/about', name: 'About', requiresAuth: false },
  { path: '/contact', name: 'Contact', requiresAuth: false },
  { path: '/tos', name: 'Terms of Service', requiresAuth: false },
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
  const screenshotPath = path.join(__dirname, 'screenshots', `backend-audit-${name}.png`);
  await page.screenshot({ path: screenshotPath, fullPage: true });
  console.log(`📸 Screenshot saved: ${screenshotPath}`);
}

// Helper function to login
async function login(page) {
  try {
    console.log('🔐 Logging in...');
    await page.goto(`${BACKEND_BASE}/sign-in`, { waitUntil: 'domcontentloaded', timeout: TEST_TIMEOUT });
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    const emailField = await page.$('input[name="email"]');
    const passwordField = await page.$('input[name="password"]');
    const submitButton = await page.$('button[type="submit"]');
    
    if (emailField && passwordField && submitButton) {
      await emailField.click({ clickCount: 3 });
      await emailField.type(ADMIN_CREDENTIALS.email);
      await passwordField.click({ clickCount: 3 });
      await passwordField.type(ADMIN_CREDENTIALS.password);
      await submitButton.click();
      
      // Wait for navigation
      await new Promise(resolve => setTimeout(resolve, 5000));
      
      const currentUrl = page.url();
      const loginSuccessful = !currentUrl.includes('sign-in');
      
      console.log(`Login result: ${loginSuccessful ? 'Success' : 'Failed'}`);
      return loginSuccessful;
    }
    
    return false;
  } catch (error) {
    console.error('Login failed:', error.message);
    return false;
  }
}

// Test 1: Route Accessibility
async function testRouteAccessibility(page) {
  console.log('\n🌐 === ROUTE ACCESSIBILITY TESTING ===');
  
  let routesPassed = 0;
  let routesFailed = 0;
  
  for (const route of BACKEND_ROUTES) {
    try {
      console.log(`\n🔍 Testing route: ${route.name} (${route.path})`);
      
      await page.goto(`${BACKEND_BASE}${route.path}`, { 
        waitUntil: 'domcontentloaded', 
        timeout: TEST_TIMEOUT 
      });
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Check if page loads without errors
      const currentUrl = page.url();
      const pageLoaded = await page.evaluate(() => document.readyState === 'complete');
      
      // Check for content (not just error pages)
      const hasContent = await waitForElement(page, '.content, .MuiContainer-root, .MuiBox-root, main', 3000);
      
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
  
  console.log(`\n📊 Route Accessibility Summary: ${routesPassed}/${BACKEND_ROUTES.length} routes accessible`);
  
  // Take screenshot of final page
  await takeScreenshot(page, 'route-accessibility');
}

// Test 2: Navigation and Menu Testing
async function testNavigationAndMenu(page) {
  console.log('\n🧭 === NAVIGATION AND MENU TESTING ===');
  
  try {
    // Go to dashboard
    await page.goto(BACKEND_BASE, { waitUntil: 'domcontentloaded', timeout: TEST_TIMEOUT });
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Test header navigation
    const headerExists = await waitForElement(page, 'header, .header, .MuiAppBar-root', 3000);
    await validateTest(
      'Header Navigation',
      'navigation',
      headerExists,
      'Header should be present on all pages'
    );
    
    // Test menu items
    const menuExists = await waitForElement(page, '.MuiToolbar-root, .toolbar, nav', 3000);
    await validateTest(
      'Menu Structure',
      'navigation',
      menuExists,
      'Menu structure should be present'
    );
    
    // Test navigation links
    const navLinks = await page.$$('a[href], button[onclick]');
    const hasNavLinks = navLinks.length > 0;
    await validateTest(
      'Navigation Links',
      'navigation',
      hasNavLinks,
      `Should have navigation links (found ${navLinks.length})`
    );
    
    // Test responsive menu (mobile)
    await page.setViewport({ width: 375, height: 667 });
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const mobileMenuExists = await waitForElement(page, '.MuiIconButton-root, .menu-button, .hamburger', 2000);
    await validateTest(
      'Mobile Menu',
      'navigation',
      mobileMenuExists,
      'Mobile menu should be available on small screens'
    );
    
    // Reset viewport
    await page.setViewport({ width: 1280, height: 720 });
    
    // Take screenshot
    await takeScreenshot(page, 'navigation-menu');
    
  } catch (error) {
    await validateTest(
      'Navigation and Menu Test',
      'navigation',
      false,
      `Navigation test failed: ${error.message}`
    );
  }
}

// Test 3: Form Functionality Testing
async function testFormFunctionality(page) {
  console.log('\n📝 === FORM FUNCTIONALITY TESTING ===');
  
  try {
    // Test Create Dress form (most important form with required fields)
    await page.goto(`${BACKEND_BASE}/create-dress`, { waitUntil: 'domcontentloaded', timeout: TEST_TIMEOUT });
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // Check if form exists
    const formExists = await waitForElement(page, 'form, .dress-form', 5000);
    await validateTest(
      'Create Dress Form',
      'forms',
      formExists,
      'Create dress form should be present'
    );
    
    // Test required fields (name and dress code)
    const nameFieldExists = await waitForElement(page, 'input[name="name"], input[id="name"]', 3000);
    const dressCodeFieldExists = await waitForElement(page, 'input[name="dressCode"], input[id="dressCode"]', 3000);
    
    await validateTest(
      'Required Fields Present',
      'forms',
      nameFieldExists && dressCodeFieldExists,
      'Name and dress code fields should be present'
    );
    
    // Test form validation
    if (nameFieldExists && dressCodeFieldExists) {
      const submitButton = await page.$('button[type="submit"]');
      if (submitButton) {
        // Try to submit empty form
        await submitButton.click();
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Check if still on create page (validation prevented submission)
        const stillOnCreatePage = page.url().includes('create-dress');
        await validateTest(
          'Form Validation',
          'forms',
          stillOnCreatePage,
          'Form validation should prevent empty submission'
        );
      }
    }
    
    // Test Create Booking form
    await page.goto(`${BACKEND_BASE}/create-booking`, { waitUntil: 'domcontentloaded', timeout: TEST_TIMEOUT });
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    const bookingFormExists = await waitForElement(page, 'form, .booking-form', 5000);
    await validateTest(
      'Create Booking Form',
      'forms',
      bookingFormExists,
      'Create booking form should be present'
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

// Test 4: Arabic Language and RTL Testing
async function testArabicLanguageAndRTL(page) {
  console.log('\n🌍 === ARABIC LANGUAGE AND RTL TESTING ===');
  
  try {
    // Go to dashboard
    await page.goto(BACKEND_BASE, { waitUntil: 'domcontentloaded', timeout: TEST_TIMEOUT });
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

// Test 5: CRUD Operations Testing
async function testCRUDOperations(page) {
  console.log('\n🔄 === CRUD OPERATIONS TESTING ===');
  
  try {
    // Test Dresses CRUD
    await page.goto(`${BACKEND_BASE}/dresses`, { waitUntil: 'domcontentloaded', timeout: TEST_TIMEOUT });
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Check list view
    const dressListExists = await waitForElement(page, '.dress-list, .MuiDataGrid-root, table', 5000);
    await validateTest(
      'Dress List View',
      'crud',
      dressListExists,
      'Dress list should be displayed'
    );
    
    // Check create button
    const createButtonExists = await waitForElement(page, 'a[href*="create"], button:contains("Create"), .btn-primary', 3000);
    await validateTest(
      'Create Button',
      'crud',
      createButtonExists,
      'Create button should be available'
    );
    
    // Test Suppliers CRUD
    await page.goto(`${BACKEND_BASE}/suppliers`, { waitUntil: 'domcontentloaded', timeout: TEST_TIMEOUT });
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    const supplierListExists = await waitForElement(page, '.supplier-list, .MuiDataGrid-root, table', 5000);
    await validateTest(
      'Supplier List View',
      'crud',
      supplierListExists,
      'Supplier list should be displayed'
    );
    
    // Test Locations CRUD
    await page.goto(`${BACKEND_BASE}/locations`, { waitUntil: 'domcontentloaded', timeout: TEST_TIMEOUT });
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    const locationListExists = await waitForElement(page, '.location-list, .MuiDataGrid-root, table', 5000);
    await validateTest(
      'Location List View',
      'crud',
      locationListExists,
      'Location list should be displayed'
    );
    
    // Take screenshot
    await takeScreenshot(page, 'crud-operations');
    
  } catch (error) {
    await validateTest(
      'CRUD Operations Test',
      'crud',
      false,
      `CRUD operations test failed: ${error.message}`
    );
  }
}

// Generate test report
function generateReport() {
  console.log('\n📋 === COMPREHENSIVE BACKEND ROUTES AUDIT REPORT ===');
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
  const reportPath = path.join(__dirname, 'backend-routes-audit-report.json');
  fs.writeFileSync(reportPath, JSON.stringify({
    timestamp: new Date().toISOString(),
    testSuite: 'Comprehensive Backend Routes Audit',
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
async function runBackendRoutesAudit() {
  console.log('🚀 Starting Comprehensive Backend Routes and Functionality Audit');
  console.log('================================================================');
  
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
    
    // Login first
    const loginSuccess = await login(page);
    if (!loginSuccess) {
      console.log('⚠️ Login failed, but continuing with tests to check what\'s available');
    }
    
    // Run all test suites
    await testRouteAccessibility(page);
    await testNavigationAndMenu(page);
    await testFormFunctionality(page);
    await testArabicLanguageAndRTL(page);
    await testCRUDOperations(page);
    
    // Generate final report
    generateReport();
    
    console.log('\n🎉 Backend Routes and Functionality Audit Complete!');
    
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
  runBackendRoutesAudit();
}

module.exports = { runBackendRoutesAudit };
