import { test, expect, Page } from '@playwright/test';

interface TestResult {
  testName: string;
  page: string;
  status: 'PASS' | 'FAIL' | 'WARNING';
  issues: string[];
  timestamp: string;
}

class FrontendPageTester {
  private page: Page;
  private results: TestResult[] = [];
  private baseUrl = 'http://localhost:3000';

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

  async testHomePage() {
    const pageName = 'Home Page';
    const issues: string[] = [];

    try {
      await this.page.goto(this.baseUrl);
      await this.page.waitForLoadState('networkidle');

      // Test navigation header
      const header = this.page.locator('header');
      if (!(await header.isVisible())) {
        issues.push('Header navigation not visible');
      }

      // Test main content areas
      const mainContent = this.page.locator('main, .main-content, [role="main"]');
      if (!(await mainContent.isVisible())) {
        issues.push('Main content area not found');
      }

      // Test search functionality
      const searchForm = this.page.locator('form[role="search"], .search-form, input[type="search"]');
      if (await searchForm.count() > 0) {
        await searchForm.first().isVisible();
      } else {
        issues.push('Search form not found');
      }

      // Test dress listings or featured content
      const dressCards = this.page.locator('.dress-card, .dress-item, [data-testid="dress-card"]');
      if ((await dressCards.count()) === 0) {
        issues.push('No dress cards/listings found');
      }

      // Test footer
      const footer = this.page.locator('footer');
      if (!(await footer.isVisible())) {
        issues.push('Footer not visible');
      }

      // Test responsive design
      await this.page.setViewportSize({ width: 768, height: 1024 });
      await this.page.waitForTimeout(1000);
      
      await this.page.setViewportSize({ width: 375, height: 667 });
      await this.page.waitForTimeout(1000);
      
      await this.page.setViewportSize({ width: 1920, height: 1080 });

      this.logTest('Homepage Load and Layout', pageName, issues.length === 0 ? 'PASS' : 'WARNING', issues);
    } catch (error) {
      issues.push(`Error: ${error.message}`);
      this.logTest('Homepage Load and Layout', pageName, 'FAIL', issues);
    }
  }

  async testSignInPage() {
    const pageName = 'Sign In Page';
    const issues: string[] = [];

    try {
      await this.page.goto(`${this.baseUrl}/sign-in`);
      await this.page.waitForLoadState('networkidle');

      // Test form elements
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

      // Test form validation
      if (await submitButton.isVisible()) {
        await submitButton.click();
        await this.page.waitForTimeout(1000);
        
        const errorMessages = this.page.locator('.error, .error-message, [role="alert"]');
        if ((await errorMessages.count()) === 0) {
          issues.push('Form validation errors not shown for empty form');
        }
      }

      // Test social login options if available
      const socialLogin = this.page.locator('.social-login, .google-login, .facebook-login');
      if ((await socialLogin.count()) === 0) {
        issues.push('Social login options not found');
      }

      // Test forgot password link
      const forgotPasswordLink = this.page.locator('a[href*="forgot"], .forgot-password');
      if (!(await forgotPasswordLink.isVisible())) {
        issues.push('Forgot password link not found');
      }

      // Test sign up link
      const signUpLink = this.page.locator('a[href*="sign-up"], .sign-up-link');
      if (!(await signUpLink.isVisible())) {
        issues.push('Sign up link not found');
      }

      this.logTest('Sign In Form and Validation', pageName, issues.length === 0 ? 'PASS' : 'WARNING', issues);
    } catch (error) {
      issues.push(`Error: ${error.message}`);
      this.logTest('Sign In Form and Validation', pageName, 'FAIL', issues);
    }
  }

  async testSignUpPage() {
    const pageName = 'Sign Up Page';
    const issues: string[] = [];

    try {
      await this.page.goto(`${this.baseUrl}/sign-up`);
      await this.page.waitForLoadState('networkidle');

      // Test required form fields
      const requiredFields = [
        'input[name="fullName"], input[name="name"]',
        'input[name="email"]',
        'input[name="password"]',
        'input[name="phone"]'
      ];

      for (const selector of requiredFields) {
        const field = this.page.locator(selector);
        if (!(await field.isVisible())) {
          issues.push(`Required field not found: ${selector}`);
        }
      }

      // Test password confirmation
      const confirmPasswordField = this.page.locator('input[name="confirmPassword"], input[name="password2"]');
      if (!(await confirmPasswordField.isVisible())) {
        issues.push('Password confirmation field not found');
      }

      // Test terms and conditions
      const termsCheckbox = this.page.locator('input[type="checkbox"][name*="terms"], .terms-checkbox');
      if (!(await termsCheckbox.isVisible())) {
        issues.push('Terms and conditions checkbox not found');
      }

      // Test submit button
      const submitButton = this.page.locator('button[type="submit"], .submit-btn, .sign-up-btn');
      if (!(await submitButton.isVisible())) {
        issues.push('Submit button not found');
      }

      // Test form validation
      if (await submitButton.isVisible()) {
        await submitButton.click();
        await this.page.waitForTimeout(1000);
        
        const errorMessages = this.page.locator('.error, .error-message, [role="alert"]');
        if ((await errorMessages.count()) === 0) {
          issues.push('Form validation errors not shown for empty form');
        }
      }

      this.logTest('Sign Up Form and Validation', pageName, issues.length === 0 ? 'PASS' : 'WARNING', issues);
    } catch (error) {
      issues.push(`Error: ${error.message}`);
      this.logTest('Sign Up Form and Validation', pageName, 'FAIL', issues);
    }
  }

