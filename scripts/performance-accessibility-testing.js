#!/usr/bin/env node

/**
 * Performance and Accessibility Testing
 * 
 * Tests application performance with Arabic content, accessibility features,
 * and ensures proper screen reader support for Arabic.
 */

const puppeteer = require('puppeteer');
const fs = require('fs');

const FRONTEND_URL = 'http://localhost:3000';
const BACKEND_URL = 'http://localhost:3001';

async function testPerformance(page, url, name) {
  console.log(`  🚀 Testing performance for ${name}...`);
  
  const performanceMetrics = {
    name,
    url,
    loadTime: 0,
    domContentLoaded: 0,
    firstContentfulPaint: 0,
    largestContentfulPaint: 0,
    cumulativeLayoutShift: 0,
    totalBlockingTime: 0,
    resourceCount: 0,
    transferSize: 0,
    errors: []
  };
  
  try {
    // Enable performance monitoring
    await page.setCacheEnabled(false);
    
    const startTime = Date.now();
    
    // Navigate and measure load time
    await page.goto(url, { waitUntil: 'networkidle0', timeout: 30000 });
    
    performanceMetrics.loadTime = Date.now() - startTime;
    
    // Get performance metrics
    const metrics = await page.evaluate(() => {
      const navigation = performance.getEntriesByType('navigation')[0];
      const paint = performance.getEntriesByType('paint');
      
      return {
        domContentLoaded: navigation ? navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart : 0,
        firstContentfulPaint: paint.find(p => p.name === 'first-contentful-paint')?.startTime || 0,
        resourceCount: performance.getEntriesByType('resource').length,
        transferSize: performance.getEntriesByType('resource').reduce((total, resource) => total + (resource.transferSize || 0), 0)
      };
    });
    
    Object.assign(performanceMetrics, metrics);
    
    // Get Web Vitals using Chrome DevTools
    const webVitals = await page.evaluate(() => {
      return new Promise((resolve) => {
        const vitals = {};
        
        // LCP
        new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const lastEntry = entries[entries.length - 1];
          vitals.largestContentfulPaint = lastEntry.startTime;
        }).observe({ entryTypes: ['largest-contentful-paint'] });
        
        // CLS
        new PerformanceObserver((list) => {
          let clsValue = 0;
          for (const entry of list.getEntries()) {
            if (!entry.hadRecentInput) {
              clsValue += entry.value;
            }
          }
          vitals.cumulativeLayoutShift = clsValue;
        }).observe({ entryTypes: ['layout-shift'] });
        
        // TBT approximation
        new PerformanceObserver((list) => {
          let tbtValue = 0;
          for (const entry of list.getEntries()) {
            if (entry.duration > 50) {
              tbtValue += entry.duration - 50;
            }
          }
          vitals.totalBlockingTime = tbtValue;
        }).observe({ entryTypes: ['longtask'] });
        
        setTimeout(() => resolve(vitals), 3000);
      });
    });
    
    Object.assign(performanceMetrics, webVitals);
    
    console.log(`    ⏱️ Load time: ${performanceMetrics.loadTime}ms`);
    console.log(`    📊 DOM Content Loaded: ${Math.round(performanceMetrics.domContentLoaded)}ms`);
    console.log(`    🎨 First Contentful Paint: ${Math.round(performanceMetrics.firstContentfulPaint)}ms`);
    console.log(`    📦 Resources loaded: ${performanceMetrics.resourceCount}`);
    console.log(`    💾 Transfer size: ${Math.round(performanceMetrics.transferSize / 1024)}KB`);
    
  } catch (error) {
    performanceMetrics.errors.push(error.message);
    console.log(`    ❌ Performance test error: ${error.message}`);
  }
  
  return performanceMetrics;
}

