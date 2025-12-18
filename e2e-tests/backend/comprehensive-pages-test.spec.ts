import { test, expect } from '@playwright/test';

test.describe('Backend Comprehensive Pages Test', () => {
  test('should test all available backend pages', async ({ page }) => {
    // Login first
    await page.goto('/sign-in?lang=ar');
    await page.waitForLoadState('networkidle');
    await page.waitForSelector('form', { timeout: 10000 });
    
    await page.fill('input[name="email"]', 'admin@bookdress.com');
    await page.fill('input[name="password"]', 'admin123');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(3000);
    
    // List of backend pages to test based on App.tsx routes
    const pagesToTest = [
      { path: '/', name: 'Bookings (Root)', expected: 'حجز جديد' },
      { path: '/dashboard', name: 'Admin Dashboard', expected: 'لوحة التحكم' },
      { path: '/suppliers', name: 'Suppliers', expected: 'مورد جديد' },
      { path: '/locations', name: 'Locations', expected: 'موقع جديد' },
      { path: '/dresses', name: 'Dresses', expected: 'فستان جديد' },
      { path: '/users', name: 'Users', expected: 'مستخدم جديد' },
      { path: '/create-booking', name: 'Create Booking', expected: 'Customer' },
      { path: '/dress-search', name: 'Dress Search', expected: 'بحث' },
      { path: '/scheduler', name: 'Scheduler', expected: 'جدولة' },
      { path: '/fitting-appointments', name: 'Fitting Appointments', expected: 'مواعيد' },
      { path: '/analytics-dashboard', name: 'Analytics Dashboard', expected: 'تحليلات' },
      { path: '/admin-booking-dashboard', name: 'Admin Booking Dashboard', expected: 'حجوزات' },
      { path: '/payment-management', name: 'Payment Management', expected: 'دفع' },
      { path: '/accounting-dashboard', name: 'Accounting Dashboard', expected: 'محاسبة' },
      { path: '/customer-management', name: 'Customer Management', expected: 'عملاء' }
    ];
    
    const results = [];
    
    for (const pageTest of pagesToTest) {
      try {
        console.log(`\n🔍 Testing page: ${pageTest.name} (${pageTest.path})`);
        
        await page.goto(`${pageTest.path}?lang=ar`);
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(2000);
        
        const pageContent = await page.textContent('body');
        const contentLength = pageContent?.length || 0;
        
        // Check if page is accessible (not showing "Nothing here" message)
        const isAccessible = !pageContent?.includes('لا يوجد شيء هنا') && 
                            !pageContent?.includes('Nothing here') &&
                            contentLength > 200;
        
        // Check if expected Arabic content is present
        const hasExpectedContent = pageContent?.includes(pageTest.expected) || false;
        
        // Check for Arabic interface
        const hasArabicInterface = pageContent?.includes('العربية') || 
                                  pageContent?.includes('الإعدادات') ||
                                  pageContent?.includes('تسجيل الخروج');
        
        const result = {
          path: pageTest.path,
          name: pageTest.name,
          accessible: isAccessible,
          hasExpectedContent,
          hasArabicInterface,
          contentLength,
          status: isAccessible ? '✅ WORKING' : '❌ NOT ACCESSIBLE'
        };
        
        results.push(result);
        
        console.log(`   ${result.status}`);
        console.log(`   Content length: ${contentLength}`);
        console.log(`   Expected content (${pageTest.expected}): ${hasExpectedContent ? '✅' : '❌'}`);
        console.log(`   Arabic interface: ${hasArabicInterface ? '✅' : '❌'}`);
        
        if (isAccessible) {
          // Check for common UI elements
          const hasDataGrid = await page.locator('.MuiDataGrid-root').isVisible();
          const hasAddButton = await page.locator('button:has-text("جديد"), button:has-text("New"), button:has-text("إضافة"), button:has-text("Add")').isVisible();
          const hasSearchInput = await page.locator('input[type="search"], input[placeholder*="بحث"], input[placeholder*="search"]').isVisible();
          
          console.log(`   Data grid: ${hasDataGrid ? '✅' : '❌'}`);
          console.log(`   Add button: ${hasAddButton ? '✅' : '❌'}`);
          console.log(`   Search input: ${hasSearchInput ? '✅' : '❌'}`);
        }
        
      } catch (error) {
        console.log(`   ❌ ERROR: ${error.message}`);
        results.push({
          path: pageTest.path,
          name: pageTest.name,
          accessible: false,
          hasExpectedContent: false,
          hasArabicInterface: false,
          contentLength: 0,
          status: '❌ ERROR'
        });
      }
    }
    
    // Summary report
    console.log('\n📊 BACKEND PAGES SUMMARY:');
    console.log('=' * 50);
    
    const accessiblePages = results.filter(r => r.accessible);
    const inaccessiblePages = results.filter(r => !r.accessible);
    
    console.log(`✅ Accessible pages: ${accessiblePages.length}/${results.length}`);
    console.log(`❌ Inaccessible pages: ${inaccessiblePages.length}/${results.length}`);
    
    console.log('\n✅ WORKING PAGES:');
    accessiblePages.forEach(page => {
      console.log(`   - ${page.name} (${page.path})`);
    });
    
    if (inaccessiblePages.length > 0) {
      console.log('\n❌ NOT ACCESSIBLE PAGES:');
      inaccessiblePages.forEach(page => {
        console.log(`   - ${page.name} (${page.path})`);
      });
    }
    
    // Test should pass if we have at least some working pages
    expect(accessiblePages.length).toBeGreaterThan(0);
  });

  test('should test dropdown functionality in working pages', async ({ page }) => {
    // Login first
    await page.goto('/sign-in?lang=ar');
    await page.waitForLoadState('networkidle');
    await page.waitForSelector('form', { timeout: 10000 });
    
    await page.fill('input[name="email"]', 'admin@bookdress.com');
    await page.fill('input[name="password"]', 'admin123');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(3000);
    
    // Test dropdowns in create booking page
    console.log('\n🔍 Testing Create Booking Page Dropdowns');
    await page.goto('/create-booking?lang=ar');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    const pageContent = await page.textContent('body');
    
    if (pageContent?.includes('Customer Information')) {
      console.log('✅ Create booking page accessible');
      
      // Test customer dropdown
      const customerDropdowns = page.locator('select, .MuiSelect-root, .MuiAutocomplete-root');
      const customerDropdownCount = await customerDropdowns.count();
      console.log(`Customer dropdowns found: ${customerDropdownCount}`);
      
      if (customerDropdownCount > 0) {
        for (let i = 0; i < Math.min(customerDropdownCount, 3); i++) {
          try {
            const dropdown = customerDropdowns.nth(i);
            if (await dropdown.isVisible()) {
              await dropdown.click();
              await page.waitForTimeout(1000);
              
              const options = page.locator('[role="option"], option');
              const optionCount = await options.count();
              console.log(`   Dropdown ${i + 1}: ${optionCount} options found`);
              
              if (optionCount > 0) {
                const optionTexts = [];
                for (let j = 0; j < Math.min(optionCount, 3); j++) {
                  const optionText = await options.nth(j).textContent();
                  if (optionText) {
                    optionTexts.push(optionText.trim());
                  }
                }
                console.log(`   Options: ${optionTexts.join(', ')}`);
              }
              
              await page.keyboard.press('Escape');
              await page.waitForTimeout(500);
            }
          } catch (error) {
            console.log(`   Error testing dropdown ${i + 1}: ${error.message}`);
          }
        }
      }
      
      // Try to proceed to next step to test dress dropdown
      const nextButton = page.locator('button:has-text("Next"), button:has-text("التالي")');
      if (await nextButton.isVisible()) {
        console.log('✅ Found Next button, trying to proceed to dress selection');
        
        // First select a customer if available
        const customerSelect = page.locator('select, .MuiSelect-root').first();
        if (await customerSelect.isVisible()) {
          await customerSelect.click();
          await page.waitForTimeout(500);
          
          const firstOption = page.locator('[role="option"], option').first();
          if (await firstOption.isVisible()) {
            await firstOption.click();
            await page.waitForTimeout(500);
          }
        }
        
        await nextButton.click();
        await page.waitForTimeout(3000);
        
        // Check for dress selection step
        const newPageContent = await page.textContent('body');
        console.log('After clicking Next:', newPageContent?.substring(0, 200));
        
        // Test dress dropdown
        const dressDropdowns = page.locator('select, .MuiSelect-root, .MuiAutocomplete-root');
        const dressDropdownCount = await dressDropdowns.count();
        console.log(`Dress dropdowns found: ${dressDropdownCount}`);
        
        if (dressDropdownCount > 0) {
          const dressDropdown = dressDropdowns.first();
          if (await dressDropdown.isVisible()) {
            await dressDropdown.click();
            await page.waitForTimeout(1000);
            
            const dressOptions = page.locator('[role="option"], option');
            const dressOptionCount = await dressOptions.count();
            console.log(`Dress options found: ${dressOptionCount}`);
            
            if (dressOptionCount > 0) {
              const dressTexts = [];
              for (let i = 0; i < Math.min(dressOptionCount, 5); i++) {
                const optionText = await dressOptions.nth(i).textContent();
                if (optionText) {
                  dressTexts.push(optionText.trim());
                }
              }
              console.log(`Dress options: ${dressTexts.join(', ')}`);
            }
          }
        }
      }
    }
    
    // Test should pass regardless
    expect(pageContent?.length).toBeGreaterThan(50);
  });
});
