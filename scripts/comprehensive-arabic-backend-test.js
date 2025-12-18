const puppeteer = require('puppeteer');

const BACKEND_URL = 'http://localhost:3001';
const ADMIN_EMAIL = 'admin@bookdress.com';
const ADMIN_PASSWORD = 'admin123';

// Test configuration
const TEST_TIMEOUT = 30000;
const NAVIGATION_DELAY = 2000;

class ArabicBackendTester {
  constructor() {
    this.browser = null;
    this.page = null;
    this.testResults = [];
  }

  async initialize() {
    console.log('🚀 Starting comprehensive Arabic backend testing...\n');
    
    this.browser = await puppeteer.launch({
      headless: false, // Set to true for CI/CD
      defaultViewport: { width: 1920, height: 1080 },
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    this.page = await this.browser.newPage();
    
    // Set Arabic language preference
    await this.page.evaluateOnNewDocument(() => {
      localStorage.setItem('bc-be-language', 'ar');
    });
  }

  async login() {
    console.log('🔐 Testing login with Arabic interface...');
    
    try {
      await this.page.goto(BACKEND_URL, { waitUntil: 'domcontentloaded', timeout: TEST_TIMEOUT });
      await this.page.waitForTimeout(NAVIGATION_DELAY);

      // Check if login form is present
      await this.page.waitForSelector('input[type="email"]', { timeout: 10000 });
      
      // Fill login form
      await this.page.type('input[type="email"]', ADMIN_EMAIL);
      await this.page.type('input[type="password"]', ADMIN_PASSWORD);
      
      // Click login button
      await this.page.click('button[type="submit"]');
      await this.page.waitForTimeout(3000);
      
      // Check if login was successful (should redirect to dashboard)
      const currentUrl = this.page.url();
      const isLoggedIn = !currentUrl.includes('/sign-in') && !currentUrl.includes('/login');
      
      if (isLoggedIn) {
        console.log('✅ Login successful');
        await this.checkArabicSupport('Login Page');
        return true;
      } else {
        console.log('❌ Login failed');
        return false;
      }
    } catch (error) {
      console.log('❌ Login error:', error.message);
      return false;
    }
  }

  async checkArabicSupport(pageName) {
    try {
      const arabicCheck = await this.page.evaluate(() => {
        const hasArabicText = /[\u0600-\u06FF]/.test(document.body.textContent || '');
        const isRTL = document.documentElement.dir === 'rtl' || document.body.dir === 'rtl';
        const hasArabicFont = window.getComputedStyle(document.body).fontFamily.includes('Arabic');
        
        return {
          hasArabicText,
          isRTL,
          hasArabicFont,
          documentLang: document.documentElement.lang,
          documentDir: document.documentElement.dir
        };
      });

      const result = {
        page: pageName,
        arabicText: arabicCheck.hasArabicText,
        rtlLayout: arabicCheck.isRTL,
        arabicFont: arabicCheck.hasArabicFont,
        language: arabicCheck.documentLang,
        direction: arabicCheck.documentDir
      };

      this.testResults.push(result);

      console.log(`  📄 ${pageName}:`);
      console.log(`    🌐 Arabic Text: ${result.arabicText ? '✅' : '❌'}`);
      console.log(`    ↔️ RTL Layout: ${result.rtlLayout ? '✅' : '❌'}`);
      console.log(`    🔤 Arabic Font: ${result.arabicFont ? '✅' : '❌'}`);
      console.log(`    🏷️ Language: ${result.language || 'not set'}`);
      console.log(`    ➡️ Direction: ${result.direction || 'not set'}`);

      return result;
    } catch (error) {
      console.log(`  ❌ Error checking Arabic support for ${pageName}:`, error.message);
      return null;
    }
  }

  async testPage(pageName, url, additionalTests = null) {
    console.log(`\n📋 Testing ${pageName}...`);
    
    try {
      await this.page.goto(url, { waitUntil: 'domcontentloaded', timeout: TEST_TIMEOUT });
      await this.page.waitForTimeout(NAVIGATION_DELAY);
      
      // Check for errors
      const hasError = await this.page.$('.error, .MuiAlert-standardError');
      if (hasError) {
        console.log(`  ⚠️ Error detected on ${pageName}`);
      }
      
      // Check Arabic support
      await this.checkArabicSupport(pageName);
      
      // Test dropdowns and form elements
      await this.testFormElements(pageName);
      
      // Run additional tests if provided
      if (additionalTests) {
        await additionalTests();
      }
      
      console.log(`  ✅ ${pageName} test completed`);
      return true;
    } catch (error) {
      console.log(`  ❌ Error testing ${pageName}:`, error.message);
      return false;
    }
  }

  async testFormElements(pageName) {
    try {
      // Test dropdowns
      const dropdowns = await this.page.$$('select, .MuiSelect-root');
      console.log(`    📋 Found ${dropdowns.length} dropdown(s)`);
      
      for (let i = 0; i < Math.min(dropdowns.length, 3); i++) {
        try {
          await dropdowns[i].click();
          await this.page.waitForTimeout(500);
          
          const options = await this.page.$$('.MuiMenuItem-root, option');
          console.log(`      📝 Dropdown ${i + 1}: ${options.length} option(s)`);
          
          // Close dropdown
          await this.page.keyboard.press('Escape');
          await this.page.waitForTimeout(300);
        } catch (error) {
          console.log(`      ⚠️ Could not test dropdown ${i + 1}`);
        }
      }
      
      // Test input fields
      const inputs = await this.page.$$('input[type="text"], input[type="email"], textarea');
      console.log(`    📝 Found ${inputs.length} input field(s)`);
      
      // Test Arabic text input in first text field
      if (inputs.length > 0) {
        try {
          await inputs[0].click();
          await inputs[0].type('اختبار النص العربي');
          await this.page.waitForTimeout(500);
          
          const value = await inputs[0].evaluate(el => el.value);
          const hasArabicInput = /[\u0600-\u06FF]/.test(value);
          console.log(`    🔤 Arabic input test: ${hasArabicInput ? '✅' : '❌'}`);
          
          // Clear the field
          await inputs[0].evaluate(el => el.value = '');
        } catch (error) {
          console.log(`    ⚠️ Could not test Arabic input`);
        }
      }
    } catch (error) {
      console.log(`    ⚠️ Error testing form elements: ${error.message}`);
    }
  }

  async runComprehensiveTest() {
    try {
      await this.initialize();
      
      // Login first
      const loginSuccess = await this.login();
      if (!loginSuccess) {
        throw new Error('Login failed - cannot continue testing');
      }
      
      // Test main pages
      const pages = [
        { name: 'Dashboard', url: `${BACKEND_URL}/` },
        { name: 'Users', url: `${BACKEND_URL}/users` },
        { name: 'Suppliers', url: `${BACKEND_URL}/suppliers` },
        { name: 'Dresses', url: `${BACKEND_URL}/dresses` },
        { name: 'Bookings', url: `${BACKEND_URL}/bookings` },
        { name: 'Locations', url: `${BACKEND_URL}/locations` },
        { name: 'Countries', url: `${BACKEND_URL}/countries` },
        { name: 'Create User', url: `${BACKEND_URL}/create-user` },
        { name: 'Create Supplier', url: `${BACKEND_URL}/create-supplier` },
        { name: 'Create Location', url: `${BACKEND_URL}/create-location` },
        { name: 'Create Country', url: `${BACKEND_URL}/create-country` },
        { name: 'Settings', url: `${BACKEND_URL}/settings` }
      ];
      
      for (const page of pages) {
        await this.testPage(page.name, page.url);
      }
      
      // Generate report
      await this.generateReport();
      
    } catch (error) {
      console.log('❌ Test suite failed:', error.message);
    } finally {
      if (this.browser) {
        await this.browser.close();
      }
    }
  }

  async generateReport() {
    console.log('\n📊 COMPREHENSIVE ARABIC BACKEND TEST REPORT');
    console.log('=' .repeat(60));
    
    const totalPages = this.testResults.length;
    const pagesWithArabic = this.testResults.filter(r => r.arabicText).length;
    const pagesWithRTL = this.testResults.filter(r => r.rtlLayout).length;
    const pagesWithArabicFont = this.testResults.filter(r => r.arabicFont).length;
    
    console.log(`\n📈 Summary:`);
    console.log(`  📄 Total pages tested: ${totalPages}`);
    console.log(`  🌐 Pages with Arabic text: ${pagesWithArabic}/${totalPages} (${Math.round(pagesWithArabic/totalPages*100)}%)`);
    console.log(`  ↔️ Pages with RTL layout: ${pagesWithRTL}/${totalPages} (${Math.round(pagesWithRTL/totalPages*100)}%)`);
    console.log(`  🔤 Pages with Arabic font: ${pagesWithArabicFont}/${totalPages} (${Math.round(pagesWithArabicFont/totalPages*100)}%)`);
    
    console.log(`\n📋 Detailed Results:`);
    this.testResults.forEach(result => {
      const status = result.arabicText && result.rtlLayout ? '✅' : '⚠️';
      console.log(`  ${status} ${result.page}: Arabic=${result.arabicText ? '✅' : '❌'} RTL=${result.rtlLayout ? '✅' : '❌'} Font=${result.arabicFont ? '✅' : '❌'}`);
    });
    
    // Identify issues
    const issues = this.testResults.filter(r => !r.arabicText || !r.rtlLayout);
    if (issues.length > 0) {
      console.log(`\n⚠️ Issues Found:`);
      issues.forEach(issue => {
        console.log(`  📄 ${issue.page}:`);
        if (!issue.arabicText) console.log(`    - Missing Arabic text`);
        if (!issue.rtlLayout) console.log(`    - Missing RTL layout`);
        if (!issue.arabicFont) console.log(`    - Missing Arabic font`);
      });
    }
    
    console.log(`\n🎯 Overall Status: ${issues.length === 0 ? '✅ PASS' : '⚠️ NEEDS ATTENTION'}`);
  }
}

// Run the test
const tester = new ArabicBackendTester();
tester.runComprehensiveTest();
