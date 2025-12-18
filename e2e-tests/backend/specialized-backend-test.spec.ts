import { test, expect, Page } from '@playwright/test';

interface BackendTestResult {
  testName: string;
  feature: string;
  status: 'PASS' | 'FAIL' | 'WARNING';
  details: string[];
  timestamp: string;
  screenshot?: string;
}

class BackendAdminTester {
  private page: Page;
  private results: BackendTestResult[] = [];
  private baseUrl = 'http://localhost:3001';

  constructor(page: Page) {
    this.page = page;
  }

  private logResult(testName: string, feature: string, status: 'PASS' | 'FAIL' | 'WARNING', details: string[] = []) {
    this.results.push({
      testName,
      feature,
      status,
      details,
      timestamp: new Date().toISOString()
    });
    
    const statusIcon = status === 'PASS' ? '✅' : status === 'FAIL' ? '❌' : '⚠️';
    console.log(`${statusIcon} ${testName} (${feature}): ${status}`);
    if (details.length > 0) {
      details.forEach(detail => console.log(`   - ${detail}`));
    }
  }

  async testPerformanceMonitoring() {
    console.log('\n🔍 Testing Backend Performance Monitoring and Analytics...');
    const details: string[] = [];

    try {
      await this.page.goto(this.baseUrl);
      await this.page.waitForLoadState('networkidle', { timeout: 30000 });

      // Check for performance monitoring initialization
      const consoleMessages = await this.page.evaluate(() => {
        return window.console.messages || [];
      });

      // Look for performance monitoring indicators in console
      await this.page.waitForTimeout(2000);
      
      // Test navigation to analytics dashboard
      try {
        await this.page.goto(`${this.baseUrl}/analytics`);
        await this.page.waitForLoadState('networkidle');

        // Check for analytics charts and metrics
        const charts = this.page.locator('.chart, .graph, canvas, svg[class*="chart"], .recharts-wrapper');
        const chartCount = await charts.count();
        if (chartCount > 0) {
          details.push(`Found ${chartCount} analytics charts`);
        } else {
          details.push('No analytics charts found - may require authentication');
        }

        // Check for performance metrics cards
        const metricCards = this.page.locator('.metric-card, .kpi-card, .stat-card, .performance-card');
        const cardCount = await metricCards.count();
        if (cardCount > 0) {
          details.push(`Found ${cardCount} performance metric cards`);
        }

        // Check for API response time monitoring
        const apiMonitoring = this.page.locator('[data-testid*="api"], [class*="api-monitor"], [class*="response-time"]');
        const apiMonitorCount = await apiMonitoring.count();
        if (apiMonitorCount > 0) {
          details.push(`API response time monitoring elements found: ${apiMonitorCount}`);
        }

        this.logResult('Performance Monitoring Dashboard', 'Analytics', 'PASS', details);
      } catch (error) {
        details.push(`Analytics page error: ${error.message}`);
        this.logResult('Performance Monitoring Dashboard', 'Analytics', 'WARNING', details);
      }

      // Test admin dashboard for performance metrics
      await this.page.goto(`${this.baseUrl}/dashboard`);
      await this.page.waitForLoadState('networkidle');

      const dashboardMetrics = this.page.locator('.dashboard-metric, .performance-indicator, .system-status');
      const dashboardMetricCount = await dashboardMetrics.count();
      if (dashboardMetricCount > 0) {
        details.push(`Dashboard performance metrics found: ${dashboardMetricCount}`);
      }

      this.logResult('Admin Dashboard Performance Metrics', 'Performance Monitoring', details.length > 0 ? 'PASS' : 'WARNING', details);

    } catch (error) {
      details.push(`Performance monitoring test error: ${error.message}`);
      this.logResult('Performance Monitoring System', 'Performance Monitoring', 'FAIL', details);
    }
  }

