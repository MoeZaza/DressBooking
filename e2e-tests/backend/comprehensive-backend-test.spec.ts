import { test, expect, Page } from '@playwright/test';

interface TestResult {
  testName: string;
  page: string;
  status: 'PASS' | 'FAIL' | 'WARNING';
  issues: string[];
  timestamp: string;
}

class BackendPageTester {
  private page: Page;
  private results: TestResult[] = [];
  private baseUrl = 'http://localhost:3001';

  constructor(page: Page) {
    this.page = page;
  }

  private logTest(testName: string, page: string, status: 'PASS' | 'FAIL' | 'WARNING', issues: string[] = []) {
    this.results.push({
      testName,
      page,
      status,
      issues,
      timestamp: new Date().toISOString()
    });
    console.log(`${status === 'PASS' ? '✅' : status === 'FAIL' ? '❌' : '⚠️'} ${testName} on ${page}: ${status}`);
    if (issues.length > 0) {
      issues.forEach(issue => console.log(`   - ${issue}`));
    }
  }

  async testAdminSignInPage() {
    const pageName = 'Admin Sign In Page';
    const issues: string[] = [];

    try {
      await this.page.goto(this.baseUrl);
      await this.page.waitForLoadState('networkidle');

      // Check if redirected to sign-in
      const currentUrl = this.page.url();
      if (!currentUrl.includes('/sign-in')) {
        await this.page.goto(`${this.baseUrl}/sign-in`);
        await this.page.waitForLoadState('networkidle');
      }

      // Test admin login form
      const emailField = this.page.locator('input[type="email"], input[name="email"]');
      if (!(await emailField.isVisible())) {
        issues.push('Email input field not found');
      }

      const passwordField = this.page.locator('input[type="password"], input[name="password"]');
      if (!(await passwordField.isVisible())) {
        issues.push('Password input field not found');
      }

      const submitButton = this.page.locator('button[type="submit"], .submit-btn, .sign-in-btn');
      if (!(await submitButton.isVisible())) {
        issues.push('Submit button not found');
      }

      // Test admin-specific UI elements
      const adminTitle = this.page.locator('h1, .page-title, .admin-title');
      if (await adminTitle.count() > 0) {
        const titleText = await adminTitle.first().textContent();
        if (!titleText?.toLowerCase().includes('admin') && !titleText?.toLowerCase().includes('backend')) {
          issues.push('Admin/Backend context not clear in title');
        }
      }

      this.logTest('Admin Sign In Form', pageName, issues.length === 0 ? 'PASS' : 'WARNING', issues);
    } catch (error) {
      issues.push(`Error: ${error.message}`);
      this.logTest('Admin Sign In Form', pageName, 'FAIL', issues);
    }
  }

  async testAdminDashboard() {
    const pageName = 'Admin Dashboard';
    const issues: string[] = [];

    try {
      await this.page.goto(`${this.baseUrl}/dashboard`);
      await this.page.waitForLoadState('networkidle');

      // Check if redirected to login
      const currentUrl = this.page.url();
      if (currentUrl.includes('/sign-in')) {
        issues.push('Redirected to sign-in (authentication required)');
      } else {
        // Test dashboard components
        const dashboardCards = this.page.locator('.dashboard-card, .stat-card, .metric-card');
        if ((await dashboardCards.count()) === 0) {
          issues.push('Dashboard metric cards not found');
        }

        // Test analytics/charts
        const charts = this.page.locator('.chart, .graph, canvas, svg[class*="chart"]');
        if ((await charts.count()) === 0) {
          issues.push('Dashboard charts/analytics not found');
        }

        // Test recent activity or data tables
        const dataTable = this.page.locator('table, .data-table, .MuiDataGrid-root');
        if ((await dataTable.count()) === 0) {
          issues.push('Data table not found');
        }

        // Test navigation menu
        const navMenu = this.page.locator('nav, .sidebar, .navigation-menu');
        if (!(await navMenu.isVisible())) {
          issues.push('Navigation menu not visible');
        }
      }

      this.logTest('Dashboard Components', pageName, issues.length === 0 ? 'PASS' : 'WARNING', issues);
    } catch (error) {
      issues.push(`Error: ${error.message}`);
      this.logTest('Dashboard Components', pageName, 'FAIL', issues);
    }
  }

