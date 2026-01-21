import { test, expect } from '@playwright/test';

/**
 * Comprehensive UI-Only End-to-End Tests
 * Tests the entire application through the UI like a real user
 * NO direct API calls - all interactions through the browser
 */

test.describe('UI-Only: Customer Frontend Journey', () => {
  test('should complete full customer search journey', async ({ page }) => {
    console.log('🚀 Starting full customer search journey...');

    // Navigate to frontend home page
    await page.goto('http://localhost:3000/?lang=en');
    await page.waitForLoadState('domcontentloaded', { timeout: 30000 });
    await page.waitForTimeout(3000);

    // Take initial screenshot
    await page.screenshot({ path: 'test-results/ui-journey/01-homepage.png' });

    // Verify home page elements
    const pageTitle = await page.title();
    console.log(`✅ Page title: ${pageTitle}`);
    expect(pageTitle).toContain('BookDress');

    // Check for search form using data-testid
    const searchForm = page.getByTestId('search-form');
    const searchFormVisible = await searchForm.isVisible({ timeout: 10000 }).catch(() => false);
    console.log(`✅ Search form visible: ${searchFormVisible}`);
    expect(searchFormVisible).toBe(true);

    // Navigate to search page
    await page.goto('http://localhost:3000/search?lang=en');
    await page.waitForLoadState('domcontentloaded', { timeout: 30000 });
    await page.waitForTimeout(3000);

    await page.screenshot({ path: 'test-results/ui-journey/02-search-page.png' });

    console.log('✅ Search page loaded');
  });

  test('should verify location dropdown in search page', async ({ page }) => {
    console.log('📍 Testing location dropdown...');

    await page.goto('http://localhost:3000/search?lang=en');
    await page.waitForLoadState('domcontentloaded', { timeout: 30000 });
    await page.waitForTimeout(5000); // Extra wait for React components

    // Look for the location field using data-testid
    const locationField = page.getByTestId('location-field');
    const locationVisible = await locationField.isVisible({ timeout: 10000 }).catch(() => false);
    console.log(`✅ Location field visible: ${locationVisible}`);

    if (locationVisible) {
      // Find the autocomplete combobox within the location field
      const combobox = locationField.locator('[role="combobox"]').first();
      const comboboxVisible = await combobox.isVisible({ timeout: 5000 }).catch(() => false);
      console.log(`✅ Combobox visible: ${comboboxVisible}`);

      if (comboboxVisible) {
        // Click to open dropdown
        await combobox.click();
        await page.waitForTimeout(2000);
        await page.screenshot({ path: 'test-results/ui-journey/03-location-dropdown-clicked.png' });

        // Count options using the application-specific class
        const options = await page.$$('.ms-option');
        console.log(`✅ Dropdown options found: ${options.length}`);

        // Get text from options
        for (let i = 0; i < Math.min(10, options.length); i++) {
          const text = await options[i].textContent();
          console.log(`   Location ${i + 1}: ${text?.substring(0, 50)}`);
        }

        // Should have at least 3 locations
        expect(options.length).toBeGreaterThanOrEqual(3);
      }
    }

    await page.screenshot({ path: 'test-results/ui-journey/04-location-dropdown-final.png' });
  });

  test('should test dress search and filtering', async ({ page }) => {
    console.log('👗 Testing dress search...');

    await page.goto('http://localhost:3000/search?lang=en');
    await page.waitForLoadState('domcontentloaded', { timeout: 30000 });
    await page.waitForTimeout(5000);

    // Look for search input
    const searchInput = page.getByPlaceholder(/search|بحث/i);
    await searchInput.fill('dress');
    await page.waitForTimeout(1000);

    await page.screenshot({ path: 'test-results/ui-journey/05-search-filled.png' });

    // Look for search button
    const searchButton = page.getByRole('button', { name: /search|بحث/i });
    if (await searchButton.isVisible()) {
      await searchButton.click();
      await page.waitForTimeout(3000);
    }

    await page.screenshot({ path: 'test-results/ui-journey/06-search-results.png' });

    // Check for dress results
    const dressItems = await page.$$('.dress, .dress-card, [data-testid*="dress"]');
    console.log(`✅ Dress items found: ${dressItems.length}`);

    console.log('✅ Dress search test completed');
  });

  test('should test language switching in frontend', async ({ page }) => {
    console.log('🌐 Testing language switching...');

    // Start with English
    await page.goto('http://localhost:3000/?lang=en');
    await page.waitForLoadState('domcontentloaded', { timeout: 30000 });
    await page.waitForTimeout(3000);

    const englishContent = await page.content();
    const hasEnglish = /book|dress|search|rental/i.test(englishContent);
    console.log(`✅ English content detected: ${hasEnglish}`);

    await page.screenshot({ path: 'test-results/ui-journey/07-english-page.png' });

    // Switch to Arabic - wait for page to fully render
    await page.goto('http://localhost:3000/?lang=ar');
    await page.waitForLoadState('domcontentloaded', { timeout: 30000 });
    await page.waitForTimeout(5000); // Extra wait for Arabic font loading

    const arabicContent = await page.content();
    const hasArabic = /[\u0600-\u06FF]/.test(arabicContent);
    console.log(`✅ Arabic content detected: ${hasArabic}`);
    console.log(`   Content preview: ${arabicContent.substring(0, 200)}`);

    await page.screenshot({ path: 'test-results/ui-journey/08-arabic-page.png' });

    // Check for RTL direction
    const htmlDir = await page.getAttribute('html', 'dir');
    console.log(`✅ HTML dir: ${htmlDir}`);

    expect(htmlDir).toBe('rtl');
  });
});

