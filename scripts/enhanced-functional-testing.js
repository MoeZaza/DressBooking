#!/usr/bin/env node

/**
 * Enhanced Functional Testing
 * 
 * Comprehensive functional testing of both frontend and backend
 * to ensure all functional requirements are met.
 */

const puppeteer = require('puppeteer');
const axios = require('axios');

const FRONTEND_URL = 'http://localhost:3000';
const BACKEND_URL = 'http://localhost:3001';
const API_URL = 'http://localhost:4002';

async function testFrontendFunctionality(page) {
  console.log('📱 Testing Frontend Functionality...\n');
  
  const results = {
    homePageTest: { passed: false, details: [] },
    searchFunctionality: { passed: false, details: [] },
    navigationTest: { passed: false, details: [] },
    responsiveDesign: { passed: false, details: [] },
    arabicLocalization: { passed: false, details: [] },
    userInteraction: { passed: false, details: [] }
  };
  
  try {
    // Test 1: Home Page Functionality
    console.log('  🏠 Testing Home Page...');
    await page.goto(FRONTEND_URL, { waitUntil: 'domcontentloaded', timeout: 15000 });
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    const homePageData = await page.evaluate(() => {
      return {
        hasHeader: !!document.querySelector('header, .header, nav'),
        hasSearchForm: !!document.querySelector('.search-form, .home-search-form, form'),
        hasFooter: !!document.querySelector('footer, .footer'),
        hasMainContent: !!document.querySelector('main, .main, .content'),
        hasArabicText: /[\u0600-\u06FF]/.test(document.body.textContent || ''),
        isRTL: document.documentElement.dir === 'rtl',
        title: document.title,
        buttonsCount: document.querySelectorAll('button').length,
        linksCount: document.querySelectorAll('a').length
      };
    });
    
    results.homePageTest.passed = homePageData.hasHeader && homePageData.hasSearchForm && homePageData.hasFooter;
    results.homePageTest.details = [
      `Header: ${homePageData.hasHeader ? '✅' : '❌'}`,
      `Search Form: ${homePageData.hasSearchForm ? '✅' : '❌'}`,
      `Footer: ${homePageData.hasFooter ? '✅' : '❌'}`,
      `Main Content: ${homePageData.hasMainContent ? '✅' : '❌'}`,
      `Buttons: ${homePageData.buttonsCount}`,
      `Links: ${homePageData.linksCount}`
    ];
    
    console.log(`    ${results.homePageTest.passed ? '✅' : '❌'} Home Page Test`);
    
    // Test 2: Search Functionality
    console.log('  🔍 Testing Search Functionality...');
    await page.goto(`${FRONTEND_URL}/search`, { waitUntil: 'domcontentloaded', timeout: 15000 });
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    const searchData = await page.evaluate(() => {
      return {
        hasSearchForm: !!document.querySelector('.search-form, form'),
        hasLocationField: !!document.querySelector('.location-field, [name="location"]'),
        hasFilters: document.querySelectorAll('.filter, [class*="filter"]').length > 0,
        hasResults: !!document.querySelector('.col-2, .search-results, .results'),
        hasDataGrid: !!document.querySelector('.MuiDataGrid-root, table'),
        hasPagination: !!document.querySelector('.MuiPagination-root, .pagination'),
        hasArabicText: /[\u0600-\u06FF]/.test(document.body.textContent || '')
      };
    });
    
    results.searchFunctionality.passed = searchData.hasSearchForm && searchData.hasFilters && searchData.hasResults;
    results.searchFunctionality.details = [
      `Search Form: ${searchData.hasSearchForm ? '✅' : '❌'}`,
      `Location Field: ${searchData.hasLocationField ? '✅' : '❌'}`,
      `Filters: ${searchData.hasFilters ? '✅' : '❌'}`,
      `Results Area: ${searchData.hasResults ? '✅' : '❌'}`,
      `Data Grid: ${searchData.hasDataGrid ? '✅' : '❌'}`,
      `Pagination: ${searchData.hasPagination ? '✅' : '❌'}`
    ];
    
    console.log(`    ${results.searchFunctionality.passed ? '✅' : '❌'} Search Functionality Test`);
    
    // Test 3: Navigation
    console.log('  🧭 Testing Navigation...');
    const navigationData = await page.evaluate(() => {
      const navLinks = document.querySelectorAll('nav a, .nav a, .navigation a, header a');
      const workingLinks = [];
      
      navLinks.forEach(link => {
        if (link.href && !link.href.includes('javascript:') && !link.href.includes('#')) {
          workingLinks.push(link.href);
        }
      });
      
      return {
        totalNavLinks: navLinks.length,
        workingLinks: workingLinks.length,
        hasLogo: !!document.querySelector('.logo, [class*="logo"]'),
        hasMenu: !!document.querySelector('.menu, [class*="menu"], nav ul'),
        hasUserMenu: !!document.querySelector('.user-menu, [class*="user"]')
      };
    });
    
    results.navigationTest.passed = navigationData.totalNavLinks > 0 && navigationData.hasMenu;
    results.navigationTest.details = [
      `Navigation Links: ${navigationData.totalNavLinks}`,
      `Working Links: ${navigationData.workingLinks}`,
      `Logo: ${navigationData.hasLogo ? '✅' : '❌'}`,
      `Menu: ${navigationData.hasMenu ? '✅' : '❌'}`,
      `User Menu: ${navigationData.hasUserMenu ? '✅' : '❌'}`
    ];
    
    console.log(`    ${results.navigationTest.passed ? '✅' : '❌'} Navigation Test`);
    
    // Test 4: Responsive Design
    console.log('  📱 Testing Responsive Design...');
    
    // Test mobile viewport
    await page.setViewport({ width: 375, height: 667 });
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const mobileData = await page.evaluate(() => {
      return {
        isMobileOptimized: window.innerWidth <= 768,
        hasHamburgerMenu: !!document.querySelector('.hamburger, .mobile-menu, [class*="mobile"]'),
        contentFitsScreen: document.body.scrollWidth <= window.innerWidth + 50,
        hasResponsiveImages: document.querySelectorAll('img[srcset], img[sizes]').length > 0
      };
    });
    
    // Reset to desktop viewport
    await page.setViewport({ width: 1920, height: 1080 });
    
    results.responsiveDesign.passed = mobileData.isMobileOptimized && mobileData.contentFitsScreen;
    results.responsiveDesign.details = [
      `Mobile Optimized: ${mobileData.isMobileOptimized ? '✅' : '❌'}`,
      `Hamburger Menu: ${mobileData.hasHamburgerMenu ? '✅' : '❌'}`,
      `Content Fits Screen: ${mobileData.contentFitsScreen ? '✅' : '❌'}`,
      `Responsive Images: ${mobileData.hasResponsiveImages ? '✅' : '❌'}`
    ];
    
    console.log(`    ${results.responsiveDesign.passed ? '✅' : '❌'} Responsive Design Test`);
    
    // Test 5: Arabic Localization
    console.log('  🌐 Testing Arabic Localization...');
    const arabicData = await page.evaluate(() => {
      const bodyText = document.body.textContent || '';
      const arabicChars = bodyText.match(/[\u0600-\u06FF]/g) || [];
      const totalChars = bodyText.replace(/\s+/g, '').length;
      
      return {
        htmlLang: document.documentElement.lang,
        htmlDir: document.documentElement.dir,
        arabicCharCount: arabicChars.length,
        totalCharCount: totalChars,
        arabicPercentage: totalChars > 0 ? Math.round((arabicChars.length / totalChars) * 100) : 0,
        hasArabicNavigation: /الرئيسية|البحث|تسجيل/.test(bodyText),
        hasArabicButtons: /بحث|إرسال|حفظ/.test(bodyText),
        hasArabicLabels: /الموقع|التاريخ|النوع/.test(bodyText)
      };
    });
    
    results.arabicLocalization.passed = arabicData.htmlLang === 'ar' && arabicData.htmlDir === 'rtl' && arabicData.arabicPercentage > 50;
    results.arabicLocalization.details = [
      `HTML Lang: ${arabicData.htmlLang}`,
      `HTML Dir: ${arabicData.htmlDir}`,
      `Arabic Percentage: ${arabicData.arabicPercentage}%`,
      `Arabic Navigation: ${arabicData.hasArabicNavigation ? '✅' : '❌'}`,
      `Arabic Buttons: ${arabicData.hasArabicButtons ? '✅' : '❌'}`,
      `Arabic Labels: ${arabicData.hasArabicLabels ? '✅' : '❌'}`
    ];
    
    console.log(`    ${results.arabicLocalization.passed ? '✅' : '❌'} Arabic Localization Test`);
    
    // Test 6: User Interaction
    console.log('  👆 Testing User Interaction...');
    try {
      // Test button clicks
      const buttons = await page.$$('button:not([disabled])');
      const clickableButtons = Math.min(buttons.length, 3); // Test first 3 buttons
      
      let successfulClicks = 0;
      for (let i = 0; i < clickableButtons; i++) {
        try {
          await buttons[i].click();
          successfulClicks++;
          await new Promise(resolve => setTimeout(resolve, 500));
        } catch (error) {
          // Button might not be clickable
        }
      }
      
      results.userInteraction.passed = successfulClicks > 0;
      results.userInteraction.details = [
        `Total Buttons: ${buttons.length}`,
        `Clickable Buttons: ${successfulClicks}`,
        `Interaction Success: ${successfulClicks > 0 ? '✅' : '❌'}`
      ];
      
    } catch (error) {
      results.userInteraction.passed = false;
      results.userInteraction.details = [`Error: ${error.message}`];
    }
    
    console.log(`    ${results.userInteraction.passed ? '✅' : '❌'} User Interaction Test`);
    
  } catch (error) {
    console.log(`  ❌ Frontend testing error: ${error.message}`);
  }
  
  return results;
}

