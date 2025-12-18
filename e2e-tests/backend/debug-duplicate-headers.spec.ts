import { test, expect } from '@playwright/test';

/**
 * Debug test to identify the source of duplicate header elements
 */

test.describe('Debug Duplicate Headers', () => {
  
  test('should identify source of duplicate headers', async ({ page }) => {
    console.log('🔍 Debugging duplicate header elements...');
    
    // Login as admin
    await page.goto('http://localhost:3001/sign-in?lang=ar');
    await page.waitForLoadState('networkidle');
    await page.waitForSelector('form');
    
    await page.fill('input[name="email"]', 'admin@bookdress.com');
    await page.fill('input[name="password"]', 'admin123');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(5000);
    
    // Navigate to bookings page
    await page.goto('http://localhost:3001/?lang=ar');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);
    
    // Debug header elements
    console.log('\n🔍 ANALYZING HEADER ELEMENTS:');
    
    // Count all header elements
    const headerCount = await page.locator('header').count();
    console.log(`Total header elements: ${headerCount}`);
    
    // Count AppBar elements
    const appBarCount = await page.locator('.MuiAppBar-root').count();
    console.log(`Total AppBar elements: ${appBarCount}`);
    
    // Get details of each header
    for (let i = 0; i < headerCount; i++) {
      const header = page.locator('header').nth(i);
      const classes = await header.getAttribute('class');
      const id = await header.getAttribute('id');
      const innerHTML = await header.innerHTML();
      
      console.log(`\nHeader ${i + 1}:`);
      console.log(`  Classes: ${classes}`);
      console.log(`  ID: ${id}`);
      console.log(`  Content length: ${innerHTML.length} chars`);
      console.log(`  First 100 chars: ${innerHTML.substring(0, 100)}...`);
    }
    
    // Check if headers are identical
    if (headerCount >= 2) {
      const header1Classes = await page.locator('header').nth(0).getAttribute('class');
      const header2Classes = await page.locator('header').nth(1).getAttribute('class');
      const header1Content = await page.locator('header').nth(0).innerHTML();
      const header2Content = await page.locator('header').nth(1).innerHTML();
      
      console.log(`\n🔍 COMPARISON:`);
      console.log(`Header 1 classes: ${header1Classes}`);
      console.log(`Header 2 classes: ${header2Classes}`);
      console.log(`Classes identical: ${header1Classes === header2Classes}`);
      console.log(`Content identical: ${header1Content === header2Content}`);
    }
    
    // Check DOM structure
    const bodyHTML = await page.evaluate(() => {
      const headers = document.querySelectorAll('header');
      return Array.from(headers).map((header, index) => ({
        index,
        tagName: header.tagName,
        className: header.className,
        id: header.id,
        parentElement: header.parentElement?.tagName,
        parentClass: header.parentElement?.className,
        position: getComputedStyle(header).position,
        zIndex: getComputedStyle(header).zIndex
      }));
    });
    
    console.log('\n🔍 DOM STRUCTURE ANALYSIS:');
    bodyHTML.forEach((headerInfo, index) => {
      console.log(`Header ${index + 1}:`);
      console.log(`  Tag: ${headerInfo.tagName}`);
      console.log(`  Class: ${headerInfo.className}`);
      console.log(`  ID: ${headerInfo.id}`);
      console.log(`  Parent: ${headerInfo.parentElement} (${headerInfo.parentClass})`);
      console.log(`  Position: ${headerInfo.position}`);
      console.log(`  Z-Index: ${headerInfo.zIndex}`);
    });
    
    // Check React component tree
    const reactInfo = await page.evaluate(() => {
      // Try to access React DevTools info if available
      const rootElement = document.getElementById('root');
      return {
        hasRoot: !!rootElement,
        rootChildren: rootElement?.children.length || 0,
        rootHTML: rootElement?.innerHTML.substring(0, 200) || 'No root element'
      };
    });
    
    console.log('\n🔍 REACT STRUCTURE:');
    console.log(`Has root element: ${reactInfo.hasRoot}`);
    console.log(`Root children count: ${reactInfo.rootChildren}`);
    console.log(`Root HTML preview: ${reactInfo.rootHTML}...`);
    
    // Take a screenshot for visual debugging
    await page.screenshot({ path: 'debug-headers.png', fullPage: true });
    console.log('\n📸 Screenshot saved as debug-headers.png');
    
    // The test should pass regardless of header count for debugging purposes
    expect(headerCount).toBeGreaterThanOrEqual(1);
  });
});
