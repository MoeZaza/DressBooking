#!/usr/bin/env node

/**
 * Frontend Dress Search Page Comprehensive Testing Suite
 * 
 * Tests all aspects of the dress search functionality including:
 * - Search page loading
 * - Search form functionality
 * - Filter options
 * - Search results display
 * - Pagination
 * - Sorting options
 * - Responsive design
 */

const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

// Configuration
const FRONTEND_BASE = 'http://localhost:3000';
const SEARCH_URL = 'http://localhost:3000/search';
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
  const screenshotPath = path.join(__dirname, 'screenshots', `frontend-search-${name}.png`);
  await page.screenshot({ path: screenshotPath, fullPage: true });
  console.log(`📸 Screenshot saved: ${screenshotPath}`);
}

// Test 1: Search Page Loading
async function testSearchPageLoading(page) {
  console.log('\n🌐 === SEARCH PAGE LOADING ===');
  
  try {
    console.log(`🌐 Navigating to ${SEARCH_URL}...`);
    await page.goto(SEARCH_URL, { waitUntil: 'domcontentloaded', timeout: TEST_TIMEOUT });
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Check if page loads
    const pageLoaded = await page.evaluate(() => document.readyState === 'complete');
    await validateTest(
      'Search Page Loading',
      'loading',
      pageLoaded,
      'Search page should load completely'
    );
    
    // Check for main content
    const mainContentExists = await waitForElement(page, '.content, .search, .dresses', 8000);
    await validateTest(
      'Search Content Present',
      'layout',
      mainContentExists,
      'Search page content should be present'
    );
    
    // Check page title
    const title = await page.title();
    const hasValidTitle = title && title.length > 0;
    await validateTest(
      'Search Page Title',
      'layout',
      hasValidTitle,
      'Search page should have a title'
    );
    
    // Take screenshot
    await takeScreenshot(page, 'initial-load');
    
  } catch (error) {
    await validateTest(
      'Search Page Loading',
      'loading',
      false,
      `Failed to load search page: ${error.message}`
    );
  }
}

