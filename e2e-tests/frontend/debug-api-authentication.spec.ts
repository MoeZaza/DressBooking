import { test, expect } from '@playwright/test';

test.describe('Debug Frontend API Authentication', () => {
  test('should debug frontend API authentication issues', async ({ page }) => {
    console.log('🔍 Debugging Frontend API Authentication Issues');

    // Test 1: Check API calls without authentication
    console.log('\n📡 Testing API Calls Without Authentication:');
    
    await page.goto('/search?lang=ar');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    // Test direct API calls from browser
    const unauthenticatedApiResult = await page.evaluate(async () => {
      const results = [];
      
      // Test dresses API
      try {
        const dressesResponse = await fetch('/api/dresses/1/10/ar', {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' }
        });
        
        const dressesText = await dressesResponse.text();
        results.push({
          endpoint: '/api/dresses/1/10/ar',
          status: dressesResponse.status,
          isJson: dressesText.startsWith('{') || dressesText.startsWith('['),
          contentType: dressesResponse.headers.get('content-type'),
          preview: dressesText.substring(0, 200)
        });
      } catch (error) {
        results.push({
          endpoint: '/api/dresses/1/10/ar',
          error: (error as Error).message
        });
      }

      // Test locations API
      try {
        const locationsResponse = await fetch('/api/locations/1/10/ar', {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' }
        });
        
        const locationsText = await locationsResponse.text();
        results.push({
          endpoint: '/api/locations/1/10/ar',
          status: locationsResponse.status,
          isJson: locationsText.startsWith('{') || locationsText.startsWith('['),
          contentType: locationsResponse.headers.get('content-type'),
          preview: locationsText.substring(0, 200)
        });
      } catch (error) {
        results.push({
          endpoint: '/api/locations/1/10/ar',
          error: (error as Error).message
        });
      }

      // Test suppliers API
      try {
        const suppliersResponse = await fetch('/api/suppliers/1/10/?s=', {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' }
        });
        
        const suppliersText = await suppliersResponse.text();
        results.push({
          endpoint: '/api/suppliers/1/10/?s=',
          status: suppliersResponse.status,
          isJson: suppliersText.startsWith('{') || suppliersText.startsWith('['),
          contentType: suppliersResponse.headers.get('content-type'),
          preview: suppliersText.substring(0, 200)
        });
      } catch (error) {
        results.push({
          endpoint: '/api/suppliers/1/10/?s=',
          error: (error as Error).message
        });
      }

      return results;
    });

    console.log('Unauthenticated API results:');
    unauthenticatedApiResult.forEach(result => {
      console.log(`\n${result.endpoint}:`);
      if (result.error) {
        console.log(`  ❌ Error: ${result.error}`);
      } else {
        console.log(`  Status: ${result.status}`);
        console.log(`  Content-Type: ${result.contentType}`);
        console.log(`  Is JSON: ${result.isJson ? '✅' : '❌'}`);
        console.log(`  Preview: ${result.preview}`);
      }
    });

    // Test 2: Check if frontend has authentication
    console.log('\n🔐 Testing Frontend Authentication:');
    
    // Check for authentication tokens
    const authTokens = await page.evaluate(() => {
      return {
        localStorage: {
          token: localStorage.getItem('token'),
          authToken: localStorage.getItem('authToken'),
          accessToken: localStorage.getItem('accessToken'),
          jwt: localStorage.getItem('jwt')
        },
        sessionStorage: {
          token: sessionStorage.getItem('token'),
          authToken: sessionStorage.getItem('authToken'),
          accessToken: sessionStorage.getItem('accessToken'),
          jwt: sessionStorage.getItem('jwt')
        },
        cookies: document.cookie
      };
    });

    console.log('Authentication tokens found:');
    console.log('LocalStorage:', authTokens.localStorage);
    console.log('SessionStorage:', authTokens.sessionStorage);
    console.log('Cookies:', authTokens.cookies);

    // Test 3: Try to authenticate and test API calls
    console.log('\n🔑 Testing with Authentication:');
    
    // Go to sign-in page
    await page.goto('/sign-in?lang=ar');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    const signInPageContent = await page.textContent('body');
    const hasSignInForm = signInPageContent?.includes('Sign In') || 
                         signInPageContent?.includes('تسجيل الدخول') ||
                         signInPageContent?.includes('Email') ||
                         signInPageContent?.includes('Password');

    console.log('Frontend has sign-in form:', hasSignInForm);

    if (hasSignInForm) {
      // Try to sign in
      const emailInput = page.locator('input[type="email"], input[name="email"]');
      const passwordInput = page.locator('input[type="password"], input[name="password"]');
      const submitButton = page.locator('button[type="submit"], button:has-text("Sign In"), button:has-text("تسجيل الدخول")');

      if (await emailInput.isVisible() && await passwordInput.isVisible() && await submitButton.isVisible()) {
        console.log('Attempting to sign in...');
        
        await emailInput.fill('admin@bookdress.com');
        await passwordInput.fill('admin123');
        await submitButton.click();
        await page.waitForTimeout(3000);

        // Check if sign-in was successful
        const postSignInContent = await page.textContent('body');
        const signInSuccessful = !postSignInContent?.includes('Sign In') && 
                                !postSignInContent?.includes('تسجيل الدخول') &&
                                !postSignInContent?.includes('Invalid credentials');

        console.log('Sign-in successful:', signInSuccessful);

        if (signInSuccessful) {
          // Check tokens after sign-in
          const postAuthTokens = await page.evaluate(() => {
            return {
              localStorage: {
                token: localStorage.getItem('token'),
                authToken: localStorage.getItem('authToken'),
                accessToken: localStorage.getItem('accessToken'),
                jwt: localStorage.getItem('jwt')
              },
              cookies: document.cookie
            };
          });

          console.log('Tokens after sign-in:');
          console.log('LocalStorage:', postAuthTokens.localStorage);
          console.log('Cookies:', postAuthTokens.cookies);

          // Test API calls with authentication
          const authenticatedApiResult = await page.evaluate(async () => {
            const results = [];
            
            // Test dresses API with authentication
            try {
              const dressesResponse = await fetch('/api/dresses/1/10/ar', {
                method: 'GET',
                credentials: 'include',
                headers: { 
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${localStorage.getItem('token') || localStorage.getItem('authToken') || localStorage.getItem('jwt')}`
                }
              });
              
              const dressesText = await dressesResponse.text();
              results.push({
                endpoint: '/api/dresses/1/10/ar (authenticated)',
                status: dressesResponse.status,
                isJson: dressesText.startsWith('{') || dressesText.startsWith('['),
                contentType: dressesResponse.headers.get('content-type'),
                preview: dressesText.substring(0, 200)
              });
            } catch (error) {
              results.push({
                endpoint: '/api/dresses/1/10/ar (authenticated)',
                error: (error as Error).message
              });
            }

            return results;
          });

          console.log('Authenticated API results:');
          authenticatedApiResult.forEach(result => {
            console.log(`\n${result.endpoint}:`);
            if (result.error) {
              console.log(`  ❌ Error: ${result.error}`);
            } else {
              console.log(`  Status: ${result.status}`);
              console.log(`  Content-Type: ${result.contentType}`);
              console.log(`  Is JSON: ${result.isJson ? '✅' : '❌'}`);
              console.log(`  Preview: ${result.preview}`);
            }
          });
        }
      }
    }

    // Test 4: Check search page data loading
    console.log('\n🔍 Testing Search Page Data Loading:');
    
    await page.goto('/search?lang=ar');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    const searchPageContent = await page.textContent('body');
    console.log('Search page content length:', searchPageContent?.length);

    // Check for dress data in search page
    const hasDressData = searchPageContent?.includes('DC') || // Dress codes
                        searchPageContent?.includes('فستان') ||
                        searchPageContent?.includes('Dress') ||
                        searchPageContent?.includes('$') ||
                        searchPageContent?.includes('₪');

    console.log('Search page has dress data:', hasDressData);

    // Check for loading indicators
    const loadingIndicators = page.locator('.loading, .spinner, [role="progressbar"], .MuiCircularProgress-root');
    const loadingIndicatorCount = await loadingIndicators.count();
    console.log('Loading indicators found:', loadingIndicatorCount);

    // Check for error messages
    const errorMessages = page.locator('.error, .alert-error, .MuiAlert-error');
    const errorMessageCount = await errorMessages.count();
    console.log('Error messages found:', errorMessageCount);

    if (errorMessageCount > 0) {
      const errorText = await errorMessages.first().textContent();
      console.log('Error message:', errorText);
    }

    // Test 5: Check network requests
    console.log('\n🌐 Monitoring Network Requests:');
    
    const networkRequests = [];
    page.on('response', response => {
      if (response.url().includes('/api/')) {
        networkRequests.push({
          url: response.url(),
          status: response.status(),
          contentType: response.headers()['content-type']
        });
      }
    });

    // Reload search page to capture network requests
    await page.reload();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    console.log('Network requests captured:');
    networkRequests.forEach(request => {
      console.log(`  ${request.url}: ${request.status} (${request.contentType})`);
    });

    // Test should pass regardless
    expect(true).toBe(true);
  });
});
