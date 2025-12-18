#!/usr/bin/env node

/**
 * Backend UI End-to-End Testing Suite
 * 
 * This script performs comprehensive UI testing on the backend application
 * to ensure all functionality works correctly at the user level.
 */

const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

// Configuration
const BACKEND_BASE = 'http://localhost:3001';
const TEST_TIMEOUT = 30000;

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
  const screenshotPath = path.join(__dirname, 'screenshots', `${name}.png`);
  await page.screenshot({ path: screenshotPath, fullPage: true });
  console.log(`📸 Screenshot saved: ${screenshotPath}`);
}

// Test 1: Backend Application Loading
async function testBackendLoading(page) {
  console.log('\n🌐 === BACKEND APPLICATION LOADING ===');
  
  try {
    await page.goto(BACKEND_BASE, { waitUntil: 'networkidle2', timeout: TEST_TIMEOUT });
    
    // Check if login page loads
    const loginFormExists = await waitForElement(page, 'form', 5000);
    await validateTest(
      'Backend Application Loading',
      'infrastructure',
      loginFormExists,
      'Backend application should load successfully'
    );
    
    // Take screenshot
    await takeScreenshot(page, 'backend-login-page');
    
  } catch (error) {
    await validateTest(
      'Backend Application Loading',
      'infrastructure',
      false,
      `Failed to load backend: ${error.message}`
    );
  }
}

// Test 2: Authentication Flow
async function testAuthentication(page) {
  console.log('\n🔐 === AUTHENTICATION FLOW ===');

  try {
    // Debug: Check what elements are available
    const emailSelectors = [
      'input[type="email"]',
      'input[name="email"]',
      'input[id="email"]',
      '#email',
      '.email-input',
      'input[placeholder*="email" i]'
    ];

    const passwordSelectors = [
      'input[type="password"]',
      'input[name="password"]',
      'input[id="password"]',
      '#password',
      '.password-input'
    ];

    let emailField = null;
    let passwordField = null;

    // Try to find email field
    for (const selector of emailSelectors) {
      if (await waitForElement(page, selector, 1000)) {
        emailField = selector;
        break;
      }
    }

    // Try to find password field
    for (const selector of passwordSelectors) {
      if (await waitForElement(page, selector, 1000)) {
        passwordField = selector;
        break;
      }
    }

    if (emailField && passwordField) {
      // Fill login form
      await page.type(emailField, ADMIN_CREDENTIALS.email);
      await page.type(passwordField, ADMIN_CREDENTIALS.password);

      // Submit form
      await page.click('button[type="submit"], .btn-primary, .login-button, button:contains("Sign"), button:contains("Login")');

      // Wait for navigation to dashboard
      await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: TEST_TIMEOUT });

      // Check if dashboard loads
      const dashboardExists = await waitForElement(page, '.dashboard, .bookings, [data-testid="dashboard"], .main-content', 10000);
      await validateTest(
        'Admin Authentication',
        'authentication',
        dashboardExists,
        'Admin should be able to login and access dashboard'
      );

      // Take screenshot
      await takeScreenshot(page, 'backend-dashboard');
    } else {
      await validateTest(
        'Admin Authentication',
        'authentication',
        false,
        `Login form fields not found. Email: ${emailField}, Password: ${passwordField}`
      );
    }

  } catch (error) {
    await validateTest(
      'Admin Authentication',
      'authentication',
      false,
      `Authentication failed: ${error.message}`
    );
  }
}

// Test 3: Navigation and Menu
async function testNavigation(page) {
  console.log('\n🧭 === NAVIGATION TESTING ===');
  
  try {
    // Test main navigation items
    const navItems = [
      { selector: 'a[href="/"], a[href="#/"]', name: 'Dashboard/Bookings' },
      { selector: 'a[href="/dresses"], a[href="#/dresses"]', name: 'Dresses' },
      { selector: 'a[href="/locations"], a[href="#/locations"]', name: 'Locations' },
      { selector: 'a[href="/suppliers"], a[href="#/suppliers"]', name: 'Suppliers' }
    ];
    
    for (const item of navItems) {
      const exists = await waitForElement(page, item.selector, 2000);
      await validateTest(
        `Navigation - ${item.name}`,
        'navigation',
        exists,
        `${item.name} navigation should be available`
      );
    }
    
  } catch (error) {
    await validateTest(
      'Navigation Testing',
      'navigation',
      false,
      `Navigation test failed: ${error.message}`
    );
  }
}