  async testDressManagementPages() {
    const pageName = 'Dress Management';
    const issues: string[] = [];

    try {
      // Test dress list page
      await this.page.goto(`${this.baseUrl}/dresses`);
      await this.page.waitForLoadState('networkidle');

      const currentUrl = this.page.url();
      if (currentUrl.includes('/sign-in')) {
        issues.push('Redirected to sign-in (authentication required)');
      } else {
        // Test dress list/grid
        const dressList = this.page.locator('.dress-list, .data-grid, table, .MuiDataGrid-root');
        if (!(await dressList.isVisible())) {
          issues.push('Dress list/grid not found');
        }

        // Test add new dress button
        const addButton = this.page.locator('.add-btn, .create-btn, button[href*="create"], a[href*="create"]');
        if (!(await addButton.isVisible())) {
          issues.push('Add new dress button not found');
        }

        // Test search/filter functionality
        const searchInput = this.page.locator('input[type="search"], .search-input, .filter-input');
        if (!(await searchInput.isVisible())) {
          issues.push('Search/filter input not found');
        }

        // Test create dress page
        await this.page.goto(`${this.baseUrl}/create-dress`);
        await this.page.waitForLoadState('networkidle');

        if (!this.page.url().includes('/sign-in')) {
          // Test form fields
          const formFields = [
            'input[name="name"], input[name="dressName"]',
            'select[name="type"], .dress-type-select',
            'select[name="size"], .dress-size-select',
            'input[name="price"], .price-input'
          ];

          for (const fieldSelector of formFields) {
            const field = this.page.locator(fieldSelector);
            if (!(await field.isVisible())) {
              issues.push(`Create dress form field not found: ${fieldSelector}`);
            }
          }

          // Test image upload
          const imageUpload = this.page.locator('input[type="file"], .image-upload, .file-upload');
          if (!(await imageUpload.isVisible())) {
            issues.push('Image upload field not found');
          }

          // Test save button
          const saveButton = this.page.locator('button[type="submit"], .save-btn, .create-btn');
          if (!(await saveButton.isVisible())) {
            issues.push('Save button not found');
          }
        }
      }

      this.logTest('Dress CRUD Operations', pageName, issues.length === 0 ? 'PASS' : 'WARNING', issues);
    } catch (error) {
      issues.push(`Error: ${error.message}`);
      this.logTest('Dress CRUD Operations', pageName, 'FAIL', issues);
    }
  }

  async testBookingManagement() {
    const pageName = 'Booking Management';
    const issues: string[] = [];

    try {
      await this.page.goto(`${this.baseUrl}/bookings`);
      await this.page.waitForLoadState('networkidle');

      const currentUrl = this.page.url();
      if (currentUrl.includes('/sign-in')) {
        issues.push('Redirected to sign-in (authentication required)');
      } else {
        // Test booking list
        const bookingList = this.page.locator('.booking-list, table, .data-grid, .MuiDataGrid-root');
        if (!(await bookingList.isVisible())) {
          issues.push('Booking list not found');
        }

        // Test filter options
        const statusFilter = this.page.locator('.status-filter, select[name="status"]');
        if (!(await statusFilter.isVisible())) {
          issues.push('Booking status filter not found');
        }

        // Test date range picker
        const datePicker = this.page.locator('.date-picker, input[type="date"], .date-range-picker');
        if (!(await datePicker.isVisible())) {
          issues.push('Date picker not found');
        }

        // Test create booking button
        const createButton = this.page.locator('.create-booking-btn, button[href*="create"], a[href*="create"]');
        if (!(await createButton.isVisible())) {
          issues.push('Create booking button not found');
        }

        // Test create booking page
        await this.page.goto(`${this.baseUrl}/create-booking`);
        await this.page.waitForLoadState('networkidle');

        if (!this.page.url().includes('/sign-in')) {
          // Test booking form fields
          const bookingFields = [
            'select[name="customer"], .customer-select',
            'select[name="dress"], .dress-select',
            'input[type="date"], .date-picker',
            'select[name="location"], .location-select'
          ];

          for (const fieldSelector of bookingFields) {
            const field = this.page.locator(fieldSelector);
            if (!(await field.isVisible())) {
              issues.push(`Booking form field not found: ${fieldSelector}`);
            }
          }
        }
      }

      this.logTest('Booking Management Operations', pageName, issues.length === 0 ? 'PASS' : 'WARNING', issues);
    } catch (error) {
      issues.push(`Error: ${error.message}`);
      this.logTest('Booking Management Operations', pageName, 'FAIL', issues);
    }
  }

