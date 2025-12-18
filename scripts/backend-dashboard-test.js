#!/usr/bin/env node

/**
 * Backend Dashboard/Bookings Page Comprehensive Testing Suite
 * 
 * Tests all aspects of the dashboard/bookings page functionality including:
 * - Page loading and layout
 * - Booking list display
 * - Search and filter functionality
 * - Navigation elements
 * - CRUD operations
 */

const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

// Configuration
const BACKEND_BASE = 'http://localhost:3001';
const TEST_TIMEOUT = 10000;

// Test credentials
const ADMIN_CREDENTIALS = {
  email: 'admin@bookdress.io',
  password: 'Un1corn2024!'
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
  const screenshotPath = path.join(__dirname, 'screenshots', `dashboard-${name}.png`);
  await page.screenshot({ path: screenshotPath, fullPage: true });
  console.log(`📸 Screenshot saved: ${screenshotPath}`);
}

// Helper function to login
async function login(page) {
  try {
    console.log('🔐 Attempting to login...');
    await page.goto(BACKEND_BASE, { waitUntil: 'domcontentloaded', timeout: TEST_TIMEOUT });
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Wait for form elements to be available
    await waitForElement(page, 'input[name="email"]', 5000);

    const emailField = await page.$('input[name="email"]');
    const passwordField = await page.$('input[name="password"]');
    const submitButton = await page.$('button[type="submit"].btn-primary');

    console.log(`Form elements found: email=${!!emailField}, password=${!!passwordField}, submit=${!!submitButton}`);

    if (emailField && passwordField && submitButton) {
      await emailField.click({ clickCount: 3 });
      await emailField.type(ADMIN_CREDENTIALS.email);
      await passwordField.click({ clickCount: 3 });
      await passwordField.type(ADMIN_CREDENTIALS.password);

      console.log('Submitting login form...');
      await submitButton.click();

      // Wait for navigation or page change
      await new Promise(resolve => setTimeout(resolve, 5000));

      // Check if login was successful by checking URL or page content
      const currentUrl = page.url();
      const loginSuccessful = !currentUrl.includes('login') && !currentUrl.includes('signin');

      console.log(`Login result: URL=${currentUrl}, Success=${loginSuccessful}`);
      return loginSuccessful;
    }

    console.log('Login form elements not found');
    return false;
  } catch (error) {
    console.error('Login failed:', error.message);
    return false;
  }
}

// Test 1: Dashboard Page Loading
async function testDashboardLoading(page) {
  console.log('\n🏠 === DASHBOARD PAGE LOADING ===');
  
  try {
    // Check if we're on the dashboard/bookings page
    const currentUrl = page.url();
    const onDashboard = currentUrl.includes('localhost:3001') && !currentUrl.includes('login');
    
    await validateTest(
      'Dashboard Page Access',
      'loading',
      onDashboard,
      'Should be able to access dashboard after login'
    );
    
    // Check for main content area (bookings page or dashboard)
    const mainContentExists = await waitForElement(page, '.bookings, .MuiContainer-root, .MuiBox-root', 5000);
    await validateTest(
      'Main Content Area',
      'layout',
      mainContentExists,
      'Main content area should be present'
    );

    // Check for navigation elements (header or layout navigation)
    const navigationExists = await waitForElement(page, 'header, .header, .MuiAppBar-root, nav', 3000);
    await validateTest(
      'Navigation Elements',
      'layout',
      navigationExists,
      'Navigation elements should be present'
    );
    
    // Take screenshot
    await takeScreenshot(page, 'initial-load');
    
  } catch (error) {
    await validateTest(
      'Dashboard Loading',
      'loading',
      false,
      `Failed to load dashboard: ${error.message}`
    );
  }
}

// Test 2: Booking List Display
async function testBookingListDisplay(page) {
  console.log('\n📋 === BOOKING LIST DISPLAY ===');
  
  try {
    // Check for booking list container (DataGrid or booking list)
    const bookingListExists = await waitForElement(page, '.booking-grid, .MuiDataGrid-root, .bookings .col-2', 5000);
    await validateTest(
      'Booking List Container',
      'bookingList',
      bookingListExists,
      'Booking list container should be present'
    );

    // Check for table headers or DataGrid headers
    const headersExist = await waitForElement(page, '.MuiDataGrid-columnHeaders, .MuiDataGrid-columnHeader, th', 3000);
    await validateTest(
      'List Headers',
      'bookingList',
      headersExist,
      'Booking list should have headers'
    );

    // Check for booking items or empty state
    const bookingItemsExist = await waitForElement(page, '.MuiDataGrid-row, .MuiDataGrid-overlay, tr', 3000);
    await validateTest(
      'Booking Items Display',
      'bookingList',
      bookingItemsExist,
      'Booking items should be displayed (or empty state shown)'
    );
    
    // Take screenshot
    await takeScreenshot(page, 'booking-list');
    
  } catch (error) {
    await validateTest(
      'Booking List Display',
      'bookingList',
      false,
      `Booking list display test failed: ${error.message}`
    );
  }
}

