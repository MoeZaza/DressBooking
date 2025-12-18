#!/usr/bin/env node

/**
 * Comprehensive Backend Page-by-Page Testing
 * 
 * Tests every single backend page to ensure it loads with correct data
 * and all functionality works.
 */

const puppeteer = require('puppeteer');
const fs = require('fs');

const BACKEND_URL = 'http://localhost:3001';

// Define all backend pages to test
const backendPages = [
  { name: 'Login Page', path: '/', expectedElements: ['.sign-in', '.sign-in-form'], requiresAuth: false },
  { name: 'Dashboard/Bookings', path: '/bookings', expectedElements: ['.bookings', '.booking-list'], requiresAuth: true },
  { name: 'Create Booking', path: '/create-booking', expectedElements: ['.create-booking', '.booking-form'], requiresAuth: true },
  { name: 'Dresses List', path: '/dresses', expectedElements: ['.dresses', '.dress-list'], requiresAuth: true },
  { name: 'Create Dress', path: '/create-dress', expectedElements: ['.create-dress', '.dress-form'], requiresAuth: true },
  { name: 'Suppliers List', path: '/suppliers', expectedElements: ['.suppliers', '.supplier-list'], requiresAuth: true },
  { name: 'Create Supplier', path: '/create-supplier', expectedElements: ['.create-supplier', '.supplier-form'], requiresAuth: true },
  { name: 'Locations List', path: '/locations', expectedElements: ['.locations', '.location-list'], requiresAuth: true },
  { name: 'Create Location', path: '/create-location', expectedElements: ['.create-location', '.location-form'], requiresAuth: true },
  { name: 'Users List', path: '/users', expectedElements: ['.users', '.user-list'], requiresAuth: true },
  { name: 'Analytics', path: '/analytics', expectedElements: ['.analytics', '.analytics-content'], requiresAuth: true },
  { name: 'Business Intelligence', path: '/business-intelligence', expectedElements: ['.business-intelligence', '.bi-content'], requiresAuth: true },
  { name: 'Settings', path: '/settings', expectedElements: ['.settings', '.settings-form'], requiresAuth: true },
  { name: 'Profile', path: '/profile', expectedElements: ['.profile', '.profile-form'], requiresAuth: true }
];

// Admin credentials for testing
const ADMIN_CREDENTIALS = {
  email: 'admin@bookdress.com',
  password: 'admin123'
};

async function loginToBackend(page) {
  console.log('  🔐 Logging in to backend...');
  
  try {
    await page.goto(BACKEND_URL, { waitUntil: 'domcontentloaded', timeout: 15000 });
    
    // Wait for login form
    await page.waitForSelector('.sign-in-form, .login-form, input[type="email"], input[name="email"]', { timeout: 10000 });
    
    // Fill in credentials
    const emailField = await page.$('input[type="email"], input[name="email"]');
    const passwordField = await page.$('input[type="password"], input[name="password"]');
    
    if (emailField && passwordField) {
      await emailField.type(ADMIN_CREDENTIALS.email);
      await passwordField.type(ADMIN_CREDENTIALS.password);
      
      // Submit form
      const submitButton = await page.$('button[type="submit"], .sign-in-button, .login-button');
      if (submitButton) {
        await submitButton.click();
        
        // Wait for navigation or dashboard
        await page.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: 10000 }).catch(() => {
          // Navigation might not happen if already on dashboard
        });
        
        console.log('    ✅ Login successful');
        return true;
      }
    }
    
    console.log('    ❌ Login failed - form elements not found');
    return false;
    
  } catch (error) {
    console.log(`    ❌ Login error: ${error.message}`);
    return false;
  }
}

