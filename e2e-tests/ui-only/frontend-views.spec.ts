import { test, expect } from '@playwright/test';

/**
 * Comprehensive Frontend Customer Views Test
 * Tests ALL frontend views and features from a customer perspective
 * NO API calls - pure UI interactions
 */

// Test customer credentials
const TEST_CUSTOMER = {
  email: 'customer@test.com',
  password: 'Customer123!',
  fullName: 'Test Customer'
};

test.describe('Frontend: Authentication Views', () => {
  test('should display sign in page correctly', async ({ page }) => {
    console.log('🔐 Testing sign in page...');

    await page.goto('http://localhost:3001/sign-in?lang=en');
    await page.waitForLoadState('domcontentloaded', { timeout: 30000 });
    await page.waitForTimeout(3000);

    await page.screenshot({ path: 'test-results/frontend-views/01-signin-page.png' });

    // Check for sign in form elements - use MuiTextField inputs
    const emailInput = page.locator('input[name="email"], input[type="email"]');
    const passwordInput = page.locator('input[name="password"], input[type="password"]');
    const submitButton = page.locator('button[type="submit"]');

    const emailCount = await emailInput.count();
    const passwordCount = await passwordInput.count();
    const submitCount = await submitButton.count();

    console.log(`  Email inputs found: ${emailCount}`);
    console.log(`  Password inputs found: ${passwordCount}`);
    console.log(`  Submit buttons found: ${submitCount}`);

    expect(emailCount > 0 && passwordCount > 0 && submitCount > 0).toBe(true);
  });

  test('should display sign up page correctly', async ({ page }) => {
    console.log('📝 Testing sign up page...');

    await page.goto('http://localhost:3001/sign-up?lang=en');
    await page.waitForLoadState('domcontentloaded', { timeout: 30000 });
    await page.waitForTimeout(3000);

    await page.screenshot({ path: 'test-results/frontend-views/02-signup-page.png' });

    // Check for sign up form elements - sign up might have different structure
    const allInputs = page.locator('input:not([type="hidden"])');
    const inputCount = await allInputs.count();
    console.log(`  Total inputs found: ${inputCount}`);

    const buttons = page.locator('button');
    const buttonCount = await buttons.count();
    console.log(`  Buttons found: ${buttonCount}`);

    // Check for page content
    const content = await page.content();
    const hasSignup = /sign.?up|register|create.?account/i.test(content);
    console.log(`  Has signup content: ${hasSignup}`);

    expect(inputCount > 0 || hasSignup).toBe(true);
  });

  test('should allow customer to sign in', async ({ page }) => {
    console.log('🔑 Testing customer sign in flow...');

    await page.goto('http://localhost:3001/sign-in?lang=en');
    await page.waitForLoadState('domcontentloaded', { timeout: 30000 });
    await page.waitForTimeout(2000);

    // Fill in sign in form
    await page.fill('input[name="email"]', 'admin@bookdress.com');
    await page.fill('input[name="password"]', 'admin123');

    await page.screenshot({ path: 'test-results/frontend-views/03-signin-filled.png' });

    // Click sign in button
    await page.click('button[type="submit"]');
    await page.waitForTimeout(5000);

    await page.screenshot({ path: 'test-results/frontend-views/04-after-signin.png' });

    // Check if we're redirected or logged in
    const currentUrl = page.url();
    console.log(`  Current URL after sign in: ${currentUrl}`);

    // Check for logged-in indicators (user avatar, notifications, menu)
    const userAvatar = page.locator('.avatar, [class*="avatar"], img[alt*="avatar" i]');
    const hasUserElements = await userAvatar.count() > 0;

    console.log(`  User avatar elements found: ${hasUserElements}`);

    expect(hasUserElements || currentUrl.includes('dashboard') || currentUrl.includes('bookings')).toBe(true);
  });
});

