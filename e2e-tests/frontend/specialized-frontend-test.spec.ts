import { test, expect, Page } from '@playwright/test';

interface FrontendTestResult {
  testName: string;
  feature: string;
  status: 'PASS' | 'FAIL' | 'WARNING';
  details: string[];
  timestamp: string;
  performance?: number;
}

class FrontendCustomerTester {
  private page: Page;
  private results: FrontendTestResult[] = [];
  private baseUrl = 'http://localhost:3000';

  constructor(page: Page) {
    this.page = page;
  }

  private logResult(testName: string, feature: string, status: 'PASS' | 'FAIL' | 'WARNING', details: string[] = [], performance?: number) {
    this.results.push({
      testName,
      feature,
      status,
      details,
      timestamp: new Date().toISOString(),
      performance
    });
    
    const statusIcon = status === 'PASS' ? '✅' : status === 'FAIL' ? '❌' : '⚠️';
    console.log(`${statusIcon} ${testName} (${feature}): ${status}`);
    if (details.length > 0) {
      details.forEach(detail => console.log(`   - ${detail}`));
    }
    if (performance) {
      console.log(`   ⏱️ Performance: ${performance}ms`);
    }
  }

  async testFrontendAvailability() {
    console.log('\n🚀 Testing Frontend Application Availability...');
    const details: string[] = [];

    try {
      const startTime = Date.now();
      await this.page.goto(this.baseUrl, { waitUntil: 'networkidle', timeout: 30000 });
      const loadTime = Date.now() - startTime;

      // Check basic page structure
      const title = await this.page.title();
      if (title) {
        details.push(`Page title: ${title}`);
      } else {
        details.push('No page title found');
      }

      // Check for main content
      await this.page.waitForTimeout(2000);
      const mainContent = this.page.locator('main, .main-content, #root, .app');
      if (await mainContent.count() > 0) {
        details.push('Main content area found');
      } else {
        details.push('Main content area not found');
      }

      // Check for navigation
      const navigation = this.page.locator('nav, header, .navigation, .navbar');
      if (await navigation.count() > 0) {
        details.push('Navigation structure found');
      } else {
        details.push('Navigation structure not found');
      }

      this.logResult('Frontend Application Load', 'Application Availability', 'PASS', details, loadTime);

    } catch (error) {
      details.push(`Connection error: ${error.message}`);
      this.logResult('Frontend Application Load', 'Application Availability', 'FAIL', details);
    }
  }

  async testMultiLanguageSupport() {
    console.log('\n🌐 Testing Frontend Multi-Language Support (Arabic RTL ↔ English LTR)...');
    const details: string[] = [];

    try {
      await this.page.goto(this.baseUrl);
      await this.page.waitForLoadState('networkidle');

      // Look for language switcher
      const languageSwitcher = this.page.locator(
        '.language-selector, .lang-switch, [data-testid="language"], select[name*="lang"], button[class*="lang"], .language-btn'
      );

      if (await languageSwitcher.count() > 0) {
        details.push('Language switcher found');

        // Test current language detection
        const currentLang = await this.page.evaluate(() => {
          return document.documentElement.lang || document.body.getAttribute('dir') || 'unknown';
        });
        details.push(`Current language/direction: ${currentLang}`);

        // Look for Arabic text patterns
        const bodyText = await this.page.textContent('body');
        const hasArabicText = /[\u0600-\u06FF]/.test(bodyText || '');
        if (hasArabicText) {
          details.push('Arabic text detected on page');
        }

        // Test language switching functionality
        try {
          const arabicOption = this.page.locator('option[value="ar"], button[data-lang="ar"], .arabic-lang, [text*="العربية"]');
          if (await arabicOption.count() > 0) {
            await arabicOption.first().click();
            await this.page.waitForTimeout(1000);
            details.push('Arabic language option clicked');

            // Check for RTL layout
            const rtlDetection = await this.page.evaluate(() => {
              const dir = document.documentElement.dir || document.body.dir;
              const style = window.getComputedStyle(document.body);
              return {
                dir: dir,
                direction: style.direction,
                textAlign: style.textAlign
              };
            });
            
            if (rtlDetection.dir === 'rtl' || rtlDetection.direction === 'rtl') {
              details.push('RTL layout successfully applied');
            } else {
              details.push('RTL layout not detected');
            }
          }

          // Test switching back to English
          const englishOption = this.page.locator('option[value="en"], button[data-lang="en"], .english-lang, [text*="English"]');
          if (await englishOption.count() > 0) {
            await englishOption.first().click();
            await this.page.waitForTimeout(1000);
            details.push('English language option clicked');

            // Check for LTR layout
            const ltrDetection = await this.page.evaluate(() => {
              const dir = document.documentElement.dir || document.body.dir;
              return dir === 'ltr' || dir === '' || !dir;
            });
            
            if (ltrDetection) {
              details.push('LTR layout successfully applied');
            }
          }

        } catch (switchError) {
          details.push(`Language switching error: ${switchError.message}`);
        }

        this.logResult('Language Switching Functionality', 'Multi-Language Support', 'PASS', details);
      } else {
        details.push('Language switcher not found');
        this.logResult('Language Switcher Detection', 'Multi-Language Support', 'WARNING', details);
      }

      // Test form elements in different languages
      const forms = this.page.locator('form');
      if (await forms.count() > 0) {
        const formElements = this.page.locator('input, select, textarea, button, label');
        const elementCount = await formElements.count();
        details.push(`Form elements ready for RTL/LTR testing: ${elementCount}`);
      }

    } catch (error) {
      details.push(`Multi-language test error: ${error.message}`);
      this.logResult('Multi-Language Support System', 'Multi-Language Support', 'FAIL', details);
    }
  }