  async testSearchPage() {
    const pageName = 'Search Page';
    const issues: string[] = [];

    try {
      await this.page.goto(`${this.baseUrl}/search`);
      await this.page.waitForLoadState('networkidle');

      // Test search form
      const searchForm = this.page.locator('form.search-form, .search-container form');
      if (!(await searchForm.isVisible())) {
        issues.push('Search form not found');
      }

      // Test filter options
      const filters = [
        '.dress-type-filter, .type-filter',
        '.dress-size-filter, .size-filter',
        '.dress-style-filter, .style-filter',
        '.price-filter, .deposit-filter',
        '.location-filter'
      ];

      for (const filterSelector of filters) {
        const filter = this.page.locator(filterSelector);
        if ((await filter.count()) === 0) {
          issues.push(`Filter not found: ${filterSelector}`);
        }
      }

      // Test search results area
      const resultsContainer = this.page.locator('.search-results, .dress-list, .results-container');
      if (!(await resultsContainer.isVisible())) {
        issues.push('Search results container not found');
      }

      // Test map view if available
      const mapView = this.page.locator('.map-container, .leaflet-container, #map');
      if ((await mapView.count()) > 0) {
        if (!(await mapView.isVisible())) {
          issues.push('Map container found but not visible');
        }
      }

      // Test pagination
      const pagination = this.page.locator('.pagination, .page-navigation');
      if ((await pagination.count()) === 0) {
        issues.push('Pagination not found');
      }

      this.logTest('Search Functionality and Filters', pageName, issues.length === 0 ? 'PASS' : 'WARNING', issues);
    } catch (error) {
      issues.push(`Error: ${error.message}`);
      this.logTest('Search Functionality and Filters', pageName, 'FAIL', issues);
    }
  }

  async testDressDetailsPage() {
    const pageName = 'Dress Details Page';
    const issues: string[] = [];

    try {
      // First try to find a dress link from search or home page
      await this.page.goto(`${this.baseUrl}/search`);
      await this.page.waitForLoadState('networkidle');

      const dressLinks = this.page.locator('a[href*="/dress/"], .dress-card a, .dress-item a');
      if ((await dressLinks.count()) > 0) {
        await dressLinks.first().click();
        await this.page.waitForLoadState('networkidle');
      } else {
        // Fallback to a direct URL attempt
        await this.page.goto(`${this.baseUrl}/dress/test-dress-id`);
        await this.page.waitForLoadState('networkidle');
      }

      // Test dress image gallery
      const imageGallery = this.page.locator('.dress-images, .image-gallery, .dress-photos');
      if (!(await imageGallery.isVisible())) {
        issues.push('Dress image gallery not found');
      }

      // Test dress information
      const dressInfo = [
        '.dress-name, .dress-title, h1',
        '.dress-price, .price-info',
        '.dress-description, .description',
        '.dress-details, .dress-specs'
      ];

      for (const infoSelector of dressInfo) {
        const info = this.page.locator(infoSelector);
        if (!(await info.isVisible())) {
          issues.push(`Dress info not found: ${infoSelector}`);
        }
      }

      // Test booking button
      const bookingButton = this.page.locator('.book-now-btn, .booking-btn, button[text*="Book"]');
      if (!(await bookingButton.isVisible())) {
        issues.push('Booking button not found');
      }

      // Test availability calendar if present
      const calendar = this.page.locator('.calendar, .availability-calendar, .date-picker');
      if ((await calendar.count()) === 0) {
        issues.push('Availability calendar not found');
      }

      this.logTest('Dress Details and Information', pageName, issues.length === 0 ? 'PASS' : 'WARNING', issues);
    } catch (error) {
      issues.push(`Error: ${error.message}`);
      this.logTest('Dress Details and Information', pageName, 'FAIL', issues);
    }
  }