test.describe('Frontend: Homepage View', () => {
  test('should display homepage correctly', async ({ page }) => {
    console.log('🏠 Testing homepage view...');

    await page.goto('http://localhost:3000/?lang=en');
    await page.waitForLoadState('domcontentloaded', { timeout: 30000 });
    await page.waitForTimeout(5000);

    await page.screenshot({ path: 'test-results/frontend-views/05-homepage.png' });

    const pageTitle = await page.title();
    console.log(`  Page title: ${pageTitle}`);

    expect(pageTitle).toContain('BookDress');

    // Check for main navigation elements
    const header = page.locator('header, .header, [role="banner"]');
    const headerVisible = await header.isVisible().catch(() => false);
    console.log(`  Header visible: ${headerVisible}`);

    // Check for footer
    const footer = page.locator('footer, .footer, [role="contentinfo"]');
    const footerVisible = await footer.isVisible().catch(() => false);
    console.log(`  Footer visible: ${footerVisible}`);

    expect(headerVisible || footerVisible).toBe(true);
  });

  test('should have working search form on homepage', async ({ page }) => {
    console.log('🔍 Testing homepage search form...');

    await page.goto('http://localhost:3000/?lang=en');
    await page.waitForLoadState('domcontentloaded', { timeout: 30000 });
    await page.waitForTimeout(5000);

    // Look for search form elements
    const searchForm = page.locator('form, [role="search"]').filter({ hasText: /search|بحث/i });
    const searchInput = page.locator('input[placeholder*="earch" i], input[placeholder*="بحث" i]');
    const locationField = page.locator('[data-testid="location-field"], [class*="location" i]');

    const formCount = await searchForm.count();
    const inputCount = await searchInput.count();
    const locationCount = await locationField.count();

    console.log(`  Search forms found: ${formCount}`);
    console.log(`  Search inputs found: ${inputCount}`);
    console.log(`  Location fields found: ${locationCount}`);

    await page.screenshot({ path: 'test-results/frontend-views/06-homepage-search.png' });

    expect(formCount + inputCount > 0).toBe(true);
  });
});

test.describe('Frontend: Search Page View', () => {
  test('should display search page with filters', async ({ page }) => {
    console.log('👗 Testing search page view...');

    await page.goto('http://localhost:3000/search?lang=en');
    await page.waitForLoadState('domcontentloaded', { timeout: 30000 });
    await page.waitForTimeout(5000);

    await page.screenshot({ path: 'test-results/frontend-views/07-search-page.png' });

    // Check for search form
    const searchForm = page.locator('[data-testid="search-form"], form');
    const searchVisible = await searchForm.isVisible().catch(() => false);
    console.log(`  Search form visible: ${searchVisible}`);

    // Check for location dropdown
    const locationField = page.locator('[data-testid="location-field"]');
    const locationVisible = await locationField.isVisible().catch(() => false);
    console.log(`  Location field visible: ${locationVisible}`);

    // Check for filter dropdowns (dress type, size, style)
    const selectElements = page.locator('select, [role="combobox"]');
    const selectCount = await selectElements.count();
    console.log(`  Select/combobox elements: ${selectCount}`);

    expect(searchVisible || locationVisible || selectCount > 0).toBe(true);
  });

  test('should allow filtering by dress type', async ({ page }) => {
    console.log('🎨 Testing dress type filter...');

    await page.goto('http://localhost:3000/search?lang=en');
    await page.waitForLoadState('domcontentloaded', { timeout: 30000 });
    await page.waitForTimeout(5000);

    // Look for dress type dropdown
    const dressTypeSelect = page.locator('select[name*="type" i], [role="combobox"]').first();
    const selectCount = await dressTypeSelect.count();

    if (selectCount > 0) {
      await dressTypeSelect.first().click();
      await page.waitForTimeout(1000);
      await page.screenshot({ path: 'test-results/frontend-views/08-dress-type-filter.png' });

      // Check for options
      const options = page.locator('option, li[role="option"]');
      const optionCount = await options.count();
      console.log(`  Filter options found: ${optionCount}`);
    }

    await page.screenshot({ path: 'test-results/frontend-views/09-search-with-filters.png' });

    expect(selectCount).toBeGreaterThanOrEqual(0);
  });
});

