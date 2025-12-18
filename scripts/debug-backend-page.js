#!/usr/bin/env node

/**
 * Debug Backend Page Structure
 * 
 * This script inspects the actual HTML structure of the backend page
 * to understand what elements are present and their selectors.
 */

const puppeteer = require('puppeteer');

async function debugBackendPage() {
  console.log('🔍 Debugging Backend Page Structure');
  console.log('===================================');
  
  let browser;
  let page;
  
  try {
    // Launch browser
    browser = await puppeteer.launch({
      headless: false, // Show browser for debugging
      defaultViewport: { width: 1280, height: 720 },
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    page = await browser.newPage();
    
    // Navigate to backend
    await page.goto('http://localhost:3001', { waitUntil: 'domcontentloaded', timeout: 10000 });
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // Get page title
    const title = await page.title();
    console.log(`📄 Page Title: ${title}`);
    
    // Get current URL
    const url = page.url();
    console.log(`🌐 Current URL: ${url}`);
    
    // Check if we're on login page
    const isLoginPage = await page.$('input[name="email"]') !== null;
    console.log(`🔐 Is Login Page: ${isLoginPage}`);
    
    if (isLoginPage) {
      console.log('\n🔑 LOGIN PAGE ELEMENTS:');
      
      // Check form elements
      const emailField = await page.$('input[name="email"]');
      const passwordField = await page.$('input[name="password"]');
      const submitButton = await page.$('button[type="submit"]');
      
      console.log(`  Email Field: ${emailField ? '✅ Found' : '❌ Not Found'}`);
      console.log(`  Password Field: ${passwordField ? '✅ Found' : '❌ Not Found'}`);
      console.log(`  Submit Button: ${submitButton ? '✅ Found' : '❌ Not Found'}`);
      
      // Try to login
      if (emailField && passwordField && submitButton) {
        console.log('\n🔐 Attempting login...');
        await emailField.type('admin@bookdress.io');
        await passwordField.type('Un1corn2024!');
        await submitButton.click();
        
        // Wait for navigation
        await new Promise(resolve => setTimeout(resolve, 5000));
        
        const newUrl = page.url();
        console.log(`🌐 After Login URL: ${newUrl}`);
      }
    }
    
    // Get all elements with classes
    const elementsWithClasses = await page.evaluate(() => {
      const elements = document.querySelectorAll('[class]');
      const classInfo = [];
      
      elements.forEach(el => {
        if (el.className && typeof el.className === 'string') {
          classInfo.push({
            tag: el.tagName.toLowerCase(),
            classes: el.className,
            id: el.id || '',
            text: el.textContent ? el.textContent.substring(0, 50) : ''
          });
        }
      });
      
      return classInfo.slice(0, 20); // Limit to first 20 elements
    });
    
    console.log('\n📋 ELEMENTS WITH CLASSES (First 20):');
    elementsWithClasses.forEach((el, index) => {
      console.log(`  ${index + 1}. <${el.tag}> class="${el.classes}" id="${el.id}" text="${el.text.trim()}"`);
    });
    
    // Check for specific patterns
    const patterns = [
      '.bookings',
      '.MuiContainer-root',
      '.MuiBox-root',
      '.MuiDataGrid-root',
      '.booking-grid',
      'header',
      '.header',
      '.MuiAppBar-root',
      'nav',
      '.navigation'
    ];
    
    console.log('\n🎯 CHECKING SPECIFIC PATTERNS:');
    for (const pattern of patterns) {
      const element = await page.$(pattern);
      console.log(`  ${pattern}: ${element ? '✅ Found' : '❌ Not Found'}`);
    }
    
    // Get page HTML structure (first 1000 chars)
    const htmlStructure = await page.evaluate(() => {
      return document.body.innerHTML.substring(0, 1000);
    });
    
    console.log('\n📝 HTML STRUCTURE (First 1000 chars):');
    console.log(htmlStructure);
    
    // Wait for user to inspect
    console.log('\n⏳ Browser will stay open for 30 seconds for manual inspection...');
    await new Promise(resolve => setTimeout(resolve, 30000));
    
  } catch (error) {
    console.error('💥 Debug failed:', error);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

// Run debug
debugBackendPage();