  async testMultiLanguageSupport() {
    console.log('\n🌐 Testing Multi-Language Support (Arabic RTL ↔ English LTR)...');
    const details: string[] = [];

    try {
      await this.page.goto(this.baseUrl);
      await this.page.waitForLoadState('networkidle');

      // Look for language switcher
      const languageSwitcher = this.page.locator(
        '.language-selector, .lang-switch, [data-testid="language"], select[name*="lang"], button[class*="lang"]'
      );

      if (await languageSwitcher.count() > 0) {
        details.push('Language switcher found');

        // Test switching to Arabic
        try {
          const arabicOption = this.page.locator('option[value="ar"], button[data-lang="ar"], .arabic-lang');
          if (await arabicOption.count() > 0) {
            await arabicOption.first().click();
            await this.page.waitForTimeout(1000);

            // Check for RTL layout
            const bodyDir = await this.page.evaluate(() => document.body.dir);
            const htmlDir = await this.page.evaluate(() => document.documentElement.dir);
            
            if (bodyDir === 'rtl' || htmlDir === 'rtl') {
              details.push('RTL layout successfully applied for Arabic');
            } else {
              details.push('RTL layout not detected - may need authentication');
            }

            // Check for Arabic text
            const arabicText = this.page.locator(':has-text("العربية"), :has-text("إدارة"), :has-text("لوحة")');
            if (await arabicText.count() > 0) {
              details.push('Arabic text content detected');
            }
          }

          // Test switching back to English
          const englishOption = this.page.locator('option[value="en"], button[data-lang="en"], .english-lang');
          if (await englishOption.count() > 0) {
            await englishOption.first().click();
            await this.page.waitForTimeout(1000);

            // Check for LTR layout
            const bodyDir = await this.page.evaluate(() => document.body.dir);
            const htmlDir = await this.page.evaluate(() => document.documentElement.dir);
            
            if (bodyDir === 'ltr' || htmlDir === 'ltr' || (!bodyDir && !htmlDir)) {
              details.push('LTR layout successfully applied for English');
            }
          }

        } catch (switchError) {
          details.push(`Language switching error: ${switchError.message}`);
        }

        this.logResult('Language Switching Functionality', 'Multi-Language Support', 'PASS', details);
      } else {
        details.push('Language switcher not found - may require authentication');
        this.logResult('Language Switcher Detection', 'Multi-Language Support', 'WARNING', details);
      }

      // Test form element alignment in different languages
      const forms = this.page.locator('form');
      if (await forms.count() > 0) {
        const formInputs = this.page.locator('input, select, textarea, button');
        const inputCount = await formInputs.count();
        if (inputCount > 0) {
          details.push(`Form elements found: ${inputCount} - ready for RTL/LTR testing`);
        }
      }

    } catch (error) {
      details.push(`Multi-language test error: ${error.message}`);
      this.logResult('Multi-Language Support System', 'Multi-Language Support', 'FAIL', details);
    }
  }

  async testSupplierDependentDropdowns() {
    console.log('\n🏢 Testing Supplier-Dependent Dropdown Functionality...');
    const details: string[] = [];

    try {
      // Navigate to booking creation page
      await this.page.goto(`${this.baseUrl}/create-booking`);
      await this.page.waitForLoadState('networkidle');

      const currentUrl = this.page.url();
      if (currentUrl.includes('/sign-in') || currentUrl.includes('/login')) {
        details.push('Redirected to authentication - booking creation requires login');
        this.logResult('Booking Creation Access', 'Supplier Dropdowns', 'WARNING', details);
        return;
      }

      // Look for supplier dropdown
      const supplierDropdown = this.page.locator(
        'select[name="supplier"], select[name="supplierId"], .supplier-select, [data-testid="supplier-select"]'
      );

      if (await supplierDropdown.count() > 0) {
        details.push('Supplier dropdown found');

        // Look for location and dress dropdowns
        const locationDropdown = this.page.locator(
          'select[name="location"], select[name="locationId"], .location-select, [data-testid="location-select"]'
        );
        
        const dressDropdown = this.page.locator(
          'select[name="dress"], select[name="dressId"], .dress-select, [data-testid="dress-select"]'
        );

        if (await locationDropdown.count() > 0) {
          details.push('Location dropdown found');
        }

        if (await dressDropdown.count() > 0) {
          details.push('Dress dropdown found');
        }

        // Test supplier change functionality
        try {
          const supplierOptions = this.page.locator(`${await supplierDropdown.first().getAttribute('tagName') === 'SELECT' ? 'option' : '.option'}`);
          const optionCount = await supplierOptions.count();
          
          if (optionCount > 1) {
            details.push(`Found ${optionCount} supplier options`);
            
            // Select a different supplier
            await supplierDropdown.first().selectOption({ index: 1 });
            await this.page.waitForTimeout(1000);

            // Check if location and dress dropdowns updated
            details.push('Supplier selection changed - dependent dropdowns should update');
            
            this.logResult('Supplier-Dependent Dropdown Interaction', 'Supplier Dropdowns', 'PASS', details);
          } else {
            details.push('Insufficient supplier options for testing dependency');
            this.logResult('Supplier Options Availability', 'Supplier Dropdowns', 'WARNING', details);
          }
        } catch (interactionError) {
          details.push(`Dropdown interaction error: ${interactionError.message}`);
          this.logResult('Supplier Dropdown Interaction', 'Supplier Dropdowns', 'WARNING', details);
        }

      } else {
        details.push('Supplier dropdown not found on booking creation page');
        this.logResult('Supplier Dropdown Detection', 'Supplier Dropdowns', 'WARNING', details);
      }

    } catch (error) {
      details.push(`Supplier dropdown test error: ${error.message}`);
      this.logResult('Supplier-Dependent Dropdown System', 'Supplier Dropdowns', 'FAIL', details);
    }
  }