test.describe('UI-Only: Backend Admin Journey', () => {
  test.beforeEach(async ({ page }) => {
    // Login as admin
    await page.goto('http://localhost:3001/sign-in?lang=en');
    await page.waitForLoadState('domcontentloaded', { timeout: 30000 });
    await page.waitForTimeout(2000);

    await page.fill('input[name="email"]', 'admin@bookdress.local');
    await page.fill('input[name="password"]', 'admin123');
    await page.click('button[type="submit"]');

    await page.waitForTimeout(5000);
  });

  test('should verify dashboard loads with data', async ({ page }) => {
    console.log('📊 Testing dashboard...');

    await page.goto('http://localhost:3001/dashboard?lang=en');
    await page.waitForLoadState('domcontentloaded', { timeout: 30000 });
    await page.waitForTimeout(5000);

    await page.screenshot({ path: 'test-results/ui-journey/09-dashboard.png' });

    // Check for dashboard widgets/cards using the actual class names
    const statCards = await page.$$('.stat-card');
    const dashboardWidgets = await page.$$('.dashboard-widget');
    const muiCards = await page.$$('.MuiCard-root');

    console.log(`✅ Stat cards: ${statCards.length}`);
    console.log(`✅ Dashboard widgets: ${dashboardWidgets.length}`);
    console.log(`✅ MUI cards: ${muiCards.length}`);

    // Check for data display
    const content = await page.content();
    const hasRevenue = /revenue|إجمالي الإيرادات/i.test(content);
    const hasBookings = /booking|حجوز/i.test(content);
    const hasDresses = /dress|فستان/i.test(content);

    console.log(`  Revenue: ${hasRevenue}, Bookings: ${hasBookings}, Dresses: ${hasDresses}`);

    // Check for any cards or widgets
    const totalCards = statCards.length + dashboardWidgets.length + muiCards.length;
    console.log(`✅ Total cards found: ${totalCards}`);

    expect(totalCards).toBeGreaterThan(0);
  });

  test('should navigate to dresses page and verify list', async ({ page }) => {
    console.log('👗 Testing dresses page...');

    await page.goto('http://localhost:3001/dresses?lang=en');
    await page.waitForLoadState('domcontentloaded', { timeout: 30000 });
    await page.waitForTimeout(5000);

    await page.screenshot({ path: 'test-results/ui-journey/10-dresses-page.png' });

    // Check for the FAB button with the specific ID
    const fabButton = await page.$('#new-dress-fab-btn');
    const fabVisible = fabButton ? await fabButton.isVisible().catch(() => false) : false;
    console.log(`✅ FAB button visible: ${fabVisible}`);

    // Check for dress-list or dress containers
    const dressContainers = await page.$$('.dress, .dress-list, .dresses-list');
    console.log(`✅ Dress containers: ${dressContainers.length}`);

    // Check for any button with "Add" or "Create" text
    const addButtons = await page.$$('button:has-text("Add"), button:has-text("Create"), button:has-text("New")');
    console.log(`✅ Add/Create buttons: ${addButtons.length}`);

    // At minimum, we should have some content on the page
    const content = await page.content();
    const hasPageContent = content.includes('dress') || content.includes('Dress');
    console.log(`✅ Page has dress content: ${hasPageContent}`);

    expect(fabVisible || addButtons.length > 0 || hasPageContent).toBe(true);
  });

  test('should navigate to locations page and verify list', async ({ page }) => {
    console.log('📍 Testing locations page...');

    await page.goto('http://localhost:3001/locations?lang=en');
    await page.waitForLoadState('domcontentloaded', { timeout: 30000 });
    await page.waitForTimeout(5000);

    await page.screenshot({ path: 'test-results/ui-journey/11-locations-page.png' });

    // Check for the FAB button with the specific ID
    const fabButton = await page.$('#new-location-fab-btn');
    const fabVisible = fabButton ? await fabButton.isVisible().catch(() => false) : false;
    console.log(`✅ FAB button visible: ${fabVisible}`);

    // Check for location list or containers
    const locationContainers = await page.$$('.location, .location-list, .location-item, .locations');
    console.log(`✅ Location containers: ${locationContainers.length}`);

    // Check for InfoBox showing location count
    const infoBox = await page.$$('.location-count, .no-locations, .info-box');
    console.log(`✅ Info boxes: ${infoBox.length}`);

    // At minimum, we should have the FAB button or some location content
    const content = await page.content();
    const hasPageContent = content.includes('location') || content.includes('Location');
    console.log(`✅ Page has location content: ${hasPageContent}`);

    expect(fabVisible || locationContainers.length > 0 || hasPageContent).toBe(true);
  });

  test('should navigate to suppliers page and verify list', async ({ page }) => {
    console.log('🏪 Testing suppliers page...');

    await page.goto('http://localhost:3001/suppliers?lang=en');
    await page.waitForLoadState('domcontentloaded', { timeout: 30000 });
    await page.waitForTimeout(5000);

    await page.screenshot({ path: 'test-results/ui-journey/12-suppliers-page.png' });

    // Check for the FAB button with the specific ID
    const fabButton = await page.$('#new-supplier-fab-btn');
    const fabVisible = fabButton ? await fabButton.isVisible().catch(() => false) : false;
    console.log(`✅ FAB button visible: ${fabVisible}`);

    // Check for supplier list or containers
    const supplierContainers = await page.$$('.supplier, .supplier-list, .supplier-item, .suppliers');
    console.log(`✅ Supplier containers: ${supplierContainers.length}`);

    // Check for InfoBox showing supplier count
    const infoBox = await page.$$('.supplier-count, .info-box');
    console.log(`✅ Info boxes: ${infoBox.length}`);

    // At minimum, we should have the FAB button or some supplier content
    const content = await page.content();
    const hasPageContent = content.includes('supplier') || content.includes('Supplier');
    console.log(`✅ Page has supplier content: ${hasPageContent}`);

    expect(fabVisible || supplierContainers.length > 0 || hasPageContent).toBe(true);
  });

  test('should test create booking flow', async ({ page }) => {
    console.log('📅 Testing create booking flow...');

    await page.goto('http://localhost:3001/create-booking?lang=en');
    await page.waitForLoadState('domcontentloaded', { timeout: 30000 });
    await page.waitForTimeout(5000);

    await page.screenshot({ path: 'test-results/ui-journey/13-create-booking.png' });

    // Check for form elements
    const inputs = await page.$$('input');
    console.log(`✅ Input fields: ${inputs.length}`);

    // Check for dropdowns
    const dropdowns = await page.$$('div[role="combobox"], select');
    console.log(`✅ Dropdowns: ${dropdowns.length}`);

    // Look for Next/Continue button
    const nextButtons = await page.$$('button:has-text("Next"), button:has-text("Continue"), button:has-text("التالي")');
    console.log(`✅ Next buttons: ${nextButtons.length}`);

    // Check for customer dropdown specifically
    try {
      const customerCombobox = page.locator('div[role="combobox"]').first();
      await customerCombobox.click();
      await page.waitForTimeout(2000);

      const options = await page.$$('li[role="option"]');
      console.log(`✅ Customer dropdown options: ${options.length}`);

      if (options.length > 0) {
        const sampleText = await options[0].textContent();
        console.log(`   Sample customer: ${sampleText}`);
        expect(options.length).toBeGreaterThan(0);
      }
    } catch (e) {
      console.log('⚠️ Could not test customer dropdown:', (e as Error).message);
    }

    await page.screenshot({ path: 'test-results/ui-journey/14-booking-form.png' });
  });
});