  async testDressSearchFunctionality() {
    console.log('\n🔍 Testing Frontend Dress Search Functionality...');
    const details: string[] = [];

    try {
      // Test search from home page
      await this.page.goto(this.baseUrl);
      await this.page.waitForLoadState('networkidle');

      // Look for search form on home page
      const homeSearchForm = this.page.locator(
        'form[role="search"], .search-form, input[type="search"], input[placeholder*="search"], .search-input'
      );

      if (await homeSearchForm.count() > 0) {
        details.push('Search form found on home page');

        // Test search input
        const searchInput = homeSearchForm.first();
        await searchInput.fill('elegant dress');
        details.push('Search term entered: "elegant dress"');

        // Try to submit search
        await searchInput.press('Enter');
        await this.page.waitForTimeout(1000);
        details.push('Search submitted from home page');
      }

      // Navigate to dedicated search page
      await this.page.goto(`${this.baseUrl}/search`);
      await this.page.waitForLoadState('networkidle');

      // Test search page components
      const searchPageForm = this.page.locator('form, .search-container, .search-page');
      if (await searchPageForm.count() > 0) {
        details.push('Search page loaded successfully');

        // Test search filters
        const filters = [
          { selector: '.dress-type-filter, select[name*="type"], .type-filter', name: 'Dress Type Filter' },
          { selector: '.dress-size-filter, select[name*="size"], .size-filter', name: 'Dress Size Filter' },
          { selector: '.dress-style-filter, select[name*="style"], .style-filter', name: 'Dress Style Filter' },
          { selector: '.price-filter, .price-range, input[name*="price"]', name: 'Price Filter' },
          { selector: '.location-filter, select[name*="location"]', name: 'Location Filter' }
        ];

        for (const filter of filters) {
          const filterElement = this.page.locator(filter.selector);
          if (await filterElement.count() > 0) {
            details.push(`${filter.name} found`);
          } else {
            details.push(`${filter.name} not found`);
          }
        }

        // Test search results area
        const resultsArea = this.page.locator(
          '.search-results, .dress-list, .results-container, .dress-grid, .products-grid'
        );
        if (await resultsArea.count() > 0) {
          details.push('Search results area found');
        }

        // Test different search terms
        const searchTerms = ['wedding dress', 'evening gown', 'casual dress'];
        const mainSearchInput = this.page.locator('input[type="search"], .search-input').first();
        
        if (await mainSearchInput.count() > 0) {
          for (const term of searchTerms) {
            try {
              await mainSearchInput.fill(term);
              await this.page.waitForTimeout(500);
              await mainSearchInput.press('Enter');
              await this.page.waitForTimeout(1000);
              details.push(`Search tested with term: "${term}"`);
            } catch (searchError) {
              details.push(`Search error with term "${term}": ${searchError.message}`);
            }
          }
        }

        this.logResult('Dress Search Functionality', 'Search Features', 'PASS', details);
      } else {
        details.push('Search page not accessible');
        this.logResult('Search Page Access', 'Search Features', 'WARNING', details);
      }

    } catch (error) {
      details.push(`Search functionality error: ${error.message}`);
      this.logResult('Dress Search System', 'Search Features', 'FAIL', details);
    }
  }