async function testBackendFunctionality(page) {
  console.log('\n🖥️ Testing Backend Functionality...\n');
  
  const results = {
    accessibilityTest: { passed: false, details: [] },
    authenticationTest: { passed: false, details: [] },
    dashboardTest: { passed: false, details: [] },
    crudOperations: { passed: false, details: [] },
    arabicLocalization: { passed: false, details: [] },
    dataLoading: { passed: false, details: [] }
  };
  
  try {
    // Test 1: Backend Accessibility
    console.log('  🔐 Testing Backend Accessibility...');
    await page.goto(BACKEND_URL, { waitUntil: 'domcontentloaded', timeout: 15000 });
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    const accessData = await page.evaluate(() => {
      return {
        hasLoginForm: !!document.querySelector('form, .login-form, [class*="login"]'),
        hasInputFields: document.querySelectorAll('input').length,
        hasSubmitButton: !!document.querySelector('button[type="submit"], input[type="submit"]'),
        hasArabicText: /[\u0600-\u06FF]/.test(document.body.textContent || ''),
        isRTL: document.documentElement.dir === 'rtl',
        title: document.title
      };
    });
    
    results.accessibilityTest.passed = accessData.hasLoginForm || accessData.hasInputFields > 0;
    results.accessibilityTest.details = [
      `Login Form: ${accessData.hasLoginForm ? '✅' : '❌'}`,
      `Input Fields: ${accessData.hasInputFields}`,
      `Submit Button: ${accessData.hasSubmitButton ? '✅' : '❌'}`,
      `Arabic Text: ${accessData.hasArabicText ? '✅' : '❌'}`,
      `RTL Layout: ${accessData.isRTL ? '✅' : '❌'}`,
      `Title: ${accessData.title}`
    ];
    
    console.log(`    ${results.accessibilityTest.passed ? '✅' : '❌'} Backend Accessibility Test`);
    
    // Test 2: Authentication (if login form exists)
    console.log('  🔑 Testing Authentication...');
    if (accessData.hasLoginForm) {
      try {
        // Try to interact with login form
        const emailField = await page.$('input[type="email"], input[name="email"], input[placeholder*="email"]');
        const passwordField = await page.$('input[type="password"], input[name="password"]');
        
        if (emailField && passwordField) {
          await emailField.type('test@example.com');
          await passwordField.type('testpassword');
          
          results.authenticationTest.passed = true;
          results.authenticationTest.details = [
            'Email field: ✅',
            'Password field: ✅',
            'Form interaction: ✅'
          ];
        } else {
          results.authenticationTest.details = ['Login form fields not found'];
        }
      } catch (error) {
        results.authenticationTest.details = [`Authentication test error: ${error.message}`];
      }
    } else {
      results.authenticationTest.details = ['No login form detected'];
    }
    
    console.log(`    ${results.authenticationTest.passed ? '✅' : '❌'} Authentication Test`);
    
    // Test 3: Dashboard/Main Interface
    console.log('  📊 Testing Dashboard...');
    const dashboardData = await page.evaluate(() => {
      return {
        hasNavigation: !!document.querySelector('nav, .nav, .navigation, .sidebar'),
        hasMainContent: !!document.querySelector('main, .main, .content, .dashboard'),
        hasDataTables: document.querySelectorAll('table, .MuiDataGrid-root, .data-grid').length,
        hasCards: document.querySelectorAll('.card, [class*="card"]').length,
        hasButtons: document.querySelectorAll('button').length,
        hasLinks: document.querySelectorAll('a').length
      };
    });
    
    results.dashboardTest.passed = dashboardData.hasNavigation && dashboardData.hasMainContent;
    results.dashboardTest.details = [
      `Navigation: ${dashboardData.hasNavigation ? '✅' : '❌'}`,
      `Main Content: ${dashboardData.hasMainContent ? '✅' : '❌'}`,
      `Data Tables: ${dashboardData.hasDataTables}`,
      `Cards: ${dashboardData.hasCards}`,
      `Buttons: ${dashboardData.hasButtons}`,
      `Links: ${dashboardData.hasLinks}`
    ];
    
    console.log(`    ${results.dashboardTest.passed ? '✅' : '❌'} Dashboard Test`);
    
    // Test 4: CRUD Operations Interface
    console.log('  📝 Testing CRUD Operations Interface...');
    const crudData = await page.evaluate(() => {
      const createButtons = document.querySelectorAll('button[class*="create"], button[class*="add"], .create-btn, .add-btn');
      const editButtons = document.querySelectorAll('button[class*="edit"], .edit-btn');
      const deleteButtons = document.querySelectorAll('button[class*="delete"], .delete-btn');
      const forms = document.querySelectorAll('form');
      
      return {
        hasCreateButtons: createButtons.length > 0,
        hasEditButtons: editButtons.length > 0,
        hasDeleteButtons: deleteButtons.length > 0,
        hasForms: forms.length > 0,
        createButtonsCount: createButtons.length,
        editButtonsCount: editButtons.length,
        deleteButtonsCount: deleteButtons.length,
        formsCount: forms.length
      };
    });
    
    results.crudOperations.passed = crudData.hasForms || crudData.hasCreateButtons;
    results.crudOperations.details = [
      `Create Buttons: ${crudData.createButtonsCount}`,
      `Edit Buttons: ${crudData.editButtonsCount}`,
      `Delete Buttons: ${crudData.deleteButtonsCount}`,
      `Forms: ${crudData.formsCount}`,
      `CRUD Interface: ${results.crudOperations.passed ? '✅' : '❌'}`
    ];
    
    console.log(`    ${results.crudOperations.passed ? '✅' : '❌'} CRUD Operations Test`);
    
    // Test 5: Arabic Localization
    console.log('  🌐 Testing Backend Arabic Localization...');
    const backendArabicData = await page.evaluate(() => {
      const bodyText = document.body.textContent || '';
      const arabicChars = bodyText.match(/[\u0600-\u06FF]/g) || [];
      const totalChars = bodyText.replace(/\s+/g, '').length;
      
      return {
        htmlLang: document.documentElement.lang,
        htmlDir: document.documentElement.dir,
        arabicCharCount: arabicChars.length,
        totalCharCount: totalChars,
        arabicPercentage: totalChars > 0 ? Math.round((arabicChars.length / totalChars) * 100) : 0,
        hasArabicNavigation: /الرئيسية|الحجوزات|الفساتين|المستخدمين/.test(bodyText),
        hasArabicButtons: /إنشاء|تعديل|حذف|حفظ/.test(bodyText),
        hasArabicLabels: /الاسم|البريد|الهاتف|العنوان/.test(bodyText)
      };
    });
    
    results.arabicLocalization.passed = backendArabicData.htmlLang === 'ar' && backendArabicData.htmlDir === 'rtl' && backendArabicData.arabicPercentage > 50;
    results.arabicLocalization.details = [
      `HTML Lang: ${backendArabicData.htmlLang}`,
      `HTML Dir: ${backendArabicData.htmlDir}`,
      `Arabic Percentage: ${backendArabicData.arabicPercentage}%`,
      `Arabic Navigation: ${backendArabicData.hasArabicNavigation ? '✅' : '❌'}`,
      `Arabic Buttons: ${backendArabicData.hasArabicButtons ? '✅' : '❌'}`,
      `Arabic Labels: ${backendArabicData.hasArabicLabels ? '✅' : '❌'}`
    ];
    
    console.log(`    ${results.arabicLocalization.passed ? '✅' : '❌'} Backend Arabic Localization Test`);
    
    // Test 6: Data Loading
    console.log('  📊 Testing Data Loading...');
    const dataLoadingData = await page.evaluate(() => {
      const tables = document.querySelectorAll('table tbody tr, .MuiDataGrid-row');
      const lists = document.querySelectorAll('ul li, ol li');
      const cards = document.querySelectorAll('.card, [class*="card"]');
      
      return {
        hasTableData: tables.length > 0,
        hasListData: lists.length > 0,
        hasCardData: cards.length > 0,
        tableRowsCount: tables.length,
        listItemsCount: lists.length,
        cardsCount: cards.length,
        hasLoadingIndicators: !!document.querySelector('.loading, [class*="loading"], .spinner, [class*="spinner"]')
      };
    });
    
    results.dataLoading.passed = dataLoadingData.hasTableData || dataLoadingData.hasListData || dataLoadingData.hasCardData;
    results.dataLoading.details = [
      `Table Rows: ${dataLoadingData.tableRowsCount}`,
      `List Items: ${dataLoadingData.listItemsCount}`,
      `Cards: ${dataLoadingData.cardsCount}`,
      `Loading Indicators: ${dataLoadingData.hasLoadingIndicators ? '✅' : '❌'}`,
      `Data Present: ${results.dataLoading.passed ? '✅' : '❌'}`
    ];
    
    console.log(`    ${results.dataLoading.passed ? '✅' : '❌'} Data Loading Test`);
    
  } catch (error) {
    console.log(`  ❌ Backend testing error: ${error.message}`);
  }
  
  return results;
}

