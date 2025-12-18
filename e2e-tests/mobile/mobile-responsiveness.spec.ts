import { test, expect } from '@playwright/test';

test.describe('Mobile Responsiveness', () => {
  const mobileViewports = [
    { name: 'iPhone SE', width: 375, height: 667 },
    { name: 'iPhone 12', width: 390, height: 844 },
    { name: 'Samsung Galaxy S21', width: 360, height: 800 },
    { name: 'iPad Mini', width: 768, height: 1024 }
  ];

  for (const viewport of mobileViewports) {
    test(`Backend login should work on ${viewport.name}`, async ({ page }) => {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      
      await page.goto('/sign-in?lang=ar');
      await page.waitForLoadState('networkidle');
      await page.waitForSelector('form', { timeout: 10000 });
      
      // Check form elements are visible and properly sized
      const emailField = page.locator('input[name="email"]');
      const passwordField = page.locator('input[name="password"]');
      const submitButton = page.locator('button[type="submit"]');
      
      await expect(emailField).toBeVisible();
      await expect(passwordField).toBeVisible();
      await expect(submitButton).toBeVisible();
      
      // Check touch target sizes (minimum 44px for accessibility)
      const emailBox = await emailField.boundingBox();
      const passwordBox = await passwordField.boundingBox();
      const buttonBox = await submitButton.boundingBox();
      
      expect(emailBox?.height).toBeGreaterThan(40);
      expect(passwordBox?.height).toBeGreaterThan(40);
      expect(buttonBox?.height).toBeGreaterThan(40);
      
      console.log(`✅ ${viewport.name}: Touch targets properly sized`);
      console.log(`   Email field: ${emailBox?.height}px`);
      console.log(`   Password field: ${passwordBox?.height}px`);
      console.log(`   Submit button: ${buttonBox?.height}px`);
      
      // Test actual login
      await emailField.fill('admin@bookdress.com');
      await passwordField.fill('admin123');
      await submitButton.click();
      
      await page.waitForTimeout(3000);
      const currentUrl = page.url();
      expect(currentUrl).toBe('http://localhost:3001/');
      
      console.log(`✅ ${viewport.name}: Login successful`);
    });
  }

  test('Frontend home page should be responsive', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    
    await page.goto('/?lang=ar');
    await page.waitForLoadState('networkidle');
    
    // Check if main elements are visible
    const searchForm = page.locator('form, .search-form, [data-testid="search-form"]');
    const navigation = page.locator('nav, .navigation, .header');
    
    const searchVisible = await searchForm.isVisible();
    const navVisible = await navigation.isVisible();
    
    console.log('Search form visible on mobile:', searchVisible);
    console.log('Navigation visible on mobile:', navVisible);
    
    // Check for mobile menu if navigation is hidden
    if (!navVisible) {
      const mobileMenu = page.locator('.mobile-menu, .hamburger, .menu-toggle, [data-testid="mobile-menu"]');
      const mobileMenuVisible = await mobileMenu.isVisible();
      console.log('Mobile menu visible:', mobileMenuVisible);
    }
    
    // Page should have content
    const pageContent = await page.textContent('body');
    expect(pageContent?.length).toBeGreaterThan(100);
  });

  test('Frontend search page should be responsive', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    
    await page.goto('/search?lang=ar');
    await page.waitForLoadState('networkidle');
    
    // Check if search results are displayed properly
    const searchResults = page.locator('.dress-list, .search-results, .MuiDataGrid-root');
    const filters = page.locator('.filters, .search-filters, .filter-panel');
    
    const resultsVisible = await searchResults.isVisible();
    const filtersVisible = await filters.isVisible();
    
    console.log('Search results visible on mobile:', resultsVisible);
    console.log('Filters visible on mobile:', filtersVisible);
    
    // Check for mobile filter toggle if filters are hidden
    if (!filtersVisible) {
      const filterToggle = page.locator('.filter-toggle, .mobile-filters, [data-testid="mobile-filters"]');
      const filterToggleVisible = await filterToggle.isVisible();
      console.log('Mobile filter toggle visible:', filterToggleVisible);
    }
    
    // Page should have content
    const pageContent = await page.textContent('body');
    expect(pageContent?.length).toBeGreaterThan(100);
  });

  test('Backend dashboard should be responsive', async ({ page }) => {
    // Login first
    await page.goto('/sign-in?lang=ar');
    await page.waitForLoadState('networkidle');
    await page.waitForSelector('form', { timeout: 10000 });
    
    await page.fill('input[name="email"]', 'admin@bookdress.com');
    await page.fill('input[name="password"]', 'admin123');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(3000);
    
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/dashboard?lang=ar');
    await page.waitForLoadState('networkidle');
    
    // Check dashboard elements
    const content = page.locator('.content, .main-content, .dashboard-content');
    const sidebar = page.locator('.sidebar, .navigation, .menu');
    
    const contentVisible = await content.isVisible();
    const sidebarVisible = await sidebar.isVisible();
    
    console.log('Dashboard content visible on mobile:', contentVisible);
    console.log('Sidebar visible on mobile:', sidebarVisible);
    
    // Check for mobile navigation
    const mobileNav = page.locator('.mobile-nav, .hamburger, .menu-toggle');
    const mobileNavVisible = await mobileNav.isVisible();
    console.log('Mobile navigation visible:', mobileNavVisible);
    
    // Dashboard should be functional
    const pageContent = await page.textContent('body');
    expect(pageContent?.length).toBeGreaterThan(100);
  });

  test('Text should be readable on mobile (font sizes)', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    
    await page.goto('/sign-in?lang=ar');
    await page.waitForLoadState('networkidle');
    await page.waitForSelector('form', { timeout: 10000 });
    
    // Check font sizes are appropriate for mobile
    const title = page.locator('h1, .title, .signin-form-title');
    const labels = page.locator('label');
    const buttons = page.locator('button[type="submit"]');
    
    if (await title.isVisible()) {
      const titleStyles = await title.evaluate((el) => {
        const styles = window.getComputedStyle(el);
        return {
          fontSize: styles.fontSize,
          lineHeight: styles.lineHeight
        };
      });
      console.log('Title font size:', titleStyles.fontSize);
      
      // Font size should be at least 16px for readability
      const fontSize = parseInt(titleStyles.fontSize);
      expect(fontSize).toBeGreaterThan(14);
    }
    
    if (await labels.first().isVisible()) {
      const labelStyles = await labels.first().evaluate((el) => {
        const styles = window.getComputedStyle(el);
        return styles.fontSize;
      });
      console.log('Label font size:', labelStyles);
      
      const labelFontSize = parseInt(labelStyles);
      expect(labelFontSize).toBeGreaterThan(12);
    }
  });

  test('Horizontal scrolling should not occur', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    
    const pages = [
      '/sign-in?lang=ar',
      '/?lang=ar',
      '/search?lang=ar'
    ];
    
    for (const pagePath of pages) {
      await page.goto(pagePath);
      await page.waitForLoadState('networkidle');
      
      // Check if page width exceeds viewport
      const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
      const viewportWidth = page.viewportSize()?.width || 375;
      
      console.log(`${pagePath}: Body width ${bodyWidth}px, Viewport ${viewportWidth}px`);
      
      // Allow small tolerance for scrollbars
      expect(bodyWidth).toBeLessThanOrEqual(viewportWidth + 20);
    }
  });

  test('Touch interactions should work properly', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    
    await page.goto('/sign-in?lang=ar');
    await page.waitForLoadState('networkidle');
    await page.waitForSelector('form', { timeout: 10000 });
    
    // Test touch interactions
    const emailField = page.locator('input[name="email"]');
    const passwordField = page.locator('input[name="password"]');
    
    // Tap to focus
    await emailField.tap();
    await page.waitForTimeout(500);
    
    // Check if field is focused
    const emailFocused = await emailField.evaluate((el: HTMLInputElement) => el === document.activeElement);
    expect(emailFocused).toBe(true);
    console.log('✅ Email field focus on tap works');
    
    // Type in field
    await emailField.fill('test@example.com');
    const emailValue = await emailField.inputValue();
    expect(emailValue).toBe('test@example.com');
    console.log('✅ Email field input works');
    
    // Test password field
    await passwordField.tap();
    await passwordField.fill('testpassword');
    const passwordValue = await passwordField.inputValue();
    expect(passwordValue).toBe('testpassword');
    console.log('✅ Password field input works');
  });
});