// Test 4: Dress Management
async function testDressManagement(page) {
  console.log('\n👗 === DRESS MANAGEMENT ===');
  
  try {
    // Navigate to dresses page
    await page.click('a[href="/dresses"], a[href="#/dresses"]');
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Check if dresses page loads
    const dressesPageExists = await waitForElement(page, '.dresses, [data-testid="dresses"]', 5000);
    await validateTest(
      'Dresses Page Loading',
      'dressManagement',
      dressesPageExists,
      'Dresses page should load successfully'
    );
    
    // Test create dress button
    const createButtonExists = await waitForElement(page, 'a[href="/create-dress"], button:contains("New"), button:contains("Create")', 3000);
    await validateTest(
      'Create Dress Button',
      'dressManagement',
      createButtonExists,
      'Create dress button should be available'
    );
    
    // Take screenshot
    await takeScreenshot(page, 'backend-dresses-page');
    
    // Test dress creation form (if create button exists)
    if (createButtonExists) {
      await page.click('a[href="/create-dress"], button:contains("New"), button:contains("Create")');
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Check if create form loads
      const createFormExists = await waitForElement(page, 'form, .dress-form', 5000);
      await validateTest(
        'Create Dress Form',
        'dressManagement',
        createFormExists,
        'Create dress form should load'
      );
      
      // Test required fields
      const nameFieldExists = await waitForElement(page, 'input[id="name"], input[name="name"]', 2000);
      const dressCodeFieldExists = await waitForElement(page, 'input[id="dressCode"], input[name="dressCode"]', 2000);
      
      await validateTest(
        'Required Fields - Name',
        'dressManagement',
        nameFieldExists,
        'Dress name field should be present'
      );
      
      await validateTest(
        'Required Fields - Dress Code',
        'dressManagement',
        dressCodeFieldExists,
        'Dress code field should be present'
      );
      
      // Take screenshot
      await takeScreenshot(page, 'backend-create-dress-form');
    }
    
  } catch (error) {
    await validateTest(
      'Dress Management',
      'dressManagement',
      false,
      `Dress management test failed: ${error.message}`
    );
  }
}

// Test 5: Booking Management
async function testBookingManagement(page) {
  console.log('\n📅 === BOOKING MANAGEMENT ===');
  
  try {
    // Navigate to bookings/dashboard
    await page.click('a[href="/"], a[href="#/"]');
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Check if bookings page loads
    const bookingsPageExists = await waitForElement(page, '.bookings, [data-testid="bookings"], .dashboard', 5000);
    await validateTest(
      'Bookings Page Loading',
      'bookingManagement',
      bookingsPageExists,
      'Bookings page should load successfully'
    );
    
    // Test create booking functionality
    const createBookingExists = await waitForElement(page, 'a[href="/create-booking"], button:contains("New Booking"), button:contains("Create")', 3000);
    await validateTest(
      'Create Booking Button',
      'bookingManagement',
      createBookingExists,
      'Create booking functionality should be available'
    );
    
    // Take screenshot
    await takeScreenshot(page, 'backend-bookings-page');
    
  } catch (error) {
    await validateTest(
      'Booking Management',
      'bookingManagement',
      false,
      `Booking management test failed: ${error.message}`
    );
  }
}

// Test 6: Data Loading and Display
async function testDataLoading(page) {
  console.log('\n📊 === DATA LOADING AND DISPLAY ===');
  
  try {
    // Test if data tables/lists load
    const dataContainerExists = await waitForElement(page, 'table, .list, .grid, .data-container', 5000);
    await validateTest(
      'Data Container Loading',
      'dataLoading',
      dataContainerExists,
      'Data containers should load properly'
    );
    
    // Test if dropdowns populate
    await new Promise(resolve => setTimeout(resolve, 2000));
    const dropdownExists = await waitForElement(page, 'select, .MuiSelect-root, .dropdown', 3000);
    await validateTest(
      'Dropdown Components',
      'dataLoading',
      dropdownExists,
      'Dropdown components should be present'
    );
    
  } catch (error) {
    await validateTest(
      'Data Loading',
      'dataLoading',
      false,
      `Data loading test failed: ${error.message}`
    );
  }
}

// Generate test report
function generateReport() {
  console.log('\n📋 === BACKEND UI TEST REPORT ===');
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
  const reportPath = path.join(__dirname, 'backend-ui-test-report.json');
  fs.writeFileSync(reportPath, JSON.stringify({
    timestamp: new Date().toISOString(),
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
async function runBackendUITests() {
  console.log('🚀 Starting Backend UI End-to-End Tests');
  console.log('==========================================');
  
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
      headless: false, // Set to true for headless mode
      defaultViewport: { width: 1280, height: 720 },
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    page = await browser.newPage();
    
    // Set longer timeout for page operations
    page.setDefaultTimeout(TEST_TIMEOUT);
    
    // Run all test suites
    await testBackendLoading(page);
    await testAuthentication(page);
    await testNavigation(page);
    await testDressManagement(page);
    await testBookingManagement(page);
    await testDataLoading(page);
    
    // Generate final report
    generateReport();
    
    console.log('\n🎉 Backend UI Testing Complete!');
    
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
  runBackendUITests();
}

module.exports = { runBackendUITests };
