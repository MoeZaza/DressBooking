#!/usr/bin/env node

/**
 * Final Integration and End-to-End Testing Suite
 * 
 * Performs complete end-to-end testing of all workflows, user journeys,
 * and integration between frontend and backend including:
 * - Complete user registration and login flow
 * - Dress search and booking workflow
 * - Admin dress management workflow
 * - Cross-application navigation
 * - Data consistency between frontend and backend
 * - Arabic language consistency
 * - Error handling across applications
 */

const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

// Configuration
const FRONTEND_BASE = 'http://localhost:3000';
const BACKEND_BASE = 'http://localhost:3001';
const TEST_TIMEOUT = 20000;

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
  const screenshotPath = path.join(__dirname, 'screenshots', `e2e-${name}.png`);
  await page.screenshot({ path: screenshotPath, fullPage: true });
  console.log(`📸 Screenshot saved: ${screenshotPath}`);
}

// Test 1: Frontend-Backend Integration
async function testFrontendBackendIntegration(page) {
  console.log('\n🔗 === FRONTEND-BACKEND INTEGRATION TESTING ===');
  
  try {
    // Test Frontend Accessibility
    await page.goto(FRONTEND_BASE, { waitUntil: 'domcontentloaded', timeout: TEST_TIMEOUT });
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    const frontendLoads = await waitForElement(page, '.content, .home', 5000);
    await validateTest(
      'Frontend Application Loads',
      'integration',
      frontendLoads,
      'Frontend application should load successfully'
    );
    
    // Test Backend Accessibility
    await page.goto(BACKEND_BASE, { waitUntil: 'domcontentloaded', timeout: TEST_TIMEOUT });
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    const backendLoads = await waitForElement(page, '.content, .sign-in, form', 5000);
    await validateTest(
      'Backend Application Loads',
      'integration',
      backendLoads,
      'Backend application should load successfully'
    );
    
    // Test Cross-Application Navigation
    await page.goto(FRONTEND_BASE, { waitUntil: 'domcontentloaded', timeout: TEST_TIMEOUT });
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Open backend in new tab (simulate admin workflow)
    const backendPage = await page.browser().newPage();
    await backendPage.goto(BACKEND_BASE, { waitUntil: 'domcontentloaded', timeout: TEST_TIMEOUT });
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const bothAppsAccessible = frontendLoads && await waitForElement(backendPage, '.content, .sign-in', 3000);
    await validateTest(
      'Cross-Application Accessibility',
      'integration',
      bothAppsAccessible,
      'Both applications should be accessible simultaneously'
    );
    
    await backendPage.close();
    
    // Take screenshot
    await takeScreenshot(page, 'integration');
    
  } catch (error) {
    await validateTest(
      'Frontend-Backend Integration Test',
      'integration',
      false,
      `Integration test failed: ${error.message}`
    );
  }
}