// Test 2: Search Form and Filters
async function testSearchFormAndFilters(page) {
  console.log('\n🔍 === SEARCH FORM AND FILTERS ===');
  
  try {
    // Check for filters button
    const filtersButtonExists = await waitForElement(page, '.btn-filters, button:contains("Filters")', 5000);
    await validateTest(
      'Filters Button Present',
      'searchForm',
      filtersButtonExists,
      'Filters button should be present'
    );

    // Click filters button to show filters
    if (filtersButtonExists) {
      const filtersButton = await page.$('.btn-filters');
      if (filtersButton) {
        await filtersButton.click();
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    // Check for supplier filter
    const supplierFilterExists = await waitForElement(page, '.supplier-filter, .filter', 3000);
    await validateTest(
      'Supplier Filter',
      'searchForm',
      supplierFilterExists,
      'Supplier filter should be available'
    );

    // Check for dress type filter
    const typeFilterExists = await waitForElement(page, '.dress-type-filter, .filter', 3000);
    await validateTest(
      'Dress Type Filter',
      'searchForm',
      typeFilterExists,
      'Dress type filter should be available'
    );

    // Check for size filter
    const sizeFilterExists = await waitForElement(page, '.dress-size-filter, .filter', 3000);
    await validateTest(
      'Size Filter',
      'searchForm',
      sizeFilterExists,
      'Size filter should be available'
    );

    // Check for material filter
    const materialFilterExists = await waitForElement(page, '.dress-material-filter, .filter', 3000);
    await validateTest(
      'Material Filter',
      'searchForm',
      materialFilterExists,
      'Material filter should be available'
    );
    
    // Take screenshot
    await takeScreenshot(page, 'search-form');
    
  } catch (error) {
    await validateTest(
      'Search Form Test',
      'searchForm',
      false,
      `Search form test failed: ${error.message}`
    );
  }
}

// Test 3: Search Results Display
async function testSearchResults(page) {
  console.log('\n📋 === SEARCH RESULTS DISPLAY ===');
  
  try {
    // Wait for results to load
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Check for results container (col-2 with DressList)
    const resultsContainerExists = await waitForElement(page, '.col-2, .dress-list', 5000);
    await validateTest(
      'Results Container',
      'searchResults',
      resultsContainerExists,
      'Search results container should be present'
    );

    // Check for dress articles or DataGrid
    const dressItemsExist = await waitForElement(page, 'article .dress, .MuiDataGrid-root, .empty-list', 3000);
    await validateTest(
      'Dress Items or Empty State',
      'searchResults',
      dressItemsExist,
      'Dress items or empty state should be displayed'
    );

    // Check for dress images (if dresses exist)
    const dressImagesExist = await waitForElement(page, 'article .dress img, .MuiDataGrid-cell img', 2000);
    await validateTest(
      'Dress Images',
      'searchResults',
      dressImagesExist,
      'Dress items should have images (if dresses exist)'
    );
    
    // Check for dress information (name, price, etc.)
    const dressInfoExists = await page.evaluate(() => {
      const articles = document.querySelectorAll('article .dress');
      const dataGrid = document.querySelector('.MuiDataGrid-root');
      const emptyList = document.querySelector('.empty-list');

      // If there's an empty list message, that's valid
      if (emptyList) return true;

      // If there's a DataGrid, that's valid
      if (dataGrid) return true;

      // Check articles for meaningful content
      if (articles.length > 0) {
        for (let article of articles) {
          const text = article.textContent || '';
          if (text.trim().length > 20) return true;
        }
      }

      return false;
    });

    await validateTest(
      'Dress Information Display',
      'searchResults',
      dressInfoExists,
      'Dress items should display information or show empty state'
    );
    
    // Take screenshot
    await takeScreenshot(page, 'search-results');
    
  } catch (error) {
    await validateTest(
      'Search Results Test',
      'searchResults',
      false,
      `Search results test failed: ${error.message}`
    );
  }
}

// Test 4: Pagination and Navigation
async function testPaginationAndNavigation(page) {
  console.log('\n📄 === PAGINATION AND NAVIGATION ===');
  
  try {
    // Check for pagination controls (Pager component)
    const paginationExists = await waitForElement(page, '.pager, .pagination', 3000);
    await validateTest(
      'Pagination Controls',
      'pagination',
      paginationExists,
      'Pagination controls should be present (if needed)'
    );

    // Check for DataGrid pagination (if using DataGrid)
    const dataGridPaginationExists = await waitForElement(page, '.MuiDataGrid-footerContainer, .MuiTablePagination-root', 2000);
    await validateTest(
      'DataGrid Pagination',
      'pagination',
      dataGridPaginationExists,
      'DataGrid pagination should be present (if using DataGrid)'
    );

    // Check for results info or empty state message
    const resultsInfoExists = await page.evaluate(() => {
      const text = document.body.textContent || '';
      return text.includes('results') || text.includes('found') || text.includes('Empty') || text.includes('No dresses');
    });

    await validateTest(
      'Results Information',
      'pagination',
      resultsInfoExists,
      'Results information or empty state should be displayed'
    );
    
    // Take screenshot
    await takeScreenshot(page, 'pagination');
    
  } catch (error) {
    await validateTest(
      'Pagination Test',
      'pagination',
      false,
      `Pagination test failed: ${error.message}`
    );
  }
}

// Test 5: Sorting Options
async function testSortingOptions(page) {
  console.log('\n🔄 === SORTING OPTIONS ===');
  
  try {
    // Check for DataGrid sort options (column headers)
    const sortOptionsExist = await waitForElement(page, '.MuiDataGrid-columnHeader, .MuiDataGrid-sortIcon', 3000);
    await validateTest(
      'DataGrid Sort Options',
      'sorting',
      sortOptionsExist,
      'DataGrid sorting options should be available (if using DataGrid)'
    );

    // Check for sort functionality in dress list
    const sortFunctionalityExists = await page.evaluate(() => {
      const dataGrid = document.querySelector('.MuiDataGrid-root');
      const dressList = document.querySelector('.dress-list');

      // If DataGrid exists, sorting is built-in
      if (dataGrid) return true;

      // If dress list exists, check for any sorting indicators
      if (dressList) {
        const text = document.body.textContent || '';
        return text.includes('Sort') || text.includes('Order');
      }

      return false;
    });

    await validateTest(
      'Sort Functionality',
      'sorting',
      sortFunctionalityExists,
      'Sort functionality should be available'
    );
    
    // Take screenshot
    await takeScreenshot(page, 'sorting');
    
  } catch (error) {
    await validateTest(
      'Sorting Test',
      'sorting',
      false,
      `Sorting test failed: ${error.message}`
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
    
    const mobileContentVisible = await waitForElement(page, '.content, .search, .dresses', 2000);
    await validateTest(
      'Mobile Responsiveness',
      'responsive',
      mobileContentVisible,
      'Search page should be responsive on mobile'
    );
    
    // Take mobile screenshot
    await takeScreenshot(page, 'mobile-view');
    
    // Test tablet viewport
    await page.setViewport({ width: 768, height: 1024 });
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const tabletContentVisible = await waitForElement(page, '.content, .search, .dresses', 2000);
    await validateTest(
      'Tablet Responsiveness',
      'responsive',
      tabletContentVisible,
      'Search page should be responsive on tablet'
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
  console.log('\n📋 === FRONTEND DRESS SEARCH TEST REPORT ===');
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
  const reportPath = path.join(__dirname, 'frontend-dress-search-test-report.json');
  fs.writeFileSync(reportPath, JSON.stringify({
    timestamp: new Date().toISOString(),
    page: 'Frontend Dress Search Page',
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
async function runFrontendSearchTests() {
  console.log('🚀 Starting Frontend Dress Search Page Comprehensive Tests');
  console.log('=========================================================');
  
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
    await testSearchPageLoading(page);
    await testSearchFormAndFilters(page);
    await testSearchResults(page);
    await testPaginationAndNavigation(page);
    await testSortingOptions(page);
    await testResponsiveDesign(page);
    
    // Generate final report
    generateReport();
    
    console.log('\n🎉 Frontend Dress Search Testing Complete!');
    
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
  runFrontendSearchTests();
}

module.exports = { runFrontendSearchTests };
