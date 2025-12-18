#!/usr/bin/env node

/**
 * Cross-Browser and Device Testing
 * 
 * Tests the application across different browsers and devices to ensure compatibility
 * and proper Arabic text rendering.
 */

const puppeteer = require('puppeteer');

const FRONTEND_URL = 'http://localhost:3000';
const BACKEND_URL = 'http://localhost:3001';

// Test configurations for different browsers and devices
const testConfigs = [
  {
    name: 'Desktop Chrome',
    viewport: { width: 1920, height: 1080 },
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
  },
  {
    name: 'Desktop Firefox',
    viewport: { width: 1920, height: 1080 },
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:120.0) Gecko/20100101 Firefox/120.0'
  },
  {
    name: 'Desktop Safari',
    viewport: { width: 1920, height: 1080 },
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15'
  },
  {
    name: 'Mobile Chrome',
    viewport: { width: 375, height: 667, isMobile: true },
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/120.0.0.0 Mobile/15E148 Safari/604.1'
  },
  {
    name: 'Mobile Safari',
    viewport: { width: 375, height: 667, isMobile: true },
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1'
  },
  {
    name: 'Tablet iPad',
    viewport: { width: 768, height: 1024, isMobile: true },
    userAgent: 'Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1'
  },
  {
    name: 'Android Mobile',
    viewport: { width: 360, height: 640, isMobile: true },
    userAgent: 'Mozilla/5.0 (Linux; Android 13; SM-G991B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36'
  }
];

async function testBrowserConfig(config) {
  console.log(`\n🔍 Testing ${config.name}...`);
  
  let browser;
  let results = {
    name: config.name,
    frontend: { accessible: false, arabicText: false, rtlLayout: false, responsive: false },
    backend: { accessible: false, arabicText: false, rtlLayout: false, responsive: false },
    errors: []
  };
  
  try {
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const page = await browser.newPage();
    await page.setViewport(config.viewport);
    await page.setUserAgent(config.userAgent);
    
    // Test Frontend
    console.log(`  📱 Testing Frontend on ${config.name}...`);
    try {
      await page.goto(FRONTEND_URL, { waitUntil: 'domcontentloaded', timeout: 15000 });
      results.frontend.accessible = true;
      
      // Check for Arabic text
      const arabicText = await page.evaluate(() => {
        const textContent = document.body.textContent || '';
        return /[\u0600-\u06FF]/.test(textContent);
      });
      results.frontend.arabicText = arabicText;
      
      // Check RTL layout
      const rtlLayout = await page.evaluate(() => {
        const html = document.documentElement;
        return html.dir === 'rtl' || getComputedStyle(html).direction === 'rtl';
      });
      results.frontend.rtlLayout = rtlLayout;
      
      // Check responsive design
      const responsive = await page.evaluate(() => {
        const viewport = window.innerWidth;
        const hasResponsiveElements = document.querySelector('.responsive, .mobile, .tablet, .desktop, [class*="sm:"], [class*="md:"], [class*="lg:"]');
        return viewport > 0 && (hasResponsiveElements !== null);
      });
      results.frontend.responsive = responsive;
      
      console.log(`    ✅ Frontend accessible: ${results.frontend.accessible}`);
      console.log(`    📝 Arabic text found: ${results.frontend.arabicText}`);
      console.log(`    ↔️ RTL layout: ${results.frontend.rtlLayout}`);
      console.log(`    📱 Responsive: ${results.frontend.responsive}`);
      
    } catch (error) {
      results.errors.push(`Frontend error: ${error.message}`);
      console.log(`    ❌ Frontend error: ${error.message}`);
    }
    
    // Test Backend
    console.log(`  🖥️ Testing Backend on ${config.name}...`);
    try {
      await page.goto(BACKEND_URL, { waitUntil: 'domcontentloaded', timeout: 15000 });
      results.backend.accessible = true;
      
      // Check for Arabic text
      const arabicText = await page.evaluate(() => {
        const textContent = document.body.textContent || '';
        return /[\u0600-\u06FF]/.test(textContent);
      });
      results.backend.arabicText = arabicText;
      
      // Check RTL layout
      const rtlLayout = await page.evaluate(() => {
        const html = document.documentElement;
        return html.dir === 'rtl' || getComputedStyle(html).direction === 'rtl';
      });
      results.backend.rtlLayout = rtlLayout;
      
      // Check responsive design
      const responsive = await page.evaluate(() => {
        const viewport = window.innerWidth;
        const hasResponsiveElements = document.querySelector('.responsive, .mobile, .tablet, .desktop, [class*="sm:"], [class*="md:"], [class*="lg:"]');
        return viewport > 0 && (hasResponsiveElements !== null);
      });
      results.backend.responsive = responsive;
      
      console.log(`    ✅ Backend accessible: ${results.backend.accessible}`);
      console.log(`    📝 Arabic text found: ${results.backend.arabicText}`);
      console.log(`    ↔️ RTL layout: ${results.backend.rtlLayout}`);
      console.log(`    📱 Responsive: ${results.backend.responsive}`);
      
    } catch (error) {
      results.errors.push(`Backend error: ${error.message}`);
      console.log(`    ❌ Backend error: ${error.message}`);
    }
    
  } catch (error) {
    results.errors.push(`Browser setup error: ${error.message}`);
    console.log(`  ❌ Browser setup error: ${error.message}`);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
  
  return results;
}

async function runCrossBrowserTesting() {
  console.log('🌐 Starting Cross-Browser and Device Testing...\n');
  
  const allResults = [];
  
  for (const config of testConfigs) {
    const result = await testBrowserConfig(config);
    allResults.push(result);
    
    // Small delay between tests
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
  
  // Generate summary report
  console.log('\n📊 Cross-Browser Testing Summary:');
  console.log('=' .repeat(60));
  
  allResults.forEach(result => {
    console.log(`\n${result.name}:`);
    console.log(`  Frontend: ${result.frontend.accessible ? '✅' : '❌'} Accessible, ${result.frontend.arabicText ? '✅' : '❌'} Arabic, ${result.frontend.rtlLayout ? '✅' : '❌'} RTL, ${result.frontend.responsive ? '✅' : '❌'} Responsive`);
    console.log(`  Backend:  ${result.backend.accessible ? '✅' : '❌'} Accessible, ${result.backend.arabicText ? '✅' : '❌'} Arabic, ${result.backend.rtlLayout ? '✅' : '❌'} RTL, ${result.backend.responsive ? '✅' : '❌'} Responsive`);
    
    if (result.errors.length > 0) {
      console.log(`  Errors: ${result.errors.join(', ')}`);
    }
  });
  
  // Overall statistics
  const totalTests = allResults.length * 2; // Frontend + Backend
  const successfulTests = allResults.reduce((acc, result) => {
    return acc + (result.frontend.accessible ? 1 : 0) + (result.backend.accessible ? 1 : 0);
  }, 0);
  
  console.log(`\n📈 Overall Success Rate: ${successfulTests}/${totalTests} (${Math.round(successfulTests/totalTests*100)}%)`);
  
  // Save detailed results
  const fs = require('fs');
  fs.writeFileSync('scripts/cross-browser-test-results.json', JSON.stringify(allResults, null, 2));
  console.log('📄 Detailed results saved to scripts/cross-browser-test-results.json');
  
  console.log('\n🎉 Cross-Browser and Device Testing completed!');
}

// Run the tests
runCrossBrowserTesting().catch(console.error);