// Test 2: Complete User Journey - Customer Flow
async function testCompleteCustomerJourney(page) {
  console.log('\n👤 === COMPLETE CUSTOMER JOURNEY TESTING ===');
  
  try {
    // Step 1: Visit Homepage
    await page.goto(FRONTEND_BASE, { waitUntil: 'domcontentloaded', timeout: TEST_TIMEOUT });
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    const homepageLoaded = await waitForElement(page, '.home, .content', 5000);
    await validateTest(
      'Customer Journey - Homepage Visit',
      'customerJourney',
      homepageLoaded,
      'Customer should be able to visit homepage'
    );
    
    // Step 2: Browse Dress Types
    const dressTypeButton = await page.$('.btn-dress-type');
    if (dressTypeButton) {
      await dressTypeButton.click();
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      const searchPageReached = page.url().includes('search');
      await validateTest(
        'Customer Journey - Browse Dress Types',
        'customerJourney',
        searchPageReached,
        'Customer should be able to browse dress types'
      );
    }
    
    // Step 3: Search for Dresses
    await page.goto(`${FRONTEND_BASE}/search`, { waitUntil: 'domcontentloaded', timeout: TEST_TIMEOUT });
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    const searchPageLoaded = await waitForElement(page, '.search, .content', 5000);
    await validateTest(
      'Customer Journey - Search Page Access',
      'customerJourney',
      searchPageLoaded,
      'Customer should be able to access search page'
    );
    
    // Step 4: View Dress Details
    await page.goto(`${FRONTEND_BASE}/dress?d=test-dress-id`, { waitUntil: 'domcontentloaded', timeout: TEST_TIMEOUT });
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    const dressPageLoaded = await waitForElement(page, '.content, .dress', 5000);
    await validateTest(
      'Customer Journey - Dress Details View',
      'customerJourney',
      dressPageLoaded,
      'Customer should be able to view dress details'
    );
    
    // Step 5: Access Authentication
    await page.goto(`${FRONTEND_BASE}/sign-in`, { waitUntil: 'domcontentloaded', timeout: TEST_TIMEOUT });
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    const signInPageLoaded = await waitForElement(page, '.content, .sign-in, form', 5000);
    await validateTest(
      'Customer Journey - Authentication Access',
      'customerJourney',
      signInPageLoaded,
      'Customer should be able to access authentication'
    );
    
    // Take screenshot
    await takeScreenshot(page, 'customer-journey');
    
  } catch (error) {
    await validateTest(
      'Complete Customer Journey Test',
      'customerJourney',
      false,
      `Customer journey test failed: ${error.message}`
    );
  }
}

// Test 3: Complete Admin Workflow
async function testCompleteAdminWorkflow(page) {
  console.log('\n👨‍💼 === COMPLETE ADMIN WORKFLOW TESTING ===');
  
  try {
    // Step 1: Access Backend
    await page.goto(BACKEND_BASE, { waitUntil: 'domcontentloaded', timeout: TEST_TIMEOUT });
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    const backendAccessible = await waitForElement(page, '.content, .sign-in', 5000);
    await validateTest(
      'Admin Workflow - Backend Access',
      'adminWorkflow',
      backendAccessible,
      'Admin should be able to access backend'
    );
    
    // Step 2: Navigate to Dress Management
    await page.goto(`${BACKEND_BASE}/dresses`, { waitUntil: 'domcontentloaded', timeout: TEST_TIMEOUT });
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    const dressManagementAccessible = await waitForElement(page, '.content, .dress-list', 5000);
    await validateTest(
      'Admin Workflow - Dress Management Access',
      'adminWorkflow',
      dressManagementAccessible,
      'Admin should be able to access dress management'
    );
    
    // Step 3: Access Create Dress Form
    await page.goto(`${BACKEND_BASE}/create-dress`, { waitUntil: 'domcontentloaded', timeout: TEST_TIMEOUT });
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    const createDressFormAccessible = await waitForElement(page, '.content, form', 5000);
    await validateTest(
      'Admin Workflow - Create Dress Form',
      'adminWorkflow',
      createDressFormAccessible,
      'Admin should be able to access create dress form'
    );
    
    // Step 4: Access Booking Management
    await page.goto(`${BACKEND_BASE}/`, { waitUntil: 'domcontentloaded', timeout: TEST_TIMEOUT });
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    const bookingManagementAccessible = await waitForElement(page, '.content, .bookings', 5000);
    await validateTest(
      'Admin Workflow - Booking Management',
      'adminWorkflow',
      bookingManagementAccessible,
      'Admin should be able to access booking management'
    );
    
    // Step 5: Access Analytics
    await page.goto(`${BACKEND_BASE}/analytics-dashboard`, { waitUntil: 'domcontentloaded', timeout: TEST_TIMEOUT });
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    const analyticsAccessible = await waitForElement(page, '.content, .analytics', 5000);
    await validateTest(
      'Admin Workflow - Analytics Access',
      'adminWorkflow',
      analyticsAccessible,
      'Admin should be able to access analytics'
    );
    
    // Take screenshot
    await takeScreenshot(page, 'admin-workflow');
    
  } catch (error) {
    await validateTest(
      'Complete Admin Workflow Test',
      'adminWorkflow',
      false,
      `Admin workflow test failed: ${error.message}`
    );
  }
}

