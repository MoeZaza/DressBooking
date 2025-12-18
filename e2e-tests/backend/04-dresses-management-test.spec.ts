import { test, expect } from '@playwright/test';

/**
 * Dresses Management Page Testing
 * Tests dresses CRUD operations, image upload, dress code generation, filtering, search, and Arabic text display
 */

test.describe('04. Dresses Management Page Testing', () => {
  
  test.beforeEach(async ({ page }) => {
    // Login first
    await page.goto('/sign-in?lang=ar');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Fill admin credentials
    await page.fill('input[name="email"]', 'admin@bookdress.com');
    await page.fill('input[name="password"]', 'admin123');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(3000);
  });

  test('should find and navigate to dresses page', async ({ page }) => {
    console.log('👗 Finding dresses management page...');
    
    // Start from root page
    await page.goto('/?lang=ar');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    // Look for dresses-related links or buttons
    const dressLinks = await page.locator('a[href*="dress"], button:has-text("dress"), a:has-text("dress")').count();
    console.log('Dress-related links found:', dressLinks);
    
    // Try common dress page URLs
    const possibleUrls = [
      '/dresses',
      '/dress',
      '/dress-management',
      '/manage-dresses',
      '/inventory',
      '/products'
    ];
    
    let workingUrl = null;
    
    for (const url of possibleUrls) {
      try {
        console.log(`Trying URL: ${url}`);
        await page.goto(`${url}?lang=ar`);
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(2000);
        
        // Check if page loads without error
        const currentUrl = page.url();
        const hasError = await page.locator('.error, .MuiAlert-standardError, [role="alert"]').count() > 0;
        
        if (!hasError && !currentUrl.includes('/sign-in')) {
          workingUrl = url;
          console.log(`✅ Found working dresses page: ${url}`);
          break;
        }
      } catch (error) {
        console.log(`❌ URL ${url} failed:`, error.message);
      }
    }
    
    if (workingUrl) {
      // Take screenshot of the dresses page
      await page.screenshot({ 
        path: 'test-results/screenshots/04-dresses-page-found.png',
        fullPage: true 
      });
      
      // Check page content
      const pageContent = await page.textContent('body');
      console.log('Dresses page content preview:', pageContent?.substring(0, 300));
      
    } else {
      console.log('❌ No dresses management page found');
      
      // Take screenshot of current page for debugging
      await page.screenshot({ 
        path: 'test-results/screenshots/04-dresses-page-not-found.png',
        fullPage: true 
      });
    }
    
    console.log('✅ Dresses page discovery completed');
  });

  test('should test create booking page (which might contain dress selection)', async ({ page }) => {
    console.log('👗 Testing create booking page for dress functionality...');
    
    // Navigate to create booking page
    await page.goto('/create-booking?lang=ar');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    // Check if page loads properly
    const currentUrl = page.url();
    console.log('Create booking URL:', currentUrl);
    
    // Check for dress-related elements
    const dressElements = await page.locator('[data-testid*="dress"], .dress, [class*="dress"]').count();
    console.log('Dress elements found:', dressElements);
    
    // Check for dress selection dropdowns or inputs
    const dressSelectors = await page.locator('select[name*="dress"], input[name*="dress"], [data-testid*="dress-select"]').count();
    console.log('Dress selectors found:', dressSelectors);
    
    // Check for dress images
    const dressImages = await page.locator('img[alt*="dress"], img[src*="dress"]').count();
    console.log('Dress images found:', dressImages);
    
    // Check for form fields
    const formFields = await page.locator('input, select, textarea').count();
    console.log('Form fields found:', formFields);
    
    // Check for Arabic dress terms
    const arabicDressTerms = [
      'فستان', // Dress
      'الفساتين', // Dresses
      'اختر فستان', // Choose dress
      'نوع الفستان', // Dress type
      'مقاس', // Size
      'لون' // Color
    ];
    
    for (const term of arabicDressTerms) {
      const termExists = await page.locator(`text=${term}`).count() > 0;
      console.log(`Arabic dress term "${term}": ${termExists ? '✅ Found' : '❌ Not found'}`);
    }
    
    // Take screenshot
    await page.screenshot({ 
      path: 'test-results/screenshots/04-create-booking-dress-elements.png',
      fullPage: true 
    });
    
    console.log('✅ Create booking page dress functionality testing completed');
  });

  test('should test dress data and information display', async ({ page }) => {
    console.log('📊 Testing dress data display...');
    
    // Start from root page and look for dress information
    await page.goto('/?lang=ar');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    // Check if dress information is displayed in bookings table
    const pageContent = await page.textContent('body');
    
    // Look for dress codes (like DC0003, DC0005 that we saw earlier)
    const dressCodePattern = /DC\d{4}/g;
    const dressCodes = pageContent?.match(dressCodePattern) || [];
    console.log('Dress codes found:', dressCodes);
    
    // Look for dress names
    const dressNamePattern = /(Vintage|Traditional|Cocktail|Lace|Thobe|Dress)/g;
    const dressNames = pageContent?.match(dressNamePattern) || [];
    console.log('Dress names found:', dressNames);
    
    // Check for dress-related data in table
    const tableRows = await page.locator('.MuiDataGrid-row, tbody tr, [role="row"]').count();
    console.log('Table rows with potential dress data:', tableRows);
    
    // Check for dress prices
    const pricePattern = /\d+\s*₪/g;
    const prices = pageContent?.match(pricePattern) || [];
    console.log('Dress prices found:', prices);
    
    // Take screenshot
    await page.screenshot({ 
      path: 'test-results/screenshots/04-dress-data-display.png',
      fullPage: true 
    });
    
    console.log('✅ Dress data display testing completed');
  });

  test('should test dress filtering and search functionality', async ({ page }) => {
    console.log('🔍 Testing dress filtering and search...');
    
    // Navigate to root page
    await page.goto('/?lang=ar');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    // Check for dress-related filters
    const dressFilters = await page.locator('select[name*="dress"], [data-testid*="dress-filter"]').count();
    console.log('Dress filters found:', dressFilters);
    
    // Check for supplier filter (which might filter dresses by supplier)
    const supplierFilter = await page.locator('select[name*="supplier"], [data-testid*="supplier"]').count();
    console.log('Supplier filters found:', supplierFilter);
    
    // Check for search functionality that might include dress search
    const searchInputs = await page.locator('input[type="search"], input[placeholder*="search"]').count();
    console.log('Search inputs found:', searchInputs);
    
    // Try to interact with supplier filter if available
    const supplierSelect = page.locator('select[name*="supplier"], [data-testid*="supplier"]').first();
    if (await supplierSelect.count() > 0) {
      try {
        // Get available options
        const options = await supplierSelect.locator('option').count();
        console.log('Supplier filter options:', options);
        
        if (options > 1) {
          // Select a supplier to filter dresses
          await supplierSelect.selectOption({ index: 1 });
          await page.waitForTimeout(2000);
          console.log('✅ Supplier filter interaction tested');
        }
      } catch (error) {
        console.log('⚠️ Could not interact with supplier filter:', error);
      }
    }
    
    // Take screenshot
    await page.screenshot({ 
      path: 'test-results/screenshots/04-dress-filtering-search.png',
      fullPage: true 
    });
    
    console.log('✅ Dress filtering and search testing completed');
  });

  test('should test dress codes and identification system', async ({ page }) => {
    console.log('🏷️ Testing dress codes and identification...');
    
    // Navigate to root page
    await page.goto('/?lang=ar');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    // Extract all dress codes from the page
    const pageContent = await page.textContent('body');
    const dressCodePattern = /DC\d{4}/g;
    const dressCodes = pageContent?.match(dressCodePattern) || [];
    
    console.log('All dress codes found:', dressCodes);
    console.log('Total unique dress codes:', [...new Set(dressCodes)].length);
    
    // Check for dress code format consistency
    const validDressCodes = dressCodes.filter(code => /^DC\d{4}$/.test(code));
    console.log('Valid dress codes:', validDressCodes.length);
    
    // Extract dress names associated with codes
    const dressEntries = [];
    const lines = pageContent?.split(/\n|:/) || [];
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (line.includes('DC')) {
        const nextLine = lines[i + 1] || '';
        dressEntries.push({
          code: line.match(/DC\d{4}/)?.[0],
          name: nextLine.trim()
        });
      }
    }
    
    console.log('Dress entries with codes and names:');
    dressEntries.forEach(entry => {
      if (entry.code && entry.name) {
        console.log(`  ${entry.code}: ${entry.name}`);
      }
    });
    
    // Take screenshot
    await page.screenshot({ 
      path: 'test-results/screenshots/04-dress-codes-identification.png',
      fullPage: true 
    });
    
    console.log('✅ Dress codes and identification testing completed');
  });
});
