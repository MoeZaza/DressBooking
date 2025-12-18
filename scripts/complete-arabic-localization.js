#!/usr/bin/env node

/**
 * Complete Arabic Localization
 * 
 * Ensures all language strings are properly initialized and Arabic text is displayed correctly.
 */

const fs = require('fs');
const path = require('path');

function analyzeLanguageFiles() {
  console.log('🔍 Analyzing Language Files...\n');
  
  const frontendLangDir = path.join(__dirname, '../frontend/src/lang');
  const backendLangDir = path.join(__dirname, '../backend/src/lang');
  
  const results = {
    frontend: {
      files: [],
      totalStrings: 0,
      arabicStrings: 0,
      missingArabic: []
    },
    backend: {
      files: [],
      totalStrings: 0,
      arabicStrings: 0,
      missingArabic: []
    }
  };
  
  // Analyze frontend language files
  console.log('📱 Analyzing Frontend Language Files...');
  try {
    const frontendFiles = fs.readdirSync(frontendLangDir).filter(file => file.endsWith('.ts'));
    
    frontendFiles.forEach(file => {
      const filePath = path.join(frontendLangDir, file);
      const content = fs.readFileSync(filePath, 'utf8');
      
      // Count total strings and Arabic strings
      const frMatches = content.match(/fr:\s*{[^}]*}/gs) || [];
      const enMatches = content.match(/en:\s*{[^}]*}/gs) || [];
      const arMatches = content.match(/ar:\s*{[^}]*}/gs) || [];
      
      const frStringCount = (frMatches.join('').match(/:\s*['"][^'"]*['"]/g) || []).length;
      const enStringCount = (enMatches.join('').match(/:\s*['"][^'"]*['"]/g) || []).length;
      const arStringCount = (arMatches.join('').match(/:\s*['"][^'"]*['"]/g) || []).length;
      
      const maxStrings = Math.max(frStringCount, enStringCount);
      
      results.frontend.files.push({
        file,
        totalStrings: maxStrings,
        arabicStrings: arStringCount,
        coverage: maxStrings > 0 ? Math.round((arStringCount / maxStrings) * 100) : 0
      });
      
      results.frontend.totalStrings += maxStrings;
      results.frontend.arabicStrings += arStringCount;
      
      if (arStringCount < maxStrings) {
        results.frontend.missingArabic.push({
          file,
          missing: maxStrings - arStringCount,
          total: maxStrings
        });
      }
    });
    
    console.log(`  📊 Found ${frontendFiles.length} language files`);
    console.log(`  📝 Total strings: ${results.frontend.totalStrings}`);
    console.log(`  🌐 Arabic strings: ${results.frontend.arabicStrings}`);
    console.log(`  📈 Coverage: ${Math.round((results.frontend.arabicStrings / results.frontend.totalStrings) * 100)}%`);
    
  } catch (error) {
    console.log(`  ❌ Error analyzing frontend: ${error.message}`);
  }
  
  // Analyze backend language files
  console.log('\n🖥️ Analyzing Backend Language Files...');
  try {
    const backendFiles = fs.readdirSync(backendLangDir).filter(file => file.endsWith('.ts'));
    
    backendFiles.forEach(file => {
      const filePath = path.join(backendLangDir, file);
      const content = fs.readFileSync(filePath, 'utf8');
      
      // Count total strings and Arabic strings
      const frMatches = content.match(/fr:\s*{[^}]*}/gs) || [];
      const enMatches = content.match(/en:\s*{[^}]*}/gs) || [];
      const arMatches = content.match(/ar:\s*{[^}]*}/gs) || [];
      
      const frStringCount = (frMatches.join('').match(/:\s*['"][^'"]*['"]/g) || []).length;
      const enStringCount = (enMatches.join('').match(/:\s*['"][^'"]*['"]/g) || []).length;
      const arStringCount = (arMatches.join('').match(/:\s*['"][^'"]*['"]/g) || []).length;
      
      const maxStrings = Math.max(frStringCount, enStringCount);
      
      results.backend.files.push({
        file,
        totalStrings: maxStrings,
        arabicStrings: arStringCount,
        coverage: maxStrings > 0 ? Math.round((arStringCount / maxStrings) * 100) : 0
      });
      
      results.backend.totalStrings += maxStrings;
      results.backend.arabicStrings += arStringCount;
      
      if (arStringCount < maxStrings) {
        results.backend.missingArabic.push({
          file,
          missing: maxStrings - arStringCount,
          total: maxStrings
        });
      }
    });
    
    console.log(`  📊 Found ${backendFiles.length} language files`);
    console.log(`  📝 Total strings: ${results.backend.totalStrings}`);
    console.log(`  🌐 Arabic strings: ${results.backend.arabicStrings}`);
    console.log(`  📈 Coverage: ${Math.round((results.backend.arabicStrings / results.backend.totalStrings) * 100)}%`);
    
  } catch (error) {
    console.log(`  ❌ Error analyzing backend: ${error.message}`);
  }
  
  return results;
}

