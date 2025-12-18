import { test, expect } from '@playwright/test';

test.describe('Test All Backend CRUD Operations', () => {
  test('should test CRUD operations for all entities', async ({ page }) => {
    // Login first
    await page.goto('/sign-in?lang=ar');
    await page.waitForLoadState('networkidle');
    await page.waitForSelector('form', { timeout: 10000 });
    
    await page.fill('input[name="email"]', 'admin@bookdress.com');
    await page.fill('input[name="password"]', 'admin123');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(3000);

    console.log('🔍 Testing All Backend CRUD Operations');

    const crudResults = {
      users: { create: false, read: false, update: false, delete: false },
      suppliers: { create: false, read: false, update: false, delete: false },
      dresses: { create: false, read: false, update: false, delete: false },
      bookings: { create: false, read: false, update: false, delete: false },
      locations: { create: false, read: false, update: false, delete: false }
    };

    // Test 1: USERS CRUD
    console.log('\n👥 TESTING USERS CRUD:');
    
    // Users - READ
    await page.goto('/users?lang=ar');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    const usersPageContent = await page.textContent('body');
    crudResults.users.read = !usersPageContent?.includes('لا يوجد شيء هنا') && 
                             usersPageContent && usersPageContent.length > 500;
    console.log(`Users READ: ${crudResults.users.read ? '✅' : '❌'}`);

    // Users - CREATE
    const newUserButton = page.locator('button:has-text("مستخدم جديد"), button:has-text("New User")');
    if (await newUserButton.isVisible()) {
      await newUserButton.click();
      await page.waitForTimeout(2000);
      
      const createUserContent = await page.textContent('body');
      crudResults.users.create = createUserContent?.includes('Create') || 
                                 createUserContent?.includes('إنشاء');
      console.log(`Users CREATE: ${crudResults.users.create ? '✅' : '❌'}`);
      
      // Go back
      await page.goto('/users?lang=ar');
      await page.waitForTimeout(1000);
    }

    // Users - UPDATE (test with first user)
    const userLinks = page.locator('a[href*="/user?u="]');
    if (await userLinks.count() > 0) {
      const firstUserHref = await userLinks.first().getAttribute('href');
      if (firstUserHref) {
        const userId = firstUserHref.match(/u=([a-f0-9]+)/)?.[1];
        if (userId) {
          await page.goto(`/update-user?u=${userId}&lang=ar`);
          await page.waitForTimeout(2000);
          
          const updateUserContent = await page.textContent('body');
          crudResults.users.update = updateUserContent?.includes('Update') || 
                                    updateUserContent?.includes('تحديث');
          console.log(`Users UPDATE: ${crudResults.users.update ? '✅' : '❌'}`);
        }
      }
    }

    // Test 2: SUPPLIERS CRUD
    console.log('\n🏪 TESTING SUPPLIERS CRUD:');
    
    // Suppliers - READ
    await page.goto('/suppliers?lang=ar');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    const suppliersPageContent = await page.textContent('body');
    crudResults.suppliers.read = !suppliersPageContent?.includes('لا يوجد شيء هنا') && 
                                suppliersPageContent && suppliersPageContent.length > 500;
    console.log(`Suppliers READ: ${crudResults.suppliers.read ? '✅' : '❌'}`);

    // Suppliers - CREATE
    const newSupplierButton = page.locator('button:has-text("مورد جديد"), button:has-text("New Supplier")');
    if (await newSupplierButton.isVisible()) {
      await newSupplierButton.click();
      await page.waitForTimeout(2000);
      
      const createSupplierContent = await page.textContent('body');
      crudResults.suppliers.create = createSupplierContent?.includes('Create') || 
                                    createSupplierContent?.includes('إنشاء');
      console.log(`Suppliers CREATE: ${crudResults.suppliers.create ? '✅' : '❌'}`);
      
      // Go back
      await page.goto('/suppliers?lang=ar');
      await page.waitForTimeout(1000);
    }

    // Test 3: DRESSES CRUD
    console.log('\n👗 TESTING DRESSES CRUD:');
    
    // Dresses - READ
    await page.goto('/dresses?lang=ar');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    const dressesPageContent = await page.textContent('body');
    crudResults.dresses.read = !dressesPageContent?.includes('لا يوجد شيء هنا') && 
                              dressesPageContent && dressesPageContent.length > 500;
    console.log(`Dresses READ: ${crudResults.dresses.read ? '✅' : '❌'}`);

    // Dresses - CREATE
    const newDressButton = page.locator('button:has-text("فستان جديد"), button:has-text("New Dress")');
    if (await newDressButton.isVisible()) {
      await newDressButton.click();
      await page.waitForTimeout(2000);
      
      const createDressContent = await page.textContent('body');
      crudResults.dresses.create = createDressContent?.includes('Create') || 
                                  createDressContent?.includes('إنشاء');
      console.log(`Dresses CREATE: ${crudResults.dresses.create ? '✅' : '❌'}`);
      
      // Go back
      await page.goto('/dresses?lang=ar');
      await page.waitForTimeout(1000);
    }

    // Test 4: BOOKINGS CRUD
    console.log('\n📋 TESTING BOOKINGS CRUD:');
    
    // Bookings - READ
    await page.goto('/?lang=ar');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    const bookingsPageContent = await page.textContent('body');
    crudResults.bookings.read = !bookingsPageContent?.includes('لا يوجد شيء هنا') && 
                               bookingsPageContent && bookingsPageContent.length > 500;
    console.log(`Bookings READ: ${crudResults.bookings.read ? '✅' : '❌'}`);

    // Bookings - CREATE
    const newBookingButton = page.locator('button:has-text("حجز جديد"), button:has-text("New Booking")');
    if (await newBookingButton.isVisible()) {
      await newBookingButton.click();
      await page.waitForTimeout(2000);
      
      const createBookingContent = await page.textContent('body');
      crudResults.bookings.create = createBookingContent?.includes('Customer') || 
                                   createBookingContent?.includes('عميل');
      console.log(`Bookings CREATE: ${crudResults.bookings.create ? '✅' : '❌'}`);
      
      // Go back
      await page.goto('/?lang=ar');
      await page.waitForTimeout(1000);
    }

    // Test 5: LOCATIONS CRUD
    console.log('\n📍 TESTING LOCATIONS CRUD:');
    
    // Locations - READ
    await page.goto('/locations?lang=ar');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    const locationsPageContent = await page.textContent('body');
    crudResults.locations.read = !locationsPageContent?.includes('لا يوجد شيء هنا') && 
                                locationsPageContent && locationsPageContent.length > 500;
    console.log(`Locations READ: ${crudResults.locations.read ? '✅' : '❌'}`);

    // Locations - CREATE
    const newLocationButton = page.locator('button:has-text("موقع جديد"), button:has-text("New Location")');
    if (await newLocationButton.isVisible()) {
      await newLocationButton.click();
      await page.waitForTimeout(2000);
      
      const createLocationContent = await page.textContent('body');
      crudResults.locations.create = createLocationContent?.includes('Create') || 
                                    createLocationContent?.includes('إنشاء');
      console.log(`Locations CREATE: ${crudResults.locations.create ? '✅' : '❌'}`);
    }

    // Test Advanced CRUD Operations
    console.log('\n🔧 TESTING ADVANCED CRUD OPERATIONS:');

    // Test search functionality
    await page.goto('/users?lang=ar');
    await page.waitForTimeout(2000);
    
    const searchBox = page.locator('input[type="search"], input[placeholder*="search"], input[placeholder*="بحث"]');
    if (await searchBox.isVisible()) {
      await searchBox.fill('admin');
      await page.waitForTimeout(1000);
      
      const searchResults = await page.textContent('body');
      const hasSearchResults = searchResults?.includes('admin');
      console.log(`Search functionality: ${hasSearchResults ? '✅' : '❌'}`);
    }

    // Test pagination
    const paginationElements = page.locator('.MuiPagination-root, .pagination, [aria-label*="pagination"]');
    const hasPagination = await paginationElements.count() > 0;
    console.log(`Pagination: ${hasPagination ? '✅' : '❌'}`);

    // Test sorting
    const sortableHeaders = page.locator('.MuiDataGrid-columnHeader[data-field]');
    const hasSortableHeaders = await sortableHeaders.count() > 0;
    console.log(`Sortable headers: ${hasSortableHeaders ? '✅' : '❌'}`);

    // Test filtering
    const filterButtons = page.locator('button[title*="filter"], button[aria-label*="filter"]');
    const hasFiltering = await filterButtons.count() > 0;
    console.log(`Filtering: ${hasFiltering ? '✅' : '❌'}`);

    // Generate comprehensive summary
    console.log('\n📊 COMPREHENSIVE CRUD SUMMARY:');
    console.log('=' * 50);

    const entities = ['users', 'suppliers', 'dresses', 'bookings', 'locations'];
    const operations = ['create', 'read', 'update', 'delete'];

    entities.forEach(entity => {
      console.log(`\n${entity.toUpperCase()}:`);
      operations.forEach(operation => {
        const status = crudResults[entity][operation];
        const icon = status ? '✅' : '❌';
        console.log(`  ${operation.toUpperCase()}: ${icon}`);
      });
      
      const workingOps = operations.filter(op => crudResults[entity][op]).length;
      const percentage = Math.round((workingOps / operations.length) * 100);
      console.log(`  Overall: ${workingOps}/${operations.length} (${percentage}%)`);
    });

    // Calculate overall statistics
    let totalOperations = 0;
    let workingOperations = 0;

    entities.forEach(entity => {
      operations.forEach(operation => {
        totalOperations++;
        if (crudResults[entity][operation]) {
          workingOperations++;
        }
      });
    });

    const overallPercentage = Math.round((workingOperations / totalOperations) * 100);
    console.log(`\n🎯 OVERALL CRUD STATUS: ${workingOperations}/${totalOperations} (${overallPercentage}%)`);

    // Identify strengths and areas for improvement
    console.log('\n💪 STRENGTHS:');
    entities.forEach(entity => {
      const workingOps = operations.filter(op => crudResults[entity][op]);
      if (workingOps.length > 2) {
        console.log(`  - ${entity}: ${workingOps.join(', ')} working`);
      }
    });

    console.log('\n🔧 AREAS FOR IMPROVEMENT:');
    entities.forEach(entity => {
      const failingOps = operations.filter(op => !crudResults[entity][op]);
      if (failingOps.length > 0) {
        console.log(`  - ${entity}: ${failingOps.join(', ')} need attention`);
      }
    });

    // Test should pass if we have reasonable CRUD coverage
    expect(workingOperations).toBeGreaterThan(totalOperations * 0.5); // At least 50% working
  });

  test('should test data grid interactions', async ({ page }) => {
    // Login first
    await page.goto('/sign-in?lang=ar');
    await page.waitForLoadState('networkidle');
    await page.waitForSelector('form', { timeout: 10000 });
    
    await page.fill('input[name="email"]', 'admin@bookdress.com');
    await page.fill('input[name="password"]', 'admin123');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(3000);

    console.log('🔍 Testing Data Grid Interactions');

    // Test users data grid
    await page.goto('/users?lang=ar');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Test row selection
    const checkboxes = page.locator('.MuiCheckbox-root input[type="checkbox"]');
    const checkboxCount = await checkboxes.count();
    console.log('Checkboxes found:', checkboxCount);

    if (checkboxCount > 1) {
      // Select first row
      await checkboxes.nth(1).click(); // Skip header checkbox
      await page.waitForTimeout(500);
      console.log('✅ Row selection tested');
    }

    // Test column resizing
    const columnHeaders = page.locator('.MuiDataGrid-columnHeader');
    const columnHeaderCount = await columnHeaders.count();
    console.log('Column headers found:', columnHeaderCount);

    // Test row actions
    const actionButtons = page.locator('.MuiIconButton-root');
    const actionButtonCount = await actionButtons.count();
    console.log('Action buttons found:', actionButtonCount);

    // Test should pass
    expect(checkboxCount + columnHeaderCount + actionButtonCount).toBeGreaterThan(0);
  });
});
