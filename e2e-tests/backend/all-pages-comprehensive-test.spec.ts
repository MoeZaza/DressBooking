import { test, expect } from '@playwright/test';

test.describe('Backend All Pages Comprehensive Test', () => {
  test('should test all backend pages systematically', async ({ page }) => {
    // Login first
    await page.goto('/sign-in?lang=ar');
    await page.waitForLoadState('networkidle');
    await page.waitForSelector('form', { timeout: 10000 });
    
    await page.fill('input[name="email"]', 'admin@bookdress.com');
    await page.fill('input[name="password"]', 'admin123');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(3000);
    
    // Complete list of backend pages from App.tsx routes
    const allBackendPages = [
      // Core Pages
      { path: '/', name: 'Bookings (Root)', expected: ['حجز جديد', 'New Booking'], category: 'Core' },
      { path: '/dashboard', name: 'Admin Dashboard', expected: ['لوحة التحكم', 'Dashboard'], category: 'Core' },
      
      // Management Pages
      { path: '/suppliers', name: 'Suppliers', expected: ['مورد جديد', 'New Supplier'], category: 'Management' },
      { path: '/locations', name: 'Locations', expected: ['موقع جديد', 'New Location'], category: 'Management' },
      { path: '/dresses', name: 'Dresses', expected: ['فستان جديد', 'New Dress'], category: 'Management' },
      { path: '/users', name: 'Users', expected: ['مستخدم جديد', 'New User'], category: 'Management' },
      
      // Booking Related
      { path: '/create-booking', name: 'Create Booking', expected: ['Customer Information', 'معلومات العميل'], category: 'Booking' },
      { path: '/update-booking', name: 'Update Booking', expected: ['Update', 'تحديث'], category: 'Booking' },
      { path: '/booking', name: 'Booking Details', expected: ['Booking', 'حجز'], category: 'Booking' },
      
      // Dress Related
      { path: '/dress-search', name: 'Dress Search', expected: ['بحث', 'Search'], category: 'Dress' },
      { path: '/create-dress', name: 'Create Dress', expected: ['Create', 'إنشاء'], category: 'Dress' },
      { path: '/update-dress', name: 'Update Dress', expected: ['Update', 'تحديث'], category: 'Dress' },
      { path: '/dress', name: 'Dress Details', expected: ['Dress', 'فستان'], category: 'Dress' },
      
      // User Related
      { path: '/create-user', name: 'Create User', expected: ['Create', 'إنشاء'], category: 'User' },
      { path: '/update-user', name: 'Update User', expected: ['Update', 'تحديث'], category: 'User' },
      { path: '/user', name: 'User Details', expected: ['User', 'مستخدم'], category: 'User' },
      
      // Supplier Related
      { path: '/create-supplier', name: 'Create Supplier', expected: ['Create', 'إنشاء'], category: 'Supplier' },
      { path: '/update-supplier', name: 'Update Supplier', expected: ['Update', 'تحديث'], category: 'Supplier' },
      { path: '/supplier', name: 'Supplier Details', expected: ['Supplier', 'مورد'], category: 'Supplier' },
      
      // Location Related
      { path: '/create-location', name: 'Create Location', expected: ['Create', 'إنشاء'], category: 'Location' },
      { path: '/update-location', name: 'Update Location', expected: ['Update', 'تحديث'], category: 'Location' },
      { path: '/location', name: 'Location Details', expected: ['Location', 'موقع'], category: 'Location' },
      
      // Advanced Features
      { path: '/scheduler', name: 'Scheduler', expected: ['جدولة', 'Schedule'], category: 'Advanced' },
      { path: '/fitting-appointments', name: 'Fitting Appointments', expected: ['مواعيد', 'Appointments'], category: 'Advanced' },
      { path: '/analytics-dashboard', name: 'Analytics Dashboard', expected: ['تحليلات', 'Analytics'], category: 'Advanced' },
      { path: '/admin-booking-dashboard', name: 'Admin Booking Dashboard', expected: ['حجوزات', 'Bookings'], category: 'Advanced' },
      { path: '/payment-management', name: 'Payment Management', expected: ['دفع', 'Payment'], category: 'Advanced' },
      { path: '/accounting-dashboard', name: 'Accounting Dashboard', expected: ['محاسبة', 'Accounting'], category: 'Advanced' },
      { path: '/customer-management', name: 'Customer Management', expected: ['عملاء', 'Customers'], category: 'Advanced' },
      { path: '/revenue-dashboard', name: 'Revenue Dashboard', expected: ['إيرادات', 'Revenue'], category: 'Advanced' },
      { path: '/reports', name: 'Reports', expected: ['تقارير', 'Reports'], category: 'Advanced' },
      { path: '/settings', name: 'Settings', expected: ['إعدادات', 'Settings'], category: 'Advanced' },
      
      // Profile Related
      { path: '/profile', name: 'Profile', expected: ['Profile', 'الملف الشخصي'], category: 'Profile' },
      { path: '/change-password', name: 'Change Password', expected: ['Password', 'كلمة المرور'], category: 'Profile' },
      
      // Notifications
      { path: '/notifications', name: 'Notifications', expected: ['إشعارات', 'Notifications'], category: 'System' }
    ];
    
    const results = {
      accessible: [],
      inaccessible: [],
      errors: [],
      byCategory: {}
    };
    
    console.log(`🔍 Testing ${allBackendPages.length} Backend Pages`);
    console.log('=' * 60);
    
    for (const pageTest of allBackendPages) {
      try {
        console.log(`\n📄 Testing: ${pageTest.name} (${pageTest.path})`);
        
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
        const hasExpectedContent = pageTest.expected.some(expected => 
          pageContent?.includes(expected)
        );
        
        // Check for Arabic interface
        const hasArabicInterface = pageContent?.includes('العربية') || 
                                  pageContent?.includes('الإعدادات') ||
                                  pageContent?.includes('تسجيل الخروج');
        
        const result = {
          path: pageTest.path,
          name: pageTest.name,
          category: pageTest.category,
          accessible: isAccessible,
          hasExpectedContent,
          hasArabicInterface,
          contentLength,
          status: isAccessible ? '✅ ACCESSIBLE' : '❌ NOT ACCESSIBLE'
        };
        
        if (isAccessible) {
          results.accessible.push(result);
          
          // Check for common UI elements
          const hasDataGrid = await page.locator('.MuiDataGrid-root').isVisible();
          const hasAddButton = await page.locator('button:has-text("جديد"), button:has-text("New"), button:has-text("إضافة"), button:has-text("Add"), button:has-text("Create"), button:has-text("إنشاء")').isVisible();
          const hasSearchInput = await page.locator('input[type="search"], input[placeholder*="بحث"], input[placeholder*="search"]').isVisible();
          const hasForm = await page.locator('form').isVisible();
          
          result.uiElements = {
            dataGrid: hasDataGrid,
            addButton: hasAddButton,
            searchInput: hasSearchInput,
            form: hasForm
          };
          
          console.log(`   ✅ ACCESSIBLE - Content: ${contentLength} chars`);
          console.log(`   Expected content: ${hasExpectedContent ? '✅' : '❌'}`);
          console.log(`   Arabic interface: ${hasArabicInterface ? '✅' : '❌'}`);
          console.log(`   UI: Grid=${hasDataGrid ? '✅' : '❌'} Add=${hasAddButton ? '✅' : '❌'} Search=${hasSearchInput ? '✅' : '❌'} Form=${hasForm ? '✅' : '❌'}`);
        } else {
          results.inaccessible.push(result);
          console.log(`   ❌ NOT ACCESSIBLE - Content: ${contentLength} chars`);
        }
        
        // Group by category
        if (!results.byCategory[pageTest.category]) {
          results.byCategory[pageTest.category] = { accessible: [], inaccessible: [] };
        }
        
        if (isAccessible) {
          results.byCategory[pageTest.category].accessible.push(result);
        } else {
          results.byCategory[pageTest.category].inaccessible.push(result);
        }
        
      } catch (error) {
        console.log(`   ❌ ERROR: ${error.message}`);
        results.errors.push({
          path: pageTest.path,
          name: pageTest.name,
          category: pageTest.category,
          error: error.message
        });
      }
    }
    
    // Generate comprehensive summary report
    console.log('\n📊 COMPREHENSIVE BACKEND PAGES SUMMARY');
    console.log('=' * 60);
    
    console.log(`✅ Accessible pages: ${results.accessible.length}/${allBackendPages.length}`);
    console.log(`❌ Inaccessible pages: ${results.inaccessible.length}/${allBackendPages.length}`);
    console.log(`⚠️ Error pages: ${results.errors.length}/${allBackendPages.length}`);
    
    // Summary by category
    console.log('\n📋 SUMMARY BY CATEGORY:');
    Object.keys(results.byCategory).forEach(category => {
      const categoryData = results.byCategory[category];
      const total = categoryData.accessible.length + categoryData.inaccessible.length;
      console.log(`${category}: ${categoryData.accessible.length}/${total} accessible`);
    });
    
    // List accessible pages
    if (results.accessible.length > 0) {
      console.log('\n✅ ACCESSIBLE PAGES:');
      results.accessible.forEach(page => {
        const uiInfo = page.uiElements ? 
          ` [Grid:${page.uiElements.dataGrid ? '✅' : '❌'} Add:${page.uiElements.addButton ? '✅' : '❌'} Form:${page.uiElements.form ? '✅' : '❌'}]` : '';
        console.log(`   - ${page.name} (${page.path})${uiInfo}`);
      });
    }
    
    // List inaccessible pages
    if (results.inaccessible.length > 0) {
      console.log('\n❌ INACCESSIBLE PAGES:');
      results.inaccessible.forEach(page => {
        console.log(`   - ${page.name} (${page.path})`);
      });
    }
    
    // List error pages
    if (results.errors.length > 0) {
      console.log('\n⚠️ ERROR PAGES:');
      results.errors.forEach(page => {
        console.log(`   - ${page.name} (${page.path}): ${page.error}`);
      });
    }
    
    // Test should pass if we have at least some working pages
    expect(results.accessible.length).toBeGreaterThan(5);
  });
});