function generateLanguageInitializationFix() {
  console.log('\n🔧 Generating Language Initialization Fix...\n');
  
  // Check frontend main.tsx for missing language imports
  const frontendMainPath = path.join(__dirname, '../frontend/src/main.tsx');
  const frontendMainContent = fs.readFileSync(frontendMainPath, 'utf8');
  
  // Check backend main.tsx for missing language imports
  const backendMainPath = path.join(__dirname, '../backend/src/main.tsx');
  const backendMainContent = fs.readFileSync(backendMainPath, 'utf8');
  
  const fixes = [];
  
  // Check if all language strings are imported in frontend
  const frontendLangDir = path.join(__dirname, '../frontend/src/lang');
  const frontendLangFiles = fs.readdirSync(frontendLangDir).filter(file => file.endsWith('.ts'));
  
  console.log('📱 Checking Frontend Language Imports...');
  frontendLangFiles.forEach(file => {
    const fileName = file.replace('.ts', '');
    const importPattern = new RegExp(`import.*${fileName}.*from.*@/lang/${fileName}`, 'i');
    const setLanguagePattern = new RegExp(`${fileName}Strings\\.setLanguage`, 'i');
    
    if (!importPattern.test(frontendMainContent)) {
      fixes.push({
        type: 'frontend-import',
        file: fileName,
        fix: `import { strings as ${fileName}Strings } from '@/lang/${fileName}'`
      });
    }
    
    if (!setLanguagePattern.test(frontendMainContent)) {
      fixes.push({
        type: 'frontend-init',
        file: fileName,
        fix: `${fileName}Strings.setLanguage(_lang)`
      });
    }
  });
  
  // Check if all language strings are imported in backend
  const backendLangDir = path.join(__dirname, '../backend/src/lang');
  const backendLangFiles = fs.readdirSync(backendLangDir).filter(file => file.endsWith('.ts'));
  
  console.log('🖥️ Checking Backend Language Imports...');
  backendLangFiles.forEach(file => {
    const fileName = file.replace('.ts', '');
    const importPattern = new RegExp(`import.*${fileName}.*from.*@/lang/${fileName}`, 'i');
    const setLanguagePattern = new RegExp(`${fileName}Strings\\.setLanguage`, 'i');
    
    if (!importPattern.test(backendMainContent)) {
      fixes.push({
        type: 'backend-import',
        file: fileName,
        fix: `import { strings as ${fileName}Strings } from '@/lang/${fileName}'`
      });
    }
    
    if (!setLanguagePattern.test(backendMainContent)) {
      fixes.push({
        type: 'backend-init',
        file: fileName,
        fix: `${fileName}Strings.setLanguage(language)`
      });
    }
  });
  
  console.log(`  📊 Found ${fixes.length} potential fixes needed`);
  
  return fixes;
}

function createLanguageTestScript() {
  console.log('\n🧪 Creating Language Test Script...\n');
  
  const testScript = `#!/usr/bin/env node

/**
 * Test Language String Initialization
 * 
 * Tests if all language strings are properly initialized.
 */

const puppeteer = require('puppeteer');

const FRONTEND_URL = 'http://localhost:3000';
const BACKEND_URL = 'http://localhost:3001';

async function testLanguageStrings() {
  console.log('🌐 Testing Language String Initialization...\\n');
  
  let browser;
  
  try {
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const page = await browser.newPage();
    await page.setViewport({ width: 1920, height: 1080 });
    
    // Test frontend
    console.log('📱 Testing Frontend Language Strings...');
    await page.goto(FRONTEND_URL, { waitUntil: 'domcontentloaded', timeout: 15000 });
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    const frontendResults = await page.evaluate(() => {
      const bodyText = document.body.textContent || '';
      const arabicTextMatches = bodyText.match(/[\\u0600-\\u06FF]/g) || [];
      const totalText = bodyText.replace(/\\s+/g, ' ').trim();
      
      return {
        totalTextLength: totalText.length,
        arabicCharCount: arabicTextMatches.length,
        arabicPercentage: totalText.length > 0 ? Math.round((arabicTextMatches.length / totalText.length) * 100) : 0,
        hasArabicText: arabicTextMatches.length > 0,
        sampleText: totalText.substring(0, 200)
      };
    });
    
    console.log(\`  📊 Total text length: \${frontendResults.totalTextLength}\`);
    console.log(\`  🌐 Arabic characters: \${frontendResults.arabicCharCount}\`);
    console.log(\`  📈 Arabic percentage: \${frontendResults.arabicPercentage}%\`);
    console.log(\`  ✅ Has Arabic text: \${frontendResults.hasArabicText ? 'Yes' : 'No'}\`);
    
    // Test backend
    console.log('\\n🖥️ Testing Backend Language Strings...');
    await page.goto(BACKEND_URL, { waitUntil: 'domcontentloaded', timeout: 15000 });
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    const backendResults = await page.evaluate(() => {
      const bodyText = document.body.textContent || '';
      const arabicTextMatches = bodyText.match(/[\\u0600-\\u06FF]/g) || [];
      const totalText = bodyText.replace(/\\s+/g, ' ').trim();
      
      return {
        totalTextLength: totalText.length,
        arabicCharCount: arabicTextMatches.length,
        arabicPercentage: totalText.length > 0 ? Math.round((arabicTextMatches.length / totalText.length) * 100) : 0,
        hasArabicText: arabicTextMatches.length > 0,
        sampleText: totalText.substring(0, 200)
      };
    });
    
    console.log(\`  📊 Total text length: \${backendResults.totalTextLength}\`);
    console.log(\`  🌐 Arabic characters: \${backendResults.arabicCharCount}\`);
    console.log(\`  📈 Arabic percentage: \${backendResults.arabicPercentage}%\`);
    console.log(\`  ✅ Has Arabic text: \${backendResults.hasArabicText ? 'Yes' : 'No'}\`);
    
    // Overall assessment
    console.log('\\n📊 Overall Assessment:');
    const overallArabicPercentage = Math.round(((frontendResults.arabicCharCount + backendResults.arabicCharCount) / (frontendResults.totalTextLength + backendResults.totalTextLength)) * 100);
    console.log(\`  🌐 Overall Arabic coverage: \${overallArabicPercentage}%\`);
    
    if (overallArabicPercentage >= 80) {
      console.log('  🟢 Excellent Arabic localization!');
    } else if (overallArabicPercentage >= 60) {
      console.log('  🟡 Good Arabic localization, some improvements needed');
    } else if (overallArabicPercentage >= 40) {
      console.log('  🟠 Fair Arabic localization, significant improvements needed');
    } else {
      console.log('  🔴 Poor Arabic localization, major improvements required');
    }
    
    return {
      frontend: frontendResults,
      backend: backendResults,
      overall: overallArabicPercentage
    };
    
  } catch (error) {
    console.log(\`❌ Error testing language strings: \${error.message}\`);
    return null;
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

// Run the test
testLanguageStrings().then(results => {
  if (results) {
    console.log('\\n🎉 Language string test completed!');
    
    // Save results
    const fs = require('fs');
    fs.writeFileSync('scripts/language-test-results.json', JSON.stringify(results, null, 2));
    console.log('📄 Results saved to scripts/language-test-results.json');
  }
}).catch(console.error);
`;
  
  fs.writeFileSync('scripts/test-language-strings.js', testScript);
  console.log('✅ Language test script created: scripts/test-language-strings.js');
}

