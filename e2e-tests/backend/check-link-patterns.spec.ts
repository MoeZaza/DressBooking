import { test, expect } from '@playwright/test';

test.describe('Check Link Patterns in Main Pages', () => {
  test('should check how links are structured in main pages', async ({ page }) => {
    // Login first
    await page.goto('/sign-in?lang=ar');
    await page.waitForLoadState('networkidle');
    await page.waitForSelector('form', { timeout: 10000 });
    
    await page.fill('input[name="email"]', 'admin@bookdress.com');
    await page.fill('input[name="password"]', 'admin123');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(3000);

    console.log('🔍 Checking Link Patterns in Main Pages');

    // Check bookings page links
    console.log('\n📋 BOOKINGS PAGE LINKS:');
    await page.goto('/?lang=ar');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    const allBookingLinks = page.locator('a');
    const bookingLinkCount = await allBookingLinks.count();
    console.log(`Total links found: ${bookingLinkCount}`);

    const bookingHrefs = [];
    for (let i = 0; i < Math.min(bookingLinkCount, 20); i++) {
      const href = await allBookingLinks.nth(i).getAttribute('href');
      if (href && (href.includes('booking') || href.includes('update'))) {
        bookingHrefs.push(href);
      }
    }
    console.log('Booking-related links:', bookingHrefs);

    // Check for edit/view buttons or icons
    const editButtons = page.locator('button:has-text("Edit"), button:has-text("تحرير"), button[title*="edit"], button[title*="تحرير"]');
    const editButtonCount = await editButtons.count();
    console.log('Edit buttons found:', editButtonCount);

    const viewButtons = page.locator('button:has-text("View"), button:has-text("عرض"), button[title*="view"], button[title*="عرض"]');
    const viewButtonCount = await viewButtons.count();
    console.log('View buttons found:', viewButtonCount);

    // Check for action icons
    const actionIcons = page.locator('.MuiIconButton-root, .action-button, [data-testid*="action"]');
    const actionIconCount = await actionIcons.count();
    console.log('Action icons found:', actionIconCount);

    // Check dresses page links
    console.log('\n👗 DRESSES PAGE LINKS:');
    await page.goto('/dresses?lang=ar');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    const allDressLinks = page.locator('a');
    const dressLinkCount = await allDressLinks.count();
    console.log(`Total links found: ${dressLinkCount}`);

    const dressHrefs = [];
    for (let i = 0; i < Math.min(dressLinkCount, 20); i++) {
      const href = await allDressLinks.nth(i).getAttribute('href');
      if (href && (href.includes('dress') || href.includes('update'))) {
        dressHrefs.push(href);
      }
    }
    console.log('Dress-related links:', dressHrefs);

    // Check suppliers page links
    console.log('\n🏪 SUPPLIERS PAGE LINKS:');
    await page.goto('/suppliers?lang=ar');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    const allSupplierLinks = page.locator('a');
    const supplierLinkCount = await allSupplierLinks.count();
    console.log(`Total links found: ${supplierLinkCount}`);

    const supplierHrefs = [];
    for (let i = 0; i < Math.min(supplierLinkCount, 20); i++) {
      const href = await allSupplierLinks.nth(i).getAttribute('href');
      if (href && (href.includes('supplier') || href.includes('update'))) {
        supplierHrefs.push(href);
      }
    }
    console.log('Supplier-related links:', supplierHrefs);

    // Check users page links
    console.log('\n👥 USERS PAGE LINKS:');
    await page.goto('/users?lang=ar');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    const allUserLinks = page.locator('a');
    const userLinkCount = await allUserLinks.count();
    console.log(`Total links found: ${userLinkCount}`);

    const userHrefs = [];
    for (let i = 0; i < Math.min(userLinkCount, 20); i++) {
      const href = await allUserLinks.nth(i).getAttribute('href');
      if (href && (href.includes('user') || href.includes('update'))) {
        userHrefs.push(href);
      }
    }
    console.log('User-related links:', userHrefs);

    // Check for data grid action columns
    console.log('\n🔍 CHECKING DATA GRID ACTIONS:');
    
    // Go back to bookings page and check for data grid
    await page.goto('/?lang=ar');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    const dataGrids = page.locator('.MuiDataGrid-root');
    const dataGridCount = await dataGrids.count();
    console.log('Data grids found:', dataGridCount);

    if (dataGridCount > 0) {
      // Check for action columns
      const actionCells = page.locator('[data-field="actions"], .MuiDataGrid-actionsCell');
      const actionCellCount = await actionCells.count();
      console.log('Action cells found:', actionCellCount);

      // Check for menu buttons
      const menuButtons = page.locator('.MuiIconButton-root[aria-label*="menu"], .MuiIconButton-root[title*="menu"]');
      const menuButtonCount = await menuButtons.count();
      console.log('Menu buttons found:', menuButtonCount);

      if (menuButtonCount > 0) {
        console.log('Testing first menu button...');
        try {
          await menuButtons.first().click();
          await page.waitForTimeout(1000);

          const menuItems = page.locator('.MuiMenuItem-root, [role="menuitem"]');
          const menuItemCount = await menuItems.count();
          console.log('Menu items found:', menuItemCount);

          if (menuItemCount > 0) {
            for (let i = 0; i < menuItemCount; i++) {
              const menuItemText = await menuItems.nth(i).textContent();
              console.log(`Menu item ${i + 1}: "${menuItemText}"`);
            }
          }

          // Close menu
          await page.keyboard.press('Escape');
        } catch (error) {
          console.log('Error testing menu:', (error as Error).message);
        }
      }
    }

    // Test should pass
    expect(true).toBe(true);
  });
});
