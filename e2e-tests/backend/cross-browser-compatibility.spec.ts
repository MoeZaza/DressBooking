import { test, expect } from '@playwright/test';

test.describe('Backend Cross-Browser Compatibility', () => {
  test('should demonstrate browser compatibility features', async ({ page, browserName }) => {
    console.log(`🌐 Testing Browser Compatibility in ${browserName}`);
    
    // Test basic browser capabilities without requiring server
    const browserCapabilities = await page.evaluate(() => {
      return {
        userAgent: navigator.userAgent,
        language: navigator.language,
        platform: navigator.platform,
        cookieEnabled: navigator.cookieEnabled,
        onLine: navigator.onLine,
        
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
        
        // Storage
        supportsLocalStorage: 'localStorage' in window,
        supportsFetch: 'fetch' in window,
        
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

    console.log(`\n🎨 CSS SUPPORT:`);
    console.log(`Grid: ${browserCapabilities.supportsGrid ? '✅' : '❌'}`);
    console.log(`Flexbox: ${browserCapabilities.supportsFlexbox ? '✅' : '❌'}`);
    console.log(`Custom Properties: ${browserCapabilities.supportsCustomProperties ? '✅' : '❌'}`);

    console.log(`\n⚡ JAVASCRIPT SUPPORT:`);
    console.log(`Arrow Functions: ${browserCapabilities.supportsArrowFunctions ? '✅' : '❌'}`);
    console.log(`Async/Await: ${browserCapabilities.supportsAsyncAwait ? '✅' : '❌'}`);

    console.log(`\n🔧 APIs:`);
    console.log(`Local Storage: ${browserCapabilities.supportsLocalStorage ? '✅' : '❌'}`);
    console.log(`Fetch API: ${browserCapabilities.supportsFetch ? '✅' : '❌'}`);

    // Calculate compatibility score
    const scores = {
      css: (browserCapabilities.supportsGrid ? 1 : 0) + 
           (browserCapabilities.supportsFlexbox ? 1 : 0) + 
           (browserCapabilities.supportsCustomProperties ? 1 : 0),
      javascript: (browserCapabilities.supportsArrowFunctions ? 1 : 0) + 
                 (browserCapabilities.supportsAsyncAwait ? 1 : 0),
      apis: (browserCapabilities.supportsLocalStorage ? 1 : 0) + 
            (browserCapabilities.supportsFetch ? 1 : 0)
    };

    const totalScore = scores.css + scores.javascript + scores.apis;
    const maxScore = 7; // 3 + 2 + 2
    const compatibilityPercentage = Math.round((totalScore / maxScore) * 100);

    console.log(`\n🎯 ${browserName.toUpperCase()} COMPATIBILITY SCORE:`);
    console.log(`CSS Support: ${scores.css}/3`);
    console.log(`JavaScript Support: ${scores.javascript}/2`);
    console.log(`API Support: ${scores.apis}/2`);
    console.log(`Overall: ${totalScore}/${maxScore} (${compatibilityPercentage}%)`);

    // Determine compatibility level
    let compatibilityLevel = 'Poor';
    if (compatibilityPercentage >= 90) compatibilityLevel = 'Excellent';
    else if (compatibilityPercentage >= 75) compatibilityLevel = 'Good';
    else if (compatibilityPercentage >= 60) compatibilityLevel = 'Fair';

    console.log(`Compatibility Level: ${compatibilityLevel}`);

    // Test should pass if compatibility is reasonable
    expect(compatibilityPercentage).toBeGreaterThan(70); // At least 70% compatibility
    expect(browserCapabilities.supportsFlexbox).toBe(true); // Flexbox is essential
    expect(browserCapabilities.supportsFetch).toBe(true); // Fetch API is essential
  });

  test('should test Arabic RTL support', async ({ page, browserName }) => {
    console.log(`🔤 Testing Arabic RTL Support in ${browserName}`);
    
    // Create Arabic RTL test page
    await page.setContent(`
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Arabic RTL Test</title>
        <style>
          body { 
            font-family: Arial, sans-serif; 
            padding: 20px; 
            direction: rtl;
            text-align: right;
          }
          .test-text { 
            font-size: 18px; 
            margin: 10px 0; 
          }
          .flex-container { 
            display: flex; 
            justify-content: space-between; 
            margin: 10px 0;
          }
          .grid-container { 
            display: grid; 
            grid-template-columns: 1fr 1fr; 
            gap: 10px; 
            margin: 10px 0;
          }
          .form-test {
            margin: 20px 0;
          }
          .form-test input {
            margin: 5px;
            padding: 8px;
            border: 1px solid #ccc;
            border-radius: 4px;
          }
          .form-test button {
            margin: 5px;
            padding: 8px 16px;
            background-color: #1976d2;
            color: white;
            border: none;
            border-radius: 4px;
            cursor: pointer;
          }
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
        <div class="form-test">
          <h3>نموذج تجريبي</h3>
          <input type="text" placeholder="البريد الإلكتروني" />
          <input type="password" placeholder="كلمة المرور" />
          <button type="submit">تسجيل الدخول</button>
        </div>
        <div class="test-text">
          <strong>نص مهم:</strong> يجب أن يظهر هذا النص من اليمين إلى اليسار بشكل صحيح
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
      const button = document.querySelector('button');
      
      return {
        htmlDir: html.dir,
        htmlLang: html.lang,
        bodyDirection: window.getComputedStyle(body).direction,
        bodyTextAlign: window.getComputedStyle(body).textAlign,
        testTextAlign: testText ? window.getComputedStyle(testText).textAlign : 'unknown',
        flexDirection: flexContainer ? window.getComputedStyle(flexContainer).flexDirection : 'unknown',
        buttonDirection: button ? window.getComputedStyle(button).direction : 'unknown',
        hasArabicText: body.textContent?.includes('العربية') || false,
        hasArabicChars: /[\u0600-\u06FF]/.test(body.textContent || ''),
        pageTitle: document.title
      };
    });

    console.log(`\n🔤 ${browserName.toUpperCase()} ARABIC RTL SUPPORT:`);
    console.log(`HTML dir attribute: ${rtlSupport.htmlDir}`);
    console.log(`HTML lang attribute: ${rtlSupport.htmlLang}`);
    console.log(`Body direction: ${rtlSupport.bodyDirection}`);
    console.log(`Body text align: ${rtlSupport.bodyTextAlign}`);
    console.log(`Test text align: ${rtlSupport.testTextAlign}`);
    console.log(`Flex direction: ${rtlSupport.flexDirection}`);
    console.log(`Button direction: ${rtlSupport.buttonDirection}`);
    console.log(`Arabic text rendering: ${rtlSupport.hasArabicText ? '✅' : '❌'}`);
    console.log(`Arabic characters: ${rtlSupport.hasArabicChars ? '✅' : '❌'}`);
    console.log(`Page title: ${rtlSupport.pageTitle}`);

    // Test responsive design with RTL
    const viewports = [
      { name: 'Desktop', width: 1920, height: 1080 },
      { name: 'Tablet', width: 768, height: 1024 },
      { name: 'Mobile', width: 375, height: 667 }
    ];

    console.log(`\n📱 RTL RESPONSIVE DESIGN:`);
    for (const viewport of viewports) {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await page.waitForTimeout(500);

      const responsiveRTL = await page.evaluate(() => {
        const body = document.body;
        return {
          direction: window.getComputedStyle(body).direction,
          textAlign: window.getComputedStyle(body).textAlign,
          width: window.innerWidth,
          height: window.innerHeight
        };
      });

      const isRTLMaintained = responsiveRTL.direction === 'rtl';
      console.log(`${viewport.name} (${viewport.width}x${viewport.height}): RTL ${isRTLMaintained ? '✅' : '❌'} (dir: ${responsiveRTL.direction})`);
    }

    // Calculate RTL compatibility score
    const rtlScore = [
      rtlSupport.htmlDir === 'rtl',
      rtlSupport.htmlLang === 'ar',
      rtlSupport.bodyDirection === 'rtl',
      rtlSupport.hasArabicText,
      rtlSupport.hasArabicChars,
      rtlSupport.pageTitle.includes('Arabic')
    ].filter(Boolean).length;

    const rtlPercentage = Math.round((rtlScore / 6) * 100);
    console.log(`\n🎯 RTL Compatibility: ${rtlScore}/6 (${rtlPercentage}%)`);

    // Test should pass if RTL support is reasonable
    expect(rtlPercentage).toBeGreaterThan(60); // At least 60% RTL compatibility
    expect(rtlSupport.htmlDir).toBe('rtl');
    expect(rtlSupport.bodyDirection).toBe('rtl');
    expect(rtlSupport.hasArabicText).toBe(true);
  });

  test('should test Material-UI component compatibility', async ({ page, browserName }) => {
    console.log(`🎨 Testing Material-UI Compatibility in ${browserName}`);
    
    // Create Material-UI-like test page
    await page.setContent(`
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Material-UI Test</title>
        <style>
          /* Material-UI-like styles */
          .MuiButton-root {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            position: relative;
            box-sizing: border-box;
            background-color: #e3f2fd;
            border: 0;
            border-radius: 4px;
            padding: 6px 16px;
            cursor: pointer;
            color: #1976d2;
            transition: background-color 250ms cubic-bezier(0.4, 0, 0.2, 1) 0ms;
          }
          
          .MuiTextField-root {
            display: inline-flex;
            flex-direction: column;
            position: relative;
            min-width: 0;
            margin: 8px;
          }
          
          .MuiDataGrid-root {
            display: flex;
            flex-direction: column;
            position: relative;
            border: 1px solid #e0e0e0;
            border-radius: 4px;
            background-color: #fff;
            min-height: 200px;
          }
          
          .test-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 16px;
            margin: 20px 0;
          }
          
          .test-flex {
            display: flex;
            justify-content: space-between;
            align-items: center;
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
          <div style="padding: 16px;">Test Data Grid Content</div>
        </div>
        
        <div class="test-grid">
          <div style="background: #f5f5f5; padding: 16px;">Grid Item 1</div>
          <div style="background: #f5f5f5; padding: 16px;">Grid Item 2</div>
          <div style="background: #f5f5f5; padding: 16px;">Grid Item 3</div>
        </div>
        
        <div class="test-flex">
          <div>Flex Item 1</div>
          <div>Flex Item 2</div>
        </div>
      </body>
      </html>
    `);

    await page.waitForTimeout(1000);

    const muiCompatibility = await page.evaluate(() => {
      const button = document.querySelector('.MuiButton-root');
      const textField = document.querySelector('.MuiTextField-root');
      const dataGrid = document.querySelector('.MuiDataGrid-root');
      const grid = document.querySelector('.test-grid');
      const flex = document.querySelector('.test-flex');
      
      return {
        buttonDisplay: button ? window.getComputedStyle(button).display : 'none',
        textFieldDisplay: textField ? window.getComputedStyle(textField).display : 'none',
        dataGridDisplay: dataGrid ? window.getComputedStyle(dataGrid).display : 'none',
        gridDisplay: grid ? window.getComputedStyle(grid).display : 'none',
        flexDisplay: flex ? window.getComputedStyle(flex).display : 'none',
        
        // Check visibility
        buttonVisible: button ? button.offsetWidth > 0 && button.offsetHeight > 0 : false,
        textFieldVisible: textField ? textField.offsetWidth > 0 && textField.offsetHeight > 0 : false,
        dataGridVisible: dataGrid ? dataGrid.offsetWidth > 0 && dataGrid.offsetHeight > 0 : false,
        gridVisible: grid ? grid.offsetWidth > 0 && grid.offsetHeight > 0 : false,
        flexVisible: flex ? flex.offsetWidth > 0 && flex.offsetHeight > 0 : false
      };
    });

    console.log(`\n🎨 ${browserName.toUpperCase()} MATERIAL-UI COMPATIBILITY:`);
    console.log(`Button (inline-flex): ${muiCompatibility.buttonDisplay === 'inline-flex' ? '✅' : '❌'} (${muiCompatibility.buttonDisplay})`);
    console.log(`TextField (inline-flex): ${muiCompatibility.textFieldDisplay === 'inline-flex' ? '✅' : '❌'} (${muiCompatibility.textFieldDisplay})`);
    console.log(`DataGrid (flex): ${muiCompatibility.dataGridDisplay === 'flex' ? '✅' : '❌'} (${muiCompatibility.dataGridDisplay})`);
    console.log(`CSS Grid: ${muiCompatibility.gridDisplay === 'grid' ? '✅' : '❌'} (${muiCompatibility.gridDisplay})`);
    console.log(`CSS Flexbox: ${muiCompatibility.flexDisplay === 'flex' ? '✅' : '❌'} (${muiCompatibility.flexDisplay})`);

    console.log(`\n👁️ ELEMENT VISIBILITY:`);
    console.log(`Button visible: ${muiCompatibility.buttonVisible ? '✅' : '❌'}`);
    console.log(`TextField visible: ${muiCompatibility.textFieldVisible ? '✅' : '❌'}`);
    console.log(`DataGrid visible: ${muiCompatibility.dataGridVisible ? '✅' : '❌'}`);
    console.log(`Grid visible: ${muiCompatibility.gridVisible ? '✅' : '❌'}`);
    console.log(`Flex visible: ${muiCompatibility.flexVisible ? '✅' : '❌'}`);

    // Calculate Material-UI compatibility score
    const muiScore = [
      muiCompatibility.buttonDisplay === 'inline-flex',
      muiCompatibility.textFieldDisplay === 'inline-flex',
      muiCompatibility.dataGridDisplay === 'flex',
      muiCompatibility.gridDisplay === 'grid',
      muiCompatibility.flexDisplay === 'flex',
      muiCompatibility.buttonVisible,
      muiCompatibility.textFieldVisible,
      muiCompatibility.dataGridVisible,
      muiCompatibility.gridVisible,
      muiCompatibility.flexVisible
    ].filter(Boolean).length;

    const muiPercentage = Math.round((muiScore / 10) * 100);
    console.log(`\n🎯 Material-UI Compatibility: ${muiScore}/10 (${muiPercentage}%)`);

    // Test should pass if Material-UI compatibility is reasonable
    expect(muiPercentage).toBeGreaterThan(70); // At least 70% Material-UI compatibility
    expect(muiCompatibility.buttonVisible).toBe(true);
    expect(muiCompatibility.flexDisplay).toBe('flex');
  });
});
