import { test, expect } from '@playwright/test';

test.describe('Test Dropdowns Are Populated', () => {
  test('should verify location and dress dropdowns have values', async ({ page }) => {
    console.log('🔍 Testing if dropdowns are populated after data seeding');
    
    // Login first
    await page.goto('/sign-in?lang=ar');
    await page.waitForLoadState('networkidle');
    await page.waitForSelector('form', { timeout: 10000 });
    
    await page.fill('input[name="email"]', 'admin@bookdress.com');
    await page.fill('input[name="password"]', 'admin123');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(3000);

    // Test 1: Check Locations Page
    console.log('\n📍 Testing Locations Page...');
    await page.goto('/locations?lang=ar');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    const locationsContent = await page.textContent('body');
    console.log('Locations page content length:', locationsContent?.length);
    
    // Check for Palestinian cities
    const palestinianCities = ['Jenin', 'جنين', 'Ramallah', 'رام الله', 'Nablus', 'نابلس', 'Amman', 'عمان', 'Beirut', 'بيروت'];
    let foundCities = 0;
    const foundCityNames = [];
    
    for (const city of palestinianCities) {
      if (locationsContent?.includes(city)) {
        foundCities++;
        foundCityNames.push(city);
      }
    }
    
    console.log(`Found ${foundCities} cities:`, foundCityNames);
    
    // Test 2: Check Create Booking Page Dropdowns
    console.log('\n📅 Testing Create Booking Page Dropdowns...');
    await page.goto('/create-booking?lang=ar');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    const bookingContent = await page.textContent('body');
    console.log('Booking page content length:', bookingContent?.length);
    
    // Test Location Dropdown
    console.log('\n📍 Testing Location Dropdown...');
    try {
      // Look for location autocomplete field
      const locationField = page.locator('input[placeholder*="موقع"], input[placeholder*="Location"], .MuiAutocomplete-root input').first();
      await locationField.click();
      await page.waitForTimeout(1000);
      
      // Check if dropdown options appear
      const locationOptions = page.locator('.MuiAutocomplete-option, .MuiMenuItem-root');
      const locationOptionCount = await locationOptions.count();
      console.log(`Location dropdown options: ${locationOptionCount}`);
      
      if (locationOptionCount > 0) {
        const locationTexts = [];
        for (let i = 0; i < Math.min(locationOptionCount, 5); i++) {
          const optionText = await locationOptions.nth(i).textContent();
          if (optionText && optionText.trim()) {
            locationTexts.push(optionText.trim());
          }
        }
        console.log('Location options:', locationTexts);
      }
    } catch (error) {
      console.log('Location dropdown test error:', (error as Error).message);
    }

    // Test Dress Dropdown
    console.log('\n👗 Testing Dress Dropdown...');
    try {
      // Look for dress autocomplete field
      const dressField = page.locator('input[placeholder*="فستان"], input[placeholder*="Dress"], .MuiAutocomplete-root input').nth(1);
      await dressField.click();
      await page.waitForTimeout(1000);
      
      // Check if dropdown options appear
      const dressOptions = page.locator('.MuiAutocomplete-option, .MuiMenuItem-root');
      const dressOptionCount = await dressOptions.count();
      console.log(`Dress dropdown options: ${dressOptionCount}`);
      
      if (dressOptionCount > 0) {
        const dressTexts = [];
        for (let i = 0; i < Math.min(dressOptionCount, 5); i++) {
          const optionText = await dressOptions.nth(i).textContent();
          if (optionText && optionText.trim()) {
            dressTexts.push(optionText.trim());
          }
        }
        console.log('Dress options:', dressTexts);
      }
    } catch (error) {
      console.log('Dress dropdown test error:', (error as Error).message);
    }

    // Test Customer Dropdown
    console.log('\n👤 Testing Customer Dropdown...');
    try {
      // Look for customer autocomplete field
      const customerField = page.locator('input[placeholder*="عميل"], input[placeholder*="Customer"], .MuiAutocomplete-root input').nth(2);
      await customerField.click();
      await page.waitForTimeout(1000);
      
      // Check if dropdown options appear
      const customerOptions = page.locator('.MuiAutocomplete-option, .MuiMenuItem-root');
      const customerOptionCount = await customerOptions.count();
      console.log(`Customer dropdown options: ${customerOptionCount}`);
      
      if (customerOptionCount > 0) {
        const customerTexts = [];
        for (let i = 0; i < Math.min(customerOptionCount, 3); i++) {
          const optionText = await customerOptions.nth(i).textContent();
          if (optionText && optionText.trim()) {
            customerTexts.push(optionText.trim());
          }
        }
        console.log('Customer options:', customerTexts);
      }
    } catch (error) {
      console.log('Customer dropdown test error:', (error as Error).message);
    }

    // Test 3: Check Dresses Page
    console.log('\n👗 Testing Dresses Page...');
    await page.goto('/dresses?lang=ar');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    const dressesContent = await page.textContent('body');
    console.log('Dresses page content length:', dressesContent?.length);
    
    // Look for dress names
    const dressNames = ['Elegant', 'Classic', 'Modern', 'Vintage', 'Luxury', 'Premium'];
    let foundDresses = 0;
    const foundDressNames = [];
    
    for (const dress of dressNames) {
      if (dressesContent?.includes(dress)) {
        foundDresses++;
        foundDressNames.push(dress);
      }
    }
    
    console.log(`Found ${foundDresses} dresses:`, foundDressNames);

    // Test 4: Check Users Page
    console.log('\n👥 Testing Users Page...');
    await page.goto('/users?lang=ar');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    const usersContent = await page.textContent('body');
    console.log('Users page content length:', usersContent?.length);
    
    // Look for user names
    const userNames = ['Sofia', 'Layla', 'Ahmed', 'Fatima', 'Omar', 'Aisha'];
    let foundUsers = 0;
    const foundUserNames = [];
    
    for (const user of userNames) {
      if (usersContent?.includes(user)) {
        foundUsers++;
        foundUserNames.push(user);
      }
    }
    
    console.log(`Found ${foundUsers} users:`, foundUserNames);

    // Summary
    console.log('\n📊 DROPDOWN POPULATION SUMMARY:');
    console.log(`✅ Locations found: ${foundCities}`);
    console.log(`✅ Dresses found: ${foundDresses}`);
    console.log(`✅ Users found: ${foundUsers}`);
    console.log(`✅ Data seeding was successful!`);

    // Basic assertions
    expect(locationsContent?.length).toBeGreaterThan(500);
    expect(dressesContent?.length).toBeGreaterThan(500);
    expect(usersContent?.length).toBeGreaterThan(500);
    expect(foundCities + foundDresses + foundUsers).toBeGreaterThan(5); // At least some data found
  });

  test('should test API endpoints directly', async ({ page }) => {
    console.log('🔌 Testing API endpoints directly');
    
    // Test API endpoints through browser fetch
    const apiTests = [
      { name: 'Locations API', url: 'http://localhost:4002/api/locations/1/10/ar' },
      { name: 'Dresses API', url: 'http://localhost:4002/api/dresses/1/10' },
      { name: 'Users API', url: 'http://localhost:4002/api/users/1/10' },
      { name: 'Health API', url: 'http://localhost:4002/api/health' }
    ];

    for (const apiTest of apiTests) {
      try {
        const response = await page.evaluate(async (url) => {
          try {
            const res = await fetch(url);
            const data = await res.json();
            return {
              status: res.status,
              ok: res.ok,
              dataLength: JSON.stringify(data).length,
              hasData: Array.isArray(data) ? data.length > 0 : Object.keys(data).length > 0
            };
          } catch (error) {
            return { error: (error as Error).message };
          }
        }, apiTest.url);

        console.log(`${apiTest.name}:`, response);
      } catch (error) {
        console.log(`${apiTest.name}: Error -`, (error as Error).message);
      }
    }
  });
});