async function testAPIFunctionality() {
  console.log('\n🔌 Testing API Functionality...\n');
  
  const results = {
    connectivity: { passed: false, details: [] },
    endpoints: { passed: false, details: [] },
    performance: { passed: false, details: [] },
    dataIntegrity: { passed: false, details: [] }
  };
  
  try {
    // Test API endpoints
    const endpoints = [
      { name: 'Frontend Dresses', method: 'POST', url: '/api/frontend-dresses/1/10', data: {} },
      { name: 'Locations', method: 'GET', url: '/api/locations/1/10/en' },
      { name: 'Countries', method: 'GET', url: '/api/countries/1/10/en' },
      { name: 'Frontend Suppliers', method: 'POST', url: '/api/frontend-suppliers', data: {} }
    ];
    
    const endpointResults = [];
    let totalResponseTime = 0;
    
    for (const endpoint of endpoints) {
      console.log(`  📡 Testing ${endpoint.name}...`);
      
      try {
        const startTime = Date.now();
        
        const config = {
          method: endpoint.method,
          url: `${API_URL}${endpoint.url}`,
          timeout: 10000,
          validateStatus: () => true
        };
        
        if (endpoint.data) {
          config.data = endpoint.data;
          config.headers = { 'Content-Type': 'application/json' };
        }
        
        const response = await axios(config);
        const endTime = Date.now();
        const responseTime = endTime - startTime;
        totalResponseTime += responseTime;
        
        const result = {
          name: endpoint.name,
          status: response.status,
          responseTime,
          hasData: !!response.data,
          dataSize: JSON.stringify(response.data || {}).length,
          success: response.status >= 200 && response.status < 300
        };
        
        endpointResults.push(result);
        console.log(`    ${result.success ? '✅' : '❌'} ${endpoint.name} (${responseTime}ms, ${result.status})`);
        
      } catch (error) {
        endpointResults.push({
          name: endpoint.name,
          status: 0,
          responseTime: 10000,
          hasData: false,
          dataSize: 0,
          success: false,
          error: error.message
        });
        console.log(`    ❌ ${endpoint.name} (Error: ${error.message})`);
      }
    }
    
    const successfulEndpoints = endpointResults.filter(r => r.success).length;
    const averageResponseTime = totalResponseTime / endpoints.length;
    
    results.connectivity.passed = successfulEndpoints > 0;
    results.connectivity.details = [`${successfulEndpoints}/${endpoints.length} endpoints accessible`];
    
    results.endpoints.passed = successfulEndpoints >= endpoints.length * 0.75; // 75% success rate
    results.endpoints.details = endpointResults.map(r => 
      `${r.name}: ${r.success ? '✅' : '❌'} (${r.responseTime}ms)`
    );
    
    results.performance.passed = averageResponseTime < 1000; // Under 1 second average
    results.performance.details = [
      `Average Response Time: ${Math.round(averageResponseTime)}ms`,
      `Performance Target: ${results.performance.passed ? '✅' : '❌'} (< 1000ms)`
    ];
    
    results.dataIntegrity.passed = endpointResults.some(r => r.hasData && r.dataSize > 100);
    results.dataIntegrity.details = [
      `Endpoints with data: ${endpointResults.filter(r => r.hasData).length}`,
      `Data integrity: ${results.dataIntegrity.passed ? '✅' : '❌'}`
    ];
    
  } catch (error) {
    console.log(`  ❌ API testing error: ${error.message}`);
  }
  
  return results;
}

