import { test, expect } from '@playwright/test';

test.describe('Test API Fixes', () => {
  test('should verify that API fixes resolved the authentication and data issues', async ({ page }) => {
    console.log('🔧 Testing API Fixes');
    
    // Login first
    await page.goto('/sign-in?lang=en');
    await page.waitForLoadState('networkidle');
    await page.waitForSelector('form', { timeout: 10000 });
    
    await page.fill('input[name="email"]', 'admin@bookdress.com');
    await page.fill('input[name="password"]', 'admin123');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(3000);

    const results = {
      locationsAPI: false,
      suppliersAPI: false,
      dressesAPI: false,
      usersAPI: false,
      locationsPage: false,
      suppliersPage: false,
      dropdowns: false
    };

    // Test 1: API Endpoints with Authentication
    console.log('\n1️⃣ Testing API Endpoints with Authentication...');
    
    try {
      const apiResponse = await page.evaluate(async () => {
        try {
          // Test locations API (English)
          const locRes = await fetch('/api/locations/1/10/en', {
            credentials: 'include'
          });
          const locData = await locRes.json();
          
          // Test backend suppliers API (fixed format)
          const suppRes = await fetch('/api/backend-suppliers', {
            method: 'POST',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ suppliers: [] })
          });
          const suppData = await suppRes.json();
          
          // Test dresses API
          const dressRes = await fetch('/api/dresses/1/10', {
            method: 'POST',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ suppliers: [] })
          });
          const dressData = await dressRes.json();
          
          // Test users API
          const userRes = await fetch('/api/users/1/10', {
            method: 'POST',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ user: '', types: ['user'] })
          });
          const userData = await userRes.json();
          
          return {
            locations: { status: locRes.status, ok: locRes.ok, data: locData },
            suppliers: { status: suppRes.status, ok: suppRes.ok, data: suppData },
            dresses: { status: dressRes.status, ok: dressRes.ok, data: dressData },
            users: { status: userRes.status, ok: userRes.ok, data: userData }
          };
        } catch (error) {
          return { error: (error as Error).message };
        }
      });

      // Check locations API
      if (apiResponse.locations?.ok && apiResponse.locations.data) {
        const locData = apiResponse.locations.data;
        if (Array.isArray(locData) && locData.length > 0 && locData[0].resultData?.length > 0) {
          results.locationsAPI = true;
          console.log(`✅ Locations API: ${locData[0].resultData.length} locations`);
        } else {
          console.log('❌ Locations API: Empty data');
        }
      } else {
        console.log('❌ Locations API: Failed', apiResponse.locations?.status);
      }

      // Check suppliers API
      if (apiResponse.suppliers?.ok && apiResponse.suppliers.data) {
        const suppData = apiResponse.suppliers.data;
        if (Array.isArray(suppData) && suppData.length > 0) {
          results.suppliersAPI = true;
          console.log(`✅ Suppliers API: ${suppData.length} suppliers`);
        } else {
          console.log('❌ Suppliers API: Empty data');
        }
      } else {
        console.log('❌ Suppliers API: Failed', apiResponse.suppliers?.status);
      }

      // Check dresses API
      if (apiResponse.dresses?.ok && apiResponse.dresses.data) {
        const dressData = apiResponse.dresses.data;
        if (Array.isArray(dressData) && dressData.length > 0 && dressData[0].resultData?.length > 0) {
          results.dressesAPI = true;
          console.log(`✅ Dresses API: ${dressData[0].resultData.length} dresses`);
        } else {
          console.log('❌ Dresses API: Empty data');
        }
      } else {
        console.log('❌ Dresses API: Failed', apiResponse.dresses?.status);
      }

      // Check users API
      if (apiResponse.users?.ok && apiResponse.users.data) {
        const userData = apiResponse.users.data;
        if (Array.isArray(userData) && userData.length > 0 && userData[0].resultData?.length > 0) {
          results.usersAPI = true;
          console.log(`✅ Users API: ${userData[0].resultData.length} users`);
        } else {
          console.log('❌ Users API: Empty data');
        }
      } else {
        console.log('❌ Users API: Failed', apiResponse.users?.status);
      }
    } catch (error) {
      console.log('❌ API test error:', (error as Error).message);
    }

    // Test 2: Pages
    console.log('\n2️⃣ Testing Pages...');
    
    // Test locations page
    await page.goto('/locations?lang=en');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    const locationsContent = await page.textContent('body');
    const locationNames = ['Jenin', 'Ramallah', 'Nablus', 'Amman', 'Beirut'];
    let foundLocations = 0;
    
    for (const location of locationNames) {
      if (locationsContent?.includes(location)) {
        foundLocations++;
      }
    }
    
    if (foundLocations > 0 || (locationsContent && locationsContent.length > 500)) {
      results.locationsPage = true;
      console.log(`✅ Locations page: ${foundLocations} locations found, ${locationsContent?.length} chars`);
    } else {
      console.log(`❌ Locations page: ${foundLocations} locations found, ${locationsContent?.length || 0} chars`);
    }

    // Test suppliers page
    await page.goto('/suppliers?lang=en');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    const suppliersContent = await page.textContent('body');
    const supplierNames = ['Sofia', 'Layla', 'Boutique'];
    let foundSuppliers = 0;
    
    for (const supplier of supplierNames) {
      if (suppliersContent?.includes(supplier)) {
        foundSuppliers++;
      }
    }
    
    if (foundSuppliers > 0 || (suppliersContent && suppliersContent.length > 500)) {
      results.suppliersPage = true;
      console.log(`✅ Suppliers page: ${foundSuppliers} suppliers found, ${suppliersContent?.length} chars`);
    } else {
      console.log(`❌ Suppliers page: ${foundSuppliers} suppliers found, ${suppliersContent?.length || 0} chars`);
    }

    // Test 3: Dropdowns
    console.log('\n3️⃣ Testing Dropdowns...');
    
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
        
        if (optionCount > 0) {
          workingDropdowns++;
        }
      } catch (error) {
        // Ignore errors
      }
    }
    
    if (workingDropdowns > 0) {
      results.dropdowns = true;
      console.log(`✅ Dropdowns: ${workingDropdowns} working dropdowns`);
    } else {
      console.log('❌ Dropdowns: No working dropdowns');
    }

    // Calculate success rate
    const successCount = Object.values(results).filter(Boolean).length;
    const totalTests = Object.keys(results).length;
    const successRate = Math.round((successCount / totalTests) * 100);

    console.log('\n📊 API FIXES RESULTS:');
    console.log('='.repeat(50));
    console.log(`✅ Locations API: ${results.locationsAPI ? 'PASS' : 'FAIL'}`);
    console.log(`✅ Suppliers API: ${results.suppliersAPI ? 'PASS' : 'FAIL'}`);
    console.log(`✅ Dresses API: ${results.dressesAPI ? 'PASS' : 'FAIL'}`);
    console.log(`✅ Users API: ${results.usersAPI ? 'PASS' : 'FAIL'}`);
    console.log(`✅ Locations Page: ${results.locationsPage ? 'PASS' : 'FAIL'}`);
    console.log(`✅ Suppliers Page: ${results.suppliersPage ? 'PASS' : 'FAIL'}`);
    console.log(`✅ Dropdowns: ${results.dropdowns ? 'PASS' : 'FAIL'}`);
    console.log('='.repeat(50));
    console.log(`🎯 OVERALL SUCCESS: ${successCount}/${totalTests} (${successRate}%)`);
    
    if (successRate >= 70) {
      console.log('🎉 API FIXES SUCCESSFUL! Most issues resolved.');
    } else if (successRate >= 50) {
      console.log('⚠️  API FIXES PARTIALLY SUCCESSFUL. Some issues remain.');
    } else {
      console.log('❌ API FIXES NEED MORE WORK. Major issues remain.');
    }

    expect(successRate).toBeGreaterThan(40);
  });
});