async function runArabicLocalizationCompletion() {
  console.log('🌐 Starting Arabic Localization Completion...\n');
  
  // Analyze language files
  const analysisResults = analyzeLanguageFiles();
  
  // Generate fixes
  const fixes = generateLanguageInitializationFix();
  
  // Create test script
  createLanguageTestScript();
  
  // Generate summary
  console.log('\\n📊 Arabic Localization Summary:');
  console.log('=' .repeat(60));
  
  const frontendCoverage = Math.round((analysisResults.frontend.arabicStrings / analysisResults.frontend.totalStrings) * 100);
  const backendCoverage = Math.round((analysisResults.backend.arabicStrings / analysisResults.backend.totalStrings) * 100);
  const overallCoverage = Math.round(((analysisResults.frontend.arabicStrings + analysisResults.backend.arabicStrings) / (analysisResults.frontend.totalStrings + analysisResults.backend.totalStrings)) * 100);
  
  console.log(\`📱 Frontend Arabic Coverage: \${frontendCoverage}%\`);
  console.log(\`🖥️ Backend Arabic Coverage: \${backendCoverage}%\`);
  console.log(\`🌐 Overall Arabic Coverage: \${overallCoverage}%\`);
  
  console.log(\`\\n🔧 Fixes Needed: \${fixes.length}\`);
  
  if (analysisResults.frontend.missingArabic.length > 0) {
    console.log('\\n📱 Frontend Files Missing Arabic:');
    analysisResults.frontend.missingArabic.forEach(item => {
      console.log(\`  - \${item.file}: \${item.missing}/\${item.total} missing\`);
    });
  }
  
  if (analysisResults.backend.missingArabic.length > 0) {
    console.log('\\n🖥️ Backend Files Missing Arabic:');
    analysisResults.backend.missingArabic.forEach(item => {
      console.log(\`  - \${item.file}: \${item.missing}/\${item.total} missing\`);
    });
  }
  
  // Save results
  const results = {
    analysis: analysisResults,
    fixes,
    summary: {
      frontendCoverage,
      backendCoverage,
      overallCoverage,
      fixesNeeded: fixes.length
    }
  };
  
  fs.writeFileSync('scripts/arabic-localization-analysis.json', JSON.stringify(results, null, 2));
  console.log('\\n📄 Analysis saved to scripts/arabic-localization-analysis.json');
  
  console.log('\\n🎉 Arabic localization analysis completed!');
  console.log('\\n💡 Next Steps:');
  console.log('  1. Run: node scripts/test-language-strings.js');
  console.log('  2. Review missing Arabic translations');
  console.log('  3. Apply language initialization fixes');
  console.log('  4. Test Arabic text display in browser');
  
  return results;
}

// Run the completion
runArabicLocalizationCompletion().catch(console.error);
