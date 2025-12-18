#!/usr/bin/env node

const puppeteer = require('puppeteer');

async function debugFrontendSearch() {
  console.log('🔍 Debugging Frontend Search...\n');
  
  let browser;
  let page;
  
  try {
    browser = await puppeteer.launch({
      headless: false,
      defaultViewport: { width: 1280, height: 720 },
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    page = await browser.newPage();
    
    // Listen to console messages
    page.on('console', msg => {
      console.log('BROWSER CONSOLE:', msg.type(), msg.text());
    });
    
    // Listen to page errors
    page.on('pageerror', error => {
      console.log('PAGE ERROR:', error.message);
    });
    
    // Go to search page
    console.log('📍 Going to search page...');
    await page.goto('http://localhost:3000/search', { 
      waitUntil: 'domcontentloaded', 
      timeout: 15000 
    });
    
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // Check page structure
    console.log('\n📊 Checking page structure...');
    
    const hasContent = await page.$('.content');
    console.log('Has .content:', !!hasContent);
    
    const hasSearch = await page.$('.search');
    console.log('Has .search:', !!hasSearch);
    
    const hasCol1 = await page.$('.col-1');
    console.log('Has .col-1:', !!hasCol1);
    
    const hasCol2 = await page.$('.col-2');
    console.log('Has .col-2:', !!hasCol2);
    
    const hasNoMatch = await page.$('.no-match');
    console.log('Has .no-match:', !!hasNoMatch);
    
    // Check if loading
    const isLoading = await page.evaluate(() => {
      const loadingElement = document.querySelector('.loading');
      return !!loadingElement;
    });
    console.log('Is loading:', isLoading);
    
    // Check React state (if possible)
    const reactState = await page.evaluate(() => {
      // Try to get some info about the page state
      const searchDiv = document.querySelector('.search');
      if (searchDiv) {
        return {
          hasSearchDiv: true,
          innerHTML: searchDiv.innerHTML.substring(0, 200) + '...'
        };
      }
      return { hasSearchDiv: false };
    });
    console.log('React state info:', reactState);
    
    // Take screenshot
    await page.screenshot({ path: 'scripts/screenshots/debug-search.png', fullPage: true });
    console.log('📸 Screenshot saved');
    
    console.log('\n🎉 Debug completed!');
    
  } catch (error) {
    console.error('❌ Debug failed:', error.message);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

debugFrontendSearch();