async function runEnhancedFunctionalTesting() {
  console.log('🧪 Starting Enhanced Functional Testing...\n');
  
  let browser;
  const testResults = {
    frontend: null,
    backend: null,
    api: null,
    summary: {
      totalTests: 0,
      passedTests: 0,
      failedTests: 0,
      overallScore: 0
    }
  };
  
  try {
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const page = await browser.newPage();
    await page.setViewport({ width: 1920, height: 1080 });
    
    // Test Frontend
    testResults.frontend = await testFrontendFunctionality(page);
    
    // Test Backend
    testResults.backend = await testBackendFunctionality(page);
    
    // Test API
    testResults.api = await testAPIFunctionality();
    
    // Calculate summary
    const allTests = [
      ...Object.values(testResults.frontend),
      ...Object.values(testResults.backend),
      ...Object.values(testResults.api)
    ];
    
    testResults.summary.totalTests = allTests.length;
    testResults.summary.passedTests = allTests.filter(test => test.passed).length;
    testResults.summary.failedTests = allTests.filter(test => !test.passed).length;
    testResults.summary.overallScore = Math.round((testResults.summary.passedTests / testResults.summary.totalTests) * 100);
    
  } catch (error) {
    console.error('❌ Enhanced functional testing error:', error.message);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
  
  // Display summary
  console.log('\n📊 Enhanced Functional Testing Summary:');
  console.log('=' .repeat(60));
  console.log(`📱 Frontend Tests: ${Object.values(testResults.frontend).filter(t => t.passed).length}/${Object.values(testResults.frontend).length} passed`);
  console.log(`🖥️ Backend Tests: ${Object.values(testResults.backend).filter(t => t.passed).length}/${Object.values(testResults.backend).length} passed`);
  console.log(`🔌 API Tests: ${Object.values(testResults.api).filter(t => t.passed).length}/${Object.values(testResults.api).length} passed`);
  console.log(`🎯 Overall Score: ${testResults.summary.overallScore}%`);
  
  if (testResults.summary.overallScore >= 80) {
    console.log('🟢 Excellent functional test results!');
  } else if (testResults.summary.overallScore >= 60) {
    console.log('🟡 Good functional test results, some improvements needed');
  } else {
    console.log('🔴 Poor functional test results, significant improvements required');
  }
  
  // Save results
  const fs = require('fs');
  fs.writeFileSync('scripts/enhanced-functional-testing-results.json', JSON.stringify(testResults, null, 2));
  console.log('\n📄 Results saved to scripts/enhanced-functional-testing-results.json');
  
  console.log('\n🎉 Enhanced functional testing completed!');
  
  return testResults;
}

// Run the enhanced functional testing
runEnhancedFunctionalTesting().catch(console.error);
