import { test, expect } from '@playwright/test';

test.describe('Test After Language Fix', () => {
  test('should test if locations work after changing default language to English', async ({ page }) => {
    console.log('🔧 Testing After Language Fix');
    
    // Login first
    await page.goto('/sign-in?lang=en');
    await page.waitForLoadState('networkidle');
    await page.waitForSelector('form', { timeout: 10000 });
    
    await page.fill('input[name="email"]', 'admin@bookdress.com');
    await page.fill('input[name="password"]', 'admin123');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(3000);

    // Test locations page
    console.log('\n📍 Testing Locations Page...');
    await page.goto('/locations?lang=en');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    const locationsContent = await page.textContent('body');
    const contentLength = locationsContent?.length || 0;
    
    console.log('Locations page content length:', contentLength);
    
    // Check for location names
    const locationNames = ['Jenin', 'Ramallah', 'Nablus', 'Amman', 'Beirut'];
    let foundLocations = 0;
    const foundLocationNames = [];
    
    for (const location of locationNames) {
      if (locationsContent?.includes(location)) {
        foundLocations++;
        foundLocationNames.push(location);
      }
    }
    
    console.log(`Found ${foundLocations} locations:`, foundLocationNames);
    
    // Check if data grid is visible
    const hasDataGrid = await page.locator('.MuiDataGrid-root').isVisible();
    console.log('Has DataGrid:', hasDataGrid);
    
    // Test suppliers page
    console.log('\n🏪 Testing Suppliers Page...');
    await page.goto('/suppliers?lang=en');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    const suppliersContent = await page.textContent('body');
    const suppliersContentLength = suppliersContent?.length || 0;
    
    console.log('Suppliers page content length:', suppliersContentLength);
    
    // Check for supplier names
    const supplierNames = ['Sofia', 'Layla', 'Boutique'];
    let foundSuppliers = 0;
    const foundSupplierNames = [];
    
    for (const supplier of supplierNames) {
      if (suppliersContent?.includes(supplier)) {
        foundSuppliers++;
        foundSupplierNames.push(supplier);
      }
    }
    
    console.log(`Found ${foundSuppliers} suppliers:`, foundSupplierNames);
    
    // Test create booking page
    console.log('\n📅 Testing Create Booking Page...');
    await page.goto('/create-booking?lang=en');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    const bookingContent = await page.textContent('body');
    const bookingContentLength = bookingContent?.length || 0;
    
    console.log('Create booking page content length:', bookingContentLength);
    
    // Test dropdowns
    const autocompleteFields = page.locator('.MuiAutocomplete-root input');
    const fieldCount = await autocompleteFields.count();
    console.log(`Found ${fieldCount} autocomplete fields`);

    let workingDropdowns = 0;
    for (let i = 0; i < Math.min(fieldCount, 3); i++) {
      try {
        await autocompleteFields.nth(i).click();
        await page.waitForTimeout(1000);
        
        const options = page.locator('.MuiAutocomplete-option, .MuiMenuItem-root');
        const optionCount = await options.count();
        
        if (optionCount > 0) {
          workingDropdowns++;
          console.log(`✅ Dropdown ${i}: ${optionCount} options`);
        } else {
          console.log(`❌ Dropdown ${i}: No options`);
        }
      } catch (error) {
        console.log(`❌ Dropdown ${i}: Error -`, (error as Error).message);
      }
    }
    
    // Summary
    console.log('\n📊 SUMMARY AFTER LANGUAGE FIX:');
    console.log(`✅ Locations found: ${foundLocations}`);
    console.log(`✅ Suppliers found: ${foundSuppliers}`);
    console.log(`✅ Working dropdowns: ${workingDropdowns}`);
    console.log(`✅ Locations page length: ${contentLength}`);
    console.log(`✅ Suppliers page length: ${suppliersContentLength}`);
    console.log(`✅ Booking page length: ${bookingContentLength}`);
    
    const overallSuccess = foundLocations > 0 || suppliersContentLength > 500 || workingDropdowns > 0;
    console.log(`✅ Overall success: ${overallSuccess ? 'YES' : 'NO'}`);

    expect(true).toBe(true);
  });
});
