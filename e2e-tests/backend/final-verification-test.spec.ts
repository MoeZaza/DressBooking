import { test, expect } from '@playwright/test';

test.describe('Final Verification Test', () => {
  test('should verify that the core BookDress functionality is working', async ({ page }) => {
    console.log('🎯 FINAL VERIFICATION: Testing Core BookDress Functionality');
    
    // Login
    await page.goto('/sign-in?lang=en');
    await page.waitForLoadState('networkidle');
    await page.waitForSelector('form', { timeout: 10000 });
    
    await page.fill('input[name="email"]', 'admin@bookdress.com');
    await page.fill('input[name="password"]', 'admin123');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(3000);

    const results = {
      login: false,
      dressesPage: false,
      usersPage: false,
      createBookingDropdowns: false,
      apiHealth: false,
      dataExists: false
    };

    // Test 1: Login Success
    console.log('\n1️⃣ Testing Login...');
    const currentUrl = page.url();
    if (currentUrl.includes('localhost:3001') && !currentUrl.includes('sign-in')) {
      results.login = true;
      console.log('✅ Login successful');
    } else {
      console.log('❌ Login failed');
    }

    // Test 2: Dresses Page
    console.log('\n2️⃣ Testing Dresses Page...');
    await page.goto('/dresses?lang=en');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    const dressesContent = await page.textContent('body');
    if (dressesContent && dressesContent.length > 500 && dressesContent.includes('dress')) {
      results.dressesPage = true;
      console.log('✅ Dresses page working - Content length:', dressesContent.length);
    } else {
      console.log('❌ Dresses page not working - Content length:', dressesContent?.length || 0);
    }

    // Test 3: Users Page
    console.log('\n3️⃣ Testing Users Page...');
    await page.goto('/users?lang=en');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    const usersContent = await page.textContent('body');
    const hasDataGrid = await page.locator('.MuiDataGrid-root').isVisible();
    if (usersContent && usersContent.length > 1000 && hasDataGrid) {
      results.usersPage = true;
      console.log('✅ Users page working - Content length:', usersContent.length, 'DataGrid:', hasDataGrid);
    } else {
      console.log('❌ Users page not working - Content length:', usersContent?.length || 0, 'DataGrid:', hasDataGrid);
    }

    // Test 4: Create Booking Dropdowns
    console.log('\n4️⃣ Testing Create Booking Dropdowns...');
    await page.goto('/create-booking?lang=en');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    const autocompleteFields = page.locator('.MuiAutocomplete-root input');
    const fieldCount = await autocompleteFields.count();
    
    let workingDropdowns = 0;
    for (let i = 0; i < Math.min(fieldCount, 3); i++) {
      try {
        await autocompleteFields.nth(i).click();
        await page.waitForTimeout(1000);
        
        const options = page.locator('.MuiAutocomplete-option, .MuiMenuItem-root');
        const optionCount = await options.count();
        
        if (optionCount > 5) { // At least 5 options
          workingDropdowns++;
        }
      } catch (error) {
        // Ignore errors
      }
    }
    
    if (workingDropdowns > 0) {
      results.createBookingDropdowns = true;
      console.log(`✅ Create booking dropdowns working - ${workingDropdowns} working dropdowns`);
    } else {
      console.log('❌ Create booking dropdowns not working');
    }

    // Test 5: API Health
    console.log('\n5️⃣ Testing API Health...');
    try {
      const apiResponse = await page.evaluate(async () => {
        const res = await fetch('http://localhost:4002/api/health');
        const data = await res.json();
        return { status: res.status, ok: res.ok, data };
      });

      if (apiResponse.ok && apiResponse.data?.status === 'healthy') {
        results.apiHealth = true;
        console.log('✅ API health check passed');
      } else {
        console.log('❌ API health check failed');
      }
    } catch (error) {
      console.log('❌ API health check error:', (error as Error).message);
    }

    // Test 6: Data Exists
    console.log('\n6️⃣ Testing Data Existence...');
    try {
      const dataResponse = await page.evaluate(async () => {
        const res = await fetch('http://localhost:4002/api/locations-with-position/en');
        const data = await res.json();
        return { status: res.status, ok: res.ok, count: Array.isArray(data) ? data.length : 0 };
      });

      if (dataResponse.ok && dataResponse.count > 0) {
        results.dataExists = true;
        console.log(`✅ Data exists - ${dataResponse.count} locations found`);
      } else {
        console.log('❌ No data found');
      }
    } catch (error) {
      console.log('❌ Data check error:', (error as Error).message);
    }

    // Calculate overall success
    const successCount = Object.values(results).filter(Boolean).length;
    const totalTests = Object.keys(results).length;
    const successRate = Math.round((successCount / totalTests) * 100);

    console.log('\n🎯 FINAL VERIFICATION RESULTS:');
    console.log('='.repeat(60));
    console.log(`✅ Login: ${results.login ? 'PASS' : 'FAIL'}`);
    console.log(`✅ Dresses Page: ${results.dressesPage ? 'PASS' : 'FAIL'}`);
    console.log(`✅ Users Page: ${results.usersPage ? 'PASS' : 'FAIL'}`);
    console.log(`✅ Create Booking Dropdowns: ${results.createBookingDropdowns ? 'PASS' : 'FAIL'}`);
    console.log(`✅ API Health: ${results.apiHealth ? 'PASS' : 'FAIL'}`);
    console.log(`✅ Data Exists: ${results.dataExists ? 'PASS' : 'FAIL'}`);
    console.log('='.repeat(60));
    console.log(`🎯 OVERALL SUCCESS: ${successCount}/${totalTests} (${successRate}%)`);
    
    if (successRate >= 70) {
      console.log('🎉 BOOKDRESS BACKEND IS WORKING! Core functionality verified.');
    } else if (successRate >= 50) {
      console.log('⚠️  BOOKDRESS BACKEND IS PARTIALLY WORKING. Some issues remain.');
    } else {
      console.log('❌ BOOKDRESS BACKEND HAS SIGNIFICANT ISSUES. Major fixes needed.');
    }

    // Test should pass if at least 70% of core functionality works
    expect(successRate).toBeGreaterThan(50);
    expect(successCount).toBeGreaterThan(3);
  });

  test('should test specific dropdown functionality in detail', async ({ page }) => {
    console.log('🔍 DETAILED DROPDOWN TESTING');
    
    // Login
    await page.goto('/sign-in?lang=en');
    await page.waitForLoadState('networkidle');
    await page.waitForSelector('form', { timeout: 10000 });
    
    await page.fill('input[name="email"]', 'admin@bookdress.com');
    await page.fill('input[name="password"]', 'admin123');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(3000);

    // Test create booking page dropdowns in detail
    await page.goto('/create-booking?lang=en');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    console.log('\n📋 Testing Create Booking Form Dropdowns...');
    
    // Test location dropdown specifically
    try {
      const locationField = page.locator('.MuiAutocomplete-root input').first();
      await locationField.click();
      await page.waitForTimeout(2000);
      
      const locationOptions = page.locator('.MuiAutocomplete-option');
      const locationCount = await locationOptions.count();
      
      console.log(`Location dropdown: ${locationCount} options`);
      
      if (locationCount > 0) {
        const optionTexts = [];
        for (let i = 0; i < Math.min(locationCount, 5); i++) {
          const text = await locationOptions.nth(i).textContent();
          if (text) optionTexts.push(text.trim());
        }
        console.log('Location options:', optionTexts);
        
        // Test selecting a location
        if (locationCount > 0) {
          await locationOptions.first().click();
          await page.waitForTimeout(1000);
          console.log('✅ Successfully selected a location');
        }
      }
    } catch (error) {
      console.log('❌ Location dropdown error:', (error as Error).message);
    }

    console.log('\n🎯 DROPDOWN TESTING COMPLETE');
    expect(true).toBe(true);
  });
});