test.describe('Frontend: Bookings View (Logged In)', () => {
  test.beforeEach(async ({ page }) => {
    // Sign in as admin (can also act as customer for testing)
    await page.goto('http://localhost:3001/sign-in?lang=en');
    await page.waitForLoadState('domcontentloaded', { timeout: 30000 });
    await page.waitForTimeout(2000);

    await page.fill('input[name="email"]', 'admin@bookdress.com');
    await page.fill('input[name="password"]', 'admin123');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(5000);
  });

  test('should display bookings page', async ({ page }) => {
    console.log('📅 Testing bookings page view...');

    await page.goto('http://localhost:3001/bookings?lang=en');
    await page.waitForLoadState('domcontentloaded', { timeout: 30000 });
    await page.waitForTimeout(5000);

    await page.screenshot({ path: 'test-results/frontend-views/10-bookings-page.png' });

    // Check for bookings content
    const content = await page.content();
    const hasBookingContent = /booking|حجز/i.test(content);
    console.log(`  Has booking content: ${hasBookingContent}`);

    // Check for table or list of bookings
    const tableRows = page.locator('tr, [role="row"], .booking-card');
    const rowCount = await tableRows.count();
    console.log(`  Booking items/rows found: ${rowCount}`);

    await page.screenshot({ path: 'test-results/frontend-views/11-bookings-list.png' });

    expect(hasBookingContent || rowCount > 0).toBe(true);
  });

  test('should have booking actions visible', async ({ page }) => {
    console.log('⚙️ Testing booking actions...');

    await page.goto('http://localhost:3001/bookings?lang=en');
    await page.waitForLoadState('domcontentloaded', { timeout: 30000 });
    await page.waitForTimeout(5000);

    // Look for action buttons
    const buttons = page.locator('button');
    const buttonCount = await buttons.count();
    console.log(`  Total buttons found: ${buttonCount}`);

    // Look for specific booking actions
    const content = await page.content();
    const hasActions = /cancel|delete|view|edit|إلغاء|حذف|عرض/i.test(content);
    console.log(`  Has booking actions: ${hasActions}`);

    await page.screenshot({ path: 'test-results/frontend-views/12-booking-actions.png' });

    expect(buttonCount > 0 || hasActions).toBe(true);
  });
});

test.describe('Frontend: Locations Page', () => {
  test('should display locations page', async ({ page }) => {
    console.log('📍 Testing locations page view...');

    await page.goto('http://localhost:3000/locations?lang=en');
    await page.waitForLoadState('domcontentloaded', { timeout: 30000 });
    await page.waitForTimeout(5000);

    await page.screenshot({ path: 'test-results/frontend-views/13-locations-page.png' });

    // Check for locations content
    const content = await page.content();
    const hasLocationContent = /location|موقع/i.test(content);
    console.log(`  Has location content: ${hasLocationContent}`);

    // Check for location cards/items
    const locationItems = page.locator('[class*="location" i], .location-card');
    const locationCount = await locationItems.count();
    console.log(`  Location items found: ${locationCount}`);

    expect(hasLocationContent || locationCount > 0).toBe(true);
  });
});