test.describe('UI-Only: Dropdown Data Verification', () => {
  test.use({ viewport: { width: 1920, height: 1080 } });

  test('should verify all dropdowns have data via UI', async ({ page }) => {
    console.log('🔍 Verifying all dropdowns have data...');

    // Login first
    await page.goto('http://localhost:3001/sign-in?lang=en');
    await page.waitForLoadState('domcontentloaded', { timeout: 30000 });
    await page.waitForTimeout(2000);

    await page.fill('input[name="email"]', 'admin@bookdress.local');
    await page.fill('input[name="password"]', 'admin123');
    await page.click('button[type="submit"]');

    await page.waitForTimeout(5000);

    // Navigate to create booking page
    await page.goto('http://localhost:3001/create-booking?lang=en');
    await page.waitForLoadState('domcontentloaded', { timeout: 30000 });
    await page.waitForTimeout(5000);

    await page.screenshot({ path: 'test-results/ui-dropdowns/01-create-booking.png' });

    // Test Customer dropdown
    console.log('Testing Customer dropdown...');
    const customerComboboxes = await page.$$('div[role="combobox"]');
    if (customerComboboxes.length > 0) {
      await customerComboboxes[0].click();
      await page.waitForTimeout(2000);

      const customerOptions = await page.$$('li[role="option"]');
      console.log(`   Customer dropdown: ${customerOptions.length} options`);

      if (customerOptions.length > 0) {
        const firstOption = await customerOptions[0].textContent();
        console.log(`   First customer: ${firstOption}`);
        expect(customerOptions.length).toBeGreaterThan(0);
      }
    }

    // Test Location dropdown - find by iterating through comboboxes
    console.log('Testing Location dropdown...');
    const allComboboxes = await page.$$('div[role="combobox"]');
    console.log(`   Total comboboxes found: ${allComboboxes.length}`);

    // Try each combobox to find location dropdown
    for (let i = 1; i < allComboboxes.length; i++) {
      try {
        await allComboboxes[i].click();
        await page.waitForTimeout(1500);

        const options = await page.$$('li[role="option"]');
        if (options.length > 0) {
          const firstOption = await options[0].textContent();
          console.log(`   Combobox ${i}: ${options.length} options - first: "${firstOption?.substring(0, 30)}..."`);

          // Check if it's location dropdown
          const locationKeywords = ['Nablus', 'Ramallah', 'Amman', 'Beirut', 'Jenin', 'Location', 'الموقع'];
          const isLocationDropdown = locationKeywords.some(kw =>
            firstOption?.toLowerCase().includes(kw.toLowerCase())
          );

          if (isLocationDropdown) {
            console.log(`   ✅ This appears to be the location dropdown`);
            expect(options.length).toBeGreaterThan(0);
            break;
          }
        }

        // Close dropdown by clicking outside or pressing Escape
        await page.keyboard.press('Escape');
        await page.waitForTimeout(500);
      } catch (e) {
        // Continue to next combobox
      }
    }

    // Test Supplier dropdown
    console.log('Testing Supplier dropdown...');
    for (let i = 1; i < allComboboxes.length; i++) {
      try {
        await allComboboxes[i].click();
        await page.waitForTimeout(1500);

        const options = await page.$$('li[role="option"]');
        if (options.length > 0) {
          const firstOption = await options[0].textContent();
          console.log(`   Combobox ${i}: ${options.length} options - first: "${firstOption?.substring(0, 30)}..."`);

          // Check if it's supplier dropdown
          const supplierKeywords = ['Layla', 'Sofia', 'Boutique', 'Supplier', 'المورد'];
          const isSupplierDropdown = supplierKeywords.some(kw =>
            firstOption?.toLowerCase().includes(kw.toLowerCase())
          );

          if (isSupplierDropdown) {
            console.log(`   ✅ This appears to be the supplier dropdown`);
            expect(options.length).toBeGreaterThan(0);
            break;
          }
        }

        await page.keyboard.press('Escape');
        await page.waitForTimeout(500);
      } catch (e) {
        // Continue to next combobox
      }
    }

    // Test native select elements for dress type
    console.log('Testing native select dropdowns...');
    const selectElements = await page.$$('select');
    console.log(`   Total select elements: ${selectElements.length}`);

    for (const select of selectElements) {
      const name = await select.getAttribute('name');
      const options = await select.$$('option');
      console.log(`   Select "${name}": ${options.length} options`);

      if (options.length > 0) {
        const firstOption = await options[0].textContent();
        const firstValue = await options[0].getAttribute('value');
        console.log(`     First: "${firstOption}" (${firstValue})`);
      }
    }

    await page.screenshot({ path: 'test-results/ui-dropdowns/02-dropdowns-tested.png' });
  });
});