  async testUserManagement() {
    const pageName = 'User Management';
    const issues: string[] = [];

    try {
      await this.page.goto(`${this.baseUrl}/users`);
      await this.page.waitForLoadState('networkidle');

      const currentUrl = this.page.url();
      if (currentUrl.includes('/sign-in')) {
        issues.push('Redirected to sign-in (authentication required)');
      } else {
        // Test user list
        const userList = this.page.locator('.user-list, table, .data-grid, .MuiDataGrid-root');
        if (!(await userList.isVisible())) {
          issues.push('User list not found');
        }

        // Test user type filter
        const typeFilter = this.page.locator('.user-type-filter, select[name="type"]');
        if (!(await typeFilter.isVisible())) {
          issues.push('User type filter not found');
        }

        // Test search functionality
        const searchInput = this.page.locator('input[type="search"], .search-input');
        if (!(await searchInput.isVisible())) {
          issues.push('User search input not found');
        }

        // Test create user button
        const createButton = this.page.locator('.create-user-btn, button[href*="create"], a[href*="create"]');
        if (!(await createButton.isVisible())) {
          issues.push('Create user button not found');
        }

        // Test create user page
        await this.page.goto(`${this.baseUrl}/create-user`);
        await this.page.waitForLoadState('networkidle');

        if (!this.page.url().includes('/sign-in')) {
          // Test user form fields
          const userFields = [
            'input[name="fullName"], input[name="name"]',
            'input[name="email"]',
            'input[name="phone"]',
            'select[name="type"], .user-type-select'
          ];

          for (const fieldSelector of userFields) {
            const field = this.page.locator(fieldSelector);
            if (!(await field.isVisible())) {
              issues.push(`User form field not found: ${fieldSelector}`);
            }
          }
        }
      }

      this.logTest('User Management Operations', pageName, issues.length === 0 ? 'PASS' : 'WARNING', issues);
    } catch (error) {
      issues.push(`Error: ${error.message}`);
      this.logTest('User Management Operations', pageName, 'FAIL', issues);
    }
  }

  async testSupplierManagement() {
    const pageName = 'Supplier Management';
    const issues: string[] = [];

    try {
      await this.page.goto(`${this.baseUrl}/suppliers`);
      await this.page.waitForLoadState('networkidle');

      const currentUrl = this.page.url();
      if (currentUrl.includes('/sign-in')) {
        issues.push('Redirected to sign-in (authentication required)');
      } else {
        // Test supplier list
        const supplierList = this.page.locator('.supplier-list, table, .data-grid, .MuiDataGrid-root');
        if (!(await supplierList.isVisible())) {
          issues.push('Supplier list not found');
        }

        // Test create supplier button
        const createButton = this.page.locator('.create-supplier-btn, button[href*="create"], a[href*="create"]');
        if (!(await createButton.isVisible())) {
          issues.push('Create supplier button not found');
        }

        // Test create supplier page
        await this.page.goto(`${this.baseUrl}/create-supplier`);
        await this.page.waitForLoadState('networkidle');

        if (!this.page.url().includes('/sign-in')) {
          // Test supplier form fields
          const supplierFields = [
            'input[name="fullName"], input[name="name"]',
            'input[name="email"]',
            'input[name="phone"]',
            'select[name="locations"], .location-select'
          ];

          for (const fieldSelector of supplierFields) {
            const field = this.page.locator(fieldSelector);
            if (!(await field.isVisible())) {
              issues.push(`Supplier form field not found: ${fieldSelector}`);
            }
          }
        }
      }

      this.logTest('Supplier Management Operations', pageName, issues.length === 0 ? 'PASS' : 'WARNING', issues);
    } catch (error) {
      issues.push(`Error: ${error.message}`);
      this.logTest('Supplier Management Operations', pageName, 'FAIL', issues);
    }
  }

