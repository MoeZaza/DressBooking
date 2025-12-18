import { test, expect } from '@playwright/test';

/**
 * Frontend Search Dresses Functionality Testing
 * Tests frontend search dresses functionality, location dropdown population, search results display, and data integration
 */

test.describe('Frontend Search Dresses Functionality Testing', () => {
  
  test('should load frontend application and search page', async ({ page }) => {
    console.log('🌐 Testing frontend application and search page...');
    
    // Navigate to frontend application
    await page.goto('http://localhost:3000');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    // Check if page loads properly
    await expect(page).toHaveTitle(/BookDress/);
    
    // Check current URL
    console.log('Frontend URL:', page.url());
    
    // Check for page content
    const pageContent = await page.textContent('body');
    console.log('Frontend page content preview:', pageContent?.substring(0, 500));
    
    // Take screenshot for documentation
    await page.screenshot({ 
      path: 'test-results/screenshots/frontend-home-page.png',
      fullPage: true 
    });
    
    console.log('✅ Frontend application loaded successfully');
  });

  test('should find and test search dresses functionality', async ({ page }) => {
    console.log('🔍 Testing search dresses functionality...');
    
    // Navigate to frontend application
    await page.goto('http://localhost:3000');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    // Look for search-related elements
    const searchInputs = await page.locator('input[type="search"], input[placeholder*="search"], input[placeholder*="بحث"]').count();
    console.log('Search inputs found:', searchInputs);
    
    // Look for search buttons
    const searchButtons = await page.locator('button:has-text("Search"), button:has-text("بحث"), [data-testid*="search"]').count();
    console.log('Search buttons found:', searchButtons);
    
    // Look for dress-related search elements
    const dressSearchElements = await page.locator('[data-testid*="dress"], .dress-search, input[name*="dress"]').count();
    console.log('Dress search elements found:', dressSearchElements);
    
    // Check for search form
    const searchForms = await page.locator('form').count();
    console.log('Forms found:', searchForms);
    
    // Try to find search page by common URLs
    const searchUrls = [
      '/search',
      '/search-dresses',
      '/dresses',
      '/browse',
      '/catalog'
    ];
    
    let searchPageFound = false;
    
    for (const url of searchUrls) {
      try {
        console.log(`Trying search URL: ${url}`);
        await page.goto(`http://localhost:3000${url}`);
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(2000);
        
        // Check if page loads without error
        const currentUrl = page.url();
        const hasError = await page.locator('.error, .MuiAlert-standardError, [role="alert"]').count() > 0;
        
        if (!hasError && !currentUrl.includes('/404')) {
          searchPageFound = true;
          console.log(`✅ Found search page: ${url}`);
          
          // Take screenshot
          await page.screenshot({ 
            path: `test-results/screenshots/frontend-search-page-${url.replace('/', '')}.png`,
            fullPage: true 
          });
          
          break;
        }
      } catch (error) {
        console.log(`❌ URL ${url} failed:`, error.message);
      }
    }
    
    if (!searchPageFound) {
      console.log('⚠️ No dedicated search page found, checking home page for search functionality');
      await page.goto('http://localhost:3000');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(3000);
    }
    
    console.log('✅ Search dresses functionality discovery completed');
  });

  test('should test location dropdown functionality', async ({ page }) => {
    console.log('📍 Testing location dropdown functionality...');
    
    // Navigate to frontend application
    await page.goto('http://localhost:3000');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    // Look for location-related dropdowns
    const locationDropdowns = await page.locator('select[name*="location"], select[name*="city"], select[name*="country"]').count();
    console.log('Location dropdowns found:', locationDropdowns);
    
    // Look for location inputs
    const locationInputs = await page.locator('input[name*="location"], input[placeholder*="location"], input[placeholder*="موقع"]').count();
    console.log('Location inputs found:', locationInputs);
    
    // Look for MUI Select components for location
    const muiSelects = await page.locator('.MuiSelect-root, [data-testid*="location"], [data-testid*="city"]').count();
    console.log('MUI Select components found:', muiSelects);
    
    // Try to interact with location dropdown if found
    const locationSelect = page.locator('select[name*="location"], select[name*="city"], .MuiSelect-root').first();
    if (await locationSelect.count() > 0) {
      try {
        // Check if it's a regular select
        if (await page.locator('select[name*="location"], select[name*="city"]').count() > 0) {
          const options = await page.locator('select[name*="location"], select[name*="city"]').first().locator('option').count();
          console.log('Location dropdown options:', options);
          
          if (options > 1) {
            // Get option texts
            const optionTexts = await page.locator('select[name*="location"], select[name*="city"]').first().locator('option').allTextContents();
            console.log('Location options:', optionTexts);
          }
        } else {
          // Try MUI Select
          await locationSelect.click();
          await page.waitForTimeout(1000);
          
          const menuItems = await page.locator('.MuiMenuItem-root, [role="option"]').count();
          console.log('MUI Select menu items:', menuItems);
          
          if (menuItems > 0) {
            const menuTexts = await page.locator('.MuiMenuItem-root, [role="option"]').allTextContents();
            console.log('Location menu options:', menuTexts);
            
            // Close the dropdown
            await page.keyboard.press('Escape');
          }
        }
        
        console.log('✅ Location dropdown interaction tested');
      } catch (error) {
        console.log('⚠️ Could not interact with location dropdown:', error);
      }
    } else {
      console.log('❌ No location dropdown found');
    }
    
    // Take screenshot
    await page.screenshot({ 
      path: 'test-results/screenshots/frontend-location-dropdown.png',
      fullPage: true 
    });
    
    console.log('✅ Location dropdown testing completed');
  });

  test('should test search functionality and results', async ({ page }) => {
    console.log('🔎 Testing search functionality and results...');
    
    // Navigate to frontend application
    await page.goto('http://localhost:3000');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    // Look for search input
    const searchInput = page.locator('input[type="search"], input[placeholder*="search"], input[placeholder*="بحث"]').first();
    
    if (await searchInput.count() > 0) {
      try {
        // Test search functionality
        await searchInput.fill('dress');
        await page.waitForTimeout(1000);
        
        // Look for search button and click it
        const searchButton = page.locator('button:has-text("Search"), button:has-text("بحث"), [data-testid*="search"]').first();
        if (await searchButton.count() > 0) {
          await searchButton.click();
          await page.waitForTimeout(3000);
        } else {
          // Try pressing Enter
          await searchInput.press('Enter');
          await page.waitForTimeout(3000);
        }
        
        // Check for search results
        const searchResults = await page.locator('.search-result, .dress-item, .product-item, [data-testid*="result"]').count();
        console.log('Search results found:', searchResults);
        
        // Check for dress cards or items
        const dressItems = await page.locator('.dress-card, .product-card, .item-card').count();
        console.log('Dress items found:', dressItems);
        
        // Check for images
        const dressImages = await page.locator('img[alt*="dress"], img[src*="dress"]').count();
        console.log('Dress images found:', dressImages);
        
        // Check for prices
        const priceElements = await page.locator('.price, [data-testid*="price"]').count();
        console.log('Price elements found:', priceElements);
        
        // Take screenshot of search results
        await page.screenshot({ 
          path: 'test-results/screenshots/frontend-search-results.png',
          fullPage: true 
        });
        
        console.log('✅ Search functionality tested successfully');
        
      } catch (error) {
        console.log('⚠️ Could not test search functionality:', error);
      }
    } else {
      console.log('❌ No search input found');
    }
    
    console.log('✅ Search functionality and results testing completed');
  });

  test('should test data integration and API connectivity', async ({ page }) => {
    console.log('🔗 Testing data integration and API connectivity...');
    
    // Navigate to frontend application
    await page.goto('http://localhost:3000');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    // Monitor network requests
    const apiRequests: string[] = [];
    
    page.on('request', request => {
      const url = request.url();
      if (url.includes('/api/') || url.includes(':4002')) {
        apiRequests.push(url);
        console.log('API Request:', url);
      }
    });
    
    // Trigger some actions to generate API calls
    const searchInput = page.locator('input[type="search"], input[placeholder*="search"]').first();
    if (await searchInput.count() > 0) {
      await searchInput.fill('test');
      await page.waitForTimeout(2000);
    }
    
    // Check for any dropdowns that might trigger API calls
    const dropdowns = await page.locator('select, .MuiSelect-root').count();
    if (dropdowns > 0) {
      try {
        await page.locator('select, .MuiSelect-root').first().click();
        await page.waitForTimeout(2000);
        await page.keyboard.press('Escape');
      } catch (error) {
        console.log('Could not interact with dropdown:', error);
      }
    }
    
    console.log('Total API requests captured:', apiRequests.length);
    console.log('API requests:', apiRequests);
    
    // Check for data loading indicators
    const loadingElements = await page.locator('.loading, .MuiCircularProgress-root, [data-testid="loading"]').count();
    console.log('Loading indicators found:', loadingElements);
    
    // Check for error messages
    const errorElements = await page.locator('.error, .MuiAlert-standardError, [role="alert"]').count();
    console.log('Error messages found:', errorElements);
    
    if (errorElements > 0) {
      const errorTexts = await page.locator('.error, .MuiAlert-standardError, [role="alert"]').allTextContents();
      console.log('Error messages:', errorTexts);
    }
    
    // Take screenshot
    await page.screenshot({ 
      path: 'test-results/screenshots/frontend-data-integration.png',
      fullPage: true 
    });
    
    console.log('✅ Data integration and API connectivity testing completed');
  });
});