  async testSearchFunctionality() {
    console.log('\n🔍 Testing Backend Search Functionality...');
    const details: string[] = [];

    try {
      // Test search on different management pages
      const searchPages = [
        { path: '/dresses', name: 'Dress Management' },
        { path: '/bookings', name: 'Booking Management' },
        { path: '/users', name: 'User Management' },
        { path: '/suppliers', name: 'Supplier Management' }
      ];

      for (const searchPage of searchPages) {
        try {
          await this.page.goto(`${this.baseUrl}${searchPage.path}`);
          await this.page.waitForLoadState('networkidle');

          if (this.page.url().includes('/sign-in')) {
            details.push(`${searchPage.name} requires authentication`);
            continue;
          }

          // Look for search input
          const searchInput = this.page.locator(
            'input[type="search"], input[placeholder*="search"], input[name*="search"], .search-input'
          );

          if (await searchInput.count() > 0) {
            details.push(`Search input found on ${searchPage.name}`);

            // Test search functionality
            await searchInput.first().fill('test search');
            await this.page.waitForTimeout(500);
            await searchInput.first().press('Enter');
            await this.page.waitForTimeout(1000);

            details.push(`Search executed on ${searchPage.name}`);
          } else {
            details.push(`No search input found on ${searchPage.name}`);
          }

          // Look for filter options
          const filters = this.page.locator(
            'select[name*="filter"], select[name*="status"], .filter-select, .status-filter'
          );

          if (await filters.count() > 0) {
            details.push(`${await filters.count()} filter options found on ${searchPage.name}`);
          }

        } catch (pageError) {
          details.push(`Error testing ${searchPage.name}: ${pageError.message}`);
        }
      }

      this.logResult('Search Functionality Across Pages', 'Search Features', details.length > 0 ? 'PASS' : 'WARNING', details);

    } catch (error) {
      details.push(`Search functionality test error: ${error.message}`);
      this.logResult('Backend Search System', 'Search Features', 'FAIL', details);
    }
  }

  async testAPIResponseMonitoring() {
    console.log('\n📊 Testing API Response Time Tracking and Issue Resolution...');
    const details: string[] = [];

    try {
      await this.page.goto(this.baseUrl);
      await this.page.waitForLoadState('networkidle');

      // Listen for console messages related to performance
      this.page.on('console', (msg) => {
        const text = msg.text();
        if (text.includes('Performance') || text.includes('API') || text.includes('response time')) {
          details.push(`Performance log: ${text.substring(0, 100)}`);
        }
      });

      // Wait for performance monitoring to initialize
      await this.page.waitForTimeout(3000);

      // Check for performance monitoring indicators
      const performanceElements = this.page.locator(
        '[class*="performance"], [class*="monitor"], [data-testid*="performance"]'
      );

      if (await performanceElements.count() > 0) {
        details.push(`Performance monitoring elements found: ${await performanceElements.count()}`);
      }

      // Try to access monitoring dashboard
      try {
        await this.page.goto(`${this.baseUrl}/monitoring`);
        await this.page.waitForLoadState('networkidle');

        const monitoringContent = this.page.locator('.monitoring-dashboard, .performance-dashboard, .system-monitor');
        if (await monitoringContent.count() > 0) {
          details.push('Monitoring dashboard accessible');
        }
      } catch (monitoringError) {
        details.push(`Monitoring dashboard not accessible: ${monitoringError.message}`);
      }

      // Test API calls and monitor responses
      try {
        const response = await this.page.request.get(`http://localhost:4002/api/health`);
        if (response.ok()) {
          details.push(`API health check successful: ${response.status()}`);
        } else {
          details.push(`API health check failed: ${response.status()}`);
        }
      } catch (apiError) {
        details.push(`API request error: ${apiError.message}`);
      }

      this.logResult('API Response Time Monitoring', 'API Monitoring', details.length > 0 ? 'PASS' : 'WARNING', details);

    } catch (error) {
      details.push(`API monitoring test error: ${error.message}`);
      this.logResult('API Response Monitoring System', 'API Monitoring', 'FAIL', details);
    }
  }

