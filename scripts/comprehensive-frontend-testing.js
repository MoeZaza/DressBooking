#!/usr/bin/env node

/**
 * Comprehensive Frontend Page-by-Page Testing
 * 
 * Tests every single frontend page to ensure it loads with correct data
 * and all functionality works.
 */

const puppeteer = require('puppeteer');
const fs = require('fs');

const FRONTEND_URL = 'http://localhost:3000';

// Define all frontend pages to test
const frontendPages = [
  { name: 'Home Page', path: '/', expectedElements: ['.hero', '.search-form', '.dress-types'] },
  { name: 'Search Page', path: '/search', expectedElements: ['.search', '.col-1', '.col-2'] },
  { name: 'About Page', path: '/about', expectedElements: ['.about', '.content'] },
  { name: 'Contact Page', path: '/contact', expectedElements: ['.contact', '.contact-form'] },
  { name: 'FAQ Page', path: '/faq', expectedElements: ['.faq', '.faq-list'] },
  { name: 'Locations Page', path: '/locations', expectedElements: ['.locations', '.location-list'] },
  { name: 'Sign In Page', path: '/sign-in', expectedElements: ['.sign-in', '.sign-in-form'] },
  { name: 'Sign Up Page', path: '/sign-up', expectedElements: ['.sign-up', '.sign-up-form'] },
  { name: 'Terms of Service', path: '/tos', expectedElements: ['.tos', '.content'] },
  { name: 'Privacy Policy', path: '/privacy', expectedElements: ['.privacy', '.content'] },
  { name: 'Forgot Password', path: '/forgot-password', expectedElements: ['.forgot-password', '.forgot-password-form'] },
  { name: 'User Dashboard', path: '/profile', expectedElements: ['.profile', '.user-info'], requiresAuth: true },
  { name: 'User Settings', path: '/settings', expectedElements: ['.settings', '.settings-form'], requiresAuth: true },
  { name: 'User Bookings', path: '/bookings', expectedElements: ['.bookings', '.booking-list'], requiresAuth: true },
  { name: 'Checkout', path: '/checkout', expectedElements: ['.checkout', '.checkout-form'], requiresAuth: true }
];

async function testFrontendPage(page, pageInfo) {
  console.log(`  📄 Testing ${pageInfo.name}...`);
  
  const result = {
    name: pageInfo.name,
    path: pageInfo.path,
    accessible: false,
    hasExpectedElements: false,
    hasContent: false,
    hasArabicText: false,
    hasRTLLayout: false,
    loadTime: 0,
    errors: [],
    foundElements: [],
    missingElements: []
  };
  
  try {
    const startTime = Date.now();
    
    // Navigate to page
    await page.goto(`${FRONTEND_URL}${pageInfo.path}`, { 
      waitUntil: 'domcontentloaded', 
      timeout: 15000 
    });
    
    result.accessible = true;
    result.loadTime = Date.now() - startTime;
    
    // Wait a bit for dynamic content to load
    await new Promise(resolve => setTimeout(resolve, 2000));
    
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
    
    // Check for content
    const pageContent = await page.evaluate(() => {
      const body = document.body;
      return {
        hasText: body.textContent.trim().length > 100,
        hasArabicText: /[\u0600-\u06FF]/.test(body.textContent),
        isRTL: document.documentElement.dir === 'rtl' || getComputedStyle(document.documentElement).direction === 'rtl'
      };
    });
    
    result.hasContent = pageContent.hasText;
    result.hasArabicText = pageContent.hasArabicText;
    result.hasRTLLayout = pageContent.isRTL;
    
    // Check for JavaScript errors
    const jsErrors = await page.evaluate(() => {
      return window.jsErrors || [];
    });
    
    if (jsErrors.length > 0) {
      result.errors.push(...jsErrors);
    }
    
    console.log(`    ✅ Accessible: ${result.accessible}`);
    console.log(`    ⏱️ Load time: ${result.loadTime}ms`);
    console.log(`    🔍 Expected elements: ${result.foundElements.length}/${pageInfo.expectedElements.length}`);
    console.log(`    📝 Has content: ${result.hasContent ? '✅' : '❌'}`);
    console.log(`    🌐 Arabic text: ${result.hasArabicText ? '✅' : '❌'}`);
    console.log(`    ↔️ RTL layout: ${result.hasRTLLayout ? '✅' : '❌'}`);
    
    if (result.missingElements.length > 0) {
      console.log(`    ⚠️ Missing elements: ${result.missingElements.join(', ')}`);
    }
    
  } catch (error) {
    result.errors.push(error.message);
    console.log(`    ❌ Error: ${error.message}`);
  }
  
  return result;
}

