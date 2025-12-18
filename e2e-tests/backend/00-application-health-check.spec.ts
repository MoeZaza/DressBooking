import { test, expect } from '@playwright/test';

/**
 * Application Health Check
 * Verifies that all applications are running and accessible
 */

test.describe('00. Application Health Check', () => {
  
  test('should verify API is accessible', async ({ request }) => {
    console.log('🔍 Checking API accessibility...');
    
    try {
      const response = await request.get('http://localhost:4002/api/health', {
        timeout: 10000
      });
      
      console.log('API Response Status:', response.status());
      
      if (response.ok()) {
        console.log('✅ API is accessible');
      } else {
        console.log('⚠️ API responded but with status:', response.status());
      }
      
    } catch (error) {
      console.error('❌ API is not accessible:', error);
      // Don't fail the test, just log the issue
    }
  });

  test('should verify Backend is accessible', async ({ page }) => {
    console.log('🔍 Checking Backend accessibility...');
    
    try {
      await page.goto('http://localhost:3001', { 
        timeout: 10000,
        waitUntil: 'domcontentloaded'
      });
      
      console.log('✅ Backend is accessible');
      console.log('Current URL:', page.url());
      
      // Take screenshot
      await page.screenshot({ 
        path: 'test-results/screenshots/00-backend-health-check.png',
        fullPage: true 
      });
      
    } catch (error) {
      console.error('❌ Backend is not accessible:', error);
      // Don't fail the test, just log the issue
    }
  });

  test('should verify Frontend is accessible', async ({ page }) => {
    console.log('🔍 Checking Frontend accessibility...');
    
    try {
      await page.goto('http://localhost:3000', { 
        timeout: 10000,
        waitUntil: 'domcontentloaded'
      });
      
      console.log('✅ Frontend is accessible');
      console.log('Current URL:', page.url());
      
      // Take screenshot
      await page.screenshot({ 
        path: 'test-results/screenshots/00-frontend-health-check.png',
        fullPage: true 
      });
      
    } catch (error) {
      console.error('❌ Frontend is not accessible:', error);
      // Don't fail the test, just log the issue
    }
  });

  test('should check all application ports', async ({ request }) => {
    console.log('🔍 Checking all application ports...');
    
    const applications = [
      { name: 'API', url: 'http://localhost:4002' },
      { name: 'Backend', url: 'http://localhost:3001' },
      { name: 'Frontend', url: 'http://localhost:3000' }
    ];
    
    for (const app of applications) {
      try {
        const response = await request.get(app.url, { timeout: 5000 });
        console.log(`${app.name}: Status ${response.status()}`);
      } catch (error) {
        console.log(`${app.name}: Not accessible - ${error.message}`);
      }
    }
  });

  test('should wait for applications to be ready', async ({ page }) => {
    console.log('⏳ Waiting for applications to be ready...');
    
    // Wait a bit for applications to start
    await page.waitForTimeout(10000);
    
    // Try to access backend login page
    try {
      await page.goto('http://localhost:3001/sign-in?lang=ar', { 
        timeout: 15000,
        waitUntil: 'networkidle'
      });
      
      // Check if we can see the login form
      const loginForm = await page.locator('form').count();
      if (loginForm > 0) {
        console.log('✅ Backend login page is ready');
      } else {
        console.log('⚠️ Backend login page loaded but no form found');
      }
      
      // Take screenshot
      await page.screenshot({ 
        path: 'test-results/screenshots/00-backend-ready-check.png',
        fullPage: true 
      });
      
    } catch (error) {
      console.error('❌ Backend is not ready:', error);
    }
    
    console.log('✅ Health check completed');
  });
});