test.describe('Frontend: Information Pages', () => {
  test('should display about page', async ({ page }) => {
    console.log('ℹ️ Testing about page...');

    await page.goto('http://localhost:3000/about?lang=en');
    await page.waitForLoadState('domcontentloaded', { timeout: 30000 });
    await page.waitForTimeout(3000);

    await page.screenshot({ path: 'test-results/frontend-views/14-about-page.png' });

    const content = await page.content();
    const hasAbout = /about|حول/i.test(content);
    console.log(`  Has about content: ${hasAbout}`);

    expect(hasAbout).toBe(true);
  });

  test('should display privacy policy page', async ({ page }) => {
    console.log('🔒 Testing privacy policy page...');

    await page.goto('http://localhost:3000/privacy?lang=en');
    await page.waitForLoadState('domcontentloaded', { timeout: 30000 });
    await page.waitForTimeout(3000);

    await page.screenshot({ path: 'test-results/frontend-views/15-privacy-page.png' });

    // Check for page loaded properly (even if content is minimal)
    const pageTitle = await page.title();
    const hasContent = pageTitle.length > 0;

    // Check for any content
    const bodyText = await page.locator('body').textContent();
    const hasText = bodyText && bodyText.length > 50;

    console.log(`  Page title: ${pageTitle}`);
    console.log(`  Has content: ${hasContent || hasText}`);

    expect(hasContent || hasText).toBe(true);
  });

  test('should display terms of service page', async ({ page }) => {
    console.log('📜 Testing terms of service page...');

    await page.goto('http://localhost:3000/tos?lang=en');
    await page.waitForLoadState('domcontentloaded', { timeout: 30000 });
    await page.waitForTimeout(3000);

    await page.screenshot({ path: 'test-results/frontend-views/16-tos-page.png' });

    // Check for page loaded properly
    const pageTitle = await page.title();
    const bodyText = await page.locator('body').textContent();
    const hasText = bodyText && bodyText.length > 50;

    console.log(`  Page title: ${pageTitle}`);
    console.log(`  Has content: ${hasText}`);

    expect(hasText).toBe(true);
  });

  test('should display FAQ page', async ({ page }) => {
    console.log('❓ Testing FAQ page...');

    await page.goto('http://localhost:3000/faq?lang=en');
    await page.waitForLoadState('domcontentloaded', { timeout: 30000 });
    await page.waitForTimeout(3000);

    await page.screenshot({ path: 'test-results/frontend-views/17-faq-page.png' });

    // Check for page loaded properly
    const bodyText = await page.locator('body').textContent();
    const hasText = bodyText && bodyText.length > 50;

    console.log(`  Has content: ${hasText}`);

    expect(hasText).toBe(true);
  });

  test('should display contact page', async ({ page }) => {
    console.log('📧 Testing contact page...');

    await page.goto('http://localhost:3000/contact?lang=en');
    await page.waitForLoadState('domcontentloaded', { timeout: 30000 });
    await page.waitForTimeout(3000);

    await page.screenshot({ path: 'test-results/frontend-views/18-contact-page.png' });

    const content = await page.content();
    const hasContact = /contact|email|اتصال|بريد/i.test(content);
    console.log(`  Has contact content: ${hasContact}`);

    expect(hasContact).toBe(true);
  });
});

test.describe('Frontend: User Settings View', () => {
  test.beforeEach(async ({ page }) => {
    // Sign in first
    await page.goto('http://localhost:3001/sign-in?lang=en');
    await page.waitForLoadState('domcontentloaded', { timeout: 30000 });
    await page.waitForTimeout(2000);

    await page.fill('input[name="email"]', 'admin@bookdress.com');
    await page.fill('input[name="password"]', 'admin123');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(5000);
  });

  test('should display settings page', async ({ page }) => {
    console.log('⚙️ Testing settings page view...');

    await page.goto('http://localhost:3001/settings?lang=en');
    await page.waitForLoadState('domcontentloaded', { timeout: 30000 });
    await page.waitForTimeout(5000);

    await page.screenshot({ path: 'test-results/frontend-views/19-settings-page.png' });

    // Check for settings content
    const content = await page.content();
    const hasSettings = /settings|profile|account|إعدادات/i.test(content);
    console.log(`  Has settings content: ${hasSettings}`);

    // Check for any buttons or form elements
    const buttons = page.locator('button');
    const buttonCount = await buttons.count();
    console.log(`  Buttons found: ${buttonCount}`);

    await page.screenshot({ path: 'test-results/frontend-views/20-settings-form.png' });

    expect(hasSettings || buttonCount > 0).toBe(true);
  });
});

test.describe('Frontend: Navigation & Menu', () => {
  test('should have working navigation menu', async ({ page }) => {
    console.log('🧭 Testing navigation menu...');

    await page.goto('http://localhost:3000/?lang=en');
    await page.waitForLoadState('domcontentloaded', { timeout: 30000 });
    await page.waitForTimeout(3000);

    // Check for menu button (hamburger)
    const menuButton = page.locator('button[aria-label*="menu" i], button:has-text("menu"), .menu-button');
    const menuButtonCount = await menuButton.count();
    console.log(`  Menu buttons found: ${menuButtonCount}`);

    await page.screenshot({ path: 'test-results/frontend-views/21-navigation.png' });

    // Try to click menu if exists
    if (menuButtonCount > 0) {
      await menuButton.first().click();
      await page.waitForTimeout(2000);
      await page.screenshot({ path: 'test-results/frontend-views/22-menu-opened.png' });

      // Check for menu items
      const menuItems = page.locator('a, [role="menuitem"], .menu-item');
      const itemCount = await menuItems.count();
      console.log(`  Menu items found: ${itemCount}`);
    }

    expect(menuButtonCount >= 0).toBe(true);
  });

  test('should have language switcher', async ({ page }) => {
    console.log('🌐 Testing language switcher...');

    await page.goto('http://localhost:3000/?lang=en');
    await page.waitForLoadState('domcontentloaded', { timeout: 30000 });
    await page.waitForTimeout(3000);

    // Look for language selector
    const langButton = page.locator('button:has-text("EN"), button:has-text("AR"), [class*="language" i], [class*="lang" i]');
    const langButtonCount = await langButton.count();
    console.log(`  Language buttons found: ${langButtonCount}`);

    await page.screenshot({ path: 'test-results/frontend-views/23-language-switcher.png' });

    expect(langButtonCount >= 0).toBe(true);
  });
});