async function testInteractiveFeatures(page) {
  console.log('  🎯 Testing interactive features...');
  
  const interactiveResults = {
    searchForm: false,
    navigation: false,
    languageSwitch: false,
    responsiveMenu: false,
    errors: []
  };
  
  try {
    // Test search form (if present)
    const searchForm = await page.$('.search-form, .home-search-form');
    if (searchForm) {
      try {
        const locationField = await page.$('.location-field input, .location-field select');
        if (locationField) {
          await locationField.click();
          interactiveResults.searchForm = true;
        }
      } catch (error) {
        interactiveResults.errors.push(`Search form error: ${error.message}`);
      }
    }
    
    // Test navigation
    const navLinks = await page.$$('nav a, .nav a, .navigation a');
    if (navLinks.length > 0) {
      interactiveResults.navigation = true;
    }
    
    // Test language switch (if present)
    const languageSwitch = await page.$('.language-switch, .lang-switch, [data-testid="language-switch"]');
    if (languageSwitch) {
      try {
        await languageSwitch.click();
        interactiveResults.languageSwitch = true;
      } catch (error) {
        interactiveResults.errors.push(`Language switch error: ${error.message}`);
      }
    }
    
    // Test responsive menu (mobile)
    await page.setViewport({ width: 375, height: 667 });
    const mobileMenu = await page.$('.mobile-menu, .hamburger, .menu-toggle');
    if (mobileMenu) {
      try {
        await mobileMenu.click();
        interactiveResults.responsiveMenu = true;
      } catch (error) {
        interactiveResults.errors.push(`Mobile menu error: ${error.message}`);
      }
    }
    
    // Reset viewport
    await page.setViewport({ width: 1920, height: 1080 });
    
  } catch (error) {
    interactiveResults.errors.push(`Interactive test error: ${error.message}`);
  }
  
  console.log(`    🔍 Search form: ${interactiveResults.searchForm ? '✅' : '❌'}`);
  console.log(`    🧭 Navigation: ${interactiveResults.navigation ? '✅' : '❌'}`);
  console.log(`    🌐 Language switch: ${interactiveResults.languageSwitch ? '✅' : '❌'}`);
  console.log(`    📱 Mobile menu: ${interactiveResults.responsiveMenu ? '✅' : '❌'}`);
  
  return interactiveResults;
}

async function runComprehensiveFrontendTesting() {
  console.log('🌐 Starting Comprehensive Frontend Page-by-Page Testing...\n');
  
  let browser;
  const results = {
    pages: [],
    interactive: null,
    summary: {
      totalPages: frontendPages.length,
      accessiblePages: 0,
      pagesWithContent: 0,
      pagesWithArabic: 0,
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
    
    // Test each page
    for (const pageInfo of frontendPages) {
      if (pageInfo.requiresAuth) {
        console.log(`  ⚠️ Skipping ${pageInfo.name} (requires authentication)`);
        continue;
      }
      
      const pageResult = await testFrontendPage(page, pageInfo);
      results.pages.push(pageResult);
      
      // Update summary
      if (pageResult.accessible) results.summary.accessiblePages++;
      if (pageResult.hasContent) results.summary.pagesWithContent++;
      if (pageResult.hasArabicText) results.summary.pagesWithArabic++;
      results.summary.totalErrors += pageResult.errors.length;
      
      // Small delay between pages
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    // Test interactive features on home page
    console.log('\n🎯 Testing Interactive Features...');
    await page.goto(FRONTEND_URL, { waitUntil: 'domcontentloaded', timeout: 15000 });
    results.interactive = await testInteractiveFeatures(page);
    
  } catch (error) {
    console.error('❌ Testing error:', error.message);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
  
  // Calculate average load time
  const totalLoadTime = results.pages.reduce((sum, page) => sum + page.loadTime, 0);
  results.summary.averageLoadTime = Math.round(totalLoadTime / results.pages.length);
  
  // Generate summary report
  console.log('\n📊 Frontend Testing Summary:');
  console.log('=' .repeat(60));
  console.log(`📄 Total pages tested: ${results.pages.length}/${results.summary.totalPages}`);
  console.log(`✅ Accessible pages: ${results.summary.accessiblePages}/${results.pages.length}`);
  console.log(`📝 Pages with content: ${results.summary.pagesWithContent}/${results.pages.length}`);
  console.log(`🌐 Pages with Arabic: ${results.summary.pagesWithArabic}/${results.pages.length}`);
  console.log(`⏱️ Average load time: ${results.summary.averageLoadTime}ms`);
  console.log(`❌ Total errors: ${results.summary.totalErrors}`);
  
  // Save detailed results
  fs.writeFileSync('scripts/frontend-testing-results.json', JSON.stringify(results, null, 2));
  console.log('\n📄 Detailed results saved to scripts/frontend-testing-results.json');
  
  console.log('\n🎉 Comprehensive Frontend Testing completed!');
}

// Run the tests
runComprehensiveFrontendTesting().catch(console.error);
