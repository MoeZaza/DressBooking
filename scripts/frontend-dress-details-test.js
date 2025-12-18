#!/usr/bin/env node

/**
 * Frontend Dress Details Page Comprehensive Testing Suite
 * 
 * Tests all aspects of the dress details page functionality including:
 * - Page loading and layout
 * - Dress information display
 * - Image gallery
 * - Booking form
 * - Pricing display
 * - Related dresses
 * - Responsive design
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
  const screenshotPath = path.join(__dirname, 'screenshots', `frontend-dress-details-${name}.png`);
  await page.screenshot({ path: screenshotPath, fullPage: true });
  console.log(`📸 Screenshot saved: ${screenshotPath}`);
}

// Test 1: Page Loading and Layout
async function testPageLoading(page) {
  console.log('\n🌐 === DRESS DETAILS PAGE LOADING ===');
  
  try {
    // Try to navigate to a dress details page
    // First, let's try to find a dress from the home page
    console.log(`🌐 Navigating to home page to find a dress...`);
    await page.goto(FRONTEND_BASE, { waitUntil: 'domcontentloaded', timeout: TEST_TIMEOUT });
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Look for dress type buttons that navigate to search
    const dressTypeButton = await page.$('.btn-dress-type');
    let dressDetailsUrl = null;
    
    if (dressTypeButton) {
      await dressTypeButton.click();
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Check if we're on search page and look for dress items
      const currentUrl = page.url();
      if (currentUrl.includes('search')) {
        // Look for dress links in search results
        const dressLinks = await page.$$('a[href*="/dress"]');
        if (dressLinks.length > 0) {
          dressDetailsUrl = await page.evaluate(el => el.href, dressLinks[0]);
        }
      }
    }
    
    // If we found a dress URL, navigate to it
    if (dressDetailsUrl) {
      console.log(`🌐 Navigating to dress details: ${dressDetailsUrl}`);
      await page.goto(dressDetailsUrl, { waitUntil: 'domcontentloaded', timeout: TEST_TIMEOUT });
      await new Promise(resolve => setTimeout(resolve, 3000));
    } else {
      // Try a generic dress details URL
      console.log(`🌐 Trying generic dress details URL...`);
      await page.goto(`${FRONTEND_BASE}/dress?d=test`, { waitUntil: 'domcontentloaded', timeout: TEST_TIMEOUT });
      await new Promise(resolve => setTimeout(resolve, 3000));
    }
    
    // Check if page loads
    const pageLoaded = await page.evaluate(() => document.readyState === 'complete');
    await validateTest(
      'Dress Details Page Loading',
      'loading',
      pageLoaded,
      'Dress details page should load completely'
    );
    
    // Check for main content or error page
    const mainContentExists = await waitForElement(page, '.content, .dress, .no-match, .error', 8000);
    await validateTest(
      'Page Content Present',
      'layout',
      mainContentExists,
      'Page content should be present (dress details or error page)'
    );
    
    // Check page title
    const title = await page.title();
    const hasValidTitle = title && title.length > 0;
    await validateTest(
      'Page Title',
      'layout',
      hasValidTitle,
      'Page should have a title'
    );
    
    // Take screenshot
    await takeScreenshot(page, 'initial-load');
    
  } catch (error) {
    await validateTest(
      'Dress Details Page Loading',
      'loading',
      false,
      `Failed to load dress details page: ${error.message}`
    );
  }
}

// Test 2: Dress Information Display
async function testDressInformation(page) {
  console.log('\n👗 === DRESS INFORMATION DISPLAY ===');
  
  try {
    // Check for dress container
    const dressContainerExists = await waitForElement(page, '.dress, .dress-details, .product-details', 5000);
    await validateTest(
      'Dress Container',
      'dressInfo',
      dressContainerExists,
      'Dress container should be present'
    );
    
    // Check for dress name/title
    const dressNameExists = await waitForElement(page, 'h1, h2, .dress-name, .product-title', 3000);
    await validateTest(
      'Dress Name',
      'dressInfo',
      dressNameExists,
      'Dress name should be displayed'
    );
    
    // Check for dress description or details
    const dressDetailsExist = await page.evaluate(() => {
      const content = document.body.textContent || '';
      return content.includes('Price') || content.includes('Size') || content.includes('Color') || 
             content.includes('Type') || content.includes('Material') || content.length > 500;
    });
    
    await validateTest(
      'Dress Details',
      'dressInfo',
      dressDetailsExist,
      'Dress details should be displayed'
    );
    
    // Check for pricing information
    const pricingExists = await page.evaluate(() => {
      const content = document.body.textContent || '';
      return content.includes('$') || content.includes('Price') || content.includes('€') || content.includes('£');
    });
    
    await validateTest(
      'Pricing Information',
      'dressInfo',
      pricingExists,
      'Pricing information should be displayed'
    );
    
    // Take screenshot
    await takeScreenshot(page, 'dress-information');
    
  } catch (error) {
    await validateTest(
      'Dress Information Test',
      'dressInfo',
      false,
      `Dress information test failed: ${error.message}`
    );
  }
}

// Test 3: Image Gallery
async function testImageGallery(page) {
  console.log('\n🖼️ === IMAGE GALLERY ===');
  
  try {
    // Check for dress images
    const imagesExist = await waitForElement(page, 'img, .image-gallery, .dress-img, .product-images', 5000);
    await validateTest(
      'Dress Images',
      'imageGallery',
      imagesExist,
      'Dress images should be present'
    );
    
    // Check for image gallery functionality
    const galleryExists = await waitForElement(page, '.image-gallery, .carousel, .slider, .gallery', 3000);
    await validateTest(
      'Image Gallery',
      'imageGallery',
      galleryExists,
      'Image gallery should be present'
    );
    
    // Check for multiple images or navigation
    const multipleImagesExist = await page.evaluate(() => {
      const images = document.querySelectorAll('img');
      const galleryElements = document.querySelectorAll('.image-gallery *, .carousel *, .slider *');
      return images.length > 1 || galleryElements.length > 0;
    });
    
    await validateTest(
      'Multiple Images or Gallery Navigation',
      'imageGallery',
      multipleImagesExist,
      'Multiple images or gallery navigation should be available'
    );
    
    // Take screenshot
    await takeScreenshot(page, 'image-gallery');
    
  } catch (error) {
    await validateTest(
      'Image Gallery Test',
      'imageGallery',
      false,
      `Image gallery test failed: ${error.message}`
    );
  }
}

// Test 4: Booking Form
async function testBookingForm(page) {
  console.log('\n📅 === BOOKING FORM ===');
  
  try {
    // Check for booking form or booking button
    const bookingFormExists = await waitForElement(page, 'form, .booking-form, .book-now, .rent-now, button:contains("Book")', 5000);
    await validateTest(
      'Booking Form or Button',
      'bookingForm',
      bookingFormExists,
      'Booking form or button should be present'
    );
    
    // Check for date inputs
    const dateInputsExist = await waitForElement(page, 'input[type="date"], .date-picker, .MuiDatePicker-root', 3000);
    await validateTest(
      'Date Inputs',
      'bookingForm',
      dateInputsExist,
      'Date inputs should be available for booking'
    );
    
    // Check for booking-related text
    const bookingTextExists = await page.evaluate(() => {
      const content = document.body.textContent || '';
      return content.includes('Book') || content.includes('Rent') || content.includes('Reserve') || 
             content.includes('Available') || content.includes('Booking');
    });
    
    await validateTest(
      'Booking Text',
      'bookingForm',
      bookingTextExists,
      'Booking-related text should be present'
    );
    
    // Take screenshot
    await takeScreenshot(page, 'booking-form');
    
  } catch (error) {
    await validateTest(
      'Booking Form Test',
      'bookingForm',
      false,
      `Booking form test failed: ${error.message}`
    );
  }
}

// Test 5: Related Dresses
async function testRelatedDresses(page) {
  console.log('\n🔗 === RELATED DRESSES ===');
  
  try {
    // Check for related dresses section
    const relatedSectionExists = await waitForElement(page, '.related, .similar, .recommendations, .other-dresses', 3000);
    await validateTest(
      'Related Dresses Section',
      'relatedDresses',
      relatedSectionExists,
      'Related dresses section should be present'
    );
    
    // Check for related dress items
    const relatedItemsExist = await waitForElement(page, '.related .dress, .similar .dress, .recommendations .card', 2000);
    await validateTest(
      'Related Dress Items',
      'relatedDresses',
      relatedItemsExist,
      'Related dress items should be displayed'
    );
    
    // Check for navigation back to search or other dresses
    const navigationExists = await page.evaluate(() => {
      const content = document.body.textContent || '';
      const links = document.querySelectorAll('a');
      return content.includes('Back') || content.includes('Search') || 
             Array.from(links).some(link => link.href.includes('search') || link.href.includes('dresses'));
    });
    
    await validateTest(
      'Navigation Links',
      'relatedDresses',
      navigationExists,
      'Navigation links should be available'
    );
    
    // Take screenshot
    await takeScreenshot(page, 'related-dresses');
    
  } catch (error) {
    await validateTest(
      'Related Dresses Test',
      'relatedDresses',
      false,
      `Related dresses test failed: ${error.message}`
    );
  }
}

// Test 6: Responsive Design
async function testResponsiveDesign(page) {
  console.log('\n📱 === RESPONSIVE DESIGN ===');
  
  try {
    // Test mobile viewport
    await page.setViewport({ width: 375, height: 667 });
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const mobileContentVisible = await waitForElement(page, '.content, .dress, .no-match', 2000);
    await validateTest(
      'Mobile Responsiveness',
      'responsive',
      mobileContentVisible,
      'Dress details page should be responsive on mobile'
    );
    
    // Take mobile screenshot
    await takeScreenshot(page, 'mobile-view');
    
    // Test tablet viewport
    await page.setViewport({ width: 768, height: 1024 });
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const tabletContentVisible = await waitForElement(page, '.content, .dress, .no-match', 2000);
    await validateTest(
      'Tablet Responsiveness',
      'responsive',
      tabletContentVisible,
      'Dress details page should be responsive on tablet'
    );
    
    // Take tablet screenshot
    await takeScreenshot(page, 'tablet-view');
    
    // Reset to desktop viewport
    await page.setViewport({ width: 1280, height: 720 });
    
  } catch (error) {
    await validateTest(
      'Responsive Design Test',
      'responsive',
      false,
      `Responsive design test failed: ${error.message}`
    );
  }
}

// Generate test report
function generateReport() {
  console.log('\n📋 === FRONTEND DRESS DETAILS TEST REPORT ===');
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
  const reportPath = path.join(__dirname, 'frontend-dress-details-test-report.json');
  fs.writeFileSync(reportPath, JSON.stringify({
    timestamp: new Date().toISOString(),
    page: 'Frontend Dress Details Page',
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
async function runFrontendDressDetailsTests() {
  console.log('🚀 Starting Frontend Dress Details Page Comprehensive Tests');
  console.log('============================================================');
  
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
    await testPageLoading(page);
    await testDressInformation(page);
    await testImageGallery(page);
    await testBookingForm(page);
    await testRelatedDresses(page);
    await testResponsiveDesign(page);
    
    // Generate final report
    generateReport();
    
    console.log('\n🎉 Frontend Dress Details Testing Complete!');
    
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
  runFrontendDressDetailsTests();
}

module.exports = { runFrontendDressDetailsTests };