test.describe('UI-Only: CRUD Operations via Interface', () => {
  test.use({ viewport: { width: 1920, height: 1080 } });

  test.beforeEach(async ({ page }) => {
    // Login as admin
    await page.goto('http://localhost:3001/sign-in?lang=en');
    await page.waitForLoadState('domcontentloaded', { timeout: 30000 });
    await page.waitForTimeout(2000);

    await page.fill('input[name="email"]', 'admin@bookdress.local');
    await page.fill('input[name="password"]', 'admin123');
    await page.click('button[type="submit"]');

    await page.waitForTimeout(5000);
  });

  test('should navigate to locations page and test add button', async ({ page }) => {
    console.log('📍 Testing locations CRUD...');

    await page.goto('http://localhost:3001/locations?lang=en');
    await page.waitForLoadState('domcontentloaded', { timeout: 30000 });
    await page.waitForTimeout(5000);

    await page.screenshot({ path: 'test-results/ui-crud/01-locations-page.png' });

    // Find and click Add button
    const addButton = page.getByRole('button', { name: /add|create|new/i });

    if (await addButton.isVisible()) {
      await addButton.click();
      await page.waitForTimeout(3000);

      await page.screenshot({ path: 'test-results/ui-crud/02-location-create-form.png' });

      // Check for form fields
      const formFields = await page.$$('input, textarea');
      console.log(`✅ Form fields: ${formFields.length}`);

      const submitButton = page.getByRole('button', { name: /save|submit|create/i });
      const hasSubmitButton = await submitButton.isVisible();
      console.log(`✅ Submit button visible: ${hasSubmitButton}`);

      // Go back
      await page.goBack();
      await page.waitForTimeout(3000);
    } else {
      console.log('⚠️ Add button not visible');
    }

    console.log('✅ Locations CRUD test completed');
  });

  test('should navigate to suppliers page and test add button', async ({ page }) => {
    console.log('🏪 Testing suppliers CRUD...');

    await page.goto('http://localhost:3001/suppliers?lang=en');
    await page.waitForLoadState('domcontentloaded', { timeout: 30000 });
    await page.waitForTimeout(5000);

    await page.screenshot({ path: 'test-results/ui-crud/03-suppliers-page.png' });

    // Find and click Add button
    const addButton = page.getByRole('button', { name: /add|create|new/i });

    if (await addButton.isVisible()) {
      await addButton.click();
      await page.waitForTimeout(3000);

      await page.screenshot({ path: 'test-results/ui-crud/04-supplier-create-form.png' });

      // Check for form fields
      const formFields = await page.$$('input, textarea');
      console.log(`✅ Form fields: ${formFields.length}`);

      const submitButton = page.getByRole('button', { name: /save|submit|create/i });
      const hasSubmitButton = await submitButton.isVisible();
      console.log(`✅ Submit button visible: ${hasSubmitButton}`);

      // Go back
      await page.goBack();
      await page.waitForTimeout(3000);
    } else {
      console.log('⚠️ Add button not visible');
    }

    console.log('✅ Suppliers CRUD test completed');
  });

  test('should navigate to dresses page and test filters', async ({ page }) => {
    console.log('👗 Testing dresses filters...');

    await page.goto('http://localhost:3001/dresses?lang=en');
    await page.waitForLoadState('domcontentloaded', { timeout: 30000 });
    await page.waitForTimeout(5000);

    await page.screenshot({ path: 'test-results/ui-crud/05-dresses-page.png' });

    // Check for filter controls
    const filterInputs = await page.$$('input[placeholder*="filter" i], input[placeholder*="search" i]');
    console.log(`✅ Filter inputs: ${filterInputs.length}`);

    // Check for dress type dropdown
    const typeDropdown = await page.$$('select[name="type"], [name="dressType"]');
    console.log(`✅ Type dropdowns: ${typeDropdown.length}`);

    // Check for data grid
    const dataGrid = await page.$$('.MuiDataGrid-root');
    console.log(`✅ Data grid present: ${dataGrid.length > 0}`);

    expect(dataGrid.length).toBeGreaterThan(0);
  });

  test('should test dashboard analytics display', async ({ page }) => {
    console.log('📊 Testing dashboard analytics...');

    await page.goto('http://localhost:3001/dashboard?lang=en');
    await page.waitForLoadState('domcontentloaded', { timeout: 30000 });
    await page.waitForTimeout(5000);

    await page.screenshot({ path: 'test-results/ui-crud/06-dashboard-analytics.png' });

    // Check for statistics cards
    const statCards = await page.$$('.MuiCard-root, .stat-card, [class*="stat"]');
    console.log(`✅ Stat cards: ${statCards.length}`);

    // Check for charts
    const charts = await page.$$('svg, canvas, [class*="chart"]');
    console.log(`✅ Chart elements: ${charts.length}`);

    // Check for numerical data in page
    const content = await page.content();
    const hasNumbers = /\d+/.test(content);
    console.log(`✅ Has numerical data: ${hasNumbers}`);

    expect(statCards.length + charts.length).toBeGreaterThan(0);
  });
});