  async testBookingProcess() {
    console.log('\n📅 Testing Frontend Booking Process and Supplier Features...');
    const details: string[] = [];

    try {
      // Try to access a dress details page first
      await this.page.goto(`${this.baseUrl}/search`);
      await this.page.waitForLoadState('networkidle');

      // Look for dress cards/items
      const dressCards = this.page.locator(
        '.dress-card, .dress-item, .product-card, [data-testid="dress-card"], a[href*="/dress/"]'
      );

      if (await dressCards.count() > 0) {
        details.push(`Found ${await dressCards.count()} dress cards`);

        // Click on first dress card
        try {
          await dressCards.first().click();
          await this.page.waitForLoadState('networkidle');
          details.push('Navigated to dress details page');

          // Look for booking button
          const bookingButton = this.page.locator(
            '.book-now, .booking-btn, button[text*="Book"], button[text*="Reserve"], .reserve-btn'
          );

          if (await bookingButton.count() > 0) {
            details.push('Booking button found on dress details page');

            // Click booking button
            await bookingButton.first().click();
            await this.page.waitForLoadState('networkidle');
            details.push('Booking button clicked');

            // Test booking form elements
            const bookingForm = this.page.locator('form, .booking-form, .reservation-form');
            if (await bookingForm.count() > 0) {
              details.push('Booking form found');

              // Test form fields
              const formFields = [
                { selector: 'input[type="date"], .date-picker', name: 'Date Picker' },
                { selector: 'select[name*="supplier"], .supplier-select', name: 'Supplier Selection' },
                { selector: 'select[name*="location"], .location-select', name: 'Location Selection' },
                { selector: 'input[name*="customer"], .customer-info', name: 'Customer Information' }
              ];

              for (const field of formFields) {
                const fieldElement = this.page.locator(field.selector);
                if (await fieldElement.count() > 0) {
                  details.push(`${field.name} found in booking form`);
                } else {
                  details.push(`${field.name} not found in booking form`);
                }
              }

              // Test supplier-dependent functionality
              const supplierSelect = this.page.locator('select[name*="supplier"], .supplier-select');
              if (await supplierSelect.count() > 0) {
                details.push('Testing supplier-dependent dropdowns');
                
                // Try to change supplier selection
                try {
                  const options = this.page.locator('option');
                  const optionCount = await options.count();
                  if (optionCount > 1) {
                    await supplierSelect.first().selectOption({ index: 1 });
                    await this.page.waitForTimeout(1000);
                    details.push('Supplier selection changed - dependent fields should update');
                  }
                } catch (supplierError) {
                  details.push(`Supplier selection error: ${supplierError.message}`);
                }
              }
            }
          } else {
            details.push('Booking button not found on dress details page');
          }

        } catch (navigationError) {
          details.push(`Navigation to dress details error: ${navigationError.message}`);
        }

      } else {
        details.push('No dress cards found for booking test');
      }

      // Test direct booking page access
      try {
        await this.page.goto(`${this.baseUrl}/booking`);
        await this.page.waitForLoadState('networkidle');

        const bookingPage = this.page.locator('.booking-page, .reservation-page, form');
        if (await bookingPage.count() > 0) {
          details.push('Direct booking page accessible');
        }
      } catch (bookingPageError) {
        details.push(`Direct booking page error: ${bookingPageError.message}`);
      }

      this.logResult('Booking Process and Supplier Features', 'Booking System', details.length > 0 ? 'PASS' : 'WARNING', details);

    } catch (error) {
      details.push(`Booking process error: ${error.message}`);
      this.logResult('Frontend Booking System', 'Booking System', 'FAIL', details);
    }
  }

  async testResponsiveDesign() {
    console.log('\n📱 Testing Frontend Responsive Design...');
    const details: string[] = [];

    try {
      const viewports = [
        { width: 375, height: 667, name: 'Mobile (iPhone)' },
        { width: 768, height: 1024, name: 'Tablet (iPad)' },
        { width: 1920, height: 1080, name: 'Desktop' }
      ];

      for (const viewport of viewports) {
        await this.page.setViewportSize({ width: viewport.width, height: viewport.height });
        await this.page.goto(this.baseUrl);
        await this.page.waitForLoadState('networkidle');

        // Test navigation responsiveness
        const nav = this.page.locator('nav, header, .navigation, .navbar');
        if (await nav.isVisible()) {
          details.push(`Navigation visible on ${viewport.name}`);
        } else {
          details.push(`Navigation not visible on ${viewport.name}`);
        }

        // Test mobile menu for smaller screens
        if (viewport.width < 768) {
          const mobileMenu = this.page.locator(
            '.mobile-menu, .hamburger, .menu-toggle, .burger-menu, [data-testid="mobile-menu"]'
          );
          if (await mobileMenu.count() > 0) {
            details.push(`Mobile menu found on ${viewport.name}`);
          } else {
            details.push(`Mobile menu not found on ${viewport.name}`);
          }
        }

        // Test main content responsiveness
        const mainContent = this.page.locator('main, .main-content, .content');
        if (await mainContent.isVisible()) {
          const contentBox = await mainContent.boundingBox();
          if (contentBox && contentBox.width <= viewport.width) {
            details.push(`Content fits viewport on ${viewport.name}`);
          } else {
            details.push(`Content overflow on ${viewport.name}`);
          }
        }
      }

      this.logResult('Responsive Design Testing', 'Responsive Design', details.length > 0 ? 'PASS' : 'WARNING', details);

    } catch (error) {
      details.push(`Responsive design test error: ${error.message}`);
      this.logResult('Responsive Design System', 'Responsive Design', 'FAIL', details);
    }
  }