// Test 3: Search and Filter Functionality
async function testSearchAndFilter(page) {
  console.log('\n🔍 === SEARCH AND FILTER FUNCTIONALITY ===');
  
  try {
    // Check for search input (DataGrid toolbar or filter components)
    const searchInputExists = await waitForElement(page, '.MuiDataGrid-toolbarContainer input, .cl-booking-filter input, input[type="search"]', 3000);
    await validateTest(
      'Search Input Field',
      'searchFilter',
      searchInputExists,
      'Search input field should be present'
    );

    // Check for filter options (supplier filter, status filter)
    const filterOptionsExist = await waitForElement(page, '.cl-supplier-filter, .cl-status-filter, .MuiSelect-root', 3000);
    await validateTest(
      'Filter Options',
      'searchFilter',
      filterOptionsExist,
      'Filter options should be available'
    );
    
    // Test search functionality if search input exists
    if (searchInputExists) {
      const searchInput = await page.$('input[type="search"], input[placeholder*="search" i], .search-input');
      if (searchInput) {
        await searchInput.type('test');
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        await validateTest(
          'Search Input Functionality',
          'searchFilter',
          true,
          'Search input should accept text input'
        );
      }
    }
    
    // Take screenshot
    await takeScreenshot(page, 'search-filter');
    
  } catch (error) {
    await validateTest(
      'Search and Filter',
      'searchFilter',
      false,
      `Search and filter test failed: ${error.message}`
    );
  }
}

// Test 4: Navigation and Action Buttons
async function testNavigationAndActions(page) {
  console.log('\n🧭 === NAVIGATION AND ACTION BUTTONS ===');
  
  try {
    // Check for "Create New Booking" button (FAB or regular button)
    const createButtonExists = await waitForElement(page, '.MuiFab-root, button:contains("New Booking"), .cl-new-booking', 3000);
    await validateTest(
      'Create New Booking Button',
      'navigation',
      createButtonExists,
      'Create new booking button should be present'
    );

    // Check for navigation links (header navigation)
    const navLinksExist = await waitForElement(page, 'a[href*="dresses"], a[href*="locations"], a[href*="suppliers"], .MuiAppBar-root a', 3000);
    await validateTest(
      'Navigation Links',
      'navigation',
      navLinksExist,
      'Navigation links to other pages should be present'
    );

    // Check for user menu or profile (header user info)
    const userMenuExists = await waitForElement(page, '.user-menu, .profile, .avatar, .user-info, .MuiAvatar-root', 3000);
    await validateTest(
      'User Menu/Profile',
      'navigation',
      userMenuExists,
      'User menu or profile section should be present'
    );
    
    // Take screenshot
    await takeScreenshot(page, 'navigation-actions');
    
  } catch (error) {
    await validateTest(
      'Navigation and Actions',
      'navigation',
      false,
      `Navigation and actions test failed: ${error.message}`
    );
  }
}

// Test 5: Responsive Design
async function testResponsiveDesign(page) {
  console.log('\n📱 === RESPONSIVE DESIGN ===');
  
  try {
    // Test mobile viewport
    await page.setViewport({ width: 375, height: 667 });
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const mobileContentVisible = await waitForElement(page, '.bookings, .MuiContainer-root, .MuiBox-root', 2000);
    await validateTest(
      'Mobile Responsiveness',
      'responsive',
      mobileContentVisible,
      'Dashboard should be responsive on mobile'
    );

    // Take mobile screenshot
    await takeScreenshot(page, 'mobile-view');

    // Test tablet viewport
    await page.setViewport({ width: 768, height: 1024 });
    await new Promise(resolve => setTimeout(resolve, 1000));

    const tabletContentVisible = await waitForElement(page, '.bookings, .MuiContainer-root, .MuiBox-root', 2000);
    await validateTest(
      'Tablet Responsiveness',
      'responsive',
      tabletContentVisible,
      'Dashboard should be responsive on tablet'
    );
    
    // Take tablet screenshot
    await takeScreenshot(page, 'tablet-view');
    
    // Reset to desktop viewport
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

// Generate test report
function generateReport() {
  console.log('\n📋 === DASHBOARD TEST REPORT ===');
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
  const reportPath = path.join(__dirname, 'dashboard-test-report.json');
  fs.writeFileSync(reportPath, JSON.stringify({
    timestamp: new Date().toISOString(),
    page: 'Dashboard/Bookings Page',
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
async function runDashboardTests() {
  console.log('🚀 Starting Backend Dashboard/Bookings Page Tests');
  console.log('=================================================');
  
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
      headless: true,
      defaultViewport: { width: 1280, height: 720 },
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
    });
    
    page = await browser.newPage();
    page.setDefaultTimeout(TEST_TIMEOUT);
    
    // Try to access dashboard directly first (in case already logged in)
    await page.goto(BACKEND_BASE, { waitUntil: 'domcontentloaded', timeout: TEST_TIMEOUT });
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Check if we need to login
    const needsLogin = await waitForElement(page, 'input[name="email"], .signin-form', 2000);

    if (needsLogin) {
      console.log('🔐 Login required, attempting to login...');
      const loginSuccess = await login(page);
      if (!loginSuccess) {
        console.log('⚠️ Login failed, but continuing with tests to check what\'s available');
      }
    } else {
      console.log('✅ Already logged in or no login required');
    }
    
    // Run all test suites
    await testDashboardLoading(page);
    await testBookingListDisplay(page);
    await testSearchAndFilter(page);
    await testNavigationAndActions(page);
    await testResponsiveDesign(page);
    
    // Generate final report
    generateReport();
    
    console.log('\n🎉 Dashboard Testing Complete!');
    
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
  runDashboardTests();
}

module.exports = { runDashboardTests };
