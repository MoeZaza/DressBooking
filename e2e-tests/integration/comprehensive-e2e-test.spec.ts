import { test, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';

interface TestResult {
  testName: string;
  page: string;
  status: 'PASS' | 'FAIL' | 'WARNING';
  issues: string[];
  screenshot?: string;
  timestamp: string;
  url: string;
  responseTime?: number;
}

class ComprehensiveE2ETester {
  private results: TestResult[] = [];
  private frontendUrl = 'http://localhost:3000';
  private backendUrl = 'http://localhost:3001';
  private apiUrl = 'http://localhost:4002';

  private logTest(testName: string, page: string, status: 'PASS' | 'FAIL' | 'WARNING', issues: string[] = [], url: string = '', responseTime?: number) {
    this.results.push({
      testName,
      page,
      status,
      issues,
      timestamp: new Date().toISOString(),
      url,
      responseTime
    });
    console.log(`${status === 'PASS' ? '✅' : status === 'FAIL' ? '❌' : '⚠️'} ${testName} (${page}): ${status}`);
    if (issues.length > 0) {
      issues.forEach(issue => console.log(`   - ${issue}`));
    }
  }

  async testApplicationAvailability(page: any) {
    console.log('\n🔍 Testing Application Availability...');
    
    const applications = [
      { name: 'Frontend', url: this.frontendUrl },
      { name: 'Backend Admin', url: this.backendUrl },
      { name: 'API Server', url: this.apiUrl }
    ];

    for (const app of applications) {
      const issues: string[] = [];
      try {
        const startTime = Date.now();
        const response = await page.goto(app.url, { waitUntil: 'networkidle', timeout: 30000 });
        const responseTime = Date.now() - startTime;
        
        if (!response.ok()) {
          issues.push(`HTTP ${response.status()}: ${response.statusText()}`);
        }
        
        if (responseTime > 5000) {
          issues.push(`Slow response time: ${responseTime}ms`);
        }

        // Check for basic page structure
        await page.waitForTimeout(2000);
        const title = await page.title();
        if (!title || title === '') {
          issues.push('No page title found');
        }

        this.logTest('Application Availability', app.name, issues.length === 0 ? 'PASS' : 'WARNING', issues, app.url, responseTime);
      } catch (error) {
        issues.push(`Connection failed: ${error.message}`);
        this.logTest('Application Availability', app.name, 'FAIL', issues, app.url);
      }
    }
  }

  async testFrontendPages(page: any) {
    console.log('\n🎨 Testing Frontend Pages...');
    
    const frontendPages = [
      { path: '/', name: 'Home Page' },
      { path: '/sign-in', name: 'Sign In' },
      { path: '/sign-up', name: 'Sign Up' },
      { path: '/search', name: 'Search' },
      { path: '/about', name: 'About' },
      { path: '/contact', name: 'Contact' }
    ];

    for (const pageInfo of frontendPages) {
      const issues: string[] = [];
      try {
        const startTime = Date.now();
        const url = `${this.frontendUrl}${pageInfo.path}`;
        await page.goto(url, { waitUntil: 'networkidle', timeout: 15000 });
        const responseTime = Date.now() - startTime;

        // Test basic page structure
        const title = await page.title();
        if (!title || !title.includes('BookDress')) {
          issues.push('Page title missing or incorrect');
        }

        // Test navigation
        const nav = page.locator('nav, header, .navigation');
        if (!(await nav.isVisible())) {
          issues.push('Navigation not found');
        }

        // Test main content
        const main = page.locator('main, .main-content, [role="main"]');
        if (!(await main.isVisible())) {
          issues.push('Main content area not found');
        }

        // Page-specific tests
        if (pageInfo.path === '/') {
          const searchForm = page.locator('form, .search-form, input[type="search"]');
          if ((await searchForm.count()) === 0) {
            issues.push('Search functionality not found on homepage');
          }
        }

        if (pageInfo.path === '/sign-in' || pageInfo.path === '/sign-up') {
          const form = page.locator('form');
          if (!(await form.isVisible())) {
            issues.push('Authentication form not found');
          }
        }

        if (pageInfo.path === '/search') {
          const filters = page.locator('.filter, .search-filter');
          if ((await filters.count()) === 0) {
            issues.push('Search filters not found');
          }
        }

        this.logTest('Page Load and Structure', pageInfo.name, issues.length === 0 ? 'PASS' : 'WARNING', issues, url, responseTime);
      } catch (error) {
        issues.push(`Page load error: ${error.message}`);
        this.logTest('Page Load and Structure', pageInfo.name, 'FAIL', issues, `${this.frontendUrl}${pageInfo.path}`);
      }
    }
  }

  async testBackendPages(page: any) {
    console.log('\n👑 Testing Backend Admin Pages...');
    
    const backendPages = [
      { path: '/', name: 'Admin Home' },
      { path: '/sign-in', name: 'Admin Sign In' },
      { path: '/dashboard', name: 'Dashboard' },
      { path: '/dresses', name: 'Dress Management' },
      { path: '/bookings', name: 'Booking Management' },
      { path: '/users', name: 'User Management' },
      { path: '/suppliers', name: 'Supplier Management' },
      { path: '/locations', name: 'Location Management' },
      { path: '/analytics', name: 'Analytics' }
    ];

    for (const pageInfo of backendPages) {
      const issues: string[] = [];
      try {
        const startTime = Date.now();
        const url = `${this.backendUrl}${pageInfo.path}`;
        await page.goto(url, { waitUntil: 'networkidle', timeout: 15000 });
        const responseTime = Date.now() - startTime;

        // Check if redirected to sign-in (expected for protected pages)
        const currentUrl = page.url();
        if (currentUrl.includes('/sign-in') && pageInfo.path !== '/sign-in' && pageInfo.path !== '/') {
          issues.push('Redirected to sign-in (authentication required)');
        } else {
          // Test page structure
          const title = await page.title();
          if (!title) {
            issues.push('No page title');
          }

          // Test admin interface elements
          if (!currentUrl.includes('/sign-in')) {
            const sidebar = page.locator('.sidebar, nav, .navigation');
            if (!(await sidebar.isVisible())) {
              issues.push('Admin sidebar/navigation not found');
            }

            const mainContent = page.locator('main, .content, .main-content');
            if (!(await mainContent.isVisible())) {
              issues.push('Main content area not found');
            }

            // Test data tables for management pages
            if (pageInfo.path.includes('management') || ['dresses', 'bookings', 'users', 'suppliers', 'locations'].some(p => pageInfo.path.includes(p))) {
              const dataTable = page.locator('table, .data-grid, .MuiDataGrid-root');
              if ((await dataTable.count()) === 0) {
                issues.push('Data table/grid not found');
              }
            }

            // Test dashboard elements
            if (pageInfo.path === '/dashboard') {
              const charts = page.locator('.chart, canvas, svg[class*="chart"]');
              if ((await charts.count()) === 0) {
                issues.push('Dashboard charts not found');
              }
            }
          }
        }

        this.logTest('Admin Page Structure', pageInfo.name, issues.length === 0 ? 'PASS' : 'WARNING', issues, url, responseTime);
      } catch (error) {
        issues.push(`Page load error: ${error.message}`);
        this.logTest('Admin Page Structure', pageInfo.name, 'FAIL', issues, `${this.backendUrl}${pageInfo.path}`);
      }
    }
  }

  async testAPIEndpoints(page: any) {
    console.log('\n🔌 Testing API Endpoints...');
    
    const apiEndpoints = [
      { path: '/api/health', name: 'Health Check' },
      { path: '/api/locations', name: 'Locations API' },
      { path: '/api/dresses', name: 'Dresses API' },
      { path: '/api/bookings', name: 'Bookings API' },
      { path: '/api/users', name: 'Users API' }
    ];

    for (const endpoint of apiEndpoints) {
      const issues: string[] = [];
      try {
        const startTime = Date.now();
        const url = `${this.apiUrl}${endpoint.path}`;
        const response = await page.request.get(url);
        const responseTime = Date.now() - startTime;

        if (response.status() >= 500) {
          issues.push(`Server error: ${response.status()}`);
        } else if (response.status() === 401 || response.status() === 403) {
          issues.push(`Authentication required: ${response.status()}`);
        } else if (response.status() >= 400) {
          issues.push(`Client error: ${response.status()}`);
        }

        if (responseTime > 3000) {
          issues.push(`Slow API response: ${responseTime}ms`);
        }

        // Check content type for successful responses
        if (response.status() < 400) {
          const contentType = response.headers()['content-type'];
          if (!contentType?.includes('application/json')) {
            issues.push('Non-JSON response from API');
          }
        }

        this.logTest('API Endpoint', endpoint.name, issues.length === 0 ? 'PASS' : 'WARNING', issues, url, responseTime);
      } catch (error) {
        issues.push(`API request failed: ${error.message}`);
        this.logTest('API Endpoint', endpoint.name, 'FAIL', issues, `${this.apiUrl}${endpoint.path}`);
      }
    }
  }

  async testResponsiveDesign(page: any) {
    console.log('\n📱 Testing Responsive Design...');
    
    const viewports = [
      { width: 375, height: 667, name: 'Mobile' },
      { width: 768, height: 1024, name: 'Tablet' },
      { width: 1920, height: 1080, name: 'Desktop' }
    ];

    for (const viewport of viewports) {
      const issues: string[] = [];
      try {
        await page.setViewportSize({ width: viewport.width, height: viewport.height });
        
        // Test frontend responsiveness
        await page.goto(this.frontendUrl);
        await page.waitForLoadState('networkidle');

        const nav = page.locator('nav, header, .navigation');
        if (!(await nav.isVisible())) {
          issues.push(`Frontend navigation not visible on ${viewport.name}`);
        }

        if (viewport.width < 768) {
          const mobileMenu = page.locator('.mobile-menu, .hamburger, .menu-toggle');
          if ((await mobileMenu.count()) === 0) {
            issues.push(`Mobile menu not found on ${viewport.name}`);
          }
        }

        // Test backend responsiveness
        await page.goto(this.backendUrl);
        await page.waitForLoadState('networkidle');

        if (!page.url().includes('/sign-in')) {
          const adminNav = page.locator('.sidebar, nav, .navigation');
          if (!(await adminNav.isVisible())) {
            issues.push(`Backend navigation not visible on ${viewport.name}`);
          }
        }

        this.logTest('Responsive Design', viewport.name, issues.length === 0 ? 'PASS' : 'WARNING', issues);
      } catch (error) {
        issues.push(`Responsive test error: ${error.message}`);
        this.logTest('Responsive Design', viewport.name, 'FAIL', issues);
      }
    }
  }

  async generateComprehensiveReport(): Promise<string> {
    const totalTests = this.results.length;
    const passedTests = this.results.filter(r => r.status === 'PASS').length;
    const failedTests = this.results.filter(r => r.status === 'FAIL').length;
    const warningTests = this.results.filter(r => r.status === 'WARNING').length;

    let report = `# BookDress Comprehensive E2E Test Report\n\n`;
    report += `**Generated:** ${new Date().toISOString()}\n`;
    report += `**Test Environment:** Development\n`;
    report += `**Applications Tested:** Frontend (${this.frontendUrl}), Backend (${this.backendUrl}), API (${this.apiUrl})\n\n`;

    report += `## Executive Summary\n`;
    report += `- **Total Tests:** ${totalTests}\n`;
    report += `- **Passed:** ${passedTests} (${((passedTests / totalTests) * 100).toFixed(1)}%)\n`;
    report += `- **Failed:** ${failedTests} (${((failedTests / totalTests) * 100).toFixed(1)}%)\n`;
    report += `- **Warnings:** ${warningTests} (${((warningTests / totalTests) * 100).toFixed(1)}%)\n`;
    report += `- **Overall Health:** ${failedTests === 0 ? 'GOOD' : failedTests < 5 ? 'FAIR' : 'POOR'}\n\n`;

    // Performance Summary
    const responseTimes = this.results.filter(r => r.responseTime).map(r => r.responseTime!);
    if (responseTimes.length > 0) {
      const avgResponseTime = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;
      const maxResponseTime = Math.max(...responseTimes);
      report += `## Performance Summary\n`;
      report += `- **Average Response Time:** ${avgResponseTime.toFixed(0)}ms\n`;
      report += `- **Maximum Response Time:** ${maxResponseTime}ms\n`;
      report += `- **Performance Grade:** ${avgResponseTime < 1000 ? 'A' : avgResponseTime < 3000 ? 'B' : avgResponseTime < 5000 ? 'C' : 'D'}\n\n`;
    }

    // Detailed Results by Category
    const categories = ['Application Availability', 'Page Load and Structure', 'Admin Page Structure', 'API Endpoint', 'Responsive Design'];
    
    for (const category of categories) {
      const categoryResults = this.results.filter(r => r.testName === category);
      if (categoryResults.length > 0) {
        report += `## ${category}\n`;
        report += `- **Tests:** ${categoryResults.length}\n`;
        report += `- **Passed:** ${categoryResults.filter(r => r.status === 'PASS').length}\n`;
        report += `- **Failed:** ${categoryResults.filter(r => r.status === 'FAIL').length}\n`;
        report += `- **Warnings:** ${categoryResults.filter(r => r.status === 'WARNING').length}\n\n`;
      }
    }

    report += `## Detailed Test Results\n\n`;
    
    for (const result of this.results) {
      const statusIcon = result.status === 'PASS' ? '✅' : result.status === 'FAIL' ? '❌' : '⚠️';
      report += `### ${statusIcon} ${result.testName} - ${result.page}\n`;
      report += `**Status:** ${result.status}\n`;
      if (result.url) report += `**URL:** ${result.url}\n`;
      if (result.responseTime) report += `**Response Time:** ${result.responseTime}ms\n`;
      report += `**Time:** ${result.timestamp}\n`;
      
      if (result.issues.length > 0) {
        report += `**Issues:**\n`;
        for (const issue of result.issues) {
          report += `- ${issue}\n`;
        }
      }
      report += `\n`;
    }

    // Critical Issues
    const criticalIssues = this.results.filter(r => r.status === 'FAIL');
    if (criticalIssues.length > 0) {
      report += `## Critical Issues Requiring Immediate Attention\n\n`;
      for (const issue of criticalIssues) {
        report += `### ❌ ${issue.page} - ${issue.testName}\n`;
        report += `**URL:** ${issue.url}\n`;
        for (const issueText of issue.issues) {
          report += `- ${issueText}\n`;
        }
        report += `\n`;
      }
    }

    // Warnings and Recommendations
    const warnings = this.results.filter(r => r.status === 'WARNING');
    if (warnings.length > 0) {
      report += `## Warnings and Recommendations\n\n`;
      for (const warning of warnings) {
        report += `### ⚠️ ${warning.page} - ${warning.testName}\n`;
        for (const warningText of warning.issues) {
          report += `- ${warningText}\n`;
        }
        report += `\n`;
      }
    }

    report += `## Next Steps\n\n`;
    report += `### Immediate Actions\n`;
    if (failedTests > 0) {
      report += `1. **Fix Critical Issues:** Address all failed tests, particularly application connectivity issues\n`;
      report += `2. **Verify Services:** Ensure all services (Frontend, Backend, API) are running correctly\n`;
      report += `3. **Check Configuration:** Verify environment configuration and database connectivity\n`;
    } else {
      report += `1. **Address Warnings:** Review and fix warning-level issues to improve user experience\n`;
    }
    
    report += `2. **Performance Optimization:** Address slow response times and loading issues\n`;
    report += `3. **Authentication Setup:** Configure test user accounts for complete testing\n`;
    report += `4. **Data Setup:** Ensure test data is available for comprehensive functionality testing\n`;
    
    report += `\n### Continuous Improvement\n`;
    report += `1. **Automated Testing:** Integrate these tests into CI/CD pipeline\n`;
    report += `2. **Regular Monitoring:** Schedule regular E2E test runs\n`;
    report += `3. **Performance Monitoring:** Set up ongoing performance tracking\n`;
    report += `4. **User Acceptance Testing:** Conduct UAT with real users\n`;

    return report;
  }
}

test.describe('BookDress Comprehensive E2E Testing', () => {
  let tester: ComprehensiveE2ETester;

  test.beforeEach(async ({ page }) => {
    tester = new ComprehensiveE2ETester();
  });

  test('Complete Application Testing Suite', async ({ page }) => {
    console.log('🚀 Starting BookDress Comprehensive E2E Testing...');
    
    await tester.testApplicationAvailability(page);
    await tester.testFrontendPages(page);
    await tester.testBackendPages(page);
    await tester.testAPIEndpoints(page);
    await tester.testResponsiveDesign(page);
    
    const report = await tester.generateComprehensiveReport();
    
    // Save report to file
    const reportPath = path.join(process.cwd(), 'test-results', 'comprehensive-e2e-report.md');
    await fs.promises.mkdir(path.dirname(reportPath), { recursive: true });
    await fs.promises.writeFile(reportPath, report);
    
    console.log('\n📊 Test Report Generated:');
    console.log(`File: ${reportPath}`);
    console.log('\n' + report);
  });
});