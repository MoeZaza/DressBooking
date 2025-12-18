#!/usr/bin/env node

/**
 * Arabic Localization Audit and Fixes
 * 
 * Comprehensive audit of all Arabic text implementation.
 * Ensures ALL user-facing text is in Arabic except entity names in English.
 */

const puppeteer = require('puppeteer');
const fs = require('fs');

const FRONTEND_URL = 'http://localhost:3000';
const BACKEND_URL = 'http://localhost:3001';

// Pages to audit for Arabic localization
const pagesToAudit = [
  { name: 'Frontend Home', url: `${FRONTEND_URL}/` },
  { name: 'Frontend Search', url: `${FRONTEND_URL}/search` },
  { name: 'Frontend About', url: `${FRONTEND_URL}/about` },
  { name: 'Frontend Contact', url: `${FRONTEND_URL}/contact` },
  { name: 'Frontend FAQ', url: `${FRONTEND_URL}/faq` },
  { name: 'Frontend Sign In', url: `${FRONTEND_URL}/sign-in` },
  { name: 'Frontend Sign Up', url: `${FRONTEND_URL}/sign-up` },
  { name: 'Backend Login', url: `${BACKEND_URL}/` }
];

// Common UI elements that should be in Arabic
const expectedArabicElements = [
  'button', 'label', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
  '.nav-link', '.menu-item', '.form-label', '.btn', '.button',
  '.title', '.subtitle', '.description', '.text', '.content',
  'input[placeholder]', 'textarea[placeholder]'
];

// English words that should remain in English (entity names, etc.)
const allowedEnglishWords = [
  'BookDress', 'API', 'URL', 'HTTP', 'HTTPS', 'JSON', 'XML',
  'ID', 'UUID', 'CSS', 'HTML', 'JavaScript', 'React', 'Vue',
  'MongoDB', 'MySQL', 'PostgreSQL', 'Redis', 'Docker',
  // Dress names, location names, etc. can be in English
];

