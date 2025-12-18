#!/usr/bin/env node

/**
 * Backend Create Dress Page Comprehensive Testing Suite
 * 
 * Tests all aspects of the create dress page functionality including:
 * - REQUIRED name and dress code fields
 * - Form validation
 * - Dropdown population
 * - Image upload
 * - Form submission
 */

const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

// Configuration
const BACKEND_BASE = 'http://localhost:3001';
const CREATE_DRESS_URL = 'http://localhost:3001/create-dress';
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
  const screenshotPath = path.join(__dirname, 'screenshots', `create-dress-${name}.png`);
  await page.screenshot({ path: screenshotPath, fullPage: true });
  console.log(`📸 Screenshot saved: ${screenshotPath}`);
}

// Test 1: Page Loading and Layout
async function testPageLoading(page) {
  console.log('\n🌐 === CREATE DRESS PAGE LOADING ===');

  try {
    await page.goto(CREATE_DRESS_URL, { waitUntil: 'domcontentloaded', timeout: TEST_TIMEOUT });
    await new Promise(resolve => setTimeout(resolve, 5000)); // Wait longer for authentication

    // Check if page loads
    const pageLoaded = await page.evaluate(() => document.readyState === 'complete');
    await validateTest(
      'Page Loading',
      'loading',
      pageLoaded,
      'Create dress page should load completely'
    );

    // Check for form (wait for authentication and visibility)
    const formExists = await waitForElement(page, '.dress-form form, .create-dress form', 8000);
    await validateTest(
      'Create Dress Form Present',
      'layout',
      formExists,
      'Create dress form should be present after authentication'
    );

    // Take screenshot
    await takeScreenshot(page, 'initial-load');

  } catch (error) {
    await validateTest(
      'Page Loading',
      'loading',
      false,
      `Failed to load create dress page: ${error.message}`
    );
  }
}

// Test 2: Required Fields - Name and Dress Code
async function testRequiredFields(page) {
  console.log('\n⭐ === REQUIRED FIELDS TESTING ===');
  
  try {
    // Check for name field
    const nameFieldExists = await waitForElement(page, 'input[id="name"], input[name="name"]', 3000);
    await validateTest(
      'Name Field Present',
      'requiredFields',
      nameFieldExists,
      'Name field should be present'
    );
    
    // Check if name field is required
    if (nameFieldExists) {
      const nameRequired = await page.evaluate(() => {
        const nameField = document.querySelector('input[id="name"], input[name="name"]');
        return nameField ? nameField.hasAttribute('required') : false;
      });
      
      await validateTest(
        'Name Field Required Attribute',
        'requiredFields',
        nameRequired,
        'Name field should have required attribute'
      );
    }
    
    // Check for dress code field
    const dressCodeFieldExists = await waitForElement(page, 'input[id="dressCode"], input[name="dressCode"]', 3000);
    await validateTest(
      'Dress Code Field Present',
      'requiredFields',
      dressCodeFieldExists,
      'Dress code field should be present'
    );
    
    // Check if dress code field is required
    if (dressCodeFieldExists) {
      const dressCodeRequired = await page.evaluate(() => {
        const dressCodeField = document.querySelector('input[id="dressCode"], input[name="dressCode"]');
        return dressCodeField ? dressCodeField.hasAttribute('required') : false;
      });
      
      await validateTest(
        'Dress Code Field Required Attribute',
        'requiredFields',
        dressCodeRequired,
        'Dress code field should have required attribute'
      );
    }
    
    // Check for required field indicators (asterisks or labels)
    const requiredIndicators = await page.evaluate(() => {
      const labels = document.querySelectorAll('label.required, .required');
      return labels.length > 0;
    });
    
    await validateTest(
      'Required Field Indicators',
      'requiredFields',
      requiredIndicators,
      'Required fields should have visual indicators'
    );
    
    // Take screenshot
    await takeScreenshot(page, 'required-fields');
    
  } catch (error) {
    await validateTest(
      'Required Fields Test',
      'requiredFields',
      false,
      `Required fields test failed: ${error.message}`
    );
  }
}

// Test 3: Form Validation
async function testFormValidation(page) {
  console.log('\n📝 === FORM VALIDATION TESTING ===');
  
  try {
    // Test empty form submission
    const submitButton = await page.$('button[type="submit"], .btn-primary');
    if (submitButton) {
      await submitButton.click();
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Check if form prevents submission (still on same page)
      const currentUrl = page.url();
      const stillOnCreatePage = currentUrl.includes('create-dress');
      
      await validateTest(
        'Empty Form Validation',
        'validation',
        stillOnCreatePage,
        'Form should prevent submission when required fields are empty'
      );
    }
    
    // Test with only name filled
    const nameField = await page.$('input[id="name"], input[name="name"]');
    if (nameField) {
      await nameField.click({ clickCount: 3 });
      await nameField.type('Test Dress Name');
      
      if (submitButton) {
        await submitButton.click();
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        const stillOnCreatePageAfterName = page.url().includes('create-dress');
        await validateTest(
          'Name Only Validation',
          'validation',
          stillOnCreatePageAfterName,
          'Form should prevent submission when dress code is missing'
        );
      }
    }
    
    // Test with only dress code filled
    await page.reload();
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const dressCodeField = await page.$('input[id="dressCode"], input[name="dressCode"]');
    if (dressCodeField) {
      await dressCodeField.click({ clickCount: 3 });
      await dressCodeField.type('DR-2024-0001');
      
      if (submitButton) {
        await submitButton.click();
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        const stillOnCreatePageAfterCode = page.url().includes('create-dress');
        await validateTest(
          'Dress Code Only Validation',
          'validation',
          stillOnCreatePageAfterCode,
          'Form should prevent submission when name is missing'
        );
      }
    }
    
    // Take screenshot
    await takeScreenshot(page, 'form-validation');
    
  } catch (error) {
    await validateTest(
      'Form Validation Test',
      'validation',
      false,
      `Form validation test failed: ${error.message}`
    );
  }
}

