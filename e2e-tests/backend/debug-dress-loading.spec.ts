import { test, expect } from '@playwright/test';

test.describe('Debug Dress Loading', () => {
  test('should debug dress loading in create booking', async ({ page }) => {
    // Capture console logs
    const consoleLogs = [];
    page.on('console', msg => {
      consoleLogs.push(`${msg.type()}: ${msg.text()}`);
    });

    // Capture network requests
    const networkRequests = [];
    page.on('request', request => {
      if (request.url().includes('/api/')) {
        networkRequests.push({
          url: request.url(),
          method: request.method(),
          headers: request.headers()
        });
      }
    });

    // Capture network responses
    const networkResponses = [];
    page.on('response', response => {
      if (response.url().includes('/api/')) {
        networkResponses.push({
          url: response.url(),
          status: response.status(),
          statusText: response.statusText()
        });
      }
    });

    // Login first
    await page.goto('/sign-in?lang=ar');
    await page.waitForLoadState('networkidle');
    await page.waitForSelector('form', { timeout: 10000 });
    
    await page.fill('input[name="email"]', 'admin@bookdress.com');
    await page.fill('input[name="password"]', 'admin123');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(3000);

    console.log('🔍 Debugging Create Booking Page - Dress Loading');

    // Navigate to create booking page
    await page.goto('/create-booking?lang=ar');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000); // Give more time for API calls

    // Select a customer and proceed to dress selection
    const customerDropdown = page.locator('select, .MuiSelect-root, .MuiAutocomplete-root').first();
    if (await customerDropdown.isVisible()) {
      await customerDropdown.click();
      await page.waitForTimeout(1000);
      
      const firstCustomerOption = page.locator('[role="option"]').first();
      if (await firstCustomerOption.isVisible()) {
        await firstCustomerOption.click();
        await page.waitForTimeout(1000);
      }
    }

    // Proceed to dress selection
    const nextButton = page.locator('button:has-text("Next"), button:has-text("التالي")');
    if (await nextButton.isVisible()) {
      await nextButton.click();
      await page.waitForTimeout(5000); // Give more time for dress loading
    }

    // Check the dress dropdown label for count
    const dressLabel = await page.locator('label:has-text("Select Dress")').textContent();
    console.log('Dress dropdown label:', dressLabel);

    // Print all console logs
    console.log('\n📋 CONSOLE LOGS:');
    consoleLogs.forEach((log, index) => {
      console.log(`${index + 1}. ${log}`);
    });

    // Print network requests
    console.log('\n🌐 NETWORK REQUESTS:');
    networkRequests.forEach((req, index) => {
      console.log(`${index + 1}. ${req.method} ${req.url}`);
    });

    // Print network responses
    console.log('\n📡 NETWORK RESPONSES:');
    networkResponses.forEach((res, index) => {
      console.log(`${index + 1}. ${res.status} ${res.statusText} - ${res.url}`);
    });

    // Check for specific dress API calls
    const dressApiCalls = networkRequests.filter(req => req.url.includes('/dresses'));
    console.log(`\n👗 DRESS API CALLS: ${dressApiCalls.length}`);
    dressApiCalls.forEach((call, index) => {
      console.log(`${index + 1}. ${call.method} ${call.url}`);
    });

    // Check for dress API responses
    const dressApiResponses = networkResponses.filter(res => res.url.includes('/dresses'));
    console.log(`\n📦 DRESS API RESPONSES: ${dressApiResponses.length}`);
    dressApiResponses.forEach((res, index) => {
      console.log(`${index + 1}. ${res.status} ${res.statusText} - ${res.url}`);
    });

    // Check for authentication issues
    const authErrors = networkResponses.filter(res => res.status === 401 || res.status === 403);
    if (authErrors.length > 0) {
      console.log('\n🔒 AUTHENTICATION ERRORS:');
      authErrors.forEach((error, index) => {
        console.log(`${index + 1}. ${error.status} ${error.statusText} - ${error.url}`);
      });
    }

    // Check for other API errors
    const apiErrors = networkResponses.filter(res => res.status >= 400);
    if (apiErrors.length > 0) {
      console.log('\n❌ API ERRORS:');
      apiErrors.forEach((error, index) => {
        console.log(`${index + 1}. ${error.status} ${error.statusText} - ${error.url}`);
      });
    }

    // Test should pass regardless
    const pageContent = await page.textContent('body');
    expect(pageContent?.length).toBeGreaterThan(50);
  });

  test('should test direct dress API call', async ({ page }) => {
    // Login first
    await page.goto('/sign-in?lang=ar');
    await page.waitForLoadState('networkidle');
    await page.waitForSelector('form', { timeout: 10000 });
    
    await page.fill('input[name="email"]', 'admin@bookdress.com');
    await page.fill('input[name="password"]', 'admin123');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(3000);

    console.log('🔍 Testing Direct Dress API Call');

    // Try to call the dress API directly from the browser
    const apiResult = await page.evaluate(async () => {
      try {
        const response = await fetch('/api/dresses/1/100/ar', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json'
          }
        });
        
        const data = await response.json();
        return {
          status: response.status,
          statusText: response.statusText,
          data: data,
          dataLength: Array.isArray(data) ? data.length : (data?.length || 0)
        };
      } catch (error) {
        return {
          error: error.message
        };
      }
    });

    console.log('Direct API call result:', apiResult);

    if (apiResult.data) {
      console.log('API returned data:', typeof apiResult.data);
      if (Array.isArray(apiResult.data)) {
        console.log(`API returned ${apiResult.data.length} items`);
        if (apiResult.data.length > 0) {
          console.log('First item:', apiResult.data[0]);
        }
      } else if (apiResult.data.resultData) {
        console.log(`API returned resultData with ${apiResult.data.resultData.length} items`);
        if (apiResult.data.resultData.length > 0) {
          console.log('First dress:', apiResult.data.resultData[0]);
        }
      }
    }

    // Test should pass regardless
    expect(apiResult).toBeDefined();
  });
});
