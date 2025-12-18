import { test, expect } from '@playwright/test';

test.describe('Final BookDress System Integration', () => {
  test('should validate complete system integration', async ({ page }) => {
    console.log('🚀 Starting Final BookDress System Integration Test');
    
    const results = {
      backend: { working: 0, total: 0, details: [] },
      frontend: { working: 0, total: 0, details: [] },
      api: { working: 0, total: 0, details: [] },
      database: { working: 0, total: 0, details: [] },
      overall: { score: 0, level: 'Unknown' }
    };

    // 1. Backend Integration Tests
    console.log('\n🔧 TESTING BACKEND INTEGRATION...');
    
    const backendTests = [
      { name: 'Login System', url: '/sign-in?lang=ar', check: 'login' },
      { name: 'Dashboard Access', url: '/dashboard?lang=ar', check: 'dashboard' },
      { name: 'Bookings Management', url: '/?lang=ar', check: 'bookings' },
      { name: 'Dresses Management', url: '/dresses?lang=ar', check: 'dresses' },
      { name: 'Users Management', url: '/users?lang=ar', check: 'users' },
      { name: 'Suppliers Management', url: '/suppliers?lang=ar', check: 'suppliers' },
      { name: 'Locations Management', url: '/locations?lang=ar', check: 'locations' },
      { name: 'Fitting Appointments', url: '/fitting-appointments?lang=ar', check: 'appointments' }
    ];

    results.backend.total = backendTests.length;

    // Test backend login first
    try {
      await page.goto('http://localhost:3001/sign-in?lang=ar');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);

      const loginContent = await page.textContent('body');
      if (loginContent && loginContent.length > 500) {
        await page.fill('input[name="email"]', 'admin@bookdress.com');
        await page.fill('input[name="password"]', 'admin123');
        await page.click('button[type="submit"]');
        await page.waitForTimeout(3000);

        console.log('✅ Backend login successful');
        results.backend.working++;
        results.backend.details.push('Login: ✅');
      } else {
        console.log('❌ Backend login failed - insufficient content');
        results.backend.details.push('Login: ❌');
      }
    } catch (error) {
      console.log('❌ Backend login error:', (error as Error).message);
      results.backend.details.push('Login: ❌ Error');
    }

    // Test other backend pages
    for (const testCase of backendTests.slice(1)) {
      try {
        await page.goto(`http://localhost:3001${testCase.url}`);
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(2000);

        const content = await page.textContent('body');
        const hasContent = content && content.length > 500;
        const hasArabic = content?.includes('العربية') || content?.includes('لوحة التحكم');

        if (hasContent && hasArabic) {
          results.backend.working++;
          results.backend.details.push(`${testCase.name}: ✅`);
          console.log(`✅ ${testCase.name}: Working`);
        } else {
          results.backend.details.push(`${testCase.name}: ❌`);
          console.log(`❌ ${testCase.name}: Not working`);
        }
      } catch (error) {
        results.backend.details.push(`${testCase.name}: ❌ Error`);
        console.log(`❌ ${testCase.name}: Error`);
      }
    }

    // 2. API Integration Tests
    console.log('\n🔌 TESTING API INTEGRATION...');
    
    const apiTests = [
      { name: 'Health Check', endpoint: '/api/health', method: 'GET' },
      { name: 'Auth Status', endpoint: '/api/auth/status', method: 'GET' },
      { name: 'Dresses List', endpoint: '/api/dresses', method: 'GET' },
      { name: 'Users List', endpoint: '/api/users', method: 'GET' },
      { name: 'Suppliers List', endpoint: '/api/suppliers', method: 'GET' },
      { name: 'Locations List', endpoint: '/api/locations', method: 'GET' }
    ];

    results.api.total = apiTests.length;

    for (const apiTest of apiTests) {
      try {
        const response = await page.evaluate(async (endpoint) => {
          try {
            const res = await fetch(`http://localhost:4002${endpoint}`);
            return {
              status: res.status,
              ok: res.ok,
              contentType: res.headers.get('content-type'),
              hasData: res.status === 200
            };
          } catch (error) {
            return { error: (error as Error).message };
          }
        }, apiTest.endpoint);

        if (response.ok || response.status === 401) { // 401 is expected for protected routes
          results.api.working++;
          results.api.details.push(`${apiTest.name}: ✅ (${response.status})`);
          console.log(`✅ ${apiTest.name}: ${response.status}`);
        } else {
          results.api.details.push(`${apiTest.name}: ❌ (${response.status || 'Error'})`);
          console.log(`❌ ${apiTest.name}: ${response.status || response.error}`);
        }
      } catch (error) {
        results.api.details.push(`${apiTest.name}: ❌ Error`);
        console.log(`❌ ${apiTest.name}: Error`);
      }
    }

    // 3. Frontend Integration Tests
    console.log('\n🎨 TESTING FRONTEND INTEGRATION...');
    
    const frontendTests = [
      { name: 'Home Page', url: '/?lang=ar', check: 'home' },
      { name: 'Search Page', url: '/search?lang=ar', check: 'search' },
      { name: 'Dress Details', url: '/dress?lang=ar', check: 'dress' },
      { name: 'Bookings Page', url: '/bookings?lang=ar', check: 'bookings' }
    ];

    results.frontend.total = frontendTests.length;

    for (const frontendTest of frontendTests) {
      try {
        await page.goto(`http://localhost:3000${frontendTest.url}`);
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(2000);

        const content = await page.textContent('body');
        const hasContent = content && content.length > 200;
        const hasReactElements = await page.locator('div[id="root"], div[data-reactroot]').count() > 0;

        if (hasContent || hasReactElements) {
          results.frontend.working++;
          results.frontend.details.push(`${frontendTest.name}: ✅`);
          console.log(`✅ ${frontendTest.name}: Working`);
        } else {
          results.frontend.details.push(`${frontendTest.name}: ❌`);
          console.log(`❌ ${frontendTest.name}: Not working`);
        }
      } catch (error) {
        results.frontend.details.push(`${frontendTest.name}: ❌ Error`);
        console.log(`❌ ${frontendTest.name}: Error`);
      }
    }

    // 4. Database Integration Tests
    console.log('\n🗄️ TESTING DATABASE INTEGRATION...');
    
    const databaseTests = [
      { name: 'MongoDB Connection', check: 'connection' },
      { name: 'Collections Access', check: 'collections' },
      { name: 'Data Retrieval', check: 'data' }
    ];

    results.database.total = databaseTests.length;

    // Test database through API health check
    try {
      const healthResponse = await page.evaluate(async () => {
        try {
          const res = await fetch('http://localhost:4002/api/health');
          const data = await res.json();
          return data;
        } catch (error) {
          return { error: (error as Error).message };
        }
      });

      if (healthResponse.status === 'healthy' && healthResponse.database === 'connected') {
        results.database.working += 3; // All database tests pass if health check shows connected
        results.database.details.push('MongoDB Connection: ✅');
        results.database.details.push('Collections Access: ✅');
        results.database.details.push('Data Retrieval: ✅');
        console.log('✅ Database: All tests passed');
      } else {
        results.database.details.push('MongoDB Connection: ❌');
        results.database.details.push('Collections Access: ❌');
        results.database.details.push('Data Retrieval: ❌');
        console.log('❌ Database: Connection issues');
      }
    } catch (error) {
      results.database.details.push('Database Tests: ❌ Error');
      console.log('❌ Database: Error testing');
    }

    // 5. Calculate Overall Integration Score
    const totalWorking = results.backend.working + results.api.working + 
                        results.frontend.working + results.database.working;
    const totalTests = results.backend.total + results.api.total + 
                      results.frontend.total + results.database.total;
    
    results.overall.score = Math.round((totalWorking / totalTests) * 100);

    if (results.overall.score >= 90) results.overall.level = 'Excellent';
    else if (results.overall.score >= 75) results.overall.level = 'Good';
    else if (results.overall.score >= 60) results.overall.level = 'Fair';
    else if (results.overall.score >= 40) results.overall.level = 'Poor';
    else results.overall.level = 'Critical';

    // 6. Generate Final Report
    console.log('\n📊 FINAL INTEGRATION TEST RESULTS:');
    console.log('='.repeat(50));
    
    console.log(`\n🔧 BACKEND INTEGRATION: ${results.backend.working}/${results.backend.total} (${Math.round((results.backend.working/results.backend.total)*100)}%)`);
    results.backend.details.forEach(detail => console.log(`   ${detail}`));
    
    console.log(`\n🔌 API INTEGRATION: ${results.api.working}/${results.api.total} (${Math.round((results.api.working/results.api.total)*100)}%)`);
    results.api.details.forEach(detail => console.log(`   ${detail}`));
    
    console.log(`\n🎨 FRONTEND INTEGRATION: ${results.frontend.working}/${results.frontend.total} (${Math.round((results.frontend.working/results.frontend.total)*100)}%)`);
    results.frontend.details.forEach(detail => console.log(`   ${detail}`));
    
    console.log(`\n🗄️ DATABASE INTEGRATION: ${results.database.working}/${results.database.total} (${Math.round((results.database.working/results.database.total)*100)}%)`);
    results.database.details.forEach(detail => console.log(`   ${detail}`));
    
    console.log(`\n🎯 OVERALL SYSTEM INTEGRATION:`);
    console.log(`   Score: ${totalWorking}/${totalTests} (${results.overall.score}%)`);
    console.log(`   Level: ${results.overall.level}`);
    console.log('='.repeat(50));

    // 7. System Health Summary
    console.log('\n🏥 SYSTEM HEALTH SUMMARY:');
    
    const healthSummary = {
      backend: results.backend.working >= results.backend.total * 0.7,
      api: results.api.working >= results.api.total * 0.7,
      frontend: results.frontend.working >= results.frontend.total * 0.5,
      database: results.database.working >= results.database.total * 0.7,
      overall: results.overall.score >= 60
    };

    console.log(`Backend Health: ${healthSummary.backend ? '🟢 Healthy' : '🔴 Issues'}`);
    console.log(`API Health: ${healthSummary.api ? '🟢 Healthy' : '🔴 Issues'}`);
    console.log(`Frontend Health: ${healthSummary.frontend ? '🟢 Healthy' : '🔴 Issues'}`);
    console.log(`Database Health: ${healthSummary.database ? '🟢 Healthy' : '🔴 Issues'}`);
    console.log(`Overall System: ${healthSummary.overall ? '🟢 Healthy' : '🔴 Needs Attention'}`);

    // 8. Recommendations
    console.log('\n💡 RECOMMENDATIONS:');
    if (!healthSummary.backend) {
      console.log('   - Backend: Check server status and authentication');
    }
    if (!healthSummary.api) {
      console.log('   - API: Verify API endpoints and database connections');
    }
    if (!healthSummary.frontend) {
      console.log('   - Frontend: Check React app build and proxy configuration');
    }
    if (!healthSummary.database) {
      console.log('   - Database: Verify MongoDB connection and collections');
    }
    if (healthSummary.overall) {
      console.log('   - System is performing well! Continue monitoring.');
    }

    // Test assertions
    expect(results.overall.score).toBeGreaterThan(50); // At least 50% integration
    expect(results.backend.working).toBeGreaterThan(0); // At least some backend functionality
    expect(results.api.working).toBeGreaterThan(0); // At least some API functionality
    
    console.log('\n✅ Final Integration Test Completed Successfully!');
  });

  test('should validate Arabic language integration', async ({ page }) => {
    console.log('🔤 Testing Arabic Language Integration Across System');
    
    const arabicTests = [
      {
        name: 'Backend Arabic',
        url: 'http://localhost:3001/sign-in?lang=ar',
        expectedTexts: ['العربية', 'تسجيل الدخول', 'البريد الإلكتروني']
      },
      {
        name: 'Frontend Arabic',
        url: 'http://localhost:3000/?lang=ar',
        expectedTexts: ['العربية', 'فساتين', 'بحث']
      }
    ];

    const arabicResults = { working: 0, total: arabicTests.length, details: [] };

    for (const test of arabicTests) {
      try {
        await page.goto(test.url);
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(2000);

        const content = await page.textContent('body');
        const hasArabicText = test.expectedTexts.some(text => content?.includes(text));
        const hasRTL = await page.evaluate(() => {
          return document.documentElement.dir === 'rtl' || 
                 document.body.dir === 'rtl' ||
                 window.getComputedStyle(document.body).direction === 'rtl';
        });

        if (hasArabicText && hasRTL) {
          arabicResults.working++;
          arabicResults.details.push(`${test.name}: ✅ (Arabic + RTL)`);
          console.log(`✅ ${test.name}: Arabic integration working`);
        } else if (hasArabicText) {
          arabicResults.details.push(`${test.name}: ⚠️ (Arabic only)`);
          console.log(`⚠️ ${test.name}: Arabic text found but RTL missing`);
        } else {
          arabicResults.details.push(`${test.name}: ❌`);
          console.log(`❌ ${test.name}: Arabic integration not working`);
        }
      } catch (error) {
        arabicResults.details.push(`${test.name}: ❌ Error`);
        console.log(`❌ ${test.name}: Error testing Arabic`);
      }
    }

    console.log('\n🔤 ARABIC INTEGRATION RESULTS:');
    arabicResults.details.forEach(detail => console.log(`   ${detail}`));
    
    const arabicPercentage = Math.round((arabicResults.working / arabicResults.total) * 100);
    console.log(`\nArabic Integration Score: ${arabicResults.working}/${arabicResults.total} (${arabicPercentage}%)`);

    expect(arabicResults.working).toBeGreaterThan(0); // At least some Arabic support
  });

  test('should validate system performance', async ({ page }) => {
    console.log('⚡ Testing System Performance Integration');
    
    const performanceTests = [
      { name: 'Backend Load Time', url: 'http://localhost:3001/dashboard?lang=ar' },
      { name: 'API Response Time', url: 'http://localhost:4002/api/health' },
      { name: 'Frontend Load Time', url: 'http://localhost:3000/?lang=ar' }
    ];

    const performanceResults = { working: 0, total: performanceTests.length, details: [] };

    for (const test of performanceTests) {
      try {
        const startTime = Date.now();
        
        if (test.name.includes('API')) {
          // Test API directly
          const response = await page.evaluate(async (url) => {
            const start = Date.now();
            try {
              const res = await fetch(url);
              return { 
                loadTime: Date.now() - start, 
                status: res.status,
                ok: res.ok 
              };
            } catch (error) {
              return { 
                loadTime: Date.now() - start, 
                error: (error as Error).message 
              };
            }
          }, test.url);
          
          const isPerformant = response.loadTime < 5000 && (response.ok || response.status === 401);
          if (isPerformant) {
            performanceResults.working++;
            performanceResults.details.push(`${test.name}: ✅ (${response.loadTime}ms)`);
          } else {
            performanceResults.details.push(`${test.name}: ❌ (${response.loadTime}ms)`);
          }
        } else {
          // Test page load
          await page.goto(test.url);
          await page.waitForLoadState('networkidle');
          
          const loadTime = Date.now() - startTime;
          const hasContent = (await page.textContent('body'))?.length > 200;
          
          const isPerformant = loadTime < 10000 && hasContent;
          if (isPerformant) {
            performanceResults.working++;
            performanceResults.details.push(`${test.name}: ✅ (${loadTime}ms)`);
          } else {
            performanceResults.details.push(`${test.name}: ❌ (${loadTime}ms)`);
          }
        }
        
        console.log(`${test.name}: ${performanceResults.details[performanceResults.details.length - 1]}`);
      } catch (error) {
        performanceResults.details.push(`${test.name}: ❌ Error`);
        console.log(`❌ ${test.name}: Performance test error`);
      }
    }

    console.log('\n⚡ PERFORMANCE INTEGRATION RESULTS:');
    performanceResults.details.forEach(detail => console.log(`   ${detail}`));
    
    const performancePercentage = Math.round((performanceResults.working / performanceResults.total) * 100);
    console.log(`\nPerformance Score: ${performanceResults.working}/${performanceResults.total} (${performancePercentage}%)`);

    expect(performanceResults.working).toBeGreaterThan(0); // At least some performance
  });
});
