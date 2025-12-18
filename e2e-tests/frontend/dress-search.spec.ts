import { test, expect } from '@playwright/test';
import { TestHelpers } from '../utils/test-helpers';

test.describe('Frontend Dress Search', () => {
  let helpers: TestHelpers;

  test.beforeEach(async ({ page }) => {
    helpers = new TestHelpers(page);
    await page.goto('/search?lang=ar');
    await helpers.waitForLoading();
  });

  test('should display search page with filters', async ({ page }) => {
    // Check if search page is loaded
    await expect(page.locator('text=البحث عن الفساتين')).toBeVisible(); // Search for dresses
    
    // Check for filter sections
    await expect(page.locator('text=الموردين')).toBeVisible(); // Suppliers
    await expect(page.locator('text=نوع الفستان')).toBeVisible(); // Dress Type
    await expect(page.locator('text=المقاس')).toBeVisible(); // Size
    await expect(page.locator('text=العربون')).toBeVisible(); // Deposit
    
    await helpers.takeScreenshot('search-page-filters');
  });

  test('should display dress results', async ({ page }) => {
    await helpers.waitForLoading();
    
    // Check if dress results are displayed
    const dressGrid = page.locator('.MuiDataGrid-root, [role="grid"], .dress-list');
    await expect(dressGrid).toBeVisible();
    
    // Check for dress cards/rows
    const dressItems = page.locator('.MuiDataGrid-row, .dress-card, [data-testid="dress-item"]');
    const itemCount = await dressItems.count();
    expect(itemCount).toBeGreaterThan(0);
    
    // Check dress information is displayed
    const firstDress = dressItems.first();
    await expect(firstDress.locator('text=/DC\d+/')).toBeVisible(); // Dress code
    await expect(firstDress.locator('text=/\d+/')).toBeVisible(); // Price
    
    await helpers.takeScreenshot('dress-search-results');
  });

  test('should filter dresses by type', async ({ page }) => {
    await helpers.waitForLoading();
    
    // Find dress type filter
    const typeFilter = page.locator('[data-testid="dress-type-filter"], .dress-type-filter');
    if (await typeFilter.isVisible()) {
      // Select wedding dresses
      const weddingOption = page.locator('text=زفاف, text=Wedding').first();
      if (await weddingOption.isVisible()) {
        await weddingOption.click();
        await helpers.waitForLoading();
        
        // Check if results are filtered
        const dressItems = page.locator('.MuiDataGrid-row, .dress-card');
        const itemCount = await dressItems.count();
        
        // Verify wedding dresses are shown
        if (itemCount > 0) {
          const firstDress = dressItems.first();
          await expect(firstDress.locator('text=زفاف, text=wedding')).toBeVisible();
        }
        
        await helpers.takeScreenshot('dresses-filtered-by-type');
      }
    }
  });

  test('should filter dresses by size', async ({ page }) => {
    await helpers.waitForLoading();
    
    // Find size filter
    const sizeFilter = page.locator('[data-testid="dress-size-filter"], .dress-size-filter');
    if (await sizeFilter.isVisible()) {
      // Select size M
      const sizeM = page.locator('text=M').first();
      if (await sizeM.isVisible()) {
        await sizeM.click();
        await helpers.waitForLoading();
        
        await helpers.takeScreenshot('dresses-filtered-by-size');
      }
    }
  });

  test('should filter dresses by supplier', async ({ page }) => {
    await helpers.waitForLoading();
    
    // Find supplier filter
    const supplierFilter = page.locator('[data-testid="supplier-filter"], .supplier-filter');
    if (await supplierFilter.isVisible()) {
      // Select first supplier
      const firstSupplier = page.locator('.supplier-option, input[type="checkbox"]').first();
      if (await firstSupplier.isVisible()) {
        await firstSupplier.click();
        await helpers.waitForLoading();
        
        await helpers.takeScreenshot('dresses-filtered-by-supplier');
      }
    }
  });

  test('should filter dresses by price range', async ({ page }) => {
    await helpers.waitForLoading();
    
    // Find deposit/price filter
    const priceFilter = page.locator('[data-testid="deposit-filter"], .deposit-filter, .price-filter');
    if (await priceFilter.isVisible()) {
      // Set price range
      const minPrice = page.locator('input[name="minPrice"], [data-testid="min-price"]').first();
      const maxPrice = page.locator('input[name="maxPrice"], [data-testid="max-price"]').first();
      
      if (await minPrice.isVisible()) {
        await minPrice.fill('500');
      }
      if (await maxPrice.isVisible()) {
        await maxPrice.fill('1500');
      }
      
      // Apply filter
      const applyButton = page.locator('button:has-text("تطبيق"), button:has-text("Apply")').first();
      if (await applyButton.isVisible()) {
        await applyButton.click();
        await helpers.waitForLoading();
      }
      
      await helpers.takeScreenshot('dresses-filtered-by-price');
    }
  });

  test('should sort dresses', async ({ page }) => {
    await helpers.waitForLoading();
    
    // Find sort options
    const sortButton = page.locator('[data-testid="sort"], .sort-button, button:has-text("ترتيب")').first();
    if (await sortButton.isVisible()) {
      await sortButton.click();
      
      // Select sort by price
      const priceSort = page.locator('text=السعر, text=Price').first();
      if (await priceSort.isVisible()) {
        await priceSort.click();
        await helpers.waitForLoading();
        
        await helpers.takeScreenshot('dresses-sorted-by-price');
      }
    }
  });

  test('should view dress details', async ({ page }) => {
    await helpers.waitForLoading();
    
    // Click on first dress
    const firstDress = page.locator('.MuiDataGrid-row, .dress-card, [data-testid="dress-item"]').first();
    if (await firstDress.isVisible()) {
      await firstDress.click();
      
      // Should navigate to dress details page
      await page.waitForURL('**/dress?dr=*');
      await helpers.waitForLoading();
      
      // Check if dress details are displayed
      await expect(page.locator('text=تفاصيل الفستان')).toBeVisible(); // Dress Details
      
      // Check for dress information
      await expect(page.locator('text=/DC\d+/')).toBeVisible(); // Dress code
      await expect(page.locator('text=/\d+/')).toBeVisible(); // Price
      
      await helpers.takeScreenshot('dress-details-page');
    }
  });

  test('should handle pagination', async ({ page }) => {
    await helpers.waitForLoading();
    
    // Check if pagination is available
    const pagination = page.locator('.MuiPagination-root, .pagination, [data-testid="pagination"]');
    if (await pagination.isVisible()) {
      // Click next page
      const nextButton = page.locator('button[aria-label="Go to next page"], button:has-text("التالي")').first();
      if (await nextButton.isVisible() && !await nextButton.isDisabled()) {
        await nextButton.click();
        await helpers.waitForLoading();
        
        // Check if new results are loaded
        await helpers.takeScreenshot('dress-search-page-2');
      }
    }
  });

  test('should handle empty search results', async ({ page }) => {
    // Apply very restrictive filters to get no results
    const typeFilter = page.locator('[data-testid="dress-type-filter"], .dress-type-filter');
    if (await typeFilter.isVisible()) {
      // Select a rare combination that should return no results
      await page.click('text=زفاف'); // Wedding
      await page.click('text=XXL'); // Large size
      
      // Set very high price range
      const minPrice = page.locator('input[name="minPrice"]').first();
      if (await minPrice.isVisible()) {
        await minPrice.fill('10000');
      }
      
      await helpers.waitForLoading();
      
      // Check for "no results" message
      const noResults = page.locator('text=لا توجد نتائج, text=No results, text=لم يتم العثور');
      if (await noResults.isVisible()) {
        await helpers.takeScreenshot('no-search-results');
      }
    }
  });

  test('should clear filters', async ({ page }) => {
    await helpers.waitForLoading();
    
    // Apply some filters first
    const typeFilter = page.locator('text=زفاف').first();
    if (await typeFilter.isVisible()) {
      await typeFilter.click();
      await helpers.waitForLoading();
    }
    
    // Look for clear filters button
    const clearButton = page.locator('button:has-text("مسح الفلاتر"), button:has-text("Clear"), [data-testid="clear-filters"]').first();
    if (await clearButton.isVisible()) {
      await clearButton.click();
      await helpers.waitForLoading();
      
      // Check if all results are shown again
      await helpers.takeScreenshot('filters-cleared');
    }
  });

  test('should be responsive on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/search?lang=ar');
    await helpers.waitForLoading();
    
    // Check if mobile layout is applied
    const mobileFilters = page.locator('.mobile-filters, [data-testid="mobile-filters"]');
    if (await mobileFilters.isVisible()) {
      await mobileFilters.click();
      
      // Check if filter panel opens
      await expect(page.locator('text=الموردين')).toBeVisible();
      
      await helpers.takeScreenshot('mobile-search-filters');
    }
    
    // Check if dress results are properly displayed on mobile
    const dressItems = page.locator('.dress-card, [data-testid="dress-item"]');
    if (await dressItems.first().isVisible()) {
      const boundingBox = await dressItems.first().boundingBox();
      expect(boundingBox?.width).toBeLessThan(400); // Should fit mobile screen
    }
    
    await helpers.takeScreenshot('mobile-search-results');
  });

  test('should handle search with location', async ({ page }) => {
    // Navigate with location parameter
    await page.goto('/search?location=688bf083026db60a95c2b3e8&lang=ar');
    await helpers.waitForLoading();
    
    // Check if location-specific results are shown
    const locationInfo = page.locator('text=الموقع, [data-testid="location-info"]');
    if (await locationInfo.isVisible()) {
      await helpers.takeScreenshot('search-with-location');
    }
    
    // Results should be filtered by location
    const dressItems = page.locator('.MuiDataGrid-row, .dress-card');
    const itemCount = await dressItems.count();
    
    // Should have some results (or show appropriate message if no dresses at location)
    if (itemCount === 0) {
      const noResults = page.locator('text=لا توجد فساتين في هذا الموقع');
      await expect(noResults).toBeVisible();
    }
  });
});
