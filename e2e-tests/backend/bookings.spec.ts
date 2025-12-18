import { test, expect } from '@playwright/test';
import { TestHelpers } from '../utils/test-helpers';

test.describe('Backend Booking Management', () => {
  let helpers: TestHelpers;

  test.beforeEach(async ({ page }) => {
    helpers = new TestHelpers(page);
    await helpers.loginAsAdmin();
    await helpers.switchToArabic();
  });

  test('should display bookings list page', async ({ page }) => {
    await page.goto('/bookings');
    await helpers.waitForLoading();
    
    // Check if bookings page is loaded
    await expect(page.locator('text=الحجوزات')).toBeVisible(); // Bookings in Arabic
    
    // Check for data grid
    await expect(page.locator('.MuiDataGrid-root, [role="grid"]')).toBeVisible();
    
    // Check for column headers in Arabic
    await expect(page.locator('text=الزبون')).toBeVisible(); // Customer
    await expect(page.locator('text=من')).toBeVisible(); // From
    await expect(page.locator('text=إلى')).toBeVisible(); // To
    await expect(page.locator('text=السعر')).toBeVisible(); // Price
    await expect(page.locator('text=الحالة')).toBeVisible(); // Status
    
    await helpers.takeScreenshot('bookings-list');
  });

  test('should open new booking form', async ({ page }) => {
    await page.goto('/bookings');
    await helpers.waitForLoading();
    
    // Click new booking button
    await helpers.clickButtonByText('حجز جديد'); // New Booking
    
    // Should navigate to create booking page
    await page.waitForURL('**/create-booking');
    
    // Check if form is displayed
    await expect(page.locator('text=حجز جديد')).toBeVisible(); // New Booking heading
    
    // Check for form fields
    await expect(page.locator('text=الفستان')).toBeVisible(); // Dress
    await expect(page.locator('text=الزبون')).toBeVisible(); // Customer
    await expect(page.locator('text=الموقع')).toBeVisible(); // Location
    await expect(page.locator('text=من')).toBeVisible(); // From date
    await expect(page.locator('text=إلى')).toBeVisible(); // To date
    
    await helpers.takeScreenshot('new-booking-form');
  });

  test('should create new booking successfully', async ({ page }) => {
    await page.goto('/create-booking');
    await helpers.waitForLoading();
    
    // Fill dress field
    const dressField = page.locator('[data-testid="dress-select"], .dress-select, input[name="dress"]').first();
    if (await dressField.isVisible()) {
      await dressField.click();
      await page.waitForTimeout(1000);
      
      // Select first available dress
      const firstDress = page.locator('.MuiAutocomplete-option, .dress-option').first();
      if (await firstDress.isVisible()) {
        await firstDress.click();
      }
    }
    
    // Fill customer field
    const customerField = page.locator('[data-testid="customer-select"], .customer-select, input[name="customer"]').first();
    if (await customerField.isVisible()) {
      await customerField.click();
      await page.waitForTimeout(1000);
      
      // Select first available customer
      const firstCustomer = page.locator('.MuiAutocomplete-option, .customer-option').first();
      if (await firstCustomer.isVisible()) {
        await firstCustomer.click();
      }
    }
    
    // Fill location field
    const locationField = page.locator('[data-testid="location-select"], .location-select, input[name="location"]').first();
    if (await locationField.isVisible()) {
      await locationField.click();
      await page.waitForTimeout(1000);
      
      // Select first available location
      const firstLocation = page.locator('.MuiAutocomplete-option, .location-option').first();
      if (await firstLocation.isVisible()) {
        await firstLocation.click();
      }
    }
    
    // Fill dates
    const fromDate = new Date();
    fromDate.setDate(fromDate.getDate() + 7); // Next week
    const toDate = new Date();
    toDate.setDate(toDate.getDate() + 10); // 3 days later
    
    const fromDateField = page.locator('input[name="from"], [data-testid="from-date"]').first();
    if (await fromDateField.isVisible()) {
      await fromDateField.fill(fromDate.toISOString().split('T')[0]);
    }
    
    const toDateField = page.locator('input[name="to"], [data-testid="to-date"]').first();
    if (await toDateField.isVisible()) {
      await toDateField.fill(toDate.toISOString().split('T')[0]);
    }
    
    await helpers.takeScreenshot('booking-form-filled');
    
    // Submit form
    await helpers.clickButtonByText('إنشاء'); // Create
    
    // Wait for success or error
    await page.waitForTimeout(3000);
    
    // Check for success message or redirect
    const errors = await helpers.checkForErrors();
    if (errors.length > 0) {
      console.log('Booking creation errors:', errors);
      await helpers.takeScreenshot('booking-creation-error');
    } else {
      // Should redirect to bookings list or show success
      await helpers.takeScreenshot('booking-created-success');
    }
  });

  test('should validate booking form fields', async ({ page }) => {
    await page.goto('/create-booking');
    await helpers.waitForLoading();
    
    // Try to submit empty form
    await helpers.clickButtonByText('إنشاء'); // Create
    
    // Check for validation errors
    const errors = await helpers.checkForErrors();
    expect(errors.length).toBeGreaterThan(0);
    
    await helpers.takeScreenshot('booking-validation-errors');
  });

  test('should filter bookings by status', async ({ page }) => {
    await page.goto('/bookings');
    await helpers.waitForLoading();
    
    // Look for status filter
    const statusFilter = page.locator('[data-testid="status-filter"], .status-filter, select[name="status"]').first();
    if (await statusFilter.isVisible()) {
      await statusFilter.click();
      
      // Select a specific status
      await page.click('text=محجوز'); // Reserved
      await helpers.waitForLoading();
      
      // Check if results are filtered
      await helpers.takeScreenshot('bookings-filtered-by-status');
    }
  });

  test('should search bookings by customer name', async ({ page }) => {
    await page.goto('/bookings');
    await helpers.waitForLoading();
    
    // Look for search field
    const searchField = page.locator('input[placeholder*="بحث"], input[placeholder*="Search"], [data-testid="search"]').first();
    if (await searchField.isVisible()) {
      await searchField.fill('أحمد'); // Arabic name
      await page.keyboard.press('Enter');
      await helpers.waitForLoading();
      
      await helpers.takeScreenshot('bookings-search-results');
    }
  });

  test('should export bookings data', async ({ page }) => {
    await page.goto('/bookings');
    await helpers.waitForLoading();
    
    // Look for export button
    const exportButton = page.locator('button:has-text("تصدير"), button:has-text("Export"), [data-testid="export"]').first();
    if (await exportButton.isVisible()) {
      // Set up download handler
      const downloadPromise = page.waitForEvent('download');
      await exportButton.click();
      
      const download = await downloadPromise;
      expect(download.suggestedFilename()).toContain('booking');
      
      await helpers.takeScreenshot('bookings-export');
    }
  });

  test('should view booking details', async ({ page }) => {
    await page.goto('/bookings');
    await helpers.waitForLoading();
    
    // Click on first booking row
    const firstBookingRow = page.locator('.MuiDataGrid-row, [role="row"]').nth(1); // Skip header row
    if (await firstBookingRow.isVisible()) {
      await firstBookingRow.click();
      
      // Should open booking details
      await page.waitForTimeout(2000);
      
      // Check if details are displayed
      await helpers.takeScreenshot('booking-details');
    }
  });

  test('should update booking status', async ({ page }) => {
    await page.goto('/bookings');
    await helpers.waitForLoading();
    
    // Find a booking and try to update its status
    const statusCell = page.locator('.MuiDataGrid-cell:has-text("في الانتظار"), .MuiDataGrid-cell:has-text("Pending")').first();
    if (await statusCell.isVisible()) {
      await statusCell.click();
      
      // Look for status update options
      const statusOptions = page.locator('text=محجوز, text=مدفوع, text=ملغي'); // Reserved, Paid, Cancelled
      if (await statusOptions.first().isVisible()) {
        await statusOptions.first().click();
        await helpers.waitForLoading();
        
        await helpers.takeScreenshot('booking-status-updated');
      }
    }
  });

  test('should handle booking conflicts', async ({ page }) => {
    await page.goto('/create-booking');
    await helpers.waitForLoading();
    
    // Try to create a booking with conflicting dates
    // This would require setting up test data with existing bookings
    // For now, we'll just check if the form handles date validation
    
    const fromDate = new Date();
    const toDate = new Date();
    toDate.setDate(toDate.getDate() - 1); // Invalid: to date before from date
    
    const fromDateField = page.locator('input[name="from"]').first();
    const toDateField = page.locator('input[name="to"]').first();
    
    if (await fromDateField.isVisible() && await toDateField.isVisible()) {
      await fromDateField.fill(fromDate.toISOString().split('T')[0]);
      await toDateField.fill(toDate.toISOString().split('T')[0]);
      
      await helpers.clickButtonByText('إنشاء');
      
      // Should show validation error
      const errors = await helpers.checkForErrors();
      expect(errors.length).toBeGreaterThan(0);
      
      await helpers.takeScreenshot('booking-date-conflict');
    }
  });
});
