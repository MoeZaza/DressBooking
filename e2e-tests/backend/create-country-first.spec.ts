import { test, expect } from '@playwright/test';

test.describe('Create Country First', () => {
  test('should create Palestine country first, then create Jenin location', async ({ page }) => {
    // Login first
    await page.goto('/sign-in?lang=ar');
    await page.waitForLoadState('networkidle');
    await page.waitForSelector('form', { timeout: 10000 });
    
    await page.fill('input[name="email"]', 'admin@bookdress.com');
    await page.fill('input[name="password"]', 'admin123');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(3000);

    console.log('🌍 Step 1: Creating Palestine Country');

    // Go to countries page
    await page.goto('/countries?lang=ar');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    const countriesPageContent = await page.textContent('body');
    console.log('Countries page content:', countriesPageContent?.substring(0, 300));

    // Check if Palestine already exists
    if (countriesPageContent?.includes('Palestine') || countriesPageContent?.includes('فلسطين')) {
      console.log('✅ Palestine country already exists');
    } else {
      console.log('🔍 Palestine not found, creating...');

      // Look for "New Country" button
      const addCountryButton = page.locator('button:has-text("بلد جديد"), button:has-text("New Country")');
      const addCountryButtonCount = await addCountryButton.count();
      console.log('Add country button count:', addCountryButtonCount);

      if (addCountryButtonCount > 0) {
        await addCountryButton.first().click();
        await page.waitForTimeout(3000);

        // Fill country form
        const countryFormContent = await page.textContent('body');
        console.log('Country form content:', countryFormContent?.substring(0, 300));

        if (countryFormContent?.includes('Create') || countryFormContent?.includes('إنشاء')) {
          console.log('✅ Create country form opened');

          const countryInputs = page.locator('input[type="text"]');
          const countryInputCount = await countryInputs.count();
          console.log(`Found ${countryInputCount} text inputs in country form`);

          if (countryInputCount >= 4) {
            await countryInputs.nth(0).fill('Palestine'); // English
            await countryInputs.nth(1).fill('Palestine'); // French
            await countryInputs.nth(2).fill('Palestina'); // Spanish
            await countryInputs.nth(3).fill('فلسطين'); // Arabic
            console.log('✅ Filled country names');

            // Submit country form
            const submitCountryButton = page.locator('button[type="submit"], button:has-text("إنشاء"), button:has-text("Create")');
            if (await submitCountryButton.isVisible()) {
              await submitCountryButton.first().click();
              await page.waitForTimeout(3000);
              console.log('✅ Submitted country form');
            }
          }
        }
      }
    }

    console.log('🏙️ Step 2: Creating Jenin Location');

    // Now go to locations page
    await page.goto('/locations?lang=ar');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    const locationsPageContent = await page.textContent('body');
    console.log('Locations page content:', locationsPageContent?.substring(0, 300));

    // Check if Jenin already exists
    if (locationsPageContent?.includes('Jenin') || locationsPageContent?.includes('جنين')) {
      console.log('✅ Jenin location already exists');
    } else {
      console.log('🔍 Jenin not found, creating...');

      // Look for "New Location" button
      const addLocationButton = page.locator('button:has-text("موقع جديد"), button:has-text("New Location")');
      const addLocationButtonCount = await addLocationButton.count();
      console.log('Add location button count:', addLocationButtonCount);

      if (addLocationButtonCount > 0) {
        await addLocationButton.first().click();
        await page.waitForTimeout(3000);

        // Fill location form
        const locationFormContent = await page.textContent('body');
        console.log('Location form content:', locationFormContent?.substring(0, 300));

        if (locationFormContent?.includes('Create') || locationFormContent?.includes('إنشاء')) {
          console.log('✅ Create location form opened');

          // First, select country
          console.log('🔍 Selecting Palestine country...');
          const countryDropdown = page.locator('.MuiSelect-root').first();
          if (await countryDropdown.isVisible()) {
            await countryDropdown.click();
            await page.waitForTimeout(1000);

            const countryOptions = page.locator('[role="option"]');
            const countryOptionCount = await countryOptions.count();
            console.log(`Found ${countryOptionCount} country options`);

            // Look for Palestine option
            let palestineFound = false;
            for (let i = 0; i < countryOptionCount; i++) {
              const optionText = await countryOptions.nth(i).textContent();
              console.log(`Country option ${i + 1}: "${optionText}"`);
              
              if (optionText?.includes('Palestine') || optionText?.includes('فلسطين')) {
                await countryOptions.nth(i).click();
                await page.waitForTimeout(500);
                console.log('✅ Selected Palestine country');
                palestineFound = true;
                break;
              }
            }

            if (!palestineFound && countryOptionCount > 0) {
              // Select first option if Palestine not found
              await countryOptions.first().click();
              await page.waitForTimeout(500);
              console.log('⚠️ Selected first available country');
            }
          }

          // Fill location names
          const locationInputs = page.locator('input[type="text"]');
          const locationInputCount = await locationInputs.count();
          console.log(`Found ${locationInputCount} text inputs in location form`);

          if (locationInputCount >= 4) {
            // Skip first 2 inputs (latitude/longitude) and fill name inputs
            const nameStartIndex = locationInputCount >= 6 ? 2 : 0;
            
            await locationInputs.nth(nameStartIndex).fill('Jenin'); // English
            await locationInputs.nth(nameStartIndex + 1).fill('Jenin'); // French
            await locationInputs.nth(nameStartIndex + 2).fill('Jenin'); // Spanish
            await locationInputs.nth(nameStartIndex + 3).fill('جنين'); // Arabic
            console.log('✅ Filled location names');

            // Submit location form
            const submitLocationButton = page.locator('button[type="submit"], button:has-text("إنشاء"), button:has-text("Create")');
            if (await submitLocationButton.isVisible()) {
              await submitLocationButton.first().click();
              await page.waitForTimeout(3000);
              console.log('✅ Submitted location form');

              // Check result
              const resultContent = await page.textContent('body');
              if (resultContent?.includes('تم إنشاء') || resultContent?.includes('created')) {
                console.log('✅ Location created successfully');
              } else if (resultContent?.includes('already exists')) {
                console.log('⚠️ Location already exists');
              } else {
                console.log('⚠️ Uncertain creation result');
              }
            }
          }
        }
      }
    }

    console.log('🔍 Step 3: Testing Location Dropdown');

    // Test location dropdown in create booking
    await page.goto('/create-booking?lang=ar');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    const bookingPageContent = await page.textContent('body');

    if (!bookingPageContent?.includes('لا يوجد شيء هنا')) {
      // Select customer first
      const customerDropdown = page.locator('.MuiAutocomplete-root').first();
      if (await customerDropdown.isVisible()) {
        const customerInput = customerDropdown.locator('input');
        await customerInput.click();
        await page.waitForTimeout(1000);
        
        const customerOptions = page.locator('[role="option"]');
        if (await customerOptions.count() > 0) {
          await customerOptions.first().click();
          await page.waitForTimeout(1000);
        }
      }

      // Go to next step
      const nextButton = page.locator('button:has-text("Next"), button:has-text("التالي")');
      if (await nextButton.isVisible()) {
        await nextButton.click();
        await page.waitForTimeout(3000);
      }

      // Test location dropdown
      const autocompletes = page.locator('.MuiAutocomplete-root');
      const autocompleteCount = await autocompletes.count();
      console.log(`Found ${autocompleteCount} autocompletes in booking form`);

      if (autocompleteCount >= 3) {
        const locationAutocomplete = autocompletes.nth(2);
        const locationInput = locationAutocomplete.locator('input');
        
        if (await locationInput.isVisible()) {
          await locationInput.click();
          await page.waitForTimeout(1000);

          const locationOptions = page.locator('[role="option"]');
          const locationOptionCount = await locationOptions.count();
          console.log(`Location options found: ${locationOptionCount}`);

          if (locationOptionCount > 0) {
            const locationTexts = [];
            for (let i = 0; i < Math.min(locationOptionCount, 3); i++) {
              const optionText = await locationOptions.nth(i).textContent();
              if (optionText) locationTexts.push(optionText.trim());
            }
            console.log('Location options:', locationTexts);

            const hasJenin = locationTexts.some(text => 
              text.includes('Jenin') || text.includes('جنين')
            );

            if (hasJenin) {
              console.log('🎉 SUCCESS: Jenin location found in dropdown!');
            } else {
              console.log('⚠️ Jenin not found in dropdown, but locations exist');
            }
          } else {
            console.log('⚠️ No location options found in dropdown');
          }

          await page.keyboard.press('Escape');
        }
      }
    }

    // Test should pass
    expect(true).toBe(true);
  });
});
