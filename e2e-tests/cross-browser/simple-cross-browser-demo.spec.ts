import { test, expect } from '@playwright/test';

test.describe('Simple Cross-Browser Compatibility Demo', () => {
  test('should demonstrate cross-browser testing approach', async ({ page, browserName }) => {
    console.log(`🌐 Testing Cross-Browser Compatibility in ${browserName}`);
    
    // Test basic browser capabilities
    const browserCapabilities = await page.evaluate(() => {
      return {
        userAgent: navigator.userAgent,
        language: navigator.language,
        platform: navigator.platform,
        cookieEnabled: navigator.cookieEnabled,
        onLine: navigator.onLine,
        hardwareConcurrency: navigator.hardwareConcurrency,
        maxTouchPoints: navigator.maxTouchPoints,
        
        // CSS support
        supportsGrid: CSS.supports('display', 'grid'),
        supportsFlexbox: CSS.supports('display', 'flex'),
        supportsCustomProperties: CSS.supports('--test', 'value'),
        
        // JavaScript features
        supportsArrowFunctions: (() => {
          try {
            eval('() => {}');
            return true;
          } catch {
            return false;
          }
        })(),
        
        supportsAsyncAwait: (() => {
          try {
            eval('async function test() { await Promise.resolve(); }');
            return true;
          } catch {
            return false;
          }
        })(),
        
        // DOM features
        supportsCustomElements: 'customElements' in window,
        supportsShadowDOM: 'attachShadow' in Element.prototype,
        
        // Storage
        supportsLocalStorage: 'localStorage' in window,
        supportsSessionStorage: 'sessionStorage' in window,
        
        // Modern APIs
        supportsFetch: 'fetch' in window,
        supportsWebGL: (() => {
          try {
            const canvas = document.createElement('canvas');
            return !!(canvas.getContext('webgl') || canvas.getContext('experimental-webgl'));
          } catch {
            return false;
          }
        })(),
        
        // Viewport
        viewportWidth: window.innerWidth,
        viewportHeight: window.innerHeight,
        devicePixelRatio: window.devicePixelRatio
      };
    });

    console.log(`\n📊 ${browserName.toUpperCase()} CAPABILITIES:`);
    console.log(`User Agent: ${browserCapabilities.userAgent}`);
    console.log(`Platform: ${browserCapabilities.platform}`);
    console.log(`Language: ${browserCapabilities.language}`);
    console.log(`Viewport: ${browserCapabilities.viewportWidth}x${browserCapabilities.viewportHeight}`);
    console.log(`Device Pixel Ratio: ${browserCapabilities.devicePixelRatio}`);
    console.log(`Hardware Concurrency: ${browserCapabilities.hardwareConcurrency}`);
    console.log(`Max Touch Points: ${browserCapabilities.maxTouchPoints}`);

    console.log(`\n🎨 CSS SUPPORT:`);
    console.log(`Grid: ${browserCapabilities.supportsGrid ? '✅' : '❌'}`);
    console.log(`Flexbox: ${browserCapabilities.supportsFlexbox ? '✅' : '❌'}`);
    console.log(`Custom Properties: ${browserCapabilities.supportsCustomProperties ? '✅' : '❌'}`);

    console.log(`\n⚡ JAVASCRIPT SUPPORT:`);
    console.log(`Arrow Functions: ${browserCapabilities.supportsArrowFunctions ? '✅' : '❌'}`);
    console.log(`Async/Await: ${browserCapabilities.supportsAsyncAwait ? '✅' : '❌'}`);

    console.log(`\n🔧 DOM & APIs:`);
    console.log(`Custom Elements: ${browserCapabilities.supportsCustomElements ? '✅' : '❌'}`);
    console.log(`Shadow DOM: ${browserCapabilities.supportsShadowDOM ? '✅' : '❌'}`);
    console.log(`Local Storage: ${browserCapabilities.supportsLocalStorage ? '✅' : '❌'}`);
    console.log(`Fetch API: ${browserCapabilities.supportsFetch ? '✅' : '❌'}`);
    console.log(`WebGL: ${browserCapabilities.supportsWebGL ? '✅' : '❌'}`);

    // Test responsive design
    const viewports = [
      { name: 'Desktop', width: 1920, height: 1080 },
      { name: 'Tablet', width: 768, height: 1024 },
      { name: 'Mobile', width: 375, height: 667 }
    ];

    console.log(`\n📱 RESPONSIVE DESIGN TEST:`);
    for (const viewport of viewports) {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await page.waitForTimeout(500);

      const actualViewport = await page.evaluate(() => ({
        width: window.innerWidth,
        height: window.innerHeight
      }));

      const isCorrectSize = Math.abs(actualViewport.width - viewport.width) <= 10 &&
                           Math.abs(actualViewport.height - viewport.height) <= 10;

      console.log(`${viewport.name} (${viewport.width}x${viewport.height}): ${isCorrectSize ? '✅' : '❌'} (actual: ${actualViewport.width}x${actualViewport.height})`);
    }

    // Test Arabic RTL support
    console.log(`\n🔤 ARABIC RTL SUPPORT TEST:`);
    await page.setContent(`
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Arabic RTL Test</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; }
          .test-text { font-size: 18px; margin: 10px 0; }
          .flex-container { display: flex; justify-content: space-between; }
          .grid-container { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
        </style>
      </head>
      <body>
        <h1>اختبار اللغة العربية</h1>
        <p class="test-text">هذا نص تجريبي باللغة العربية لاختبار دعم الاتجاه من اليمين إلى اليسار</p>
        <div class="flex-container">
          <div>العنصر الأول</div>
          <div>العنصر الثاني</div>
        </div>
        <div class="grid-container">
          <div>شبكة 1</div>
          <div>شبكة 2</div>
        </div>
      </body>
      </html>
    `);

    await page.waitForTimeout(1000);

    const rtlSupport = await page.evaluate(() => {
      const html = document.documentElement;
      const body = document.body;
      const testText = document.querySelector('.test-text');
      const flexContainer = document.querySelector('.flex-container');
      
      return {
        htmlDir: html.dir,
        bodyDirection: window.getComputedStyle(body).direction,
        textAlign: testText ? window.getComputedStyle(testText).textAlign : 'unknown',
        flexDirection: flexContainer ? window.getComputedStyle(flexContainer).flexDirection : 'unknown',
        hasArabicText: body.textContent?.includes('العربية') || false
      };
    });

    console.log(`HTML dir attribute: ${rtlSupport.htmlDir}`);
    console.log(`Body direction: ${rtlSupport.bodyDirection}`);
    console.log(`Text align: ${rtlSupport.textAlign}`);
    console.log(`Flex direction: ${rtlSupport.flexDirection}`);
    console.log(`Arabic text rendering: ${rtlSupport.hasArabicText ? '✅' : '❌'}`);

    // Calculate compatibility score
    const scores = {
      css: (browserCapabilities.supportsGrid ? 1 : 0) + 
           (browserCapabilities.supportsFlexbox ? 1 : 0) + 
           (browserCapabilities.supportsCustomProperties ? 1 : 0),
      javascript: (browserCapabilities.supportsArrowFunctions ? 1 : 0) + 
                 (browserCapabilities.supportsAsyncAwait ? 1 : 0),
      apis: (browserCapabilities.supportsLocalStorage ? 1 : 0) + 
            (browserCapabilities.supportsFetch ? 1 : 0) + 
            (browserCapabilities.supportsWebGL ? 1 : 0),
      rtl: (rtlSupport.htmlDir === 'rtl' ? 1 : 0) + 
           (rtlSupport.bodyDirection === 'rtl' ? 1 : 0) + 
           (rtlSupport.hasArabicText ? 1 : 0)
    };

    const totalScore = scores.css + scores.javascript + scores.apis + scores.rtl;
    const maxScore = 11; // 3 + 2 + 3 + 3
    const compatibilityPercentage = Math.round((totalScore / maxScore) * 100);

    console.log(`\n🎯 ${browserName.toUpperCase()} COMPATIBILITY SCORE:`);
    console.log(`CSS Support: ${scores.css}/3`);
    console.log(`JavaScript Support: ${scores.javascript}/2`);
    console.log(`API Support: ${scores.apis}/3`);
    console.log(`RTL Support: ${scores.rtl}/3`);
    console.log(`Overall: ${totalScore}/${maxScore} (${compatibilityPercentage}%)`);

    // Determine compatibility level
    let compatibilityLevel = 'Poor';
    if (compatibilityPercentage >= 90) compatibilityLevel = 'Excellent';
    else if (compatibilityPercentage >= 75) compatibilityLevel = 'Good';
    else if (compatibilityPercentage >= 60) compatibilityLevel = 'Fair';

    console.log(`Compatibility Level: ${compatibilityLevel}`);

    // Test should pass if compatibility is reasonable
    expect(compatibilityPercentage).toBeGreaterThan(50); // At least 50% compatibility
    expect(browserCapabilities.supportsFlexbox).toBe(true); // Flexbox is essential
    expect(browserCapabilities.supportsFetch).toBe(true); // Fetch API is essential
  });

  test('should test Material-UI compatibility', async ({ page, browserName }) => {
    console.log(`🎨 Testing Material-UI Compatibility in ${browserName}`);
    
    // Create a simple Material-UI-like test page
    await page.setContent(`
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Material-UI Compatibility Test</title>
        <style>
          /* Material-UI-like styles */
          .MuiButton-root {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            position: relative;
            box-sizing: border-box;
            background-color: transparent;
            outline: 0;
            border: 0;
            margin: 0;
            border-radius: 4px;
            padding: 6px 16px;
            cursor: pointer;
            user-select: none;
            vertical-align: middle;
            text-decoration: none;
            color: #1976d2;
            background-color: #e3f2fd;
            transition: background-color 250ms cubic-bezier(0.4, 0, 0.2, 1) 0ms;
          }
          
          .MuiTextField-root {
            display: inline-flex;
            flex-direction: column;
            position: relative;
            min-width: 0;
            padding: 0;
            margin: 0;
            border: 0;
            vertical-align: top;
          }
          
          .MuiDataGrid-root {
            display: flex;
            flex-direction: column;
            position: relative;
            border: 1px solid rgba(224, 224, 224, 1);
            border-radius: 4px;
            color: rgba(0, 0, 0, 0.87);
            background-color: #fff;
          }
          
          .MuiAutocomplete-root {
            display: inline-flex;
            position: relative;
          }
          
          /* CSS Grid test */
          .test-grid {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 16px;
            margin: 20px 0;
          }
          
          /* Flexbox test */
          .test-flex {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin: 20px 0;
          }
          
          /* CSS Variables test */
          :root {
            --primary-color: #1976d2;
            --secondary-color: #dc004e;
          }
          
          .test-variables {
            color: var(--primary-color);
            background-color: var(--secondary-color);
            padding: 10px;
            margin: 20px 0;
          }
        </style>
      </head>
      <body>
        <h1>Material-UI Compatibility Test</h1>
        
        <button class="MuiButton-root">Test Button</button>
        
        <div class="MuiTextField-root">
          <input type="text" placeholder="Test Input" />
        </div>
        
        <div class="MuiDataGrid-root">
          <div>Test Data Grid</div>
        </div>
        
        <div class="MuiAutocomplete-root">
          <input type="text" placeholder="Test Autocomplete" />
        </div>
        
        <div class="test-grid">
          <div>Grid Item 1</div>
          <div>Grid Item 2</div>
          <div>Grid Item 3</div>
        </div>
        
        <div class="test-flex">
          <div>Flex Item 1</div>
          <div>Flex Item 2</div>
        </div>
        
        <div class="test-variables">CSS Variables Test</div>
      </body>
      </html>
    `);

    await page.waitForTimeout(1000);

    // Test Material-UI-like component rendering
    const muiCompatibility = await page.evaluate(() => {
      const button = document.querySelector('.MuiButton-root');
      const textField = document.querySelector('.MuiTextField-root');
      const dataGrid = document.querySelector('.MuiDataGrid-root');
      const autocomplete = document.querySelector('.MuiAutocomplete-root');
      const grid = document.querySelector('.test-grid');
      const flex = document.querySelector('.test-flex');
      const variables = document.querySelector('.test-variables');
      
      return {
        buttonDisplay: button ? window.getComputedStyle(button).display : 'none',
        textFieldDisplay: textField ? window.getComputedStyle(textField).display : 'none',
        dataGridDisplay: dataGrid ? window.getComputedStyle(dataGrid).display : 'none',
        autocompleteDisplay: autocomplete ? window.getComputedStyle(autocomplete).display : 'none',
        gridDisplay: grid ? window.getComputedStyle(grid).display : 'none',
        flexDisplay: flex ? window.getComputedStyle(flex).display : 'none',
        variablesColor: variables ? window.getComputedStyle(variables).color : 'none',
        
        // Check if elements are visible
        buttonVisible: button ? button.offsetWidth > 0 && button.offsetHeight > 0 : false,
        textFieldVisible: textField ? textField.offsetWidth > 0 && textField.offsetHeight > 0 : false,
        dataGridVisible: dataGrid ? dataGrid.offsetWidth > 0 && dataGrid.offsetHeight > 0 : false,
        autocompleteVisible: autocomplete ? autocomplete.offsetWidth > 0 && autocomplete.offsetHeight > 0 : false
      };
    });

    console.log(`\n🎨 MATERIAL-UI COMPATIBILITY RESULTS:`);
    console.log(`Button (inline-flex): ${muiCompatibility.buttonDisplay === 'inline-flex' ? '✅' : '❌'} (${muiCompatibility.buttonDisplay})`);
    console.log(`TextField (inline-flex): ${muiCompatibility.textFieldDisplay === 'inline-flex' ? '✅' : '❌'} (${muiCompatibility.textFieldDisplay})`);
    console.log(`DataGrid (flex): ${muiCompatibility.dataGridDisplay === 'flex' ? '✅' : '❌'} (${muiCompatibility.dataGridDisplay})`);
    console.log(`Autocomplete (inline-flex): ${muiCompatibility.autocompleteDisplay === 'inline-flex' ? '✅' : '❌'} (${muiCompatibility.autocompleteDisplay})`);
    console.log(`CSS Grid: ${muiCompatibility.gridDisplay === 'grid' ? '✅' : '❌'} (${muiCompatibility.gridDisplay})`);
    console.log(`CSS Flexbox: ${muiCompatibility.flexDisplay === 'flex' ? '✅' : '❌'} (${muiCompatibility.flexDisplay})`);
    console.log(`CSS Variables: ${muiCompatibility.variablesColor.includes('rgb') ? '✅' : '❌'} (${muiCompatibility.variablesColor})`);

    console.log(`\n👁️ ELEMENT VISIBILITY:`);
    console.log(`Button visible: ${muiCompatibility.buttonVisible ? '✅' : '❌'}`);
    console.log(`TextField visible: ${muiCompatibility.textFieldVisible ? '✅' : '❌'}`);
    console.log(`DataGrid visible: ${muiCompatibility.dataGridVisible ? '✅' : '❌'}`);
    console.log(`Autocomplete visible: ${muiCompatibility.autocompleteVisible ? '✅' : '❌'}`);

    // Calculate Material-UI compatibility score
    const muiScore = [
      muiCompatibility.buttonDisplay === 'inline-flex',
      muiCompatibility.textFieldDisplay === 'inline-flex',
      muiCompatibility.dataGridDisplay === 'flex',
      muiCompatibility.autocompleteDisplay === 'inline-flex',
      muiCompatibility.gridDisplay === 'grid',
      muiCompatibility.flexDisplay === 'flex',
      muiCompatibility.variablesColor.includes('rgb'),
      muiCompatibility.buttonVisible,
      muiCompatibility.textFieldVisible,
      muiCompatibility.dataGridVisible,
      muiCompatibility.autocompleteVisible
    ].filter(Boolean).length;

    const muiPercentage = Math.round((muiScore / 11) * 100);
    console.log(`\n🎯 Material-UI Compatibility: ${muiScore}/11 (${muiPercentage}%)`);

    // Test should pass if Material-UI compatibility is reasonable
    expect(muiPercentage).toBeGreaterThan(70); // At least 70% Material-UI compatibility
  });
});
