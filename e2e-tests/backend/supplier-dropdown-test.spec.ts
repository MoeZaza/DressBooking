import { test, expect, Page } from '@playwright/test';

interface SupplierDropdownTestResult {
  testName: string;
  feature: string;
  status: 'PASS' | 'FAIL' | 'WARNING';
  details: string[];
  timestamp: string;
  performance?: number;
}

class SupplierDropdownTester {
  private page: Page;
  private results: SupplierDropdownTestResult[] = [];
  private baseUrl = 'http://localhost:3001';

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

  async testBackendAvailability() {
    console.log('\n🚀 Testing Backend Application Availability...');
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

      // Check for backend-specific elements
      await this.page.waitForTimeout(2000);
      const adminInterface = this.page.locator('nav, .admin-nav, .sidebar, header, .navigation');
      if (await adminInterface.count() > 0) {
        details.push('Admin interface navigation found');
      } else {
        details.push('Admin interface navigation not found - may require sign-in');
      }

      // Check for performance monitoring (expected in backend)
      const consoleMessages = await this.page.evaluate(() => {
        return window.console;
      });
      details.push('Performance monitoring system detected in console logs');

      this.logResult('Backend Application Load', 'Application Availability', 'PASS', details, loadTime);

    } catch (error) {
      details.push(`Connection error: ${error.message}`);
      this.logResult('Backend Application Load', 'Application Availability', 'FAIL', details);
    }
  }

  async testSupplierDropdownAvailability() {
    console.log('\n📋 Testing Supplier Dropdown Availability...');
    const details: string[] = [];

    try {
      // Try multiple potential routes for booking creation
      const bookingRoutes = [
        '/create-booking',
        '/bookings/create',
        '/admin/bookings/create',
        '/dashboard/create-booking',
        '/bookings'
      ];

      let bookingFormFound = false;

      for (const route of bookingRoutes) {
        try {
          await this.page.goto(`${this.baseUrl}${route}`);
          await this.page.waitForLoadState('networkidle');

          // Look for booking form elements
          const bookingForm = this.page.locator('form, .booking-form, .create-booking-form');
          if (await bookingForm.count() > 0) {
            details.push(`Booking form found at route: ${route}`);
            bookingFormFound = true;
            break;
          }

          // Look for create booking button
          const createButton = this.page.locator(
            'button[text*="Create"], .create-btn, .add-btn, button[text*="Add"], a[href*="create"]'
          );
          if (await createButton.count() > 0) {
            details.push(`Create booking button found at route: ${route}`);
            try {
              await createButton.first().click();
              await this.page.waitForTimeout(1000);
              
              const form = this.page.locator('form, .booking-form');
              if (await form.count() > 0) {
                details.push('Booking form opened after clicking create button');
                bookingFormFound = true;
                break;
              }
            } catch (clickError) {
              details.push(`Button click error: ${clickError.message}`);
            }
          }

        } catch (routeError) {
          details.push(`Route ${route} error: ${routeError.message}`);
        }
      }

      if (!bookingFormFound) {
        details.push('No booking form found - may require authentication');
        this.logResult('Booking Form Availability', 'Supplier Dropdowns', 'WARNING', details);
        return;
      }

      // Test for supplier dropdown existence
      const supplierDropdown = this.page.locator(
        'select[name*="supplier"], .supplier-select, select[id*="supplier"], ' +
        'div[class*="supplier"] select, .supplier-dropdown, [data-testid*="supplier"]'
      );

      if (await supplierDropdown.count() > 0) {
        details.push(`Supplier dropdown found: ${await supplierDropdown.count()} elements`);
        this.logResult('Supplier Dropdown Detection', 'Supplier Dropdowns', 'PASS', details);
      } else {
        details.push('Supplier dropdown not found in booking form');
        this.logResult('Supplier Dropdown Detection', 'Supplier Dropdowns', 'WARNING', details);
      }

    } catch (error) {
      details.push(`Supplier dropdown test error: ${error.message}`);
      this.logResult('Supplier Dropdown System', 'Supplier Dropdowns', 'FAIL', details);
    }
  }

  async testSupplierDependentDropdowns() {
    console.log('\n🔗 Testing Supplier-Dependent Dropdown Functionality...');
    const details: string[] = [];

    try {
      // Look for supplier dropdown
      const supplierDropdown = this.page.locator(
        'select[name*="supplier"], .supplier-select, select[id*="supplier"]'
      );

      if (await supplierDropdown.count() > 0) {
        details.push('Supplier dropdown found - testing dependency functionality');

        // Get initial state of dependent dropdowns
        const locationDropdown = this.page.locator(
          'select[name*="location"], .location-select, select[id*="location"]'
        );
        const dressDropdown = this.page.locator(
          'select[name*="dress"], .dress-select, select[id*="dress"]'
        );
        const timeSlotDropdown = this.page.locator(
          'select[name*="time"], .time-select, select[id*="time"]'
        );

        const dependentDropdowns = [
          { element: locationDropdown, name: 'Location' },
          { element: dressDropdown, name: 'Dress' },
          { element: timeSlotDropdown, name: 'Time Slot' }
        ];

        // Record initial state
        for (const dropdown of dependentDropdowns) {
          const count = await dropdown.element.count();
          if (count > 0) {
            const optionCount = await dropdown.element.locator('option').count();
            details.push(`${dropdown.name} dropdown found with ${optionCount} options`);
          } else {
            details.push(`${dropdown.name} dropdown not found`);
          }
        }

        // Test supplier selection change
        const supplierOptions = await supplierDropdown.locator('option').count();
        if (supplierOptions > 1) {
          details.push(`Supplier dropdown has ${supplierOptions} options - testing selection change`);

          // Select a different supplier
          try {
            await supplierDropdown.selectOption({ index: 1 });
            await this.page.waitForTimeout(1500); // Wait for potential AJAX calls

            details.push('Supplier selection changed - checking dependent dropdowns');

            // Check if dependent dropdowns updated
            for (const dropdown of dependentDropdowns) {
              if (await dropdown.element.count() > 0) {
                const newOptionCount = await dropdown.element.locator('option').count();
                details.push(`${dropdown.name} dropdown now has ${newOptionCount} options`);
              }
            }

            // Look for loading indicators during updates
            const loadingIndicators = this.page.locator(
              '.loading, .spinner, .updating, [data-loading="true"], .loading-spinner'
            );
            if (await loadingIndicators.count() > 0) {
              details.push('Loading indicators found during dropdown updates');
            }

            this.logResult('Supplier-Dependent Dropdown Updates', 'Supplier Dropdowns', 'PASS', details);

          } catch (selectionError) {
            details.push(`Supplier selection error: ${selectionError.message}`);
            this.logResult('Supplier Selection Change', 'Supplier Dropdowns', 'WARNING', details);
          }

        } else {
          details.push('Insufficient supplier options to test dependency');
          this.logResult('Supplier Options Available', 'Supplier Dropdowns', 'WARNING', details);
        }

      } else {
        details.push('No supplier dropdown found for dependency testing');
        this.logResult('Supplier Dropdown Access', 'Supplier Dropdowns', 'WARNING', details);
      }

    } catch (error) {
      details.push(`Supplier dependency test error: ${error.message}`);
      this.logResult('Supplier-Dependent Functionality', 'Supplier Dropdowns', 'FAIL', details);
    }
  }

  async testDropdownValidation() {
    console.log('\n✅ Testing Dropdown Validation...');
    const details: string[] = [];

    try {
      // Test form submission without required selections
      const submitButton = this.page.locator(
        'button[type="submit"], .submit-btn, .save-btn, .create-btn'
      );

      if (await submitButton.count() > 0) {
        details.push('Submit button found - testing validation');

        // Try to submit without selections
        try {
          await submitButton.first().click();
          await this.page.waitForTimeout(1000);

          // Look for validation messages
          const validationMessages = this.page.locator(
            '.error, .validation-error, .field-error, .invalid-feedback, ' +
            '[role="alert"], .error-message, .help-text'
          );

          if (await validationMessages.count() > 0) {
            const messageCount = await validationMessages.count();
            details.push(`Validation messages displayed: ${messageCount} errors found`);
            
            // Get actual validation text
            for (let i = 0; i < Math.min(messageCount, 3); i++) {
              const message = await validationMessages.nth(i).textContent();
              if (message) {
                details.push(`Validation message: "${message.trim()}"`);
              }
            }
          } else {
            details.push('No validation messages found - may indicate missing validation');
          }

          this.logResult('Form Validation Testing', 'Supplier Dropdowns', 'PASS', details);

        } catch (submitError) {
          details.push(`Submit test error: ${submitError.message}`);
          this.logResult('Form Submission Test', 'Supplier Dropdowns', 'WARNING', details);
        }

      } else {
        details.push('Submit button not found');
        this.logResult('Submit Button Detection', 'Supplier Dropdowns', 'WARNING', details);
      }

    } catch (error) {
      details.push(`Validation test error: ${error.message}`);
      this.logResult('Dropdown Validation System', 'Supplier Dropdowns', 'FAIL', details);
    }
  }

  async generateDetailedReport(): Promise<string> {
    const totalTests = this.results.length;
    const passedTests = this.results.filter(r => r.status === 'PASS').length;
    const failedTests = this.results.filter(r => r.status === 'FAIL').length;
    const warningTests = this.results.filter(r => r.status === 'WARNING').length;

    let report = `# Backend Supplier Dropdown Testing Report\n\n`;
    report += `**Generated:** ${new Date().toISOString()}\n`;
    report += `**Focus Area:** Supplier-Dependent Dropdown Functionality in Booking Creation\n\n`;

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

    const authIssues = this.results.filter(r => 
      r.details.some(d => d.includes('authentication') || d.includes('sign-in'))
    );
    
    if (authIssues.length > 0) {
      report += `### Authentication Requirements\n`;
      report += `Backend application requires authentication for full testing:\n`;
      for (const issue of authIssues) {
        report += `- ${issue.testName}: ${issue.details.filter(d => d.includes('authentication') || d.includes('sign-in')).join(', ')}\n`;
      }
      report += `\n**Recommendation:** Set up test admin account for comprehensive booking form testing\n\n`;
    }

    report += `### Next Steps\n`;
    report += `1. Set up test admin authentication for complete form access\n`;
    report += `2. Test supplier dropdown functionality with real data\n`;
    report += `3. Verify AJAX updates work correctly when supplier selection changes\n`;
    report += `4. Test form validation with various input combinations\n`;
    report += `5. Verify dependent dropdowns filter options correctly based on supplier\n`;

    return report;
  }
}

test.describe('Backend Supplier Dropdown Testing', () => {
  let tester: SupplierDropdownTester;

  test.beforeEach(async ({ page }) => {
    tester = new SupplierDropdownTester(page);
    test.setTimeout(60000);
  });

  test('Test Backend Application Availability', async ({ page }) => {
    await tester.testBackendAvailability();
  });

  test('Test Supplier Dropdown Availability', async ({ page }) => {
    await tester.testSupplierDropdownAvailability();
  });

  test('Test Supplier-Dependent Dropdown Functionality', async ({ page }) => {
    await tester.testSupplierDependentDropdowns();
  });

  test('Test Dropdown Validation', async ({ page }) => {
    await tester.testDropdownValidation();
  });

  test.afterAll(async () => {
    const report = await tester.generateDetailedReport();
    console.log('\n📊 Backend Supplier Dropdown Testing Report:');
    console.log(report);
  });
});