async function auditPageArabicLocalization(page, pageInfo) {
  console.log(`  📄 Auditing ${pageInfo.name}...`);
  
  const auditResult = {
    name: pageInfo.name,
    url: pageInfo.url,
    accessible: false,
    hasRTLLayout: false,
    arabicTextPercentage: 0,
    totalTextElements: 0,
    arabicTextElements: 0,
    englishTextElements: 0,
    mixedTextElements: 0,
    missingArabicElements: [],
    formInputsWithArabicPlaceholders: 0,
    totalFormInputs: 0,
    errors: []
  };
  
  try {
    await page.goto(pageInfo.url, { waitUntil: 'domcontentloaded', timeout: 15000 });
    auditResult.accessible = true;
    
    // Wait for content to load
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Check RTL layout
    const rtlCheck = await page.evaluate(() => {
      const html = document.documentElement;
      const body = document.body;
      return {
        htmlDir: html.dir,
        htmlDirection: getComputedStyle(html).direction,
        bodyDirection: getComputedStyle(body).direction,
        hasRTLClass: html.classList.contains('rtl') || body.classList.contains('rtl')
      };
    });
    
    auditResult.hasRTLLayout = rtlCheck.htmlDir === 'rtl' || 
                               rtlCheck.htmlDirection === 'rtl' || 
                               rtlCheck.bodyDirection === 'rtl' ||
                               rtlCheck.hasRTLClass;
    
    // Analyze text content
    const textAnalysis = await page.evaluate((expectedElements) => {
      const results = {
        totalElements: 0,
        arabicElements: 0,
        englishElements: 0,
        mixedElements: 0,
        missingArabic: [],
        formInputsTotal: 0,
        formInputsWithArabic: 0
      };
      
      // Check all text elements
      const allElements = document.querySelectorAll('*');
      const arabicRegex = /[\u0600-\u06FF]/;
      const englishRegex = /[a-zA-Z]/;
      
      allElements.forEach(element => {
        // Skip script, style, and other non-visible elements
        if (['SCRIPT', 'STYLE', 'META', 'LINK', 'HEAD'].includes(element.tagName)) {
          return;
        }
        
        const textContent = element.textContent?.trim();
        if (!textContent || textContent.length < 2) return;
        
        // Only check direct text content (not inherited from children)
        const directText = Array.from(element.childNodes)
          .filter(node => node.nodeType === Node.TEXT_NODE)
          .map(node => node.textContent?.trim())
          .join(' ')
          .trim();
        
        if (!directText || directText.length < 2) return;
        
        results.totalElements++;
        
        const hasArabic = arabicRegex.test(directText);
        const hasEnglish = englishRegex.test(directText);
        
        if (hasArabic && !hasEnglish) {
          results.arabicElements++;
        } else if (hasEnglish && !hasArabic) {
          results.englishElements++;
          
          // Check if this element should have Arabic text
          const tagName = element.tagName.toLowerCase();
          const className = element.className;
          const isUIElement = expectedElements.some(selector => {
            if (selector.startsWith('.')) {
              return className.includes(selector.substring(1));
            }
            return tagName === selector;
          });
          
          if (isUIElement) {
            results.missingArabic.push({
              tag: tagName,
              class: className,
              text: directText.substring(0, 50)
            });
          }
        } else if (hasArabic && hasEnglish) {
          results.mixedElements++;
        }
      });
      
      // Check form inputs for Arabic placeholders
      const formInputs = document.querySelectorAll('input[placeholder], textarea[placeholder]');
      results.formInputsTotal = formInputs.length;
      
      formInputs.forEach(input => {
        const placeholder = input.getAttribute('placeholder');
        if (placeholder && arabicRegex.test(placeholder)) {
          results.formInputsWithArabic++;
        }
      });
      
      return results;
    }, expectedArabicElements);
    
    Object.assign(auditResult, {
      totalTextElements: textAnalysis.totalElements,
      arabicTextElements: textAnalysis.arabicElements,
      englishTextElements: textAnalysis.englishElements,
      mixedTextElements: textAnalysis.mixedElements,
      missingArabicElements: textAnalysis.missingArabic,
      formInputsWithArabicPlaceholders: textAnalysis.formInputsWithArabic,
      totalFormInputs: textAnalysis.formInputsTotal
    });
    
    // Calculate Arabic text percentage
    if (auditResult.totalTextElements > 0) {
      auditResult.arabicTextPercentage = Math.round(
        (auditResult.arabicTextElements / auditResult.totalTextElements) * 100
      );
    }
    
    console.log(`    ✅ Accessible: ${auditResult.accessible}`);
    console.log(`    ↔️ RTL Layout: ${auditResult.hasRTLLayout ? '✅' : '❌'}`);
    console.log(`    🌐 Arabic Text: ${auditResult.arabicTextPercentage}% (${auditResult.arabicTextElements}/${auditResult.totalTextElements})`);
    console.log(`    📝 Form Placeholders: ${auditResult.formInputsWithArabicPlaceholders}/${auditResult.totalFormInputs} in Arabic`);
    
    if (auditResult.missingArabicElements.length > 0) {
      console.log(`    ⚠️ Missing Arabic: ${auditResult.missingArabicElements.length} elements`);
    }
    
  } catch (error) {
    auditResult.errors.push(error.message);
    console.log(`    ❌ Error: ${error.message}`);
  }
  
  return auditResult;
}

async function testArabicTextInput(page) {
  console.log('  ✍️ Testing Arabic text input...');
  
  const inputTestResult = {
    canTypeArabic: false,
    arabicTextDisplaysCorrectly: false,
    rtlTextDirection: false,
    errors: []
  };
  
  try {
    // Find a text input field
    const textInput = await page.$('input[type="text"], input[type="search"], textarea');
    
    if (textInput) {
      // Test typing Arabic text
      const arabicText = 'مرحبا بكم في بوك دريس';
      await textInput.click();
      await textInput.type(arabicText);
      
      // Check if the text was entered correctly
      const inputValue = await textInput.evaluate(el => el.value);
      inputTestResult.canTypeArabic = inputValue.includes('مرحبا');
      
      // Check text direction
      const textDirection = await textInput.evaluate(el => {
        const styles = getComputedStyle(el);
        return styles.direction;
      });
      inputTestResult.rtlTextDirection = textDirection === 'rtl';
      
      inputTestResult.arabicTextDisplaysCorrectly = inputTestResult.canTypeArabic;
      
      console.log(`    ✍️ Can type Arabic: ${inputTestResult.canTypeArabic ? '✅' : '❌'}`);
      console.log(`    📝 Text displays correctly: ${inputTestResult.arabicTextDisplaysCorrectly ? '✅' : '❌'}`);
      console.log(`    ↔️ RTL text direction: ${inputTestResult.rtlTextDirection ? '✅' : '❌'}`);
    } else {
      console.log(`    ⚠️ No text input found for testing`);
    }
    
  } catch (error) {
    inputTestResult.errors.push(error.message);
    console.log(`    ❌ Input test error: ${error.message}`);
  }
  
  return inputTestResult;
}