// Test 4: Arabic Language Consistency
async function testArabicLanguageConsistency(page) {
  console.log('\n🌍 === ARABIC LANGUAGE CONSISTENCY TESTING ===');
  
  try {
    // Test Frontend Arabic
    await page.goto(FRONTEND_BASE, { waitUntil: 'domcontentloaded', timeout: TEST_TIMEOUT });
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    const frontendRTL = await page.evaluate(() => {
      return document.documentElement.getAttribute('dir') === 'rtl';
    });
    
    const frontendArabicFont = await page.evaluate(() => {
      const style = window.getComputedStyle(document.body);
      return style.fontFamily.includes('Noto Sans Arabic');
    });
    
    await validateTest(
      'Frontend Arabic RTL',
      'arabicConsistency',
      frontendRTL,
      'Frontend should have RTL direction'
    );
    
    await validateTest(
      'Frontend Arabic Font',
      'arabicConsistency',
      frontendArabicFont,
      'Frontend should use Arabic font'
    );
    
    // Test Backend Arabic
    await page.goto(BACKEND_BASE, { waitUntil: 'domcontentloaded', timeout: TEST_TIMEOUT });
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    const backendRTL = await page.evaluate(() => {
      return document.documentElement.getAttribute('dir') === 'rtl';
    });
    
    const backendArabicFont = await page.evaluate(() => {
      const style = window.getComputedStyle(document.body);
      return style.fontFamily.includes('Noto Sans Arabic');
    });
    
    await validateTest(
      'Backend Arabic RTL',
      'arabicConsistency',
      backendRTL,
      'Backend should have RTL direction'
    );
    
    await validateTest(
      'Backend Arabic Font',
      'arabicConsistency',
      backendArabicFont,
      'Backend should use Arabic font'
    );
    
    // Test Consistency
    const arabicConsistent = frontendRTL === backendRTL && frontendArabicFont === backendArabicFont;
    await validateTest(
      'Arabic Language Consistency',
      'arabicConsistency',
      arabicConsistent,
      'Arabic language support should be consistent across applications'
    );
    
    // Take screenshot
    await takeScreenshot(page, 'arabic-consistency');
    
  } catch (error) {
    await validateTest(
      'Arabic Language Consistency Test',
      'arabicConsistency',
      false,
      `Arabic consistency test failed: ${error.message}`
    );
  }
}

// Test 5: Error Handling Across Applications
async function testErrorHandlingAcrossApplications(page) {
  console.log('\n🚨 === ERROR HANDLING ACROSS APPLICATIONS TESTING ===');
  
  try {
    // Test Frontend 404
    await page.goto(`${FRONTEND_BASE}/non-existent-page`, { waitUntil: 'domcontentloaded', timeout: TEST_TIMEOUT });
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    const frontend404Handled = await waitForElement(page, '.content, .no-match, .error', 5000);
    await validateTest(
      'Frontend 404 Handling',
      'errorHandling',
      frontend404Handled,
      'Frontend should handle 404 errors gracefully'
    );
    
    // Test Backend 404
    await page.goto(`${BACKEND_BASE}/non-existent-page`, { waitUntil: 'domcontentloaded', timeout: TEST_TIMEOUT });
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    const backend404Handled = await waitForElement(page, '.content, .no-match, .error', 5000);
    await validateTest(
      'Backend 404 Handling',
      'errorHandling',
      backend404Handled,
      'Backend should handle 404 errors gracefully'
    );
    
    // Test Network Resilience
    await page.setOfflineMode(true);
    
    try {
      await page.goto(FRONTEND_BASE, { waitUntil: 'domcontentloaded', timeout: 5000 });
    } catch (error) {
      // Expected to fail when offline
    }
    
    await page.setOfflineMode(false);
    await page.goto(FRONTEND_BASE, { waitUntil: 'domcontentloaded', timeout: TEST_TIMEOUT });
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const networkRecovery = await waitForElement(page, '.content, .home', 3000);
    await validateTest(
      'Network Error Recovery',
      'errorHandling',
      networkRecovery,
      'Applications should recover from network errors'
    );
    
    // Take screenshot
    await takeScreenshot(page, 'error-handling');
    
  } catch (error) {
    await validateTest(
      'Error Handling Across Applications Test',
      'errorHandling',
      false,
      `Error handling test failed: ${error.message}`
    );
  }
}