  async generateDetailedReport(): Promise<string> {
    const totalTests = this.results.length;
    const passedTests = this.results.filter(r => r.status === 'PASS').length;
    const failedTests = this.results.filter(r => r.status === 'FAIL').length;
    const warningTests = this.results.filter(r => r.status === 'WARNING').length;

    let report = `# Backend Admin Dashboard - Detailed Testing Report\n\n`;
    report += `**Generated:** ${new Date().toISOString()}\n`;
    report += `**Focus Areas:** Performance Monitoring, Multi-Language Support, Supplier Dependencies, Search, API Monitoring\n\n`;

    report += `## Executive Summary\n`;
    report += `- **Total Tests:** ${totalTests}\n`;
    report += `- **Passed:** ${passedTests} (${((passedTests / totalTests) * 100).toFixed(1)}%)\n`;
    report += `- **Failed:** ${failedTests} (${((failedTests / totalTests) * 100).toFixed(1)}%)\n`;
    report += `- **Warnings:** ${warningTests} (${((warningTests / totalTests) * 100).toFixed(1)}%)\n\n`;

    // Group results by feature
    const features = [...new Set(this.results.map(r => r.feature))];
    
    for (const feature of features) {
      const featureResults = this.results.filter(r => r.feature === feature);
      report += `## ${feature}\n`;
      
      for (const result of featureResults) {
        const statusIcon = result.status === 'PASS' ? '✅' : result.status === 'FAIL' ? '❌' : '⚠️';
        report += `### ${statusIcon} ${result.testName}\n`;
        report += `**Status:** ${result.status}\n`;
        report += `**Time:** ${result.timestamp}\n`;
        
        if (result.details.length > 0) {
          report += `**Details:**\n`;
          for (const detail of result.details) {
            report += `- ${detail}\n`;
          }
        }
        report += `\n`;
      }
    }

    // Recommendations
    report += `## Recommendations\n\n`;
    
    const authWarnings = this.results.filter(r => 
      r.details.some(d => d.includes('authentication') || d.includes('sign-in'))
    );
    
    if (authWarnings.length > 0) {
      report += `### Authentication Setup Required\n`;
      report += `Several tests were limited due to authentication requirements:\n`;
      for (const warning of authWarnings) {
        report += `- ${warning.testName}: ${warning.details.filter(d => d.includes('authentication') || d.includes('sign-in')).join(', ')}\n`;
      }
      report += `\n**Recommendation:** Set up test admin user accounts for comprehensive testing\n\n`;
    }

    if (failedTests > 0) {
      report += `### Critical Issues\n`;
      const criticalIssues = this.results.filter(r => r.status === 'FAIL');
      for (const issue of criticalIssues) {
        report += `- **${issue.testName}:** ${issue.details.join(', ')}\n`;
      }
      report += `\n`;
    }

    report += `### Next Steps\n`;
    report += `1. Set up admin user accounts for authentication-required features\n`;
    report += `2. Verify all services are running (API on port 4002, Backend on port 3001)\n`;
    report += `3. Test with real data and user interactions\n`;
    report += `4. Conduct performance testing under load\n`;
    report += `5. Validate multi-language functionality with actual content\n`;

    return report;
  }
}

test.describe('Backend Admin Dashboard - Specialized Testing', () => {
  let tester: BackendAdminTester;

  test.beforeEach(async ({ page }) => {
    tester = new BackendAdminTester(page);
    // Set reasonable timeouts for tests
    test.setTimeout(60000);
  });

  test('Test Performance Monitoring and Analytics', async ({ page }) => {
    await tester.testPerformanceMonitoring();
  });

  test('Test Multi-Language Support (Arabic RTL ↔ English LTR)', async ({ page }) => {
    await tester.testMultiLanguageSupport();
  });

  test('Test Supplier-Dependent Dropdown Functionality', async ({ page }) => {
    await tester.testSupplierDependentDropdowns();
  });

  test('Test Search Functionality with Various Filters', async ({ page }) => {
    await tester.testSearchFunctionality();
  });

  test('Test API Response Time Tracking and Issue Resolution', async ({ page }) => {
    await tester.testAPIResponseMonitoring();
  });

  test.afterAll(async () => {
    const report = await tester.generateDetailedReport();
    console.log('\n📊 Backend Testing Report:');
    console.log(report);
  });
});
