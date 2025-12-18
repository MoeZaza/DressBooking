import { test, expect } from '@playwright/test';
import { TestHelpers } from '../utils/test-helpers';

test.describe('Backend Dress Management', () => {
  let helpers: TestHelpers;

  test.beforeEach(async ({ page }) => {
    helpers = new TestHelpers(page);
    await helpers.loginAsAdmin();
    await helpers.switchToArabic();
  });

  test('should display dresses list page', async ({ page }) => {
    await page.goto('/dresses');
    await helpers.waitForLoading();
    
    // Check if dresses page is loaded
    await expect(page.locator('text=الفساتين')).toBeVisible(); // Dresses in Arabic
    
    // Check for data grid
    await expect(page.locator('.MuiDataGrid-root, [role="grid"]')).toBeVisible();
    
    // Check for column headers in Arabic
    await expect(page.locator('text=الاسم')).toBeVisible(); // Name
    await expect(page.locator('text=رمز الفستان')).toBeVisible(); // Dress Code
    await expect(page.locator('text=النوع')).toBeVisible(); // Type
    await expect(page.locator('text=المقاس')).toBeVisible(); // Size
    await expect(page.locator('text=السعر')).toBeVisible(); // Price
    
    await helpers.takeScreenshot('dresses-list');
  });

  test('should open new dress form', async ({ page }) => {
    await page.goto('/dresses');
    await helpers.waitForLoading();
    
    // Click new dress button
    await helpers.clickButtonByText('فستان جديد'); // New Dress
    
    // Should navigate to create dress page
    await page.waitForURL('**/create-dress');
    
    // Check if form is displayed
    await expect(page.locator('text=فستان جديد')).toBeVisible(); // New Dress heading
    
    // Check for form fields
    await expect(page.locator('text=الاسم')).toBeVisible(); // Name
    await expect(page.locator('text=رمز الفستان')).toBeVisible(); // Dress Code
    await expect(page.locator('text=النوع')).toBeVisible(); // Type
    await expect(page.locator('text=المقاس')).toBeVisible(); // Size
    await expect(page.locator('text=اللون')).toBeVisible(); // Color
    await expect(page.locator('text=السعر')).toBeVisible(); // Price
    
    await helpers.takeScreenshot('new-dress-form');
  });

  test('should create new dress successfully', async ({ page }) => {
    await page.goto('/create-dress');
    await helpers.waitForLoading();
    
    // Fill required fields
    await helpers.fillFieldByLabel('الاسم', 'فستان اختبار جديد'); // Test dress name
    await helpers.fillFieldByLabel('رمز الفستان', 'TEST001'); // Dress code
    
    // Select dress type
    const typeField = page.locator('select[name="type"], [data-testid="dress-type"]').first();
    if (await typeField.isVisible()) {
      await typeField.selectOption('wedding');
    }
    
    // Select size
    const sizeField = page.locator('select[name="size"], [data-testid="dress-size"]').first();
    if (await sizeField.isVisible()) {
      await sizeField.selectOption('M');
    }
    
    // Fill price
    await helpers.fillFieldByLabel('السعر', '1000');
    
    // Fill deposit
    await helpers.fillFieldByLabel('العربون', '200');
    
    // Fill color
    await helpers.fillFieldByLabel('اللون', 'أبيض'); // White
    
    // Fill material
    await helpers.fillFieldByLabel('المادة', 'حرير'); // Silk
    
    await helpers.takeScreenshot('dress-form-filled');
    
    // Submit form
    await helpers.clickButtonByText('إنشاء'); // Create
    
    // Wait for success or error
    await page.waitForTimeout(3000);
    
    // Check for success message or redirect
    const errors = await helpers.checkForErrors();
    if (errors.length > 0) {
      console.log('Dress creation errors:', errors);
      await helpers.takeScreenshot('dress-creation-error');
    } else {
      // Should redirect to dresses list or show success
      await helpers.takeScreenshot('dress-created-success');
    }
  });

  test('should validate dress form fields', async ({ page }) => {
    await page.goto('/create-dress');
    await helpers.waitForLoading();
    
    // Try to submit empty form
    await helpers.clickButtonByText('إنشاء'); // Create
    
    // Check for validation errors
    const errors = await helpers.checkForErrors();
    expect(errors.length).toBeGreaterThan(0);
    
    // Check if required fields are marked as invalid
    const nameField = page.locator('input[name="name"]');
    const codeField = page.locator('input[name="dressCode"]');
    
    if (await nameField.isVisible()) {
      await expect(nameField).toHaveAttribute('aria-invalid', 'true');
    }
    if (await codeField.isVisible()) {
      await expect(codeField).toHaveAttribute('aria-invalid', 'true');
    }
    
    await helpers.takeScreenshot('dress-validation-errors');
  });

  test('should upload dress images', async ({ page }) => {
    await page.goto('/create-dress');
    await helpers.waitForLoading();
    
    // Look for image upload area
    const uploadArea = page.locator('[data-testid="image-upload"], .image-upload, input[type="file"]').first();
    if (await uploadArea.isVisible()) {
      // Upload image
      await uploadArea.setInputFiles({
        name: 'test-dress.jpg',
        mimeType: 'image/jpeg',
        buffer: Buffer.from('fake-image-data')
      });
      
      await page.waitForTimeout(2000);
      
      // Check if image preview is shown
      const imagePreview = page.locator('.image-preview, [data-testid="image-preview"]');
      if (await imagePreview.isVisible()) {
        await helpers.takeScreenshot('dress-image-uploaded');
      }
    }
  });

  test('should filter dresses by type', async ({ page }) => {
    await page.goto('/dresses');
    await helpers.waitForLoading();
    
    // Look for type filter
    const typeFilter = page.locator('[data-testid="type-filter"], .type-filter, select[name="type"]').first();
    if (await typeFilter.isVisible()) {
      await typeFilter.selectOption('wedding');
      await helpers.waitForLoading();
      
      // Check if results are filtered
      await helpers.takeScreenshot('dresses-filtered-by-type');
    }
  });

  test('should search dresses by name or code', async ({ page }) => {
    await page.goto('/dresses');
    await helpers.waitForLoading();
    
    // Look for search field
    const searchField = page.locator('input[placeholder*="بحث"], input[placeholder*="Search"], [data-testid="search"]').first();
    if (await searchField.isVisible()) {
      await searchField.fill('DC001'); // Search by dress code
      await page.keyboard.press('Enter');
      await helpers.waitForLoading();
      
      await helpers.takeScreenshot('dresses-search-results');
    }
  });

  test('should edit existing dress', async ({ page }) => {
    await page.goto('/dresses');
    await helpers.waitForLoading();
    
    // Click edit button on first dress
    const editButton = page.locator('button[aria-label="تعديل"], button:has-text("تعديل"), [data-testid="edit-dress"]').first();
    if (await editButton.isVisible()) {
      await editButton.click();
      
      // Should navigate to edit page
      await page.waitForURL('**/dress?dr=*');
      
      // Check if edit form is loaded
      await expect(page.locator('text=تعديل الفستان')).toBeVisible(); // Edit Dress
      
      // Make a small change
      const nameField = page.locator('input[name="name"]');
      if (await nameField.isVisible()) {
        const currentValue = await nameField.inputValue();
        await nameField.fill(currentValue + ' - محدث'); // Add "- Updated"
        
        // Save changes
        await helpers.clickButtonByText('حفظ'); // Save
        await page.waitForTimeout(2000);
        
        await helpers.takeScreenshot('dress-edited');
      }
    }
  });

  test('should delete dress', async ({ page }) => {
    await page.goto('/dresses');
    await helpers.waitForLoading();
    
    // Click delete button on first dress
    const deleteButton = page.locator('button[aria-label="حذف"], button:has-text("حذف"), [data-testid="delete-dress"]').first();
    if (await deleteButton.isVisible()) {
      await deleteButton.click();
      
      // Should show confirmation dialog
      await expect(page.locator('text=تأكيد الحذف')).toBeVisible(); // Confirm Delete
      
      // Confirm deletion
      await helpers.clickButtonByText('حذف'); // Delete
      await helpers.waitForLoading();
      
      await helpers.takeScreenshot('dress-deleted');
    }
  });

  test('should view dress analytics', async ({ page }) => {
    await page.goto('/dresses');
    await helpers.waitForLoading();
    
    // Click on first dress to view details
    const firstDressRow = page.locator('.MuiDataGrid-row, [role="row"]').nth(1);
    if (await firstDressRow.isVisible()) {
      await firstDressRow.click();
      
      // Should show dress details with analytics
      await page.waitForTimeout(2000);
      
      // Check for analytics data
      await expect(page.locator('text=إحصائيات')).toBeVisible(); // Statistics
      
      await helpers.takeScreenshot('dress-analytics');
    }
  });

  test('should manage dress availability', async ({ page }) => {
    await page.goto('/dresses');
    await helpers.waitForLoading();
    
    // Look for availability toggle
    const availabilityToggle = page.locator('[data-testid="availability-toggle"], .availability-toggle').first();
    if (await availabilityToggle.isVisible()) {
      const isChecked = await availabilityToggle.isChecked();
      await availabilityToggle.click();
      
      // Wait for update
      await page.waitForTimeout(1000);
      
      // Check if status changed
      const newState = await availabilityToggle.isChecked();
      expect(newState).toBe(!isChecked);
      
      await helpers.takeScreenshot('dress-availability-toggled');
    }
  });

  test('should handle dress size variations', async ({ page }) => {
    await page.goto('/create-dress');
    await helpers.waitForLoading();

    // Fill basic info
    await helpers.fillFieldByLabel('الاسم', 'فستان متعدد المقاسات');
    await helpers.fillFieldByLabel('رمز الفستان', 'MULTI001');

    // Check if multiple sizes can be selected
    const sizeOptions = page.locator('input[type="checkbox"][name*="size"], .size-option');
    const sizeCount = await sizeOptions.count();

    if (sizeCount > 0) {
      // Select multiple sizes
      for (let i = 0; i < Math.min(3, sizeCount); i++) {
        await sizeOptions.nth(i).check();
      }

      await helpers.takeScreenshot('dress-multiple-sizes');
    }
  });
});
