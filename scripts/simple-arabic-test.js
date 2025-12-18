#!/usr/bin/env node

/**
 * Simple Arabic Localization Test
 * 
 * Tests if Arabic text is displaying correctly in both frontend and backend.
 */

const puppeteer = require('puppeteer');

const FRONTEND_URL = 'http://localhost:3000';
const BACKEND_URL = 'http://localhost:3001';

async function testArabicDisplay() {
  console.log('🌐 Testing Arabic Text Display...\n');
  
  let browser;
  
  try {
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const page = await browser.newPage();
    await page.setViewport({ width: 1920, height: 1080 });
    
    // Test frontend
    console.log('📱 Testing Frontend Arabic Display...');
    await page.goto(FRONTEND_URL, { waitUntil: 'domcontentloaded', timeout: 15000 });
    await new Promise(resolve => setTimeout(resolve, 8000)); // Wait longer for full load
    
    const frontendResults = await page.evaluate(() => {
      const bodyText = document.body.textContent || '';
      const arabicTextMatches = bodyText.match(/[\u0600-\u06FF]/g) || [];
      const totalChars = bodyText.replace(/\s+/g, '').length;
      
      // Check for specific Arabic UI elements
      const hasArabicNavigation = /تسجيل|دخول|الرئيسية|البحث/.test(bodyText);
      const hasArabicButtons = /بحث|إرسال|حفظ|إلغاء/.test(bodyText);
      const hasArabicLabels = /الموقع|التاريخ|النوع|الحجم/.test(bodyText);
      
      return {
        totalChars,
        arabicCharCount: arabicTextMatches.length,
        arabicPercentage: totalChars > 0 ? Math.round((arabicTextMatches.length / totalChars) * 100) : 0,
        hasArabicText: arabicTextMatches.length > 0,
        hasArabicNavigation,
        hasArabicButtons,
        hasArabicLabels,
        sampleText: bodyText.substring(0, 300),
        htmlLang: document.documentElement.lang,
        htmlDir: document.documentElement.dir
      };
    });
    
    console.log('  📊 Frontend Results:');
    console.log('    Total characters: ' + frontendResults.totalChars);
    console.log('    Arabic characters: ' + frontendResults.arabicCharCount);
    console.log('    Arabic percentage: ' + frontendResults.arabicPercentage + '%');
    console.log('    Has Arabic text: ' + (frontendResults.hasArabicText ? '✅' : '❌'));
    console.log('    Has Arabic navigation: ' + (frontendResults.hasArabicNavigation ? '✅' : '❌'));
    console.log('    Has Arabic buttons: ' + (frontendResults.hasArabicButtons ? '✅' : '❌'));
    console.log('    Has Arabic labels: ' + (frontendResults.hasArabicLabels ? '✅' : '❌'));
    console.log('    HTML Lang: ' + frontendResults.htmlLang);
    console.log('    HTML Dir: ' + frontendResults.htmlDir);
    console.log('    Sample text: "' + frontendResults.sampleText.substring(0, 100) + '..."');
    
    // Test backend
    console.log('\n🖥️ Testing Backend Arabic Display...');
    await page.goto(BACKEND_URL, { waitUntil: 'domcontentloaded', timeout: 15000 });
    await new Promise(resolve => setTimeout(resolve, 8000));
    
    const backendResults = await page.evaluate(() => {
      const bodyText = document.body.textContent || '';
      const arabicTextMatches = bodyText.match(/[\u0600-\u06FF]/g) || [];
      const totalChars = bodyText.replace(/\s+/g, '').length;
      
      // Check for specific Arabic UI elements
      const hasArabicNavigation = /الرئيسية|الحجوزات|الفساتين|المستخدمين/.test(bodyText);
      const hasArabicButtons = /إنشاء|تعديل|حذف|حفظ/.test(bodyText);
      const hasArabicLabels = /الاسم|البريد|الهاتف|العنوان/.test(bodyText);
      
      return {
        totalChars,
        arabicCharCount: arabicTextMatches.length,
        arabicPercentage: totalChars > 0 ? Math.round((arabicTextMatches.length / totalChars) * 100) : 0,
        hasArabicText: arabicTextMatches.length > 0,
        hasArabicNavigation,
        hasArabicButtons,
        hasArabicLabels,
        sampleText: bodyText.substring(0, 300),
        htmlLang: document.documentElement.lang,
        htmlDir: document.documentElement.dir
      };
    });
    
    console.log('  📊 Backend Results:');
    console.log('    Total characters: ' + backendResults.totalChars);
    console.log('    Arabic characters: ' + backendResults.arabicCharCount);
    console.log('    Arabic percentage: ' + backendResults.arabicPercentage + '%');
    console.log('    Has Arabic text: ' + (backendResults.hasArabicText ? '✅' : '❌'));
    console.log('    Has Arabic navigation: ' + (backendResults.hasArabicNavigation ? '✅' : '❌'));
    console.log('    Has Arabic buttons: ' + (backendResults.hasArabicButtons ? '✅' : '❌'));
    console.log('    Has Arabic labels: ' + (backendResults.hasArabicLabels ? '✅' : '❌'));
    console.log('    HTML Lang: ' + backendResults.htmlLang);
    console.log('    HTML Dir: ' + backendResults.htmlDir);
    console.log('    Sample text: "' + backendResults.sampleText.substring(0, 100) + '..."');
    
    // Overall assessment
    const totalArabicChars = frontendResults.arabicCharCount + backendResults.arabicCharCount;
    const totalChars = frontendResults.totalChars + backendResults.totalChars;
    const overallPercentage = totalChars > 0 ? Math.round((totalArabicChars / totalChars) * 100) : 0;
    
    console.log('\n📊 Overall Assessment:');
    console.log('  🌐 Overall Arabic coverage: ' + overallPercentage + '%');
    console.log('  📱 Frontend coverage: ' + frontendResults.arabicPercentage + '%');
    console.log('  🖥️ Backend coverage: ' + backendResults.arabicPercentage + '%');
    
    if (overallPercentage >= 80) {
      console.log('  🟢 Excellent Arabic localization!');
    } else if (overallPercentage >= 60) {
      console.log('  🟡 Good Arabic localization, some improvements needed');
    } else if (overallPercentage >= 40) {
      console.log('  🟠 Fair Arabic localization, significant improvements needed');
    } else {
      console.log('  🔴 Poor Arabic localization, major improvements required');
    }
    
    // Specific recommendations
    console.log('\n💡 Recommendations:');
    if (!frontendResults.hasArabicNavigation) {
      console.log('  - Add Arabic navigation text to frontend');
    }
    if (!frontendResults.hasArabicButtons) {
      console.log('  - Add Arabic button text to frontend');
    }
    if (!frontendResults.hasArabicLabels) {
      console.log('  - Add Arabic form labels to frontend');
    }
    if (!backendResults.hasArabicNavigation) {
      console.log('  - Add Arabic navigation text to backend');
    }
    if (!backendResults.hasArabicButtons) {
      console.log('  - Add Arabic button text to backend');
    }
    if (!backendResults.hasArabicLabels) {
      console.log('  - Add Arabic form labels to backend');
    }
    
    return {
      frontend: frontendResults,
      backend: backendResults,
      overall: {
        percentage: overallPercentage,
        totalArabicChars,
        totalChars
      }
    };
    
  } catch (error) {
    console.log('❌ Error testing Arabic display: ' + error.message);
    return null;
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

// Run the test
testArabicDisplay().then(results => {
  if (results) {
    console.log('\n🎉 Arabic display test completed!');
    
    // Save results
    const fs = require('fs');
    fs.writeFileSync('scripts/arabic-display-test-results.json', JSON.stringify(results, null, 2));
    console.log('📄 Results saved to scripts/arabic-display-test-results.json');
    
    // Determine if Arabic localization is complete
    const isComplete = results.overall.percentage >= 80;
    console.log('\n🏆 Arabic Localization Status: ' + (isComplete ? 'COMPLETE ✅' : 'NEEDS WORK ❌'));
    
    if (isComplete) {
      console.log('🎊 Congratulations! Arabic localization is excellent!');
    } else {
      console.log('🔧 More work needed to reach 80%+ Arabic coverage');
    }
  }
}).catch(console.error);