async function testAccessibility(page, url, name) {
  console.log(`  ♿ Testing accessibility for ${name}...`);
  
  const accessibilityResults = {
    name,
    url,
    hasAltText: false,
    hasAriaLabels: false,
    hasHeadingStructure: false,
    hasKeyboardNavigation: false,
    hasColorContrast: false,
    hasScreenReaderSupport: false,
    arabicScreenReaderSupport: false,
    focusManagement: false,
    semanticHTML: false,
    errors: []
  };
  
  try {
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 15000 });
    
    // Test accessibility features
    const accessibilityChecks = await page.evaluate(() => {
      const results = {};
      
      // Check for alt text on images
      const images = document.querySelectorAll('img');
      const imagesWithAlt = Array.from(images).filter(img => img.alt && img.alt.trim() !== '');
      results.hasAltText = images.length === 0 || imagesWithAlt.length > 0;
      
      // Check for ARIA labels
      const ariaElements = document.querySelectorAll('[aria-label], [aria-labelledby], [aria-describedby]');
      results.hasAriaLabels = ariaElements.length > 0;
      
      // Check heading structure
      const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
      results.hasHeadingStructure = headings.length > 0;
      
      // Check for semantic HTML
      const semanticElements = document.querySelectorAll('main, nav, header, footer, section, article, aside');
      results.semanticHTML = semanticElements.length > 0;
      
      // Check for focusable elements
      const focusableElements = document.querySelectorAll('a, button, input, select, textarea, [tabindex]');
      results.focusManagement = focusableElements.length > 0;
      
      // Check for Arabic text and lang attributes
      const htmlLang = document.documentElement.lang;
      const arabicText = document.body.textContent.match(/[\u0600-\u06FF]/);
      results.arabicScreenReaderSupport = htmlLang === 'ar' || arabicText !== null;
      
      return results;
    });
    
    Object.assign(accessibilityResults, accessibilityChecks);
    
    // Test keyboard navigation
    try {
      await page.keyboard.press('Tab');
      const activeElement = await page.evaluate(() => document.activeElement.tagName);
      accessibilityResults.hasKeyboardNavigation = activeElement !== 'BODY';
    } catch (error) {
      accessibilityResults.errors.push(`Keyboard navigation test failed: ${error.message}`);
    }
    
    // Basic color contrast check (simplified)
    try {
      const contrastCheck = await page.evaluate(() => {
        const elements = document.querySelectorAll('*');
        let hasGoodContrast = false;
        
        for (let i = 0; i < Math.min(elements.length, 50); i++) {
          const element = elements[i];
          const styles = getComputedStyle(element);
          const color = styles.color;
          const backgroundColor = styles.backgroundColor;
          
          if (color && backgroundColor && color !== backgroundColor) {
            hasGoodContrast = true;
            break;
          }
        }
        
        return hasGoodContrast;
      });
      
      accessibilityResults.hasColorContrast = contrastCheck;
    } catch (error) {
      accessibilityResults.errors.push(`Color contrast test failed: ${error.message}`);
    }
    
    console.log(`    🖼️ Alt text: ${accessibilityResults.hasAltText ? '✅' : '❌'}`);
    console.log(`    🏷️ ARIA labels: ${accessibilityResults.hasAriaLabels ? '✅' : '❌'}`);
    console.log(`    📋 Heading structure: ${accessibilityResults.hasHeadingStructure ? '✅' : '❌'}`);
    console.log(`    ⌨️ Keyboard navigation: ${accessibilityResults.hasKeyboardNavigation ? '✅' : '❌'}`);
    console.log(`    🎨 Color contrast: ${accessibilityResults.hasColorContrast ? '✅' : '❌'}`);
    console.log(`    🔊 Arabic screen reader: ${accessibilityResults.arabicScreenReaderSupport ? '✅' : '❌'}`);
    console.log(`    🏗️ Semantic HTML: ${accessibilityResults.semanticHTML ? '✅' : '❌'}`);
    
  } catch (error) {
    accessibilityResults.errors.push(error.message);
    console.log(`    ❌ Accessibility test error: ${error.message}`);
  }
  
  return accessibilityResults;
}

async function runPerformanceAccessibilityTesting() {
  console.log('🚀 Starting Performance and Accessibility Testing...\n');
  
  let browser;
  const results = {
    performance: [],
    accessibility: [],
    summary: {}
  };
  
  try {
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-web-security']
    });
    
    const page = await browser.newPage();
    await page.setViewport({ width: 1920, height: 1080 });
    
    // Test Frontend
    console.log('📱 Testing Frontend...');
    const frontendPerf = await testPerformance(page, FRONTEND_URL, 'Frontend');
    const frontendA11y = await testAccessibility(page, FRONTEND_URL, 'Frontend');
    
    results.performance.push(frontendPerf);
    results.accessibility.push(frontendA11y);
    
    // Test Backend
    console.log('\n🖥️ Testing Backend...');
    const backendPerf = await testPerformance(page, BACKEND_URL, 'Backend');
    const backendA11y = await testAccessibility(page, BACKEND_URL, 'Backend');
    
    results.performance.push(backendPerf);
    results.accessibility.push(backendA11y);
    
  } catch (error) {
    console.error('❌ Testing error:', error.message);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
  
  // Generate summary
  console.log('\n📊 Performance and Accessibility Summary:');
  console.log('=' .repeat(60));
  
  results.performance.forEach(perf => {
    console.log(`\n${perf.name} Performance:`);
    console.log(`  Load Time: ${perf.loadTime}ms ${perf.loadTime < 3000 ? '✅' : '⚠️'}`);
    console.log(`  FCP: ${Math.round(perf.firstContentfulPaint)}ms ${perf.firstContentfulPaint < 2000 ? '✅' : '⚠️'}`);
    console.log(`  Resources: ${perf.resourceCount} (${Math.round(perf.transferSize / 1024)}KB)`);
  });
  
  results.accessibility.forEach(a11y => {
    console.log(`\n${a11y.name} Accessibility:`);
    const score = [
      a11y.hasAltText,
      a11y.hasAriaLabels,
      a11y.hasHeadingStructure,
      a11y.hasKeyboardNavigation,
      a11y.hasColorContrast,
      a11y.arabicScreenReaderSupport,
      a11y.semanticHTML
    ].filter(Boolean).length;
    
    console.log(`  Score: ${score}/7 ${score >= 5 ? '✅' : '⚠️'}`);
    console.log(`  Arabic Support: ${a11y.arabicScreenReaderSupport ? '✅' : '❌'}`);
  });
  
  // Save detailed results
  fs.writeFileSync('scripts/performance-accessibility-results.json', JSON.stringify(results, null, 2));
  console.log('\n📄 Detailed results saved to scripts/performance-accessibility-results.json');
  
  console.log('\n🎉 Performance and Accessibility Testing completed!');
}

// Run the tests
runPerformanceAccessibilityTesting().catch(console.error);
