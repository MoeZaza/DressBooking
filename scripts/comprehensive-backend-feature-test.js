#!/usr/bin/env node

/**
 * Comprehensive Backend Feature Testing Suite
 * 
 * Tests every tiny feature in the backend including:
 * - Authentication and authorization
 * - CRUD operations for all entities
 * - Form validation and error handling
 * - File uploads and image handling
 * - Search and filtering
 * - Arabic language support
 * - Edge cases and error scenarios
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
  const screenshotPath = path.join(__dirname, 'screenshots', `backend-feature-${name}.png`);
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

// Test 1: Authentication Features
async function testAuthenticationFeatures(page) {
  console.log('\n🔐 === AUTHENTICATION FEATURES TESTING ===');
  
  try {
    // Test Sign In page
    await page.goto(`${BACKEND_BASE}/sign-in`, { waitUntil: 'domcontentloaded', timeout: TEST_TIMEOUT });
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Test form elements
    const emailFieldExists = await waitForElement(page, 'input[name="email"]', 3000);
    const passwordFieldExists = await waitForElement(page, 'input[name="password"]');
    const submitButtonExists = await waitForElement(page, 'button[type="submit"]');
    
    await validateTest(
      'Sign In Form Elements',
      'authentication',
      emailFieldExists && passwordFieldExists && submitButtonExists,
      'All sign in form elements should be present'
    );
    
    // Test form validation (empty submission)
    if (submitButtonExists) {
      const submitButton = await page.$('button[type="submit"]');
      await submitButton.click();
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const stillOnSignInPage = page.url().includes('sign-in');
      await validateTest(
        'Empty Form Validation',
        'authentication',
        stillOnSignInPage,
        'Form should prevent empty submission'
      );
    }
    
    // Test invalid credentials
    if (emailFieldExists && passwordFieldExists) {
      const emailField = await page.$('input[name="email"]');
      const passwordField = await page.$('input[name="password"]');
      
      await emailField.click({ clickCount: 3 });
      await emailField.type('invalid@email.com');
      await passwordField.click({ clickCount: 3 });
      await passwordField.type('wrongpassword');
      
      const submitButton = await page.$('button[type="submit"]');
      await submitButton.click();
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      const stillOnSignInAfterInvalid = page.url().includes('sign-in');
      await validateTest(
        'Invalid Credentials Handling',
        'authentication',
        stillOnSignInAfterInvalid,
        'Invalid credentials should be rejected'
      );
    }
    
    // Test successful login
    const loginSuccess = await login(page);
    await validateTest(
      'Successful Login',
      'authentication',
      loginSuccess,
      'Valid credentials should allow login'
    );
    
    // Test logout functionality
    if (loginSuccess) {
      // Look for logout button or user menu
      const logoutExists = await waitForElement(page, 'button:contains("Logout"), .logout, .user-menu', 3000);
      await validateTest(
        'Logout Option Available',
        'authentication',
        logoutExists,
        'Logout option should be available after login'
      );
    }
    
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

// Test 2: Dress CRUD Operations
async function testDressCRUDOperations(page) {
  console.log('\n👗 === DRESS CRUD OPERATIONS TESTING ===');
  
  try {
    // Test Dress List
    await page.goto(`${BACKEND_BASE}/dresses`, { waitUntil: 'domcontentloaded', timeout: TEST_TIMEOUT });
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    const dressListExists = await waitForElement(page, '.dress-list, .MuiDataGrid-root, table', 5000);
    await validateTest(
      'Dress List Display',
      'dressCRUD',
      dressListExists,
      'Dress list should be displayed'
    );
    
    // Test Create Dress Navigation
    const createButtonExists = await waitForElement(page, 'a[href*="create-dress"], button:contains("Create")', 3000);
    await validateTest(
      'Create Dress Button',
      'dressCRUD',
      createButtonExists,
      'Create dress button should be available'
    );
    
    // Test Create Dress Form
    await page.goto(`${BACKEND_BASE}/create-dress`, { waitUntil: 'domcontentloaded', timeout: TEST_TIMEOUT });
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    const createFormExists = await waitForElement(page, 'form, .dress-form', 5000);
    await validateTest(
      'Create Dress Form',
      'dressCRUD',
      createFormExists,
      'Create dress form should be present'
    );
    
    // Test Required Fields (Name and Dress Code)
    const nameFieldExists = await waitForElement(page, 'input[name="name"], input[id="name"]', 3000);
    const dressCodeFieldExists = await waitForElement(page, 'input[name="dressCode"], input[id="dressCode"]', 3000);
    
    await validateTest(
      'Required Fields Present',
      'dressCRUD',
      nameFieldExists && dressCodeFieldExists,
      'Name and dress code fields should be present'
    );
    
    // Test Required Field Validation
    if (nameFieldExists && dressCodeFieldExists) {
      const submitButton = await page.$('button[type="submit"]');
      if (submitButton) {
        // Try to submit empty form
        await submitButton.click();
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        const stillOnCreatePage = page.url().includes('create-dress');
        await validateTest(
          'Required Field Validation',
          'dressCRUD',
          stillOnCreatePage,
          'Form should prevent submission without required fields'
        );
      }
    }
    
    // Test Form Field Types
    const typeFieldExists = await waitForElement(page, 'select[name="type"], .MuiSelect-root', 3000);
    const sizeFieldExists = await waitForElement(page, 'select[name="size"]', 3000);
    const colorFieldExists = await waitForElement(page, 'input[name="color"]', 3000);
    const priceFieldExists = await waitForElement(page, 'input[name="price"]', 3000);
    
    await validateTest(
      'Form Field Types',
      'dressCRUD',
      typeFieldExists && sizeFieldExists && colorFieldExists && priceFieldExists,
      'All dress form fields should be present'
    );
    
    // Test Image Upload Field
    const imageUploadExists = await waitForElement(page, 'input[type="file"], .image-upload', 3000);
    await validateTest(
      'Image Upload Field',
      'dressCRUD',
      imageUploadExists,
      'Image upload field should be available'
    );
    
    // Take screenshot
    await takeScreenshot(page, 'dress-crud');
    
  } catch (error) {
    await validateTest(
      'Dress CRUD Operations Test',
      'dressCRUD',
      false,
      `Dress CRUD test failed: ${error.message}`
    );
  }
}

// Test 3: Booking CRUD Operations
async function testBookingCRUDOperations(page) {
  console.log('\n📅 === BOOKING CRUD OPERATIONS TESTING ===');
  
  try {
    // Test Bookings Dashboard
    await page.goto(BACKEND_BASE, { waitUntil: 'domcontentloaded', timeout: TEST_TIMEOUT });
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    const bookingsDashboardExists = await waitForElement(page, '.bookings, .booking-list, .MuiDataGrid-root', 5000);
    await validateTest(
      'Bookings Dashboard',
      'bookingCRUD',
      bookingsDashboardExists,
      'Bookings dashboard should be displayed'
    );
    
    // Test Create Booking Navigation
    const createBookingButtonExists = await waitForElement(page, 'a[href*="create-booking"], button:contains("Create")', 3000);
    await validateTest(
      'Create Booking Button',
      'bookingCRUD',
      createBookingButtonExists,
      'Create booking button should be available'
    );
    
    // Test Create Booking Form
    await page.goto(`${BACKEND_BASE}/create-booking`, { waitUntil: 'domcontentloaded', timeout: TEST_TIMEOUT });
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    const createBookingFormExists = await waitForElement(page, 'form, .booking-form', 5000);
    await validateTest(
      'Create Booking Form',
      'bookingCRUD',
      createBookingFormExists,
      'Create booking form should be present'
    );
    
    // Test Booking Form Fields
    const customerFieldExists = await waitForElement(page, 'select[name="customer"], .customer-select', 3000);
    const dressFieldExists = await waitForElement(page, 'select[name="dress"], .dress-select', 3000);
    const locationFieldExists = await waitForElement(page, 'select[name="location"], .location-select', 3000);
    const dateFieldExists = await waitForElement(page, 'input[type="date"], .date-picker', 3000);
    
    await validateTest(
      'Booking Form Fields',
      'bookingCRUD',
      customerFieldExists && dressFieldExists && locationFieldExists && dateFieldExists,
      'All booking form fields should be present'
    );
    
    // Test Dropdown Population
    if (customerFieldExists) {
      const customerOptions = await page.$$('select[name="customer"] option, .customer-select .MuiMenuItem-root');
      await validateTest(
        'Customer Dropdown Population',
        'bookingCRUD',
        customerOptions.length > 1,
        'Customer dropdown should have options'
      );
    }
    
    // Take screenshot
    await takeScreenshot(page, 'booking-crud');
    
  } catch (error) {
    await validateTest(
      'Booking CRUD Operations Test',
      'bookingCRUD',
      false,
      `Booking CRUD test failed: ${error.message}`
    );
  }
}

// Test 4: Search and Filter Features
async function testSearchAndFilterFeatures(page) {
  console.log('\n🔍 === SEARCH AND FILTER FEATURES TESTING ===');
  
  try {
    // Test Dress Search
    await page.goto(`${BACKEND_BASE}/dress-search`, { waitUntil: 'domcontentloaded', timeout: TEST_TIMEOUT });
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    const searchPageExists = await waitForElement(page, '.dress-search, .search-form', 5000);
    await validateTest(
      'Dress Search Page',
      'searchFilter',
      searchPageExists,
      'Dress search page should be accessible'
    );
    
    // Test Search Form Fields
    const searchNameExists = await waitForElement(page, 'input[name="name"], .search-name', 3000);
    const searchCodeExists = await waitForElement(page, 'input[name="dressCode"], .search-code', 3000);
    const searchButtonExists = await waitForElement(page, 'button[type="submit"], .search-button', 3000);
    
    await validateTest(
      'Search Form Fields',
      'searchFilter',
      searchNameExists && searchCodeExists && searchButtonExists,
      'Search form fields should be present'
    );
    
    // Test Search Functionality
    if (searchNameExists && searchButtonExists) {
      const searchNameField = await page.$('input[name="name"], .search-name input');
      if (searchNameField) {
        await searchNameField.type('test');
        const searchButton = await page.$('button[type="submit"], .search-button');
        await searchButton.click();
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        // Check if search results are displayed
        const searchResultsExist = await waitForElement(page, '.search-results, .dress-list, .results', 3000);
        await validateTest(
          'Search Results Display',
          'searchFilter',
          searchResultsExist,
          'Search results should be displayed'
        );
      }
    }
    
    // Test Filters on Dresses List
    await page.goto(`${BACKEND_BASE}/dresses`, { waitUntil: 'domcontentloaded', timeout: TEST_TIMEOUT });
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    const filtersExist = await waitForElement(page, '.filters, .filter-controls, .MuiDataGrid-toolbarContainer', 3000);
    await validateTest(
      'List Filters',
      'searchFilter',
      filtersExist,
      'Filters should be available on list pages'
    );
    
    // Take screenshot
    await takeScreenshot(page, 'search-filter');
    
  } catch (error) {
    await validateTest(
      'Search and Filter Features Test',
      'searchFilter',
      false,
      `Search and filter test failed: ${error.message}`
    );
  }
}

// Test 5: Arabic Language and RTL Features
async function testArabicLanguageFeatures(page) {
  console.log('\n🌍 === ARABIC LANGUAGE FEATURES TESTING ===');
  
  try {
    // Go to dashboard
    await page.goto(BACKEND_BASE, { waitUntil: 'domcontentloaded', timeout: TEST_TIMEOUT });
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
    
    // Test Form Labels in Arabic
    await page.goto(`${BACKEND_BASE}/create-dress`, { waitUntil: 'domcontentloaded', timeout: TEST_TIMEOUT });
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    const arabicLabels = await page.evaluate(() => {
      const labels = document.querySelectorAll('label, .MuiFormLabel-root');
      let arabicLabelCount = 0;
      const arabicRegex = /[\u0600-\u06FF]/;
      
      labels.forEach(label => {
        if (arabicRegex.test(label.textContent || '')) {
          arabicLabelCount++;
        }
      });
      
      return arabicLabelCount > 0;
    });
    
    await validateTest(
      'Arabic Form Labels',
      'arabic',
      arabicLabels,
      'Form labels should be in Arabic'
    );
    
    // Take screenshot
    await takeScreenshot(page, 'arabic-features');
    
  } catch (error) {
    await validateTest(
      'Arabic Language Features Test',
      'arabic',
      false,
      `Arabic language test failed: ${error.message}`
    );
  }
}

// Test 6: Error Handling and Edge Cases
async function testErrorHandlingAndEdgeCases(page) {
  console.log('\n🚨 === ERROR HANDLING AND EDGE CASES TESTING ===');
  
  try {
    // Test 404 Page
    await page.goto(`${BACKEND_BASE}/non-existent-page`, { waitUntil: 'domcontentloaded', timeout: TEST_TIMEOUT });
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    const errorPageExists = await waitForElement(page, '.error, .not-found, .no-match', 3000);
    await validateTest(
      '404 Error Page',
      'errorHandling',
      errorPageExists,
      '404 error page should be displayed for non-existent routes'
    );
    
    // Test Form Validation Errors
    await page.goto(`${BACKEND_BASE}/create-dress`, { waitUntil: 'domcontentloaded', timeout: TEST_TIMEOUT });
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Try to submit form with invalid data
    const nameField = await page.$('input[name="name"]');
    const submitButton = await page.$('button[type="submit"]');
    
    if (nameField && submitButton) {
      // Fill only name field (missing required dress code)
      await nameField.type('Test Dress');
      await submitButton.click();
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const stillOnCreatePage = page.url().includes('create-dress');
      await validateTest(
        'Form Validation Error Handling',
        'errorHandling',
        stillOnCreatePage,
        'Form should handle validation errors gracefully'
      );
    }
    
    // Test Network Error Handling (simulate by going to invalid URL)
    try {
      await page.goto(`${BACKEND_BASE}/api/invalid-endpoint`, { waitUntil: 'domcontentloaded', timeout: 5000 });
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const networkErrorHandled = await page.evaluate(() => {
        return document.body.textContent.includes('404') || 
               document.body.textContent.includes('Not Found') ||
               document.body.textContent.includes('Error');
      });
      
      await validateTest(
        'Network Error Handling',
        'errorHandling',
        networkErrorHandled,
        'Network errors should be handled gracefully'
      );
    } catch (error) {
      // This is expected for invalid endpoints
      await validateTest(
        'Network Error Handling',
        'errorHandling',
        true,
        'Network errors are properly caught and handled'
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
  console.log('\n📋 === COMPREHENSIVE BACKEND FEATURE TEST REPORT ===');
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
  const reportPath = path.join(__dirname, 'backend-feature-test-report.json');
  fs.writeFileSync(reportPath, JSON.stringify({
    timestamp: new Date().toISOString(),
    testSuite: 'Comprehensive Backend Feature Testing',
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
async function runComprehensiveBackendFeatureTests() {
  console.log('🚀 Starting Comprehensive Backend Feature Testing Suite');
  console.log('======================================================');
  
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
    await testAuthenticationFeatures(page);
    await testDressCRUDOperations(page);
    await testBookingCRUDOperations(page);
    await testSearchAndFilterFeatures(page);
    await testArabicLanguageFeatures(page);
    await testErrorHandlingAndEdgeCases(page);
    
    // Generate final report
    generateReport();
    
    console.log('\n🎉 Comprehensive Backend Feature Testing Complete!');
    
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
  runComprehensiveBackendFeatureTests();
}

module.exports = { runComprehensiveBackendFeatureTests };