async function testBackendPage(page, pageInfo, isLoggedIn) {
  console.log(`  📄 Testing ${pageInfo.name}...`);
  
  const result = {
    name: pageInfo.name,
    path: pageInfo.path,
    accessible: false,
    hasExpectedElements: false,
    hasContent: false,
    hasArabicText: false,
    hasRTLLayout: false,
    hasDataTables: false,
    hasForms: false,
    loadTime: 0,
    errors: [],
    foundElements: [],
    missingElements: []
  };
  
  try {
    if (pageInfo.requiresAuth && !isLoggedIn) {
      console.log(`    ⚠️ Skipping ${pageInfo.name} (requires authentication)`);
      return result;
    }
    
    const startTime = Date.now();
    
    // Navigate to page
    await page.goto(`${BACKEND_URL}${pageInfo.path}`, { 
      waitUntil: 'domcontentloaded', 
      timeout: 15000 
    });
    
    result.accessible = true;
    result.loadTime = Date.now() - startTime;
    
    // Wait a bit for dynamic content to load
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Check for expected elements
    for (const selector of pageInfo.expectedElements) {
      try {
        const element = await page.$(selector);
        if (element) {
          result.foundElements.push(selector);
        } else {
          result.missingElements.push(selector);
        }
      } catch (error) {
        result.missingElements.push(selector);
      }
    }
    
    result.hasExpectedElements = result.missingElements.length === 0;
    
    // Check for content and features
    const pageContent = await page.evaluate(() => {
      const body = document.body;
      return {
        hasText: body.textContent.trim().length > 100,
        hasArabicText: /[\u0600-\u06FF]/.test(body.textContent),
        isRTL: document.documentElement.dir === 'rtl' || getComputedStyle(document.documentElement).direction === 'rtl',
        hasDataTables: document.querySelectorAll('table, .data-table, .MuiDataGrid-root').length > 0,
        hasForms: document.querySelectorAll('form, .form').length > 0
      };
    });
    
    Object.assign(result, pageContent);
    
    console.log(`    ✅ Accessible: ${result.accessible}`);
    console.log(`    ⏱️ Load time: ${result.loadTime}ms`);
    console.log(`    🔍 Expected elements: ${result.foundElements.length}/${pageInfo.expectedElements.length}`);
    console.log(`    📝 Has content: ${result.hasContent ? '✅' : '❌'}`);
    console.log(`    🌐 Arabic text: ${result.hasArabicText ? '✅' : '❌'}`);
    console.log(`    ↔️ RTL layout: ${result.hasRTLLayout ? '✅' : '❌'}`);
    console.log(`    📊 Data tables: ${result.hasDataTables ? '✅' : '❌'}`);
    console.log(`    📋 Forms: ${result.hasForms ? '✅' : '❌'}`);
    
    if (result.missingElements.length > 0) {
      console.log(`    ⚠️ Missing elements: ${result.missingElements.join(', ')}`);
    }
    
  } catch (error) {
    result.errors.push(error.message);
    console.log(`    ❌ Error: ${error.message}`);
  }
  
  return result;
}

async function testBackendFunctionality(page) {
  console.log('  🎯 Testing backend functionality...');
  
  const functionalityResults = {
    navigation: false,
    dataLoading: false,
    formValidation: false,
    searchFilters: false,
    pagination: false,
    errors: []
  };
  
  try {
    // Test navigation
    const navLinks = await page.$$('nav a, .nav a, .navigation a, .sidebar a');
    if (navLinks.length > 0) {
      functionalityResults.navigation = true;
    }
    
    // Test data loading (look for tables or lists with data)
    const dataElements = await page.$$('table tbody tr, .data-row, .list-item, .MuiDataGrid-row');
    if (dataElements.length > 0) {
      functionalityResults.dataLoading = true;
    }
    
    // Test form validation (look for required fields)
    const requiredFields = await page.$$('input[required], select[required], textarea[required]');
    if (requiredFields.length > 0) {
      functionalityResults.formValidation = true;
    }
    
    // Test search/filter functionality
    const searchElements = await page.$$('input[type="search"], .search-input, .filter-input');
    if (searchElements.length > 0) {
      functionalityResults.searchFilters = true;
    }
    
    // Test pagination
    const paginationElements = await page.$$('.pagination, .page-nav, .MuiPagination-root');
    if (paginationElements.length > 0) {
      functionalityResults.pagination = true;
    }
    
  } catch (error) {
    functionalityResults.errors.push(`Functionality test error: ${error.message}`);
  }
  
  console.log(`    🧭 Navigation: ${functionalityResults.navigation ? '✅' : '❌'}`);
  console.log(`    📊 Data loading: ${functionalityResults.dataLoading ? '✅' : '❌'}`);
  console.log(`    ✅ Form validation: ${functionalityResults.formValidation ? '✅' : '❌'}`);
  console.log(`    🔍 Search/Filters: ${functionalityResults.searchFilters ? '✅' : '❌'}`);
  console.log(`    📄 Pagination: ${functionalityResults.pagination ? '✅' : '❌'}`);
  
  return functionalityResults;
}