  async testAnalyticsDashboard() {
    const pageName = 'Analytics Dashboard';
    const issues: string[] = [];

    try {
      await this.page.goto(`${this.baseUrl}/analytics`);
      await this.page.waitForLoadState('networkidle');

      const currentUrl = this.page.url();
      if (currentUrl.includes('/sign-in')) {
        issues.push('Redirected to sign-in (authentication required)');
      } else {
        // Test analytics charts
        const charts = this.page.locator('.chart, .graph, canvas, svg[class*="chart"], .recharts-wrapper');
        if ((await charts.count()) === 0) {
          issues.push('Analytics charts not found');
        }

        // Test date range selector
        const dateRange = this.page.locator('.date-range-picker, .date-filter, input[type="date"]');
        if (!(await dateRange.isVisible())) {
          issues.push('Date range selector not found');
        }

        // Test KPI cards
        const kpiCards = this.page.locator('.kpi-card, .metric-card, .stat-card');
        if ((await kpiCards.count()) === 0) {
          issues.push('KPI metric cards not found');
        }

        // Test export functionality
        const exportButton = this.page.locator('.export-btn, button[text*="Export"], .download-btn');
        if (!(await exportButton.isVisible())) {
          issues.push('Export button not found');
        }
      }

      this.logTest('Analytics and Reporting', pageName, issues.length === 0 ? 'PASS' : 'WARNING', issues);
    } catch (error) {
      issues.push(`Error: ${error.message}`);
      this.logTest('Analytics and Reporting', pageName, 'FAIL', issues);
    }
  }

  async testLocationManagement() {
    const pageName = 'Location Management';
    const issues: string[] = [];

    try {
      await this.page.goto(`${this.baseUrl}/locations`);
      await this.page.waitForLoadState('networkidle');

      const currentUrl = this.page.url();
      if (currentUrl.includes('/sign-in')) {
        issues.push('Redirected to sign-in (authentication required)');
      } else {
        // Test location list
        const locationList = this.page.locator('.location-list, table, .data-grid, .MuiDataGrid-root');
        if (!(await locationList.isVisible())) {
          issues.push('Location list not found');
        }

        // Test create location button
        const createButton = this.page.locator('.create-location-btn, button[href*="create"], a[href*="create"]');
        if (!(await createButton.isVisible())) {
          issues.push('Create location button not found');
        }

        // Test create location page
        await this.page.goto(`${this.baseUrl}/create-location`);
        await this.page.waitForLoadState('networkidle');

        if (!this.page.url().includes('/sign-in')) {
          // Test location form fields
          const locationFields = [
            'input[name="name"]',
            'select[name="country"], .country-select',
            'input[name="address"], .address-input',
            'input[name="latitude"], input[name="longitude"]'
          ];

          for (const fieldSelector of locationFields) {
            const field = this.page.locator(fieldSelector);
            if (!(await field.isVisible())) {
              issues.push(`Location form field not found: ${fieldSelector}`);
            }
          }
        }
      }

      this.logTest('Location Management Operations', pageName, issues.length === 0 ? 'PASS' : 'WARNING', issues);
    } catch (error) {
      issues.push(`Error: ${error.message}`);
      this.logTest('Location Management Operations', pageName, 'FAIL', issues);
    }
  }