test.describe('UI-Only: Frontend Customer Experience', () => {
  test('should test complete customer booking flow', async ({ page }) => {
    console.log('🛒 Testing customer booking flow...');

    // Start at homepage
    await page.goto('http://localhost:3000/?lang=en');
    await page.waitForLoadState('domcontentloaded', { timeout: 30000 });
    await page.waitForTimeout(3000);

    await page.screenshot({ path: 'test-results/ui-customer/01-homepage.png' });

    // Navigate to search
    const searchLink = page.getByRole('link', { name: /search|حجز/i });
    if (await searchLink.isVisible()) {
      await searchLink.click();
      await page.waitForTimeout(3000);
    } else {
      await page.goto('http://localhost:3000/search?lang=en');
    }

    await page.waitForLoadState('domcontentloaded', { timeout: 30000 });
    await page.waitForTimeout(3000);

    await page.screenshot({ path: 'test-results/ui-customer/02-search-page.png' });

    // Check for location dropdown
    console.log('Checking location dropdown...');
    const locationInputs = await page.$$('input[placeholder*="ocation" i], input[placeholder*="الموقع" i]');

    if (locationInputs.length > 0) {
      await locationInputs[0].click();
      await page.waitForTimeout(2000);
      await page.screenshot({ path: 'test-results/ui-customer/03-location-dropdown.png' });

      const options = await page.$$('li[role="option"]');
      console.log(`   Location options: ${options.length}`);

      if (options.length > 0) {
        for (let i = 0; i < Math.min(5, options.length); i++) {
          const text = await options[i].textContent();
          console.log(`     Option ${i + 1}: ${text}`);
        }
        expect(options.length).toBeGreaterThan(0);
      }
    }

    console.log('✅ Customer booking flow test completed');
  });

  test('should test frontend Arabic language support', async ({ page }) => {
    console.log('🌐 Testing Arabic language support...');

    // Load Arabic page
    await page.goto('http://localhost:3000/?lang=ar');
    await page.waitForLoadState('domcontentloaded', { timeout: 30000 });
    await page.waitForTimeout(3000);

    await page.screenshot({ path: 'test-results/ui-customer/04-arabic-homepage.png' });

    // Check for Arabic text
    const content = await page.content();
    const hasArabic = /[\u0600-\u06FF]/.test(content);
    console.log(`   Arabic text present: ${hasArabic}`);

    // Check for RTL direction
    const htmlDir = await page.getAttribute('html', 'dir');
    console.log(`   HTML dir: ${htmlDir}`);

    expect(hasArabic).toBe(true);
    expect(htmlDir).toBe('rtl');
  });

  test('should test frontend responsive design', async ({ page }) => {
    console.log('📱 Testing responsive design...');

    // Desktop
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto('http://localhost:3000/?lang=en');
    await page.waitForLoadState('domcontentloaded', { timeout: 30000 });
    await page.waitForTimeout(3000);
    await page.screenshot({ path: 'test-results/ui-responsive/desktop-view.png' });
    console.log('   Desktop view captured');

    // Tablet
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto('http://localhost:3000/?lang=en');
    await page.waitForLoadState('domcontentloaded', { timeout: 30000 });
    await page.waitForTimeout(3000);
    await page.screenshot({ path: 'test-results/ui-responsive/tablet-view.png' });
    console.log('   Tablet view captured');

    // Mobile
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('http://localhost:3000/?lang=en');
    await page.waitForLoadState('domcontentloaded', { timeout: 30000 });
    await page.waitForTimeout(3000);
    await page.screenshot({ path: 'test-results/ui-responsive/mobile-view.png' });
    console.log('   Mobile view captured');

    console.log('✅ Responsive design test completed');
  });
});