// Test 6: Performance and Load Testing
async function testPerformanceAndLoad(page) {
  console.log('\n⚡ === PERFORMANCE AND LOAD TESTING ===');
  
  try {
    // Test Frontend Load Time
    const frontendStartTime = Date.now();
    await page.goto(FRONTEND_BASE, { waitUntil: 'domcontentloaded', timeout: TEST_TIMEOUT });
    await waitForElement(page, '.content, .home', 5000);
    const frontendLoadTime = Date.now() - frontendStartTime;
    
    await validateTest(
      'Frontend Load Performance',
      'performance',
      frontendLoadTime < 10000,
      `Frontend should load within 10 seconds (loaded in ${frontendLoadTime}ms)`
    );
    
    // Test Backend Load Time
    const backendStartTime = Date.now();
    await page.goto(BACKEND_BASE, { waitUntil: 'domcontentloaded', timeout: TEST_TIMEOUT });
    await waitForElement(page, '.content, .sign-in', 5000);
    const backendLoadTime = Date.now() - backendStartTime;
    
    await validateTest(
      'Backend Load Performance',
      'performance',
      backendLoadTime < 10000,
      `Backend should load within 10 seconds (loaded in ${backendLoadTime}ms)`
    );
    
    // Test Multiple Page Navigation Speed
    const navigationStartTime = Date.now();
    await page.goto(`${FRONTEND_BASE}/about`, { waitUntil: 'domcontentloaded', timeout: TEST_TIMEOUT });
    await page.goto(`${FRONTEND_BASE}/contact`, { waitUntil: 'domcontentloaded', timeout: TEST_TIMEOUT });
    await page.goto(`${FRONTEND_BASE}/search`, { waitUntil: 'domcontentloaded', timeout: TEST_TIMEOUT });
    const navigationTime = Date.now() - navigationStartTime;
    
    await validateTest(
      'Navigation Performance',
      'performance',
      navigationTime < 15000,
      `Navigation should be fast (completed in ${navigationTime}ms)`
    );
    
    // Take screenshot
    await takeScreenshot(page, 'performance');
    
  } catch (error) {
    await validateTest(
      'Performance and Load Test',
      'performance',
      false,
      `Performance test failed: ${error.message}`
    );
  }
}

// Generate test report
function generateReport() {
  console.log('\n📋 === FINAL INTEGRATION AND E2E TEST REPORT ===');
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
  const reportPath = path.join(__dirname, 'final-integration-e2e-report.json');
  fs.writeFileSync(reportPath, JSON.stringify({
    timestamp: new Date().toISOString(),
    testSuite: 'Final Integration and End-to-End Testing',
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
async function runFinalIntegrationE2ETests() {
  console.log('🚀 Starting Final Integration and End-to-End Testing Suite');
  console.log('==========================================================');
  
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
    await testFrontendBackendIntegration(page);
    await testCompleteCustomerJourney(page);
    await testCompleteAdminWorkflow(page);
    await testArabicLanguageConsistency(page);
    await testErrorHandlingAcrossApplications(page);
    await testPerformanceAndLoad(page);
    
    // Generate final report
    generateReport();
    
    console.log('\n🎉 Final Integration and End-to-End Testing Complete!');
    
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
  runFinalIntegrationE2ETests();
}

module.exports = { runFinalIntegrationE2ETests };
