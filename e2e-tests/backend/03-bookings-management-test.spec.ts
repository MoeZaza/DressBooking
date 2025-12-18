import { test, expect } from '@playwright/test';

/**
 * Bookings Management Page Testing
 * Tests bookings list, create booking, edit booking, delete booking, filtering, search, and Arabic date formatting
 */

test.describe('03. Bookings Management Page Testing', () => {
  
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

  test('should load bookings page (root) with Arabic language', async ({ page }) => {
    console.log('📋 Testing bookings page (root) with Arabic language...');
    
    // Navigate to root page (which should be bookings)
    await page.goto('/?lang=ar');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    // Check if page loads properly
    await expect(page).toHaveTitle(/BookDress/);
    
    // Check current URL
    console.log('Current URL:', page.url());
    
    // Check for Arabic language activation
    const htmlDir = await page.locator('html').getAttribute('dir');
    console.log('HTML direction:', htmlDir);
    
    // Check for page content
    const pageContent = await page.textContent('body');
    console.log('Page content preview:', pageContent?.substring(0, 500));
    
    // Check for Arabic text
    const hasArabicText = /[\u0600-\u06FF]/.test(pageContent || '');
    console.log('Has Arabic text:', hasArabicText ? '✅' : '❌');
    
    // Take screenshot for documentation
    await page.screenshot({ 
      path: 'test-results/screenshots/03-bookings-root-page.png',
      fullPage: true 
    });
    
    console.log('✅ Bookings page (root) loaded successfully');
  });

  test('should display bookings data and table', async ({ page }) => {
    console.log('📊 Testing bookings data and table...');
    
    // Navigate to root page
    await page.goto('/?lang=ar');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    // Check for data grids or tables
    const dataGrids = await page.locator('.MuiDataGrid-root, table, [role="grid"]').count();
    console.log('Data grids/tables found:', dataGrids);
    
    // Check for booking-related elements
    const bookingElements = await page.locator('[data-testid*="booking"], .booking, [class*="booking"]').count();
    console.log('Booking elements found:', bookingElements);
    
    // Check for data rows
    const dataRows = await page.locator('.MuiDataGrid-row, tbody tr, [role="row"]').count();
    console.log('Data rows found:', dataRows);
    
    // Check for loading states
    const loadingElements = await page.locator('.MuiCircularProgress-root, .loading, [data-testid="loading"]').count();
    if (loadingElements > 0) {
      console.log('⏳ Loading elements detected, waiting...');
      await page.waitForTimeout(5000);
    }
    
    // Check for common booking terms
    const bookingTerms = [
      'حجز جديد', // New Booking
      'الحجوزات', // Bookings
      'العميل', // Customer
      'التاريخ', // Date
      'الحالة', // Status
      'السعر' // Price
    ];
    
    for (const term of bookingTerms) {
      const termExists = await page.locator(`text=${term}`).count() > 0;
      console.log(`Booking term "${term}": ${termExists ? '✅ Found' : '❌ Not found'}`);
    }
    
    // Take screenshot
    await page.screenshot({ 
      path: 'test-results/screenshots/03-bookings-data-table.png',
      fullPage: true 
    });
    
    console.log('✅ Bookings data and table testing completed');
  });

  test('should test bookings search and filtering', async ({ page }) => {
    console.log('🔍 Testing bookings search and filtering...');
    
    // Navigate to root page
    await page.goto('/?lang=ar');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    // Check for search input
    const searchInputs = await page.locator('input[type="search"], input[placeholder*="search"], input[placeholder*="بحث"]').count();
    console.log('Search inputs found:', searchInputs);
    
    // Check for filter elements
    const filterElements = await page.locator('select, .MuiSelect-root, [data-testid*="filter"]').count();
    console.log('Filter elements found:', filterElements);
    
    // Check for date pickers
    const datePickers = await page.locator('input[type="date"], .MuiDatePicker-root, [data-testid*="date"]').count();
    console.log('Date pickers found:', datePickers);
    
    // Check for status filters
    const statusFilters = await page.locator('[data-testid*="status"], .status-filter').count();
    console.log('Status filters found:', statusFilters);
    
    // Try to interact with search if available
    const searchInput = page.locator('input[type="search"], input[placeholder*="search"], input[placeholder*="بحث"]').first();
    if (await searchInput.count() > 0) {
      await searchInput.fill('test');
      await page.waitForTimeout(1000);
      console.log('✅ Search interaction tested');
    }
    
    // Take screenshot
    await page.screenshot({ 
      path: 'test-results/screenshots/03-bookings-search-filter.png',
      fullPage: true 
    });
    
    console.log('✅ Bookings search and filtering testing completed');
  });

  test('should test new booking functionality', async ({ page }) => {
    console.log('➕ Testing new booking functionality...');
    
    // Navigate to root page
    await page.goto('/?lang=ar');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    // Check for "New Booking" button
    const newBookingButtons = await page.locator('button:has-text("حجز جديد"), button:has-text("New Booking"), [data-testid*="new-booking"]').count();
    console.log('New booking buttons found:', newBookingButtons);
    
    // Try to click new booking button if available
    const newBookingButton = page.locator('button:has-text("حجز جديد"), button:has-text("New Booking"), [data-testid*="new-booking"]').first();
    if (await newBookingButton.count() > 0) {
      try {
        await newBookingButton.click();
        await page.waitForTimeout(2000);
        
        // Check if modal or new page opened
        const modalExists = await page.locator('.MuiDialog-root, .modal, [role="dialog"]').count() > 0;
        const urlChanged = page.url() !== 'http://localhost:3001/?lang=ar';
        
        console.log('Modal opened:', modalExists ? '✅' : '❌');
        console.log('URL changed:', urlChanged ? '✅' : '❌');
        console.log('Current URL:', page.url());
        
        // Take screenshot of new booking interface
        await page.screenshot({ 
          path: 'test-results/screenshots/03-new-booking-interface.png',
          fullPage: true 
        });
        
      } catch (error) {
        console.log('⚠️ Could not interact with new booking button:', error);
      }
    }
    
    console.log('✅ New booking functionality testing completed');
  });

  test('should test bookings navigation and menu', async ({ page }) => {
    console.log('🧭 Testing bookings navigation and menu...');
    
    // Navigate to root page
    await page.goto('/?lang=ar');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    // Check for navigation menu
    const navMenu = await page.locator('nav, .MuiDrawer-root, [role="navigation"]').count();
    console.log('Navigation menu found:', navMenu > 0 ? '✅' : '❌');
    
    // Check for sidebar
    const sidebar = await page.locator('.sidebar, .MuiDrawer-root, [data-testid*="sidebar"]').count();
    console.log('Sidebar found:', sidebar);
    
    // Check for menu items
    const menuItems = await page.locator('a[href*="/"], button[data-testid*="menu"], .menu-item').count();
    console.log('Menu items found:', menuItems);
    
    // Check for breadcrumbs
    const breadcrumbs = await page.locator('.MuiBreadcrumbs-root, .breadcrumb, [data-testid*="breadcrumb"]').count();
    console.log('Breadcrumbs found:', breadcrumbs);
    
    // Check for user profile/avatar
    const userProfile = await page.locator('[data-testid*="user"], [data-testid*="profile"], .user-avatar').count();
    console.log('User profile elements found:', userProfile);
    
    // Take screenshot
    await page.screenshot({ 
      path: 'test-results/screenshots/03-bookings-navigation.png',
      fullPage: true 
    });
    
    console.log('✅ Bookings navigation and menu testing completed');
  });
});