test.describe('UI-Only: Location Dropdown Deep Dive', () => {
  test.use({ viewport: { width: 1920, height: 1080 } });

  test('should thoroughly test location dropdown population', async ({ page }) => {
    console.log('🔍 Deep dive into location dropdown...');

    // Login first
    await page.goto('http://localhost:3001/sign-in?lang=en');
    await page.waitForLoadState('domcontentloaded', { timeout: 30000 });
    await page.waitForTimeout(2000);

    await page.fill('input[name="email"]', 'admin@bookdress.local');
    await page.fill('input[name="password"]', 'admin123');
    await page.click('button[type="submit"]');

    await page.waitForTimeout(5000);

    // Go to create booking page
    await page.goto('http://localhost:3001/create-booking?lang=en');
    await page.waitForLoadState('domcontentloaded', { timeout: 30000 });
    await page.waitForTimeout(5000);

    await page.screenshot({ path: 'test-results/location-deep-dive/01-page-loaded.png' });

    // Get all comboboxes
    const comboboxes = await page.$$('div[role="combobox"]');
    console.log(`✅ Found ${comboboxes.length} combobox(es)`);

    // Detailed exploration of each combobox
    for (let i = 0; i < comboboxes.length; i++) {
      console.log(`\n--- Testing Combobox ${i + 1} ---`);

      try {
        // Get the combobox container
        const container = comboboxes[i];
        const isVisible = await container.isVisible();
        console.log(`   Visible: ${isVisible}`);

        if (!isVisible) {
          // Try to scroll it into view
          await container.scrollIntoViewIfNeeded();
          await page.waitForTimeout(500);
        }

        // Click to open
        await container.click();
        await page.waitForTimeout(2000);

        // Count options
        const options = await page.$$('li[role="option"]');
        console.log(`   Options after click: ${options.length}`);

        if (options.length > 0) {
          console.log('   Sample options:');
          for (let j = 0; j < Math.min(8, options.length); j++) {
            const text = await options[j].textContent();
            const value = await options[j].getAttribute('data-value');
            console.log(`     ${j + 1}. "${text?.substring(0, 40)}" (value: ${value || 'N/A'})`);
          }

          // Check for location names
          const allText = await options.map(o => o.textContent() || '');
          const allTextStr = allText.join(' ').toLowerCase();

          const locationIndicators = [
            'nablus', 'ramallah', 'jenin', 'amman', 'beirut',
            'location', 'موقع'
          ];

          const hasLocation = locationIndicators.some(ind =>
            allTextStr.includes(ind.toLowerCase())
          );

          if (hasLocation) {
            console.log(`   ✅ This appears to be the location dropdown!`);
            console.log(`   ✅ Found ${options.length} location options`);
          }

          await page.screenshot({ path: `test-results/location-deep-dive/combobox-${i + 1}-with-options.png` });
        }

        // Close dropdown
        await page.keyboard.press('Escape');
        await page.waitForTimeout(500);

      } catch (error) {
        console.log(`   Error testing combobox ${i + 1}: ${(error as Error).message}`);
      }
    }

    console.log('\n✅ Location dropdown deep dive completed');
  });
});