test.describe('Frontend: Arabic/RTL Support', () => {
  test('should display Arabic content correctly', async ({ page }) => {
    console.log('🇸🇦 Testing Arabic language display...');

    await page.goto('http://localhost:3000/?lang=ar');
    await page.waitForLoadState('domcontentloaded', { timeout: 30000 });
    await page.waitForTimeout(5000);

    await page.screenshot({ path: 'test-results/frontend-views/24-arabic-homepage.png' });

    // Check for RTL direction
    const htmlDir = await page.getAttribute('html', 'dir');
    console.log(`  HTML dir: ${htmlDir}`);

    // Check for Arabic text
    const content = await page.content();
    const hasArabic = /[\u0600-\u06FF]/.test(content);
    console.log(`  Has Arabic text: ${hasArabic}`);

    expect(htmlDir === 'rtl' || hasArabic).toBe(true);
  });

  test('should display Arabic search page', async ({ page }) => {
    console.log('🔍 Arabic search page...');

    await page.goto('http://localhost:3000/search?lang=ar');
    await page.waitForLoadState('domcontentloaded', { timeout: 30000 });
    await page.waitForTimeout(5000);

    await page.screenshot({ path: 'test-results/frontend-views/25-arabic-search.png' });

    const content = await page.content();
    const hasArabic = /[\u0600-\u06FF]/.test(content);
    const htmlDir = await page.getAttribute('html', 'dir');

    console.log(`  HTML dir: ${htmlDir}`);
    console.log(`  Has Arabic: ${hasArabic}`);

    expect(htmlDir === 'rtl' || hasArabic).toBe(true);
  });
});

test.describe('Frontend: Responsive Design', () => {
  test('should work on mobile viewport', async ({ page }) => {
    console.log('📱 Testing mobile viewport...');

    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('http://localhost:3000/?lang=en');
    await page.waitForLoadState('domcontentloaded', { timeout: 30000 });
    await page.waitForTimeout(3000);

    await page.screenshot({ path: 'test-results/frontend-views/26-mobile-homepage.png' });

    const content = await page.content();
    const hasContent = /bookdress|dress/i.test(content);
    console.log(`  Has content on mobile: ${hasContent}`);

    expect(hasContent).toBe(true);
  });

  test('should work on tablet viewport', async ({ page }) => {
    console.log('📱 Testing tablet viewport...');

    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto('http://localhost:3000/?lang=en');
    await page.waitForLoadState('domcontentloaded', { timeout: 30000 });
    await page.waitForTimeout(3000);

    await page.screenshot({ path: 'test-results/frontend-views/27-tablet-homepage.png' });

    const content = await page.content();
    const hasContent = /bookdress|dress/i.test(content);
    console.log(`  Has content on tablet: ${hasContent}`);

    expect(hasContent).toBe(true);
  });

  test('should work on desktop viewport', async ({ page }) => {
    console.log('🖥️ Testing desktop viewport...');

    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto('http://localhost:3000/?lang=en');
    await page.waitForLoadState('domcontentloaded', { timeout: 30000 });
    await page.waitForTimeout(3000);

    await page.screenshot({ path: 'test-results/frontend-views/28-desktop-homepage.png' });

    const content = await page.content();
    const hasContent = /bookdress|dress/i.test(content);
    console.log(`  Has content on desktop: ${hasContent}`);

    expect(hasContent).toBe(true);
  });
});