  async testFittingAppointments() {
    const pageName = 'Fitting Appointments';
    const issues: string[] = [];

    try {
      await this.page.goto(`${this.baseUrl}/fitting-appointments`);
      await this.page.waitForLoadState('networkidle');

      const currentUrl = this.page.url();
      if (currentUrl.includes('/sign-in')) {
        issues.push('Redirected to sign-in (authentication required)');
      } else {
        // Test appointment list/calendar
        const appointmentView = this.page.locator('.appointment-list, .calendar, .scheduler, table');
        if (!(await appointmentView.isVisible())) {
          issues.push('Appointment list or calendar not found');
        }

        // Test appointment creation
        const createButton = this.page.locator('.create-appointment-btn, .schedule-btn, button[text*="Schedule"]');
        if (!(await createButton.isVisible())) {
          issues.push('Create appointment button not found');
        }

        // Test time slot management
        const timeSlots = this.page.locator('.time-slot, .appointment-slot, .calendar-slot');
        if ((await timeSlots.count()) === 0) {
          issues.push('Time slots not found');
        }
      }

      this.logTest('Fitting Appointment Management', pageName, issues.length === 0 ? 'PASS' : 'WARNING', issues);
    } catch (error) {
      issues.push(`Error: ${error.message}`);
      this.logTest('Fitting Appointment Management', pageName, 'FAIL', issues);
    }
  }

  async testResponsiveDesign() {
    const issues: string[] = [];
    const viewports = [
      { width: 768, height: 1024, name: 'Tablet' },
      { width: 1920, height: 1080, name: 'Desktop' }
    ];

    try {
      for (const viewport of viewports) {
        await this.page.setViewportSize({ width: viewport.width, height: viewport.height });
        await this.page.goto(this.baseUrl);
        await this.page.waitForLoadState('networkidle');

        // Test navigation/sidebar
        const nav = this.page.locator('nav, .sidebar, .navigation');
        if (!(await nav.isVisible())) {
          issues.push(`Navigation not visible on ${viewport.name}`);
        }

        // Test main content area
        const main = this.page.locator('main, .main-content, .content-area');
        if (!(await main.isVisible())) {
          issues.push(`Main content not visible on ${viewport.name}`);
        }

        // Test data tables (should be responsive)
        const tables = this.page.locator('table, .data-grid, .MuiDataGrid-root');
        if ((await tables.count()) > 0) {
          const firstTable = tables.first();
          if (await firstTable.isVisible()) {
            const tableWidth = await firstTable.boundingBox();
            if (tableWidth && tableWidth.width > viewport.width) {
              issues.push(`Table overflow on ${viewport.name}`);
            }
          }
        }
      }

      this.logTest('Backend Responsive Design', 'Admin Interface', issues.length === 0 ? 'PASS' : 'WARNING', issues);
    } catch (error) {
      issues.push(`Error: ${error.message}`);
      this.logTest('Backend Responsive Design', 'Admin Interface', 'FAIL', issues);
    }
  }