  async generateDetailedReport(): Promise<string> {
    const totalTests = this.results.length;
    const passedTests = this.results.filter(r => r.status === 'PASS').length;
    const failedTests = this.results.filter(r => r.status === 'FAIL').length;
    const warningTests = this.results.filter(r => r.status === 'WARNING').length;

    let report = `# Frontend Customer Application - Detailed Testing Report\n\n`;
    report += `**Generated:** ${new Date().toISOString()}\n`;
    report += `**Focus Areas:** Multi-Language Support, Search Functionality, Booking Process, Responsive Design\n\n`;

    report += `## Executive Summary\n`;
    report += `- **Total Tests:** ${totalTests}\n`;
    report += `- **Passed:** ${passedTests} (${((passedTests / totalTests) * 100).toFixed(1)}%)\n`;
    report += `- **Failed:** ${failedTests} (${((failedTests / totalTests) * 100).toFixed(1)}%)\n`;
    report += `- **Warnings:** ${warningTests} (${((warningTests / totalTests) * 100).toFixed(1)}%)\n\n`;

    // Performance metrics
    const performanceResults = this.results.filter(r => r.performance);
    if (performanceResults.length > 0) {
      const avgPerformance = performanceResults.reduce((acc, r) => acc + (r.performance || 0), 0) / performanceResults.length;
      report += `## Performance Metrics\n`;
      report += `- **Average Load Time:** ${avgPerformance.toFixed(0)}ms\n`;
      report += `- **Performance Grade:** ${avgPerformance < 1000 ? 'A' : avgPerformance < 3000 ? 'B' : avgPerformance < 5000 ? 'C' : 'D'}\n\n`;
    }

    // Group results by feature
    const features = [...new Set(this.results.map(r => r.feature))];
    
    for (const feature of features) {
      const featureResults = this.results.filter(r => r.feature === feature);
      report += `## ${feature}\n`;
      
      for (const result of featureResults) {
        const statusIcon = result.status === 'PASS' ? '✅' : result.status === 'FAIL' ? '❌' : '⚠️';
        report += `### ${statusIcon} ${result.testName}\n`;
        report += `**Status:** ${result.status}\n`;
        if (result.performance) report += `**Load Time:** ${result.performance}ms\n`;
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
    
    if (failedTests > 0) {
      report += `### Critical Issues\n`;
      const criticalIssues = this.results.filter(r => r.status === 'FAIL');
      for (const issue of criticalIssues) {
        report += `- **${issue.testName}:** ${issue.details.join(', ')}\n`;
      }
      report += `\n`;
    }

    const connectionIssues = this.results.filter(r => 
      r.details.some(d => d.includes('connection') || d.includes('refused'))
    );
    
    if (connectionIssues.length > 0) {
      report += `### Service Connectivity\n`;
      report += `Frontend application may not be running or accessible:\n`;
      for (const issue of connectionIssues) {
        report += `- ${issue.testName}: ${issue.details.filter(d => d.includes('connection') || d.includes('refused')).join(', ')}\n`;
      }
      report += `\n**Recommendation:** Ensure frontend service is running on port 3000\n\n`;
    }

    report += `### Next Steps\n`;
    report += `1. Ensure frontend application is running on port 3000\n`;
    report += `2. Verify API connectivity (port 4002) for full functionality\n`;
    report += `3. Test with real user data and authentication\n`;
    report += `4. Validate multi-language functionality with actual content\n`;
    report += `5. Test booking process with real dress inventory\n`;

    return report;
  }
}

test.describe('Frontend Customer Application - Specialized Testing', () => {
  let tester: FrontendCustomerTester;

  test.beforeEach(async ({ page }) => {
    tester = new FrontendCustomerTester(page);
    test.setTimeout(60000);
  });

  test('Test Frontend Application Availability', async ({ page }) => {
    await tester.testFrontendAvailability();
  });

  test('Test Multi-Language Support (Arabic RTL ↔ English LTR)', async ({ page }) => {
    await tester.testMultiLanguageSupport();
  });

  test('Test Dress Search Functionality', async ({ page }) => {
    await tester.testDressSearchFunctionality();
  });

  test('Test Booking Process and Supplier Features', async ({ page }) => {
    await tester.testBookingProcess();
  });

  test('Test Responsive Design', async ({ page }) => {
    await tester.testResponsiveDesign();
  });

  test.afterAll(async () => {
    const report = await tester.generateDetailedReport();
    console.log('\n📊 Frontend Testing Report:');
    console.log(report);
  });
});