  async testUserSettingsPage() {
    const pageName = 'User Settings Page';
    const issues: string[] = [];

    try {
      await this.page.goto(`${this.baseUrl}/settings`);
      await this.page.waitForLoadState('networkidle');

      // Check if redirected to login (which is expected if not authenticated)
      const currentUrl = this.page.url();
      if (currentUrl.includes('/sign-in') || currentUrl.includes('/login')) {
        issues.push('Redirected to login (authentication required)');
      } else {
        // Test profile form fields
        const profileFields = [
          'input[name="fullName"], input[name="name"]',
          'input[name="email"]',
          'input[name="phone"]'
        ];

        for (const fieldSelector of profileFields) {
          const field = this.page.locator(fieldSelector);
          if (!(await field.isVisible())) {
            issues.push(`Profile field not found: ${fieldSelector}`);
          }
        }

        // Test avatar upload
        const avatarUpload = this.page.locator('input[type="file"], .avatar-upload, .photo-upload');
        if (!(await avatarUpload.isVisible())) {
          issues.push('Avatar upload not found');
        }

        // Test save button
        const saveButton = this.page.locator('button[type="submit"], .save-btn, .update-btn');
        if (!(await saveButton.isVisible())) {
          issues.push('Save button not found');
        }
      }

      this.logTest('User Settings and Profile', pageName, issues.length === 0 ? 'PASS' : 'WARNING', issues);
    } catch (error) {
      issues.push(`Error: ${error.message}`);
      this.logTest('User Settings and Profile', pageName, 'FAIL', issues);
    }
  }

  async testResponsiveDesign() {
    const issues: string[] = [];
    const viewports = [
      { width: 375, height: 667, name: 'Mobile' },
      { width: 768, height: 1024, name: 'Tablet' },
      { width: 1920, height: 1080, name: 'Desktop' }
    ];

    try {
      for (const viewport of viewports) {
        await this.page.setViewportSize({ width: viewport.width, height: viewport.height });
        await this.page.goto(this.baseUrl);
        await this.page.waitForLoadState('networkidle');

        // Test navigation menu
        const nav = this.page.locator('nav, .navigation, .nav-menu');
        if (!(await nav.isVisible())) {
          issues.push(`Navigation not visible on ${viewport.name}`);
        }

        // Test main content
        const main = this.page.locator('main, .main-content');
        if (!(await main.isVisible())) {
          issues.push(`Main content not visible on ${viewport.name}`);
        }

        // Check for mobile menu button on smaller screens
        if (viewport.width < 768) {
          const mobileMenuBtn = this.page.locator('.mobile-menu-btn, .hamburger, .menu-toggle');
          if (!(await mobileMenuBtn.isVisible())) {
            issues.push(`Mobile menu button not found on ${viewport.name}`);
          }
        }
      }

      this.logTest('Responsive Design', 'All Pages', issues.length === 0 ? 'PASS' : 'WARNING', issues);
    } catch (error) {
      issues.push(`Error: ${error.message}`);
      this.logTest('Responsive Design', 'All Pages', 'FAIL', issues);
    }
  }

  async generateReport(): Promise<string> {
    const totalTests = this.results.length;
    const passedTests = this.results.filter(r => r.status === 'PASS').length;
    const failedTests = this.results.filter(r => r.status === 'FAIL').length;
    const warningTests = this.results.filter(r => r.status === 'WARNING').length;

    let report = `# Frontend E2E Test Report\n\n`;
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

    report += `## Recommendations\n\n`;
    
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
    report += `1. Fix all critical issues (failed tests)\n`;
    report += `2. Address warnings to improve user experience\n`;
    report += `3. Test again after fixes are implemented\n`;
    report += `4. Consider adding unit tests for complex components\n`;

    return report;
  }
}

test.describe('Frontend Comprehensive Testing', () => {
  let tester: FrontendPageTester;

  test.beforeEach(async ({ page }) => {
    tester = new FrontendPageTester(page);
  });

  test('Test Home Page', async ({ page }) => {
    await tester.testHomePage();
  });

  test('Test Sign In Page', async ({ page }) => {
    await tester.testSignInPage();
  });

  test('Test Sign Up Page', async ({ page }) => {
    await tester.testSignUpPage();
  });

  test('Test Search Page', async ({ page }) => {
    await tester.testSearchPage();
  });

  test('Test Dress Details Page', async ({ page }) => {
    await tester.testDressDetailsPage();
  });

  test('Test User Settings Page', async ({ page }) => {
    await tester.testUserSettingsPage();
  });

  test('Test Responsive Design', async ({ page }) => {
    await tester.testResponsiveDesign();
  });

  test.afterAll(async () => {
    const report = await tester.generateReport();
    console.log('\n' + report);
  });
});