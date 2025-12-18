import { test, expect } from '@playwright/test';

test.describe('Debug Suppliers Page', () => {
  test('should debug suppliers page and API calls', async ({ page }) => {
    // Login first
    await page.goto('/sign-in?lang=ar');
    await page.waitForLoadState('networkidle');
    await page.waitForSelector('form', { timeout: 10000 });
    
    await page.fill('input[name="email"]', 'admin@bookdress.com');
    await page.fill('input[name="password"]', 'admin123');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(3000);

    console.log('🔍 Debugging Suppliers Page Issue');

    // Listen for network requests
    const apiCalls = [];
    page.on('response', response => {
      if (response.url().includes('/api/suppliers')) {
        apiCalls.push({
          url: response.url(),
          status: response.status(),
          statusText: response.statusText()
        });
      }
    });

    // Go to suppliers page
    await page.goto('/suppliers?lang=ar');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    console.log('API calls made:', apiCalls);

    const pageContent = await page.textContent('body');
    console.log('Suppliers page content:', pageContent?.substring(0, 500));

    // Check if page shows "Nothing here" message
    const hasNothingHere = pageContent?.includes('لا يوجد شيء هنا') || pageContent?.includes('Nothing here');
    console.log('Shows "Nothing here" message:', hasNothingHere);

    // Check if page shows empty list message
    const hasEmptyList = pageContent?.includes('لا توجد موردين') || pageContent?.includes('No suppliers');
    console.log('Shows empty list message:', hasEmptyList);

    // Check for search box
    const searchBox = page.locator('input[type="search"], input[placeholder*="search"], input[placeholder*="بحث"]');
    const searchBoxCount = await searchBox.count();
    console.log('Search boxes found:', searchBoxCount);

    // Check for "New Supplier" button
    const newSupplierButton = page.locator('button:has-text("مورد جديد"), button:has-text("New Supplier")');
    const newSupplierButtonCount = await newSupplierButton.count();
    console.log('New supplier buttons found:', newSupplierButtonCount);

    // Check for supplier list container
    const supplierList = page.locator('.supplier-list, .suppliers');
    const supplierListCount = await supplierList.count();
    console.log('Supplier list containers found:', supplierListCount);

    // Check for individual supplier items
    const supplierItems = page.locator('.supplier-item, .supplier');
    const supplierItemCount = await supplierItems.count();
    console.log('Supplier items found:', supplierItemCount);

    // Check for loading indicators
    const loadingIndicators = page.locator('.loading, .spinner, [role="progressbar"]');
    const loadingIndicatorCount = await loadingIndicators.count();
    console.log('Loading indicators found:', loadingIndicatorCount);

    // Check for error messages
    const errorMessages = page.locator('.error, .alert-error, .MuiAlert-error');
    const errorMessageCount = await errorMessages.count();
    console.log('Error messages found:', errorMessageCount);

    if (errorMessageCount > 0) {
      const errorText = await errorMessages.first().textContent();
      console.log('Error message text:', errorText);
    }

    // Try to make API call from browser context
    const apiResult = await page.evaluate(async () => {
      try {
        const response = await fetch('/api/suppliers/1/10/?s=', {
          method: 'GET',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json'
          }
        });

        if (response.ok) {
          const data = await response.json();
          return { 
            success: true, 
            status: response.status,
            data: data,
            dataLength: Array.isArray(data) ? data.length : 'not array',
            firstItem: Array.isArray(data) && data.length > 0 ? data[0] : null
          };
        } else {
          const errorText = await response.text();
          return { 
            success: false, 
            status: response.status,
            error: errorText.substring(0, 200)
          };
        }
      } catch (error) {
        return { 
          success: false, 
          error: (error as Error).message 
        };
      }
    });

    console.log('Direct API call result:', apiResult);

    // Check if we can access create supplier page
    if (newSupplierButtonCount > 0) {
      console.log('Testing create supplier navigation...');
      await newSupplierButton.first().click();
      await page.waitForTimeout(2000);

      const createSupplierContent = await page.textContent('body');
      const isCreateSupplierPage = createSupplierContent?.includes('Create') || 
                                  createSupplierContent?.includes('إنشاء') ||
                                  createSupplierContent?.includes('مورد جديد');

      console.log('Create supplier page accessible:', isCreateSupplierPage);

      // Go back to suppliers page
      await page.goto('/suppliers?lang=ar');
      await page.waitForTimeout(2000);
    }

    // Check if there are any users with supplier type in the system
    const usersApiResult = await page.evaluate(async () => {
      try {
        const response = await fetch('/api/users/1/50/ar', {
          method: 'GET',
          credentials: 'include'
        });

        if (response.ok) {
          const data = await response.json();
          const users = data?.resultData || data || [];
          const suppliers = users.filter((user: any) => user.type === 'supplier');
          
          return { 
            success: true,
            totalUsers: users.length,
            supplierUsers: suppliers.length,
            firstSupplier: suppliers.length > 0 ? suppliers[0] : null
          };
        } else {
          return { success: false, status: response.status };
        }
      } catch (error) {
        return { success: false, error: (error as Error).message };
      }
    });

    console.log('Users API result (checking for suppliers):', usersApiResult);

    // Test should pass regardless
    expect(pageContent?.length).toBeGreaterThan(50);
  });

  test('should test suppliers page with different approaches', async ({ page }) => {
    // Login first
    await page.goto('/sign-in?lang=ar');
    await page.waitForLoadState('networkidle');
    await page.waitForSelector('form', { timeout: 10000 });
    
    await page.fill('input[name="email"]', 'admin@bookdress.com');
    await page.fill('input[name="password"]', 'admin123');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(3000);

    console.log('🔍 Testing Suppliers Page with Different Approaches');

    // Approach 1: Direct navigation
    console.log('Approach 1: Direct navigation to /suppliers');
    await page.goto('/suppliers?lang=ar');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    let pageContent = await page.textContent('body');
    console.log('Direct navigation result:', pageContent?.includes('لا يوجد شيء هنا') ? 'Nothing here' : 'Content loaded');

    // Approach 2: Navigation from menu
    console.log('Approach 2: Navigation from dashboard');
    await page.goto('/dashboard?lang=ar');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Look for suppliers link in navigation
    const suppliersLinks = page.locator('a[href*="suppliers"], a:has-text("مورد"), a:has-text("Supplier")');
    const suppliersLinkCount = await suppliersLinks.count();
    console.log('Suppliers links found in navigation:', suppliersLinkCount);

    if (suppliersLinkCount > 0) {
      await suppliersLinks.first().click();
      await page.waitForTimeout(3000);

      pageContent = await page.textContent('body');
      console.log('Navigation from menu result:', pageContent?.includes('لا يوجد شيء هنا') ? 'Nothing here' : 'Content loaded');
    }

    // Approach 3: Check if suppliers page is in the routing
    console.log('Approach 3: Testing different supplier routes');
    const supplierRoutes = [
      '/suppliers',
      '/supplier',
      '/suppliers-list',
      '/all-suppliers'
    ];

    for (const route of supplierRoutes) {
      await page.goto(`${route}?lang=ar`);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1000);

      const routeContent = await page.textContent('body');
      const isWorking = !routeContent?.includes('لا يوجد شيء هنا') && 
                       !routeContent?.includes('Nothing here') &&
                       routeContent && routeContent.length > 300;

      console.log(`Route ${route}: ${isWorking ? 'Working' : 'Not working'}`);
    }

    // Test should pass
    expect(true).toBe(true);
  });
});