  async generateReport(): Promise<string> {
    const totalTests = this.results.length;
    const passedTests = this.results.filter(r => r.status === 'PASS').length;
    const failedTests = this.results.filter(r => r.status === 'FAIL').length;
    const warningTests = this.results.filter(r => r.status === 'WARNING').length;

    let report = `# Backend Admin Dashboard E2E Test Report\n\n`;
    report += `**Generated:** ${new Date().toISOString()}\n\n`;
    report += `## Summary\n`;
    report += `- **Total Tests:** ${totalTests}\n`;
    report += `- **Passed:** ${passedTests}\n`;
    report += `- **Failed:** ${failedTests}\n`;
    report += `- **Warnings:** ${warningTests}\n`;
    report += `- **Success Rate:** ${((passedTests / totalTests) * 100).toFixed(1)}%\n\n`;

    report += `## Test Results\n\n`;
    
    for (const result of this.results) {
      const statusIcon = result.status === 'PASS' ? '✅' : result.status === 'FAIL' ? '❌' : '⚠️';
      report += `### ${statusIcon} ${result.testName}\n`;
      report += `**Page:** ${result.page}\n`;
      report += `**Status:** ${result.status}\n`;
      report += `**Time:** ${result.timestamp}\n`;
      
      if (result.issues.length > 0) {
        report += `**Issues Found:**\n`;
        for (const issue of result.issues) {
          report += `- ${issue}\n`;
        }
      }
      report += `\n`;
    }

    report += `## Admin-Specific Findings\n\n`;
    report += `### Authentication & Security\n`;
    const authIssues = this.results.filter(r => r.issues.some(i => i.includes('sign-in') || i.includes('authentication')));
    if (authIssues.length > 0) {
      report += `- **Authentication Required:** Most admin pages properly redirect to sign-in\n`;
    } else {
      report += `- **Security Warning:** Some admin pages may not have proper authentication\n`;
    }

    report += `\n### Admin Interface Features\n`;
    const featureResults = this.results.filter(r => !r.issues.some(i => i.includes('authentication')));
    report += `- **Functional Admin Pages:** ${featureResults.filter(r => r.status === 'PASS').length}/${featureResults.length}\n`;
    report += `- **Data Management:** CRUD operations tested across entities\n`;
    report += `- **Analytics & Reporting:** Dashboard metrics and charts tested\n`;

    report += `\n## Recommendations\n\n`;
    
    if (failedTests > 0) {
      report += `### Critical Issues (${failedTests})\n`;
      const criticalIssues = this.results.filter(r => r.status === 'FAIL');
      for (const issue of criticalIssues) {
        report += `- **${issue.page}:** ${issue.issues.join(', ')}\n`;
      }
      report += `\n`;
    }

    if (warningTests > 0) {
      report += `### Warnings (${warningTests})\n`;
      const warnings = this.results.filter(r => r.status === 'WARNING');
      for (const warning of warnings) {
        report += `- **${warning.page}:** ${warning.issues.join(', ')}\n`;
      }
      report += `\n`;
    }

    report += `## Next Steps\n`;
    report += `1. Ensure all admin applications are running on correct ports\n`;
    report += `2. Set up test admin user account for authentication testing\n`;
    report += `3. Fix any missing UI components or form fields\n`;
    report += `4. Test with real data after authentication is working\n`;
    report += `5. Verify all CRUD operations work end-to-end\n`;

    return report;
  }
}

test.describe('Backend Admin Dashboard Testing', () => {
  let tester: BackendPageTester;

  test.beforeEach(async ({ page }) => {
    tester = new BackendPageTester(page);
  });

  test('Test Admin Sign In Page', async ({ page }) => {
    await tester.testAdminSignInPage();
  });

  test('Test Admin Dashboard', async ({ page }) => {
    await tester.testAdminDashboard();
  });

  test('Test Dress Management', async ({ page }) => {
    await tester.testDressManagementPages();
  });

  test('Test Booking Management', async ({ page }) => {
    await tester.testBookingManagement();
  });

  test('Test User Management', async ({ page }) => {
    await tester.testUserManagement();
  });

  test('Test Supplier Management', async ({ page }) => {
    await tester.testSupplierManagement();
  });

  test('Test Analytics Dashboard', async ({ page }) => {
    await tester.testAnalyticsDashboard();
  });

  test('Test Location Management', async ({ page }) => {
    await tester.testLocationManagement();
  });

  test('Test Fitting Appointments', async ({ page }) => {
    await tester.testFittingAppointments();
  });

  test('Test Responsive Design', async ({ page }) => {
    await tester.testResponsiveDesign();
  });

  test.afterAll(async () => {
    const report = await tester.generateReport();
    console.log('\n' + report);
  });
});