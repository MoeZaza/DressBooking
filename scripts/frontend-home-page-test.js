#!/usr/bin/env node

/**
 * Frontend Home Page Comprehensive Testing Suite
 * 
 * Tests all aspects of the home page functionality including:
 * - Page loading and layout
 * - Hero section
 * - Featured dresses
 * - Search functionality
 * - Navigation elements
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
  const screenshotPath = path.join(__dirname, 'screenshots', `frontend-home-${name}.png`);
  await page.screenshot({ path: screenshotPath, fullPage: true });
  console.log(`📸 Screenshot saved: ${screenshotPath}`);
}

// Test 1: Page Loading and Basic Layout
async function testPageLoading(page) {
  console.log('\n🌐 === HOME PAGE LOADING ===');
  
  try {
    console.log(`🌐 Navigating to ${FRONTEND_BASE}...`);
    await page.goto(FRONTEND_BASE, { waitUntil: 'domcontentloaded', timeout: TEST_TIMEOUT });
    
    // Check if page loads
    const pageLoaded = await page.evaluate(() => document.readyState === 'complete');
    await validateTest(
      'Page Loading',
      'loading',
      pageLoaded,
      'Home page should load completely'
    );
    
    // Check for main content (wait for React to load)
    await new Promise(resolve => setTimeout(resolve, 3000));
    const mainContentExists = await waitForElement(page, '.content, .home, .home-content', 8000);
    await validateTest(
      'Main Content Present',
      'layout',
      mainContentExists,
      'Main content area should be present'
    );
    
    // Check page title
    const title = await page.title();
    const hasValidTitle = title && title.length > 0 && !title.includes('React App');
    await validateTest(
      'Page Title',
      'layout',
      hasValidTitle,
      'Page should have a meaningful title'
    );
    
    // Take screenshot
    await takeScreenshot(page, 'initial-load');
    
  } catch (error) {
    await validateTest(
      'Page Loading',
      'loading',
      false,
      `Failed to load home page: ${error.message}`
    );
  }
}

// Test 2: Header and Navigation
async function testHeaderNavigation(page) {
  console.log('\n🧭 === HEADER AND NAVIGATION ===');
  
  try {
    // Check for header (Material-UI AppBar)
    const headerExists = await waitForElement(page, '.header, .MuiAppBar-root', 5000);
    await validateTest(
      'Header Present',
      'navigation',
      headerExists,
      'Header should be present'
    );

    // Check for logo/brand button
    const logoExists = await waitForElement(page, '.logo, button.logo', 3000);
    await validateTest(
      'Logo Present',
      'navigation',
      logoExists,
      'Logo should be present in header'
    );

    // Check for navigation menu (toolbar or menu button)
    const navMenuExists = await waitForElement(page, '.MuiToolbar-root, .toolbar, .MuiIconButton-root', 3000);
    await validateTest(
      'Navigation Menu',
      'navigation',
      navMenuExists,
      'Navigation menu should be present'
    );

    // Check for search functionality (in home search section, not header)
    const searchExists = await waitForElement(page, '.search, .home-search', 3000);
    await validateTest(
      'Search Section',
      'navigation',
      searchExists,
      'Search section should be available on home page'
    );
    
    // Take screenshot
    await takeScreenshot(page, 'header-navigation');
    
  } catch (error) {
    await validateTest(
      'Header Navigation Test',
      'navigation',
      false,
      `Header navigation test failed: ${error.message}`
    );
  }
}

// Test 3: Hero Section
async function testHeroSection(page) {
  console.log('\n🎯 === HERO SECTION ===');
  
  try {
    // Check for hero section (video and home content)
    const heroExists = await waitForElement(page, '.video, .home-content', 5000);
    await validateTest(
      'Hero Section Present',
      'heroSection',
      heroExists,
      'Hero section should be present'
    );

    // Check for hero title
    const heroTitleExists = await waitForElement(page, '.home-title', 3000);
    await validateTest(
      'Hero Title',
      'heroSection',
      heroTitleExists,
      'Hero section should have a title'
    );

    // Check for hero cover text
    const heroCoverExists = await waitForElement(page, '.home-cover', 3000);
    await validateTest(
      'Hero Cover Text',
      'heroSection',
      heroCoverExists,
      'Hero section should have cover text'
    );
    
    // Check for hero video
    const heroVideoExists = await waitForElement(page, 'video#cover, .video video', 3000);
    await validateTest(
      'Hero Video Element',
      'heroSection',
      heroVideoExists,
      'Hero section should have video element'
    );
    
    // Take screenshot
    await takeScreenshot(page, 'hero-section');
    
  } catch (error) {
    await validateTest(
      'Hero Section Test',
      'heroSection',
      false,
      `Hero section test failed: ${error.message}`
    );
  }
}

// Test 4: Featured Dresses Section
async function testFeaturedDresses(page) {
  console.log('\n👗 === FEATURED DRESSES ===');
  
  try {
    // Check for dress types section
    const dressTypesExists = await waitForElement(page, '.dress-types', 5000);
    await validateTest(
      'Dress Types Section',
      'featuredDresses',
      dressTypesExists,
      'Dress types section should be present'
    );

    // Check for dress type boxes
    const dressBoxesExist = await waitForElement(page, '.dress-types .boxes, .dress-types .box', 3000);
    await validateTest(
      'Dress Type Boxes',
      'featuredDresses',
      dressBoxesExist,
      'Dress type boxes should be displayed'
    );

    // Check for dress type buttons
    const dressButtonsExist = await waitForElement(page, '.btn-dress-type, .dress-type-action button', 3000);
    await validateTest(
      'Dress Type Buttons',
      'featuredDresses',
      dressButtonsExist,
      'Dress type buttons should be present'
    );
    
    // Check for dress type information (prices, descriptions)
    const dressInfoExists = await page.evaluate(() => {
      const boxes = document.querySelectorAll('.dress-types .box');
      if (boxes.length === 0) return false;

      // Check if boxes have meaningful content
      for (let box of boxes) {
        const text = box.textContent || '';
        if (text.includes('Wedding') || text.includes('Evening') || text.includes('Cocktail')) {
          return true;
        }
      }
      return false;
    });

    await validateTest(
      'Dress Type Information',
      'featuredDresses',
      dressInfoExists,
      'Dress type boxes should display information (names, prices, etc.)'
    );
    
    // Take screenshot
    await takeScreenshot(page, 'featured-dresses');
    
  } catch (error) {
    await validateTest(
      'Featured Dresses Test',
      'featuredDresses',
      false,
      `Featured dresses test failed: ${error.message}`
    );
  }
}

// Test 5: Search Functionality
async function testSearchFunctionality(page) {
  console.log('\n🔍 === SEARCH FUNCTIONALITY ===');
  
  try {
    // Find search form in home search section
    const searchFormExists = await waitForElement(page, '.home-search form, .search form', 5000);

    if (searchFormExists) {
      await validateTest(
        'Search Form Present',
        'search',
        true,
        'Search form should be present in home search section'
      );

      // Look for search inputs (location, dates, etc.)
      const searchInputs = await page.$$('.home-search input, .search input');

      await validateTest(
        'Search Input Fields',
        'search',
        searchInputs.length > 0,
        'Search form should have input fields'
      );

      // Check for search button
      const searchButton = await page.$('.home-search button, .search button');
      await validateTest(
        'Search Button Present',
        'search',
        searchButton !== null,
        'Search form should have a search button'
      );
    } else {
      await validateTest(
        'Search Form Present',
        'search',
        false,
        'Search form should be present on home page'
      );
    }
    
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

// Test 6: Footer
async function testFooter(page) {
  console.log('\n🦶 === FOOTER ===');
  
  try {
    // Check for footer
    const footerExists = await waitForElement(page, 'footer, .footer', 3000);
    await validateTest(
      'Footer Present',
      'footer',
      footerExists,
      'Footer should be present'
    );
    
    // Check for footer links
    const footerLinksExist = await waitForElement(page, 'footer a, .footer a', 2000);
    await validateTest(
      'Footer Links',
      'footer',
      footerLinksExist,
      'Footer should contain links'
    );
    
    // Check for contact information or social links
    const contactInfoExists = await page.evaluate(() => {
      const footer = document.querySelector('footer, .footer');
      if (!footer) return false;
      
      const text = footer.textContent || '';
      return text.includes('@') || text.includes('contact') || text.includes('phone') || 
             footer.querySelector('.social, .contact') !== null;
    });
    
    await validateTest(
      'Contact Information',
      'footer',
      contactInfoExists,
      'Footer should contain contact information or social links'
    );
    
    // Take screenshot
    await takeScreenshot(page, 'footer');
    
  } catch (error) {
    await validateTest(
      'Footer Test',
      'footer',
      false,
      `Footer test failed: ${error.message}`
    );
  }
}

// Test 7: Responsive Design
async function testResponsiveDesign(page) {
  console.log('\n📱 === RESPONSIVE DESIGN ===');
  
  try {
    // Test mobile viewport
    await page.setViewport({ width: 375, height: 667 });
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const mobileContentVisible = await waitForElement(page, '.content, .home, .home-content', 2000);
    await validateTest(
      'Mobile Responsiveness',
      'responsive',
      mobileContentVisible,
      'Home page should be responsive on mobile'
    );

    // Take mobile screenshot
    await takeScreenshot(page, 'mobile-view');

    // Test tablet viewport
    await page.setViewport({ width: 768, height: 1024 });
    await new Promise(resolve => setTimeout(resolve, 1000));

    const tabletContentVisible = await waitForElement(page, '.content, .home, .home-content', 2000);
    await validateTest(
      'Tablet Responsiveness',
      'responsive',
      tabletContentVisible,
      'Home page should be responsive on tablet'
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
  console.log('\n📋 === FRONTEND HOME PAGE TEST REPORT ===');
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
  const reportPath = path.join(__dirname, 'frontend-home-test-report.json');
  fs.writeFileSync(reportPath, JSON.stringify({
    timestamp: new Date().toISOString(),
    page: 'Frontend Home Page',
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
async function runFrontendHomeTests() {
  console.log('🚀 Starting Frontend Home Page Comprehensive Tests');
  console.log('==================================================');
  
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
    await testHeaderNavigation(page);
    await testHeroSection(page);
    await testFeaturedDresses(page);
    await testSearchFunctionality(page);
    await testFooter(page);
    await testResponsiveDesign(page);
    
    // Generate final report
    generateReport();
    
    console.log('\n🎉 Frontend Home Page Testing Complete!');
    
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
  runFrontendHomeTests();
}

module.exports = { runFrontendHomeTests };