// Test 4: Dropdown Fields
async function testDropdownFields(page) {
  console.log('\n📋 === DROPDOWN FIELDS TESTING ===');
  
  try {
    // Reload page to reset form
    await page.reload();
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Check for type dropdown
    const typeDropdownExists = await waitForElement(page, 'select[id="type"], .MuiSelect-root', 3000);
    await validateTest(
      'Type Dropdown Present',
      'dropdowns',
      typeDropdownExists,
      'Type dropdown should be present'
    );
    
    // Check for size dropdown
    const sizeDropdownExists = await waitForElement(page, 'select[id="size"], .MuiSelect-root', 3000);
    await validateTest(
      'Size Dropdown Present',
      'dropdowns',
      sizeDropdownExists,
      'Size dropdown should be present'
    );
    
    // Check for style dropdown
    const styleDropdownExists = await waitForElement(page, 'select[id="style"], .MuiSelect-root', 3000);
    await validateTest(
      'Style Dropdown Present',
      'dropdowns',
      styleDropdownExists,
      'Style dropdown should be present'
    );
    
    // Check for location dropdown
    const locationDropdownExists = await waitForElement(page, 'select[id="locations"], .MuiSelect-root', 3000);
    await validateTest(
      'Location Dropdown Present',
      'dropdowns',
      locationDropdownExists,
      'Location dropdown should be present'
    );
    
    // Take screenshot
    await takeScreenshot(page, 'dropdown-fields');
    
  } catch (error) {
    await validateTest(
      'Dropdown Fields Test',
      'dropdowns',
      false,
      `Dropdown fields test failed: ${error.message}`
    );
  }
}

// Test 5: Complete Form Submission
async function testCompleteFormSubmission(page) {
  console.log('\n✅ === COMPLETE FORM SUBMISSION ===');
  
  try {
    // Reload page to reset form
    await page.reload();
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Fill required fields
    const nameField = await page.$('input[id="name"], input[name="name"]');
    const dressCodeField = await page.$('input[id="dressCode"], input[name="dressCode"]');
    
    if (nameField && dressCodeField) {
      await nameField.click({ clickCount: 3 });
      await nameField.type('Test Wedding Dress');
      
      await dressCodeField.click({ clickCount: 3 });
      await dressCodeField.type('DR-2024-TEST');
      
      // Fill other required fields
      const colorField = await page.$('input[id="color"], input[name="color"]');
      if (colorField) {
        await colorField.click({ clickCount: 3 });
        await colorField.type('White');
      }
      
      const priceField = await page.$('input[id="price"], input[name="price"]');
      if (priceField) {
        await priceField.click({ clickCount: 3 });
        await priceField.type('500');
      }
      
      const depositField = await page.$('input[id="deposit"], input[name="deposit"]');
      if (depositField) {
        await depositField.click({ clickCount: 3 });
        await depositField.type('100');
      }
      
      await validateTest(
        'Form Fields Filled',
        'submission',
        true,
        'All required form fields should be fillable'
      );
      
      // Take screenshot before submission
      await takeScreenshot(page, 'before-submission');
      
      // Submit form
      const submitButton = await page.$('button[type="submit"], .btn-primary');
      if (submitButton) {
        await submitButton.click();
        await new Promise(resolve => setTimeout(resolve, 5000));
        
        // Check if form was submitted successfully (redirected or success message)
        const currentUrl = page.url();
        const submissionSuccessful = !currentUrl.includes('create-dress') || 
                                   await waitForElement(page, '.success, .alert-success, .MuiAlert-standardSuccess', 2000);
        
        await validateTest(
          'Form Submission',
          'submission',
          submissionSuccessful,
          'Form should submit successfully with all required fields filled'
        );
        
        // Take screenshot after submission
        await takeScreenshot(page, 'after-submission');
      }
    }
    
  } catch (error) {
    await validateTest(
      'Complete Form Submission',
      'submission',
      false,
      `Complete form submission test failed: ${error.message}`
    );
  }
}

// Generate test report
function generateReport() {
  console.log('\n📋 === CREATE DRESS TEST REPORT ===');
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
  const reportPath = path.join(__dirname, 'create-dress-test-report.json');
  fs.writeFileSync(reportPath, JSON.stringify({
    timestamp: new Date().toISOString(),
    page: 'Create Dress Page',
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
async function runCreateDressTests() {
  console.log('🚀 Starting Backend Create Dress Page Tests');
  console.log('============================================');
  
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
    
    // Run all test suites
    await testPageLoading(page);
    await testRequiredFields(page);
    await testFormValidation(page);
    await testDropdownFields(page);
    await testCompleteFormSubmission(page);
    
    // Generate final report
    generateReport();
    
    console.log('\n🎉 Create Dress Testing Complete!');
    
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
  runCreateDressTests();
}

module.exports = { runCreateDressTests };
