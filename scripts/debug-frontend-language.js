#!/usr/bin/env node

/**
 * Debug Frontend Language Initialization
 * 
 * Tests if language strings are being loaded correctly in the frontend.
 */

const puppeteer = require('puppeteer');

const FRONTEND_URL = 'http://localhost:3000';

async function debugLanguageInitialization() {
  console.log('🔍 Debugging Frontend Language Initialization...\n');
  
  let browser;
  
  try {
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const page = await browser.newPage();
    await page.setViewport({ width: 1920, height: 1080 });
    
    // Capture console logs and errors
    const consoleLogs = [];
    const consoleErrors = [];
    
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      } else {
        consoleLogs.push(`${msg.type()}: ${msg.text()}`);
      }
    });
    
    page.on('pageerror', error => {
      consoleErrors.push(error.message);
    });
    
    // Go to home page
    console.log('  📱 Loading Home Page...');
    await page.goto(FRONTEND_URL, { waitUntil: 'domcontentloaded', timeout: 15000 });
    await new Promise(resolve => setTimeout(resolve, 8000)); // Wait longer for app to fully load
    
    // Check language initialization
    const languageInfo = await page.evaluate(() => {
      // Check if language strings are available in window
      const hasLanguageStrings = typeof window !== 'undefined' && window.localStorage;
      const storedLanguage = hasLanguageStrings ? localStorage.getItem('bc-fe-language') : null;
      
      // Check document properties
      const documentInfo = {
        lang: document.documentElement.lang,
        dir: document.documentElement.dir,
        bodyDir: document.body.dir,
        title: document.title
      };
      
      // Check for React components
      const hasReactRoot = !!document.getElementById('root');
      const rootContent = document.getElementById('root')?.innerHTML || '';
      const hasReactContent = rootContent.includes('react') || rootContent.length > 100;
      
      // Check for specific elements
      const elements = {
        hasHeader: !!document.querySelector('header, .header, nav, .nav'),
        hasMain: !!document.querySelector('main, .main, .content'),
        hasFooter: !!document.querySelector('footer, .footer'),
        hasSearchForm: !!document.querySelector('.search-form, .home-search-form, form'),
        hasButtons: document.querySelectorAll('button').length,
        hasInputs: document.querySelectorAll('input').length,
        hasSelects: document.querySelectorAll('select').length
      };
      
      // Check for Arabic text
      const bodyText = document.body.textContent || '';
      const hasArabicText = /[\u0600-\u06FF]/.test(bodyText);
      const textSample = bodyText.substring(0, 300);
      
      return {
        storedLanguage,
        documentInfo,
        hasReactRoot,
        hasReactContent,
        elements,
        hasArabicText,
        textSample,
        bodyLength: bodyText.length
      };
    });
    
    console.log('📊 Language Initialization Debug Results:');
    console.log('=' .repeat(50));
    
    console.log('\n🌐 Language Settings:');
    console.log(`  Stored Language: ${languageInfo.storedLanguage || 'Not set'}`);
    console.log(`  Document Lang: ${languageInfo.documentInfo.lang}`);
    console.log(`  Document Dir: ${languageInfo.documentInfo.dir}`);
    console.log(`  Body Dir: ${languageInfo.documentInfo.bodyDir}`);
    console.log(`  Title: ${languageInfo.documentInfo.title}`);
    
    console.log('\n⚛️ React Application:');
    console.log(`  Has React Root: ${languageInfo.hasReactRoot ? '✅' : '❌'}`);
    console.log(`  Has React Content: ${languageInfo.hasReactContent ? '✅' : '❌'}`);
    console.log(`  Body Content Length: ${languageInfo.bodyLength} characters`);
    
    console.log('\n🧩 UI Elements:');
    console.log(`  Has Header: ${languageInfo.elements.hasHeader ? '✅' : '❌'}`);
    console.log(`  Has Main Content: ${languageInfo.elements.hasMain ? '✅' : '❌'}`);
    console.log(`  Has Footer: ${languageInfo.elements.hasFooter ? '✅' : '❌'}`);
    console.log(`  Has Search Form: ${languageInfo.elements.hasSearchForm ? '✅' : '❌'}`);
    console.log(`  Buttons Count: ${languageInfo.elements.hasButtons}`);
    console.log(`  Inputs Count: ${languageInfo.elements.hasInputs}`);
    console.log(`  Selects Count: ${languageInfo.elements.hasSelects}`);
    
    console.log('\n🌐 Arabic Content:');
    console.log(`  Has Arabic Text: ${languageInfo.hasArabicText ? '✅' : '❌'}`);
    console.log(`  Text Sample: "${languageInfo.textSample.substring(0, 100)}..."`);
    
    if (consoleErrors.length > 0) {
      console.log('\n❌ Console Errors:');
      consoleErrors.forEach(error => {
        console.log(`  - ${error}`);
      });
    }
    
    if (consoleLogs.length > 0) {
      console.log('\n📝 Console Logs (last 5):');
      consoleLogs.slice(-5).forEach(log => {
        console.log(`  - ${log}`);
      });
    }
    
    // Test search page specifically
    console.log('\n🔍 Testing Search Page...');
    try {
      await page.goto(`${FRONTEND_URL}/search`, { waitUntil: 'domcontentloaded', timeout: 15000 });
      await new Promise(resolve => setTimeout(resolve, 5000));
      
      const searchPageInfo = await page.evaluate(() => {
        const bodyText = document.body.textContent || '';
        return {
          hasContent: bodyText.length > 100,
          hasArabicText: /[\u0600-\u06FF]/.test(bodyText),
          hasSearchElements: !!document.querySelector('.search-form, form, .filter'),
          textSample: bodyText.substring(0, 200)
        };
      });
      
      console.log(`  Has Content: ${searchPageInfo.hasContent ? '✅' : '❌'}`);
      console.log(`  Has Arabic Text: ${searchPageInfo.hasArabicText ? '✅' : '❌'}`);
      console.log(`  Has Search Elements: ${searchPageInfo.hasSearchElements ? '✅' : '❌'}`);
      console.log(`  Text Sample: "${searchPageInfo.textSample}"`);
      
    } catch (error) {
      console.log(`  ❌ Error loading search page: ${error.message}`);
    }
    
  } catch (error) {
    console.log(`❌ Error debugging language initialization: ${error.message}`);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
  
  console.log('\n🎉 Language initialization debug completed!');
}

// Run the debug
debugLanguageInitialization().catch(console.error);
