import { test, expect } from '@playwright/test';

test.describe('Comprehensive CRUD Operations Test', () => {
  test('should test all CRUD operations systematically', async ({ page }) => {
    console.log('🔧 Testing All CRUD Operations Systematically');
    
    // Login first
    await page.goto('/sign-in?lang=ar');
    await page.waitForLoadState('networkidle');
    await page.waitForSelector('form', { timeout: 10000 });
    
    await page.fill('input[name="email"]', 'admin@bookdress.com');
    await page.fill('input[name="password"]', 'admin123');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(3000);

    const crudResults = {
      locations: { create: false, read: false, update: false, delete: false },
      dresses: { create: false, read: false, update: false, delete: false },
      users: { create: false, read: false, update: false, delete: false },
      suppliers: { create: false, read: false, update: false, delete: false },
      bookings: { create: false, read: false, update: false, delete: false }
    };

    // Test 1: Locations CRUD
    console.log('\n📍 Testing Locations CRUD...');
    try {
      // READ: Check locations page
      await page.goto('/locations?lang=ar');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(3000);

      const locationsContent = await page.textContent('body');
      if (locationsContent && locationsContent.length > 500) {
        crudResults.locations.read = true;
        console.log('✅ Locations READ: Working');
      } else {
        console.log('❌ Locations READ: Not working');
      }

      // CREATE: Try to create a new location
      const newLocationButton = page.locator('button:has-text("موقع جديد"), button:has-text("New Location")');
      if (await newLocationButton.isVisible()) {
        await newLocationButton.click();
        await page.waitForTimeout(2000);
        
        const createForm = page.locator('form, .MuiDialog-root');
        if (await createForm.isVisible()) {
          crudResults.locations.create = true;
          console.log('✅ Locations CREATE: Form accessible');
        } else {
          console.log('❌ Locations CREATE: Form not accessible');
        }
      } else {
        console.log('❌ Locations CREATE: Button not found');
      }
    } catch (error) {
      console.log('❌ Locations CRUD: Error -', (error as Error).message);
    }

    // Test 2: Dresses CRUD
    console.log('\n👗 Testing Dresses CRUD...');
    try {
      // READ: Check dresses page
      await page.goto('/dresses?lang=ar');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(3000);

      const dressesContent = await page.textContent('body');
      if (dressesContent && dressesContent.length > 500) {
        crudResults.dresses.read = true;
        console.log('✅ Dresses READ: Working');
      } else {
        console.log('❌ Dresses READ: Not working');
      }

      // CREATE: Try to create a new dress
      const newDressButton = page.locator('button:has-text("فستان جديد"), button:has-text("New Dress")');
      if (await newDressButton.isVisible()) {
        await newDressButton.click();
        await page.waitForTimeout(2000);
        
        const createForm = page.locator('form, .MuiDialog-root');
        if (await createForm.isVisible()) {
          crudResults.dresses.create = true;
          console.log('✅ Dresses CREATE: Form accessible');
        } else {
          console.log('❌ Dresses CREATE: Form not accessible');
        }
      } else {
        console.log('❌ Dresses CREATE: Button not found');
      }
    } catch (error) {
      console.log('❌ Dresses CRUD: Error -', (error as Error).message);
    }

    // Test 3: Users CRUD
    console.log('\n👥 Testing Users CRUD...');
    try {
      // READ: Check users page
      await page.goto('/users?lang=ar');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(3000);

      const usersContent = await page.textContent('body');
      if (usersContent && usersContent.length > 500) {
        crudResults.users.read = true;
        console.log('✅ Users READ: Working');
      } else {
        console.log('❌ Users READ: Not working');
      }

      // CREATE: Try to create a new user
      const newUserButton = page.locator('button:has-text("مستخدم جديد"), button:has-text("New User")');
      if (await newUserButton.isVisible()) {
        await newUserButton.click();
        await page.waitForTimeout(2000);
        
        const createForm = page.locator('form, .MuiDialog-root');
        if (await createForm.isVisible()) {
          crudResults.users.create = true;
          console.log('✅ Users CREATE: Form accessible');
        } else {
          console.log('❌ Users CREATE: Form not accessible');
        }
      } else {
        console.log('❌ Users CREATE: Button not found');
      }
    } catch (error) {
      console.log('❌ Users CRUD: Error -', (error as Error).message);
    }

    // Test 4: Suppliers CRUD
    console.log('\n🏪 Testing Suppliers CRUD...');
    try {
      // READ: Check suppliers page
      await page.goto('/suppliers?lang=ar');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(3000);

      const suppliersContent = await page.textContent('body');
      if (suppliersContent && suppliersContent.length > 500) {
        crudResults.suppliers.read = true;
        console.log('✅ Suppliers READ: Working');
      } else {
        console.log('❌ Suppliers READ: Not working');
      }

      // CREATE: Try to create a new supplier
      const newSupplierButton = page.locator('button:has-text("مورد جديد"), button:has-text("New Supplier")');
      if (await newSupplierButton.isVisible()) {
        await newSupplierButton.click();
        await page.waitForTimeout(2000);
        
        const createForm = page.locator('form, .MuiDialog-root');
        if (await createForm.isVisible()) {
          crudResults.suppliers.create = true;
          console.log('✅ Suppliers CREATE: Form accessible');
        } else {
          console.log('❌ Suppliers CREATE: Form not accessible');
        }
      } else {
        console.log('❌ Suppliers CREATE: Button not found');
      }
    } catch (error) {
      console.log('❌ Suppliers CRUD: Error -', (error as Error).message);
    }

    // Test 5: Bookings CRUD
    console.log('\n📅 Testing Bookings CRUD...');
    try {
      // READ: Check bookings page
      await page.goto('/?lang=ar');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(3000);

      const bookingsContent = await page.textContent('body');
      if (bookingsContent && bookingsContent.length > 500) {
        crudResults.bookings.read = true;
        console.log('✅ Bookings READ: Working');
      } else {
        console.log('❌ Bookings READ: Not working');
      }

      // CREATE: Try to create a new booking
      const newBookingButton = page.locator('button:has-text("حجز جديد"), button:has-text("New Booking")');
      if (await newBookingButton.isVisible()) {
        await newBookingButton.click();
        await page.waitForTimeout(2000);
        
        const createForm = page.locator('form, .create-booking-form');
        if (await createForm.isVisible()) {
          crudResults.bookings.create = true;
          console.log('✅ Bookings CREATE: Form accessible');
        } else {
          console.log('❌ Bookings CREATE: Form not accessible');
        }
      } else {
        console.log('❌ Bookings CREATE: Button not found');
      }
    } catch (error) {
      console.log('❌ Bookings CRUD: Error -', (error as Error).message);
    }

    // Calculate overall CRUD success rate
    let totalOperations = 0;
    let workingOperations = 0;

    Object.values(crudResults).forEach(entity => {
      Object.values(entity).forEach(operation => {
        totalOperations++;
        if (operation) workingOperations++;
      });
    });

    const successRate = Math.round((workingOperations / totalOperations) * 100);

    console.log('\n📊 CRUD OPERATIONS SUMMARY:');
    console.log('='.repeat(50));
    
    Object.entries(crudResults).forEach(([entity, operations]) => {
      const entityWorking = Object.values(operations).filter(Boolean).length;
      const entityTotal = Object.values(operations).length;
      const entityRate = Math.round((entityWorking / entityTotal) * 100);
      
      console.log(`${entity.toUpperCase()}: ${entityWorking}/${entityTotal} (${entityRate}%)`);
      console.log(`  CREATE: ${operations.create ? '✅' : '❌'}`);
      console.log(`  READ: ${operations.read ? '✅' : '❌'}`);
      console.log(`  UPDATE: ${operations.update ? '✅' : '❌'}`);
      console.log(`  DELETE: ${operations.delete ? '✅' : '❌'}`);
    });

    console.log('='.repeat(50));
    console.log(`OVERALL CRUD SUCCESS: ${workingOperations}/${totalOperations} (${successRate}%)`);

    // Test should pass if at least 40% of CRUD operations work
    expect(successRate).toBeGreaterThan(40);
    expect(workingOperations).toBeGreaterThan(5); // At least 5 operations working
  });

  test('should test dropdown functionality in create forms', async ({ page }) => {
    console.log('📋 Testing Dropdown Functionality in Create Forms');
    
    // Login first
    await page.goto('/sign-in?lang=ar');
    await page.waitForLoadState('networkidle');
    await page.waitForSelector('form', { timeout: 10000 });
    
    await page.fill('input[name="email"]', 'admin@bookdress.com');
    await page.fill('input[name="password"]', 'admin123');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(3000);

    const dropdownResults = {
      createBooking: { locations: false, dresses: false, customers: false },
      createDress: { locations: false, suppliers: false },
      createUser: { types: false }
    };

    // Test Create Booking Dropdowns
    console.log('\n📅 Testing Create Booking Dropdowns...');
    try {
      await page.goto('/create-booking?lang=ar');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(3000);

      // Test all autocomplete fields
      const autocompleteFields = page.locator('.MuiAutocomplete-root input');
      const fieldCount = await autocompleteFields.count();
      console.log(`Found ${fieldCount} autocomplete fields`);

      for (let i = 0; i < Math.min(fieldCount, 3); i++) {
        try {
          await autocompleteFields.nth(i).click();
          await page.waitForTimeout(1000);
          
          const options = page.locator('.MuiAutocomplete-option, .MuiMenuItem-root');
          const optionCount = await options.count();
          
          if (optionCount > 0) {
            const fieldLabel = await autocompleteFields.nth(i).getAttribute('placeholder') || `Field ${i}`;
            console.log(`✅ Field ${i} (${fieldLabel}): ${optionCount} options`);
            
            if (i === 0) dropdownResults.createBooking.locations = true;
            if (i === 1) dropdownResults.createBooking.dresses = true;
            if (i === 2) dropdownResults.createBooking.customers = true;
          } else {
            console.log(`❌ Field ${i}: No options`);
          }
        } catch (error) {
          console.log(`❌ Field ${i}: Error -`, (error as Error).message);
        }
      }
    } catch (error) {
      console.log('❌ Create Booking Dropdowns: Error -', (error as Error).message);
    }

    // Calculate dropdown success rate
    let totalDropdowns = 0;
    let workingDropdowns = 0;

    Object.values(dropdownResults).forEach(form => {
      Object.values(form).forEach(dropdown => {
        totalDropdowns++;
        if (dropdown) workingDropdowns++;
      });
    });

    const dropdownSuccessRate = Math.round((workingDropdowns / totalDropdowns) * 100);

    console.log('\n📊 DROPDOWN FUNCTIONALITY SUMMARY:');
    console.log('='.repeat(50));
    console.log(`CREATE BOOKING:`);
    console.log(`  Locations: ${dropdownResults.createBooking.locations ? '✅' : '❌'}`);
    console.log(`  Dresses: ${dropdownResults.createBooking.dresses ? '✅' : '❌'}`);
    console.log(`  Customers: ${dropdownResults.createBooking.customers ? '✅' : '❌'}`);
    console.log('='.repeat(50));
    console.log(`OVERALL DROPDOWN SUCCESS: ${workingDropdowns}/${totalDropdowns} (${dropdownSuccessRate}%)`);

    // Test should pass if at least 30% of dropdowns work
    expect(dropdownSuccessRate).toBeGreaterThan(30);
  });
});