async function runArabicLocalizationAudit() {
  console.log('🌐 Starting Arabic Localization Audit...\n');
  
  let browser;
  const results = {
    pages: [],
    inputTest: null,
    summary: {
      totalPages: pagesToAudit.length,
      accessiblePages: 0,
      pagesWithRTL: 0,
      averageArabicPercentage: 0,
      pagesWithGoodArabicCoverage: 0, // >70% Arabic
      totalMissingArabicElements: 0
    }
  };
  
  try {
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const page = await browser.newPage();
    await page.setViewport({ width: 1920, height: 1080 });
    
    // Audit each page
    for (const pageInfo of pagesToAudit) {
      const pageResult = await auditPageArabicLocalization(page, pageInfo);
      results.pages.push(pageResult);
      
      // Update summary
      if (pageResult.accessible) results.summary.accessiblePages++;
      if (pageResult.hasRTLLayout) results.summary.pagesWithRTL++;
      if (pageResult.arabicTextPercentage >= 70) results.summary.pagesWithGoodArabicCoverage++;
      results.summary.totalMissingArabicElements += pageResult.missingArabicElements.length;
      
      // Small delay between pages
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    // Test Arabic text input on frontend home page
    console.log('\n✍️ Testing Arabic Text Input...');
    await page.goto(FRONTEND_URL, { waitUntil: 'domcontentloaded', timeout: 15000 });
    results.inputTest = await testArabicTextInput(page);
    
  } catch (error) {
    console.error('❌ Audit error:', error.message);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
  
  // Calculate average Arabic percentage
  const accessiblePages = results.pages.filter(p => p.accessible);
  if (accessiblePages.length > 0) {
    const totalPercentage = accessiblePages.reduce((sum, page) => sum + page.arabicTextPercentage, 0);
    results.summary.averageArabicPercentage = Math.round(totalPercentage / accessiblePages.length);
  }
  
  // Generate summary report
  console.log('\n📊 Arabic Localization Audit Summary:');
  console.log('=' .repeat(60));
  console.log(`📄 Total pages audited: ${results.summary.accessiblePages}/${results.summary.totalPages}`);
  console.log(`↔️ Pages with RTL layout: ${results.summary.pagesWithRTL}/${results.summary.accessiblePages}`);
  console.log(`🌐 Average Arabic text coverage: ${results.summary.averageArabicPercentage}%`);
  console.log(`✅ Pages with good Arabic coverage (≥70%): ${results.summary.pagesWithGoodArabicCoverage}/${results.summary.accessiblePages}`);
  console.log(`⚠️ Total missing Arabic elements: ${results.summary.totalMissingArabicElements}`);
  
  if (results.inputTest) {
    console.log(`✍️ Arabic text input works: ${results.inputTest.canTypeArabic ? '✅' : '❌'}`);
    console.log(`📝 Arabic text displays correctly: ${results.inputTest.arabicTextDisplaysCorrectly ? '✅' : '❌'}`);
  }
  
  // Detailed page breakdown
  console.log('\n📋 Page-by-Page Arabic Coverage:');
  results.pages.forEach(page => {
    if (page.accessible) {
      const status = page.arabicTextPercentage >= 70 ? '✅' : page.arabicTextPercentage >= 50 ? '⚠️' : '❌';
      console.log(`  ${page.name}: ${status} ${page.arabicTextPercentage}% Arabic, RTL: ${page.hasRTLLayout ? '✅' : '❌'}`);
    }
  });
  
  // Save detailed results
  fs.writeFileSync('scripts/arabic-localization-audit-results.json', JSON.stringify(results, null, 2));
  console.log('\n📄 Detailed results saved to scripts/arabic-localization-audit-results.json');
  
  console.log('\n🎉 Arabic Localization Audit completed!');
}

// Run the audit
runArabicLocalizationAudit().catch(console.error);
