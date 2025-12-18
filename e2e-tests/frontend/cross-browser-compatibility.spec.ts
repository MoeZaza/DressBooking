import { test, expect } from '@playwright/test';

test.describe('Frontend Cross-Browser Compatibility', () => {
  test('should demonstrate frontend browser compatibility', async ({ page, browserName }) => {
    console.log(`🌐 Testing Frontend Browser Compatibility in ${browserName}`);
    
    // Test modern web features for frontend
    const frontendCapabilities = await page.evaluate(() => {
      return {
        userAgent: navigator.userAgent,
        language: navigator.language,
        platform: navigator.platform,
        
        // Modern CSS features
        supportsGrid: CSS.supports('display', 'grid'),
        supportsFlexbox: CSS.supports('display', 'flex'),
        supportsCustomProperties: CSS.supports('--test', 'value'),
        supportsClamp: CSS.supports('width', 'clamp(1rem, 2.5vw, 2rem)'),
        supportsAspectRatio: CSS.supports('aspect-ratio', '16/9'),
        
        // Modern JavaScript features
        supportsModules: 'noModule' in document.createElement('script'),
        supportsIntersectionObserver: 'IntersectionObserver' in window,
        supportsResizeObserver: 'ResizeObserver' in window,
        
        // Frontend-specific APIs
        supportsWebComponents: 'customElements' in window,
        supportsServiceWorker: 'serviceWorker' in navigator,
        supportsWebGL: (() => {
          try {
            const canvas = document.createElement('canvas');
            return !!(canvas.getContext('webgl') || canvas.getContext('experimental-webgl'));
          } catch {
            return false;
          }
        })(),
        
        // Touch and mobile features
        supportsTouchEvents: 'ontouchstart' in window,
        maxTouchPoints: navigator.maxTouchPoints,
        
        // Performance APIs
        supportsPerformanceObserver: 'PerformanceObserver' in window,
        supportsRequestIdleCallback: 'requestIdleCallback' in window,
        
        // Storage
        supportsIndexedDB: 'indexedDB' in window,
        supportsWebStorage: 'localStorage' in window && 'sessionStorage' in window,
        
        // Network
        supportsFetch: 'fetch' in window,
        supportsWebSockets: 'WebSocket' in window,
        
        // Viewport
        viewportWidth: window.innerWidth,
        viewportHeight: window.innerHeight,
        devicePixelRatio: window.devicePixelRatio
      };
    });

    console.log(`\n📊 ${browserName.toUpperCase()} FRONTEND CAPABILITIES:`);
    console.log(`User Agent: ${frontendCapabilities.userAgent}`);
    console.log(`Platform: ${frontendCapabilities.platform}`);
    console.log(`Language: ${frontendCapabilities.language}`);
    console.log(`Viewport: ${frontendCapabilities.viewportWidth}x${frontendCapabilities.viewportHeight}`);
    console.log(`Device Pixel Ratio: ${frontendCapabilities.devicePixelRatio}`);
    console.log(`Max Touch Points: ${frontendCapabilities.maxTouchPoints}`);

    console.log(`\n🎨 MODERN CSS SUPPORT:`);
    console.log(`Grid: ${frontendCapabilities.supportsGrid ? '✅' : '❌'}`);
    console.log(`Flexbox: ${frontendCapabilities.supportsFlexbox ? '✅' : '❌'}`);
    console.log(`Custom Properties: ${frontendCapabilities.supportsCustomProperties ? '✅' : '❌'}`);
    console.log(`CSS Clamp: ${frontendCapabilities.supportsClamp ? '✅' : '❌'}`);
    console.log(`Aspect Ratio: ${frontendCapabilities.supportsAspectRatio ? '✅' : '❌'}`);

    console.log(`\n⚡ MODERN JAVASCRIPT:`);
    console.log(`ES Modules: ${frontendCapabilities.supportsModules ? '✅' : '❌'}`);
    console.log(`Intersection Observer: ${frontendCapabilities.supportsIntersectionObserver ? '✅' : '❌'}`);
    console.log(`Resize Observer: ${frontendCapabilities.supportsResizeObserver ? '✅' : '❌'}`);

    console.log(`\n🔧 FRONTEND APIs:`);
    console.log(`Web Components: ${frontendCapabilities.supportsWebComponents ? '✅' : '❌'}`);
    console.log(`Service Worker: ${frontendCapabilities.supportsServiceWorker ? '✅' : '❌'}`);
    console.log(`WebGL: ${frontendCapabilities.supportsWebGL ? '✅' : '❌'}`);
    console.log(`Touch Events: ${frontendCapabilities.supportsTouchEvents ? '✅' : '❌'}`);
    console.log(`Performance Observer: ${frontendCapabilities.supportsPerformanceObserver ? '✅' : '❌'}`);
    console.log(`Request Idle Callback: ${frontendCapabilities.supportsRequestIdleCallback ? '✅' : '❌'}`);

    console.log(`\n💾 STORAGE & NETWORK:`);
    console.log(`IndexedDB: ${frontendCapabilities.supportsIndexedDB ? '✅' : '❌'}`);
    console.log(`Web Storage: ${frontendCapabilities.supportsWebStorage ? '✅' : '❌'}`);
    console.log(`Fetch API: ${frontendCapabilities.supportsFetch ? '✅' : '❌'}`);
    console.log(`WebSockets: ${frontendCapabilities.supportsWebSockets ? '✅' : '❌'}`);

    // Calculate frontend compatibility score
    const scores = {
      css: [
        frontendCapabilities.supportsGrid,
        frontendCapabilities.supportsFlexbox,
        frontendCapabilities.supportsCustomProperties,
        frontendCapabilities.supportsClamp
      ].filter(Boolean).length,
      
      javascript: [
        frontendCapabilities.supportsModules,
        frontendCapabilities.supportsIntersectionObserver,
        frontendCapabilities.supportsResizeObserver
      ].filter(Boolean).length,
      
      apis: [
        frontendCapabilities.supportsWebComponents,
        frontendCapabilities.supportsServiceWorker,
        frontendCapabilities.supportsWebGL,
        frontendCapabilities.supportsPerformanceObserver
      ].filter(Boolean).length,
      
      storage: [
        frontendCapabilities.supportsIndexedDB,
        frontendCapabilities.supportsWebStorage,
        frontendCapabilities.supportsFetch,
        frontendCapabilities.supportsWebSockets
      ].filter(Boolean).length
    };

    const totalScore = scores.css + scores.javascript + scores.apis + scores.storage;
    const maxScore = 15; // 4 + 3 + 4 + 4
    const compatibilityPercentage = Math.round((totalScore / maxScore) * 100);

    console.log(`\n🎯 ${browserName.toUpperCase()} FRONTEND COMPATIBILITY SCORE:`);
    console.log(`CSS Support: ${scores.css}/4`);
    console.log(`JavaScript Support: ${scores.javascript}/3`);
    console.log(`API Support: ${scores.apis}/4`);
    console.log(`Storage/Network: ${scores.storage}/4`);
    console.log(`Overall: ${totalScore}/${maxScore} (${compatibilityPercentage}%)`);

    // Determine compatibility level
    let compatibilityLevel = 'Poor';
    if (compatibilityPercentage >= 90) compatibilityLevel = 'Excellent';
    else if (compatibilityPercentage >= 75) compatibilityLevel = 'Good';
    else if (compatibilityPercentage >= 60) compatibilityLevel = 'Fair';

    console.log(`Compatibility Level: ${compatibilityLevel}`);

    // Essential features for frontend
    expect(compatibilityPercentage).toBeGreaterThan(60); // At least 60% compatibility
    expect(frontendCapabilities.supportsFlexbox).toBe(true); // Flexbox is essential
    expect(frontendCapabilities.supportsFetch).toBe(true); // Fetch API is essential
    expect(frontendCapabilities.supportsWebStorage).toBe(true); // Web storage is essential
  });

  test('should test React/Vite compatibility features', async ({ page, browserName }) => {
    console.log(`⚛️ Testing React/Vite Compatibility in ${browserName}`);
    
    // Create a React-like test page with modern features
    await page.setContent(`
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>React/Vite Compatibility Test</title>
        <style>
          /* Modern CSS features used by Vite/React apps */
          :root {
            --primary-color: #646cff;
            --secondary-color: #535bf2;
            --background: #242424;
            --text-color: rgba(255, 255, 255, 0.87);
          }
          
          body {
            margin: 0;
            display: flex;
            place-items: center;
            min-width: 320px;
            min-height: 100vh;
            font-family: Inter, system-ui, Avenir, Helvetica, Arial, sans-serif;
            background-color: var(--background);
            color: var(--text-color);
          }
          
          .app {
            max-width: 1280px;
            margin: 0 auto;
            padding: 2rem;
            text-align: center;
          }
          
          .card {
            padding: 2em;
            background: rgba(255, 255, 255, 0.1);
            border-radius: 8px;
            backdrop-filter: blur(10px);
            margin: 1rem 0;
          }
          
          .grid-container {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 1rem;
            margin: 2rem 0;
          }
          
          .flex-container {
            display: flex;
            justify-content: space-between;
            align-items: center;
            flex-wrap: wrap;
            gap: 1rem;
          }
          
          .button {
            border-radius: 8px;
            border: 1px solid transparent;
            padding: 0.6em 1.2em;
            font-size: 1em;
            font-weight: 500;
            font-family: inherit;
            background-color: var(--primary-color);
            color: white;
            cursor: pointer;
            transition: border-color 0.25s;
          }
          
          .button:hover {
            border-color: var(--secondary-color);
          }
          
          .input {
            padding: 0.6em 1.2em;
            border: 1px solid #ccc;
            border-radius: 8px;
            font-size: 1em;
            background: rgba(255, 255, 255, 0.1);
            color: var(--text-color);
          }
          
          /* Modern layout features */
          .aspect-ratio-box {
            aspect-ratio: 16/9;
            background: linear-gradient(45deg, var(--primary-color), var(--secondary-color));
            border-radius: 8px;
            display: flex;
            align-items: center;
            justify-content: center;
          }
          
          .clamp-text {
            font-size: clamp(1rem, 2.5vw, 2rem);
            margin: 1rem 0;
          }
          
          @media (max-width: 768px) {
            .grid-container {
              grid-template-columns: 1fr;
            }
            
            .flex-container {
              flex-direction: column;
            }
          }
        </style>
      </head>
      <body>
        <div class="app">
          <h1 class="clamp-text">React/Vite Compatibility Test</h1>
          
          <div class="card">
            <h2>Modern CSS Features</h2>
            <p>Testing CSS Grid, Flexbox, Custom Properties, and more</p>
          </div>
          
          <div class="grid-container">
            <div class="card">
              <h3>Grid Item 1</h3>
              <p>CSS Grid Layout</p>
            </div>
            <div class="card">
              <h3>Grid Item 2</h3>
              <p>Responsive Design</p>
            </div>
            <div class="card">
              <h3>Grid Item 3</h3>
              <p>Modern Styling</p>
            </div>
          </div>
          
          <div class="flex-container">
            <button class="button">Primary Button</button>
            <input class="input" type="text" placeholder="Test Input" />
            <button class="button">Secondary Button</button>
          </div>
          
          <div class="aspect-ratio-box">
            <span>Aspect Ratio 16:9</span>
          </div>
        </div>
        
        <script>
          // Test modern JavaScript features
          const testModernJS = () => {
            // Arrow functions
            const arrow = () => 'arrow function works';
            
            // Template literals
            const template = \`Template literal: \${arrow()}\`;
            
            // Destructuring
            const { userAgent } = navigator;
            
            // Async/await
            const asyncTest = async () => {
              try {
                const response = await fetch('data:text/plain,test');
                return await response.text();
              } catch (error) {
                return 'fetch failed';
              }
            };
            
            // Promises
            const promiseTest = Promise.resolve('promise works');
            
            // Classes
            class TestClass {
              constructor(name) {
                this.name = name;
              }
              
              getName() {
                return this.name;
              }
            }
            
            const testInstance = new TestClass('test');
            
            return {
              arrow: arrow(),
              template,
              userAgent: userAgent.includes('Chrome') || userAgent.includes('Firefox') || userAgent.includes('Safari'),
              asyncSupported: typeof asyncTest === 'function',
              promiseSupported: typeof promiseTest.then === 'function',
              classSupported: testInstance.getName() === 'test'
            };
          };
          
          window.modernJSTest = testModernJS();
        </script>
      </body>
      </html>
    `);

    await page.waitForTimeout(1000);

    const reactViteCompatibility = await page.evaluate(() => {
      const app = document.querySelector('.app');
      const card = document.querySelector('.card');
      const gridContainer = document.querySelector('.grid-container');
      const flexContainer = document.querySelector('.flex-container');
      const button = document.querySelector('.button');
      const input = document.querySelector('.input');
      const aspectRatioBox = document.querySelector('.aspect-ratio-box');
      const clampText = document.querySelector('.clamp-text');
      
      return {
        // Layout tests
        appVisible: app ? app.offsetWidth > 0 && app.offsetHeight > 0 : false,
        cardDisplay: card ? window.getComputedStyle(card).display : 'none',
        gridDisplay: gridContainer ? window.getComputedStyle(gridContainer).display : 'none',
        flexDisplay: flexContainer ? window.getComputedStyle(flexContainer).display : 'none',
        
        // Component tests
        buttonVisible: button ? button.offsetWidth > 0 && button.offsetHeight > 0 : false,
        inputVisible: input ? input.offsetWidth > 0 && input.offsetHeight > 0 : false,
        
        // Modern CSS features
        aspectRatioSupported: aspectRatioBox ? window.getComputedStyle(aspectRatioBox).aspectRatio !== 'auto' : false,
        clampSupported: clampText ? window.getComputedStyle(clampText).fontSize.includes('clamp') || parseFloat(window.getComputedStyle(clampText).fontSize) > 16 : false,
        
        // CSS Variables
        primaryColor: window.getComputedStyle(document.documentElement).getPropertyValue('--primary-color').trim(),
        
        // Modern JavaScript
        modernJS: window.modernJSTest || {},
        
        // Viewport
        viewportWidth: window.innerWidth,
        viewportHeight: window.innerHeight
      };
    });

    console.log(`\n⚛️ ${browserName.toUpperCase()} REACT/VITE COMPATIBILITY:`);
    console.log(`App container visible: ${reactViteCompatibility.appVisible ? '✅' : '❌'}`);
    console.log(`Card display: ${reactViteCompatibility.cardDisplay}`);
    console.log(`CSS Grid: ${reactViteCompatibility.gridDisplay === 'grid' ? '✅' : '❌'} (${reactViteCompatibility.gridDisplay})`);
    console.log(`CSS Flexbox: ${reactViteCompatibility.flexDisplay === 'flex' ? '✅' : '❌'} (${reactViteCompatibility.flexDisplay})`);
    console.log(`Button visible: ${reactViteCompatibility.buttonVisible ? '✅' : '❌'}`);
    console.log(`Input visible: ${reactViteCompatibility.inputVisible ? '✅' : '❌'}`);
    console.log(`Aspect Ratio: ${reactViteCompatibility.aspectRatioSupported ? '✅' : '❌'}`);
    console.log(`CSS Clamp: ${reactViteCompatibility.clampSupported ? '✅' : '❌'}`);
    console.log(`CSS Variables: ${reactViteCompatibility.primaryColor ? '✅' : '❌'} (${reactViteCompatibility.primaryColor})`);

    console.log(`\n⚡ MODERN JAVASCRIPT FEATURES:`);
    const jsTest = reactViteCompatibility.modernJS;
    console.log(`Arrow Functions: ${jsTest.arrow === 'arrow function works' ? '✅' : '❌'}`);
    console.log(`Template Literals: ${jsTest.template?.includes('Template literal') ? '✅' : '❌'}`);
    console.log(`User Agent Detection: ${jsTest.userAgent ? '✅' : '❌'}`);
    console.log(`Async/Await: ${jsTest.asyncSupported ? '✅' : '❌'}`);
    console.log(`Promises: ${jsTest.promiseSupported ? '✅' : '❌'}`);
    console.log(`Classes: ${jsTest.classSupported ? '✅' : '❌'}`);

    // Test responsive design
    const viewports = [
      { name: 'Desktop', width: 1920, height: 1080 },
      { name: 'Tablet', width: 768, height: 1024 },
      { name: 'Mobile', width: 375, height: 667 }
    ];

    console.log(`\n📱 RESPONSIVE DESIGN:`);
    for (const viewport of viewports) {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await page.waitForTimeout(500);

      const responsive = await page.evaluate(() => {
        const gridContainer = document.querySelector('.grid-container');
        const flexContainer = document.querySelector('.flex-container');
        
        return {
          gridColumns: gridContainer ? window.getComputedStyle(gridContainer).gridTemplateColumns : 'none',
          flexDirection: flexContainer ? window.getComputedStyle(flexContainer).flexDirection : 'none',
          bodyOverflow: window.getComputedStyle(document.body).overflowX
        };
      });

      const isResponsive = responsive.bodyOverflow !== 'scroll' && 
                          (viewport.width > 768 || responsive.flexDirection === 'column');
      
      console.log(`${viewport.name} (${viewport.width}x${viewport.height}): ${isResponsive ? '✅' : '❌'} (flex: ${responsive.flexDirection})`);
    }

    // Calculate React/Vite compatibility score
    const reactScore = [
      reactViteCompatibility.appVisible,
      reactViteCompatibility.gridDisplay === 'grid',
      reactViteCompatibility.flexDisplay === 'flex',
      reactViteCompatibility.buttonVisible,
      reactViteCompatibility.inputVisible,
      reactViteCompatibility.primaryColor !== '',
      jsTest.arrow === 'arrow function works',
      jsTest.asyncSupported,
      jsTest.promiseSupported,
      jsTest.classSupported
    ].filter(Boolean).length;

    const reactPercentage = Math.round((reactScore / 10) * 100);
    console.log(`\n🎯 React/Vite Compatibility: ${reactScore}/10 (${reactPercentage}%)`);

    // Test should pass if React/Vite compatibility is good
    expect(reactPercentage).toBeGreaterThan(80); // At least 80% React/Vite compatibility
    expect(reactViteCompatibility.appVisible).toBe(true);
    expect(reactViteCompatibility.gridDisplay).toBe('grid');
    expect(reactViteCompatibility.flexDisplay).toBe('flex');
  });
});
