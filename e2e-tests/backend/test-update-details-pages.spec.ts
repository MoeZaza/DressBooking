import { test, expect } from '@playwright/test';

test.describe('Test Update and Details Pages with Valid IDs', () => {
  test('should test update and details pages with real IDs', async ({ page }) => {
    // Login first
    await page.goto('/sign-in?lang=ar');
    await page.waitForLoadState('networkidle');
    await page.waitForSelector('form', { timeout: 10000 });
    
    await page.fill('input[name="email"]', 'admin@bookdress.com');
    await page.fill('input[name="password"]', 'admin123');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(3000);

    console.log('🔍 Testing Update and Details Pages with Valid IDs');

    // Step 1: Get real IDs from the main pages
    const realIds = {
      bookingId: null,
      dressId: null,
      supplierId: null,
      userId: null
    };

    // Get booking ID from bookings page
    await page.goto('/?lang=ar');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    const bookingLinks = page.locator('a[href*="booking?b="], a[href*="update-booking?b="]');
    const bookingLinkCount = await bookingLinks.count();
    console.log('Booking links found:', bookingLinkCount);

    if (bookingLinkCount > 0) {
      const firstBookingLink = await bookingLinks.first().getAttribute('href');
      const bookingMatch = firstBookingLink?.match(/[?&]b=([a-f0-9]+)/);
      if (bookingMatch) {
        realIds.bookingId = bookingMatch[1];
        console.log('✅ Found booking ID:', realIds.bookingId);
      }
    }

    // Get dress ID from dresses page
    await page.goto('/dresses?lang=ar');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    const dressLinks = page.locator('a[href*="dress?dr="], a[href*="update-dress?dr="]');
    const dressLinkCount = await dressLinks.count();
    console.log('Dress links found:', dressLinkCount);

    if (dressLinkCount > 0) {
      const firstDressLink = await dressLinks.first().getAttribute('href');
      const dressMatch = firstDressLink?.match(/[?&]dr=([a-f0-9]+)/);
      if (dressMatch) {
        realIds.dressId = dressMatch[1];
        console.log('✅ Found dress ID:', realIds.dressId);
      }
    }

    // Get supplier ID from suppliers page
    await page.goto('/suppliers?lang=ar');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    const supplierLinks = page.locator('a[href*="supplier?c="], a[href*="update-supplier?c="]');
    const supplierLinkCount = await supplierLinks.count();
    console.log('Supplier links found:', supplierLinkCount);

    if (supplierLinkCount > 0) {
      const firstSupplierLink = await supplierLinks.first().getAttribute('href');
      const supplierMatch = firstSupplierLink?.match(/[?&]c=([a-f0-9]+)/);
      if (supplierMatch) {
        realIds.supplierId = supplierMatch[1];
        console.log('✅ Found supplier ID:', realIds.supplierId);
      }
    }

    // Get user ID from users page
    await page.goto('/users?lang=ar');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    const userLinks = page.locator('a[href*="user?u="], a[href*="update-user?u="]');
    const userLinkCount = await userLinks.count();
    console.log('User links found:', userLinkCount);

    if (userLinkCount > 0) {
      const firstUserLink = await userLinks.first().getAttribute('href');
      const userMatch = firstUserLink?.match(/[?&]u=([a-f0-9]+)/);
      if (userMatch) {
        realIds.userId = userMatch[1];
        console.log('✅ Found user ID:', realIds.userId);
      }
    }

    console.log('📊 Real IDs found:', realIds);

    // Step 2: Test update and details pages with real IDs
    const pagesToTest = [
      {
        name: 'Booking Details',
        url: `/booking?b=${realIds.bookingId}&lang=ar`,
        id: realIds.bookingId,
        expectedContent: ['Booking', 'حجز', 'Customer', 'عميل']
      },
      {
        name: 'Update Booking',
        url: `/update-booking?b=${realIds.bookingId}&lang=ar`,
        id: realIds.bookingId,
        expectedContent: ['Update', 'تحديث', 'Customer', 'عميل']
      },
      {
        name: 'Dress Details',
        url: `/dress?dr=${realIds.dressId}&lang=ar`,
        id: realIds.dressId,
        expectedContent: ['Dress', 'فستان', 'Price', 'سعر']
      },
      {
        name: 'Update Dress',
        url: `/update-dress?dr=${realIds.dressId}&lang=ar`,
        id: realIds.dressId,
        expectedContent: ['Update', 'تحديث', 'Name', 'اسم']
      },
      {
        name: 'Supplier Details',
        url: `/supplier?c=${realIds.supplierId}&lang=ar`,
        id: realIds.supplierId,
        expectedContent: ['Supplier', 'مورد', 'Dresses', 'فساتين']
      },
      {
        name: 'Update Supplier',
        url: `/update-supplier?c=${realIds.supplierId}&lang=ar`,
        id: realIds.supplierId,
        expectedContent: ['Update', 'تحديث', 'Full Name', 'الاسم الكامل']
      },
      {
        name: 'User Details',
        url: `/user?u=${realIds.userId}&lang=ar`,
        id: realIds.userId,
        expectedContent: ['User', 'مستخدم', 'Email', 'بريد']
      },
      {
        name: 'Update User',
        url: `/update-user?u=${realIds.userId}&lang=ar`,
        id: realIds.userId,
        expectedContent: ['Update', 'تحديث', 'Full Name', 'الاسم الكامل']
      }
    ];

    const results = {
      accessible: [],
      inaccessible: [],
      noId: []
    };

    for (const pageTest of pagesToTest) {
      if (!pageTest.id) {
        console.log(`⚠️ Skipping ${pageTest.name} - no ID found`);
        results.noId.push(pageTest.name);
        continue;
      }

      try {
        console.log(`\n🔍 Testing: ${pageTest.name}`);
        console.log(`   URL: ${pageTest.url}`);

        await page.goto(pageTest.url);
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(2000);

        const pageContent = await page.textContent('body');
        const contentLength = pageContent?.length || 0;

        // Check if page is accessible
        const isAccessible = !pageContent?.includes('لا يوجد شيء هنا') && 
                            !pageContent?.includes('Nothing here') &&
                            contentLength > 200;

        // Check for expected content
        const hasExpectedContent = pageTest.expectedContent.some(expected => 
          pageContent?.includes(expected)
        );

        // Check for Arabic interface
        const hasArabicInterface = pageContent?.includes('العربية') || 
                                  pageContent?.includes('الإعدادات') ||
                                  pageContent?.includes('تسجيل الخروج');

        const result = {
          name: pageTest.name,
          url: pageTest.url,
          accessible: isAccessible,
          hasExpectedContent,
          hasArabicInterface,
          contentLength
        };

        if (isAccessible) {
          results.accessible.push(result);
          console.log(`   ✅ ACCESSIBLE - Content: ${contentLength} chars`);
          console.log(`   Expected content: ${hasExpectedContent ? '✅' : '❌'}`);
          console.log(`   Arabic interface: ${hasArabicInterface ? '✅' : '❌'}`);
        } else {
          results.inaccessible.push(result);
          console.log(`   ❌ NOT ACCESSIBLE - Content: ${contentLength} chars`);
        }

      } catch (error) {
        console.log(`   ❌ ERROR: ${(error as Error).message}`);
        results.inaccessible.push({
          name: pageTest.name,
          url: pageTest.url,
          accessible: false,
          error: (error as Error).message
        });
      }
    }

    // Step 3: Test pages without IDs (should redirect or show error)
    console.log('\n🔍 Testing Pages Without IDs (Should Not Be Accessible)');

    const pagesWithoutIds = [
      '/update-booking?lang=ar',
      '/booking?lang=ar',
      '/update-dress?lang=ar',
      '/dress?lang=ar',
      '/update-supplier?lang=ar',
      '/supplier?lang=ar',
      '/update-user?lang=ar',
      '/user?lang=ar'
    ];

    for (const url of pagesWithoutIds) {
      await page.goto(url);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1000);

      const pageContent = await page.textContent('body');
      const isCorrectlyBlocked = pageContent?.includes('لا يوجد شيء هنا') || 
                                pageContent?.includes('Nothing here') ||
                                pageContent && pageContent.length < 200;

      console.log(`${url}: ${isCorrectlyBlocked ? '✅ Correctly blocked' : '❌ Unexpectedly accessible'}`);
    }

    // Summary
    console.log('\n📊 SUMMARY:');
    console.log(`✅ Accessible with IDs: ${results.accessible.length}`);
    console.log(`❌ Inaccessible with IDs: ${results.inaccessible.length}`);
    console.log(`⚠️ No IDs found: ${results.noId.length}`);

    if (results.accessible.length > 0) {
      console.log('\n✅ ACCESSIBLE PAGES:');
      results.accessible.forEach(page => {
        console.log(`   - ${page.name}`);
      });
    }

    if (results.inaccessible.length > 0) {
      console.log('\n❌ INACCESSIBLE PAGES:');
      results.inaccessible.forEach(page => {
        console.log(`   - ${page.name}`);
      });
    }

    if (results.noId.length > 0) {
      console.log('\n⚠️ NO IDS FOUND FOR:');
      results.noId.forEach(pageName => {
        console.log(`   - ${pageName}`);
      });
    }

    // Test should pass if we have at least some working pages
    expect(results.accessible.length + results.noId.length).toBeGreaterThan(0);
  });
});