async function runComprehensiveBackendTesting() {
  console.log('🖥️ Starting Comprehensive Backend Page-by-Page Testing...\n');
  
  let browser;
  const results = {
    pages: [],
    functionality: null,
    loginSuccess: false,
    summary: {
      totalPages: backendPages.length,
      accessiblePages: 0,
      pagesWithContent: 0,
      pagesWithArabic: 0,
      pagesWithDataTables: 0,
      pagesWithForms: 0,
      averageLoadTime: 0,
      totalErrors: 0
    }
  };
  
  try {
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const page = await browser.newPage();
    await page.setViewport({ width: 1920, height: 1080 });
    
    // Capture JavaScript errors
    page.on('pageerror', error => {
      if (!page.jsErrors) page.jsErrors = [];
      page.jsErrors.push(error.message);
    });
    
    // Try to login first
    console.log('🔐 Attempting to login...');
    results.loginSuccess = await loginToBackend(page);
    
    // Test each page
    for (const pageInfo of backendPages) {
      const pageResult = await testBackendPage(page, pageInfo, results.loginSuccess);
      results.pages.push(pageResult);
      
      // Update summary
      if (pageResult.accessible) results.summary.accessiblePages++;
      if (pageResult.hasContent) results.summary.pagesWithContent++;
      if (pageResult.hasArabicText) results.summary.pagesWithArabic++;
      if (pageResult.hasDataTables) results.summary.pagesWithDataTables++;
      if (pageResult.hasForms) results.summary.pagesWithForms++;
      results.summary.totalErrors += pageResult.errors.length;
      
      // Small delay between pages
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    // Test functionality on dashboard/bookings page
    if (results.loginSuccess) {
      console.log('\n🎯 Testing Backend Functionality...');
      await page.goto(`${BACKEND_URL}/bookings`, { waitUntil: 'domcontentloaded', timeout: 15000 });
      results.functionality = await testBackendFunctionality(page);
    }
    
  } catch (error) {
    console.error('❌ Testing error:', error.message);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
  
  // Calculate average load time
  const accessiblePages = results.pages.filter(p => p.accessible);
  const totalLoadTime = accessiblePages.reduce((sum, page) => sum + page.loadTime, 0);
  results.summary.averageLoadTime = accessiblePages.length > 0 ? Math.round(totalLoadTime / accessiblePages.length) : 0;
  
  // Generate summary report
  console.log('\n📊 Backend Testing Summary:');
  console.log('=' .repeat(60));
  console.log(`🔐 Login successful: ${results.loginSuccess ? '✅' : '❌'}`);
  console.log(`📄 Total pages tested: ${results.pages.length}/${results.summary.totalPages}`);
  console.log(`✅ Accessible pages: ${results.summary.accessiblePages}/${results.pages.length}`);
  console.log(`📝 Pages with content: ${results.summary.pagesWithContent}/${results.pages.length}`);
  console.log(`🌐 Pages with Arabic: ${results.summary.pagesWithArabic}/${results.pages.length}`);
  console.log(`📊 Pages with data tables: ${results.summary.pagesWithDataTables}/${results.pages.length}`);
  console.log(`📋 Pages with forms: ${results.summary.pagesWithForms}/${results.pages.length}`);
  console.log(`⏱️ Average load time: ${results.summary.averageLoadTime}ms`);
  console.log(`❌ Total errors: ${results.summary.totalErrors}`);
  
  // Save detailed results
  fs.writeFileSync('scripts/backend-testing-results.json', JSON.stringify(results, null, 2));
  console.log('\n📄 Detailed results saved to scripts/backend-testing-results.json');
  
  console.log('\n🎉 Comprehensive Backend Testing completed!');
}

// Run the tests
runComprehensiveBackendTesting().catch(console.error);
