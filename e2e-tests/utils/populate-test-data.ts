/**
 * Populate test data for dropdowns
 * This script creates test customers and verifies data for dropdowns
 */

import { chromium } from 'playwright';

async function populateTestData() {
  console.log('🔍 Starting test data population...\n');

  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    // Navigate to backend
    console.log('1️⃣ Navigating to backend...');
    await page.goto('http://localhost:3001/sign-in?lang=en');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Login as admin
    console.log('2️⃣ Logging in as admin...');
    await page.fill('input[type="email"]', 'admin@bookdress.com');
    await page.fill('input[type="password"]', 'BookDress@2024');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(3000);

    // Check current users
    console.log('3️⃣ Checking existing users...');
    const usersResponse = await page.evaluate(async () => {
      const response = await fetch('http://localhost:4002/api/users/1/100', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      });
      return await response.json();
    });
    console.log('   Users:', JSON.stringify(usersResponse, null, 2));

    // Check locations
    console.log('4️⃣ Checking locations...');
    const locationsResponse = await page.evaluate(async () => {
      const response = await fetch('http://localhost:4002/api/locations/1/100/ar');
      return await response.json();
    });
    console.log('   Locations:', JSON.stringify(locationsResponse, null, 2));

    // Check suppliers
    console.log('5️⃣ Checking suppliers...');
    const suppliersResponse = await page.evaluate(async () => {
      const response = await fetch('http://localhost:4002/api/suppliers/1/10/');
      return await response.json();
    });
    console.log('   Suppliers:', JSON.stringify(suppliersResponse, null, 2));

    // Check dropdown options
    console.log('6️⃣ Checking dropdown options...');
    const dressTypes = await page.evaluate(async () => {
      const response = await fetch('http://localhost:4002/api/dress-types?lang=ar');
      return await response.json();
    });
    console.log('   Dress Types:', JSON.stringify(dressTypes, null, 2));

    // Try to access create booking page
    console.log('7️⃣ Accessing create booking page...');
    await page.goto('http://localhost:3001/create-booking?lang=en');
    await page.waitForTimeout(5000);

    const pageContent = await page.content();
    console.log('   Page content length:', pageContent.length);
    console.log('   Page preview:', pageContent.substring(0, 500));

    // Check for customer dropdown
    const customerDropdowns = await page.$$('[role="combobox"], select, .MuiSelect-root').length;
    console.log('   Customer dropdowns found:', customerDropdowns);

    // Get all dropdown options
    const dropdownOptions = await page.evaluate(() => {
      const options = document.querySelectorAll('option, [role="option"]');
      return Array.from(options).slice(0, 20).map(opt => ({
        text: opt.textContent?.substring(0, 50),
        value: (opt as any).value
      }));
    });
    console.log('   Dropdown options:', JSON.stringify(dropdownOptions, null, 2));

    console.log('\n✅ Test data population check complete!');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await browser.close();
  }
}

populateTestData().catch(console.error);
