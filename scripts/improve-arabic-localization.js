#!/usr/bin/env node

/**
 * Improve Arabic Localization
 * 
 * Analyzes and improves Arabic localization to achieve 85%+ coverage.
 */

const fs = require('fs');
const path = require('path');

function analyzeLanguageFiles() {
  console.log('🔍 Analyzing Language Files for Missing Arabic Translations...\n');
  
  const frontendLangDir = path.join(__dirname, '../frontend/src/lang');
  const backendLangDir = path.join(__dirname, '../backend/src/lang');
  
  const results = {
    frontend: { files: [], missingTranslations: [] },
    backend: { files: [], missingTranslations: [] }
  };
  
  // Analyze frontend language files
  console.log('📱 Analyzing Frontend Language Files...');
  try {
    const frontendFiles = fs.readdirSync(frontendLangDir).filter(file => file.endsWith('.ts'));
    
    frontendFiles.forEach(file => {
      const filePath = path.join(frontendLangDir, file);
      const content = fs.readFileSync(filePath, 'utf8');
      
      // Extract English and Arabic sections
      const enMatch = content.match(/en:\s*{([^}]*)}/s);
      const arMatch = content.match(/ar:\s*{([^}]*)}/s);
      
      if (enMatch && arMatch) {
        const enContent = enMatch[1];
        const arContent = arMatch[1];
        
        // Extract keys from English section
        const enKeys = enContent.match(/(\w+):\s*['"][^'"]*['"]/g) || [];
        const arKeys = arContent.match(/(\w+):\s*['"][^'"]*['"]/g) || [];
        
        const enKeyNames = enKeys.map(key => key.split(':')[0].trim());
        const arKeyNames = arKeys.map(key => key.split(':')[0].trim());
        
        const missingKeys = enKeyNames.filter(key => !arKeyNames.includes(key));
        
        if (missingKeys.length > 0) {
          results.frontend.missingTranslations.push({
            file,
            missingKeys,
            totalKeys: enKeyNames.length,
            translatedKeys: arKeyNames.length,
            coverage: Math.round((arKeyNames.length / enKeyNames.length) * 100)
          });
        }
        
        results.frontend.files.push({
          file,
          totalKeys: enKeyNames.length,
          translatedKeys: arKeyNames.length,
          coverage: Math.round((arKeyNames.length / enKeyNames.length) * 100)
        });
      }
    });
    
    console.log(`  📊 Analyzed ${frontendFiles.length} frontend language files`);
    
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
      
      // Extract English and Arabic sections
      const enMatch = content.match(/en:\s*{([^}]*)}/s);
      const arMatch = content.match(/ar:\s*{([^}]*)}/s);
      
      if (enMatch && arMatch) {
        const enContent = enMatch[1];
        const arContent = arMatch[1];
        
        // Extract keys from English section
        const enKeys = enContent.match(/(\w+):\s*['"][^'"]*['"]/g) || [];
        const arKeys = arContent.match(/(\w+):\s*['"][^'"]*['"]/g) || [];
        
        const enKeyNames = enKeys.map(key => key.split(':')[0].trim());
        const arKeyNames = arKeys.map(key => key.split(':')[0].trim());
        
        const missingKeys = enKeyNames.filter(key => !arKeyNames.includes(key));
        
        if (missingKeys.length > 0) {
          results.backend.missingTranslations.push({
            file,
            missingKeys,
            totalKeys: enKeyNames.length,
            translatedKeys: arKeyNames.length,
            coverage: Math.round((arKeyNames.length / enKeyNames.length) * 100)
          });
        }
        
        results.backend.files.push({
          file,
          totalKeys: enKeyNames.length,
          translatedKeys: arKeyNames.length,
          coverage: Math.round((arKeyNames.length / enKeyNames.length) * 100)
        });
      }
    });
    
    console.log(`  📊 Analyzed ${backendFiles.length} backend language files`);
    
  } catch (error) {
    console.log(`  ❌ Error analyzing backend: ${error.message}`);
  }
  
  return results;
}

function generateMissingTranslations(results) {
  console.log('\n🔧 Generating Missing Arabic Translations...\n');
  
  const commonTranslations = {
    // Common UI elements
    'SAVE': 'حفظ',
    'CANCEL': 'إلغاء',
    'DELETE': 'حذف',
    'EDIT': 'تعديل',
    'CREATE': 'إنشاء',
    'UPDATE': 'تحديث',
    'SUBMIT': 'إرسال',
    'SEARCH': 'بحث',
    'FILTER': 'تصفية',
    'SORT': 'ترتيب',
    'LOADING': 'جاري التحميل...',
    'ERROR': 'خطأ',
    'SUCCESS': 'نجح',
    'WARNING': 'تحذير',
    'INFO': 'معلومات',
    'CONFIRM': 'تأكيد',
    'YES': 'نعم',
    'NO': 'لا',
    'OK': 'موافق',
    'CLOSE': 'إغلاق',
    'OPEN': 'فتح',
    'SELECT': 'اختيار',
    'CLEAR': 'مسح',
    'RESET': 'إعادة تعيين',
    'REFRESH': 'تحديث',
    'BACK': 'رجوع',
    'NEXT': 'التالي',
    'PREVIOUS': 'السابق',
    'FIRST': 'الأول',
    'LAST': 'الأخير',
    'PAGE': 'صفحة',
    'TOTAL': 'المجموع',
    'COUNT': 'العدد',
    'ITEMS': 'عناصر',
    'RESULTS': 'النتائج',
    'NO_RESULTS': 'لا توجد نتائج',
    'NO_DATA': 'لا توجد بيانات',
    'EMPTY': 'فارغ',
    'ALL': 'الكل',
    'NONE': 'لا شيء',
    'OTHER': 'أخرى',
    'MORE': 'المزيد',
    'LESS': 'أقل',
    'SHOW': 'عرض',
    'HIDE': 'إخفاء',
    'VIEW': 'عرض',
    'DETAILS': 'التفاصيل',
    'SUMMARY': 'الملخص',
    'DESCRIPTION': 'الوصف',
    'TITLE': 'العنوان',
    'NAME': 'الاسم',
    'EMAIL': 'البريد الإلكتروني',
    'PHONE': 'الهاتف',
    'ADDRESS': 'العنوان',
    'CITY': 'المدينة',
    'COUNTRY': 'البلد',
    'LOCATION': 'الموقع',
    'DATE': 'التاريخ',
    'TIME': 'الوقت',
    'FROM': 'من',
    'TO': 'إلى',
    'START': 'البداية',
    'END': 'النهاية',
    'DURATION': 'المدة',
    'STATUS': 'الحالة',
    'TYPE': 'النوع',
    'CATEGORY': 'الفئة',
    'PRICE': 'السعر',
    'COST': 'التكلفة',
    'AMOUNT': 'المبلغ',
    'QUANTITY': 'الكمية',
    'SIZE': 'الحجم',
    'COLOR': 'اللون',
    'STYLE': 'الطراز',
    'MATERIAL': 'المادة',
    'BRAND': 'العلامة التجارية',
    'MODEL': 'الموديل',
    'CODE': 'الكود',
    'ID': 'المعرف',
    'NUMBER': 'الرقم',
    'REFERENCE': 'المرجع',
    'NOTES': 'الملاحظات',
    'COMMENTS': 'التعليقات',
    'FEEDBACK': 'التقييم',
    'RATING': 'التقييم',
    'REVIEW': 'المراجعة',
    'AVAILABLE': 'متاح',
    'UNAVAILABLE': 'غير متاح',
    'ACTIVE': 'نشط',
    'INACTIVE': 'غير نشط',
    'ENABLED': 'مفعل',
    'DISABLED': 'معطل',
    'PUBLIC': 'عام',
    'PRIVATE': 'خاص',
    'REQUIRED': 'مطلوب',
    'OPTIONAL': 'اختياري',
    'VALID': 'صحيح',
    'INVALID': 'غير صحيح',
    'NEW': 'جديد',
    'OLD': 'قديم',
    'RECENT': 'حديث',
    'LATEST': 'الأحدث',
    'POPULAR': 'شائع',
    'FEATURED': 'مميز',
    'RECOMMENDED': 'موصى به',
    'BEST': 'الأفضل',
    'TOP': 'الأعلى',
    'BOTTOM': 'الأسفل',
    'LEFT': 'اليسار',
    'RIGHT': 'اليمين',
    'CENTER': 'الوسط',
    'FULL': 'كامل',
    'PARTIAL': 'جزئي',
    'COMPLETE': 'مكتمل',
    'INCOMPLETE': 'غير مكتمل',
    'PENDING': 'في الانتظار',
    'PROCESSING': 'قيد المعالجة',
    'COMPLETED': 'مكتمل',
    'CANCELLED': 'ملغي',
    'FAILED': 'فشل',
    'EXPIRED': 'منتهي الصلاحية',
    'DRAFT': 'مسودة',
    'PUBLISHED': 'منشور',
    'ARCHIVED': 'مؤرشف',
    'DELETED': 'محذوف',
    'RESTORED': 'مستعاد'
  };
  
  const suggestions = [];
  
  // Generate suggestions for frontend
  if (results.frontend.missingTranslations.length > 0) {
    console.log('📱 Frontend Missing Translations:');
    results.frontend.missingTranslations.forEach(item => {
      console.log(`\n  📄 ${item.file} (${item.coverage}% coverage)`);
      console.log(`    Missing ${item.missingKeys.length} out of ${item.totalKeys} translations:`);
      
      item.missingKeys.forEach(key => {
        const suggestion = commonTranslations[key] || `[TRANSLATE: ${key}]`;
        console.log(`    - ${key}: '${suggestion}'`);
        suggestions.push({
          file: item.file,
          key,
          suggestion,
          type: 'frontend'
        });
      });
    });
  }
  
  // Generate suggestions for backend
  if (results.backend.missingTranslations.length > 0) {
    console.log('\n🖥️ Backend Missing Translations:');
    results.backend.missingTranslations.forEach(item => {
      console.log(`\n  📄 ${item.file} (${item.coverage}% coverage)`);
      console.log(`    Missing ${item.missingKeys.length} out of ${item.totalKeys} translations:`);
      
      item.missingKeys.forEach(key => {
        const suggestion = commonTranslations[key] || `[TRANSLATE: ${key}]`;
        console.log(`    - ${key}: '${suggestion}'`);
        suggestions.push({
          file: item.file,
          key,
          suggestion,
          type: 'backend'
        });
      });
    });
  }
  
  return suggestions;
}

function calculateOverallCoverage(results) {
  const frontendTotal = results.frontend.files.reduce((sum, file) => sum + file.totalKeys, 0);
  const frontendTranslated = results.frontend.files.reduce((sum, file) => sum + file.translatedKeys, 0);
  const frontendCoverage = frontendTotal > 0 ? Math.round((frontendTranslated / frontendTotal) * 100) : 0;
  
  const backendTotal = results.backend.files.reduce((sum, file) => sum + file.totalKeys, 0);
  const backendTranslated = results.backend.files.reduce((sum, file) => sum + file.translatedKeys, 0);
  const backendCoverage = backendTotal > 0 ? Math.round((backendTranslated / backendTotal) * 100) : 0;
  
  const overallTotal = frontendTotal + backendTotal;
  const overallTranslated = frontendTranslated + backendTranslated;
  const overallCoverage = overallTotal > 0 ? Math.round((overallTranslated / overallTotal) * 100) : 0;
  
  return {
    frontend: { total: frontendTotal, translated: frontendTranslated, coverage: frontendCoverage },
    backend: { total: backendTotal, translated: backendTranslated, coverage: backendCoverage },
    overall: { total: overallTotal, translated: overallTranslated, coverage: overallCoverage }
  };
}

async function runArabicLocalizationImprovement() {
  console.log('🌐 Starting Arabic Localization Improvement...\n');
  
  try {
    // Analyze current state
    const results = analyzeLanguageFiles();
    
    // Calculate coverage
    const coverage = calculateOverallCoverage(results);
    
    // Generate missing translations
    const suggestions = generateMissingTranslations(results);
    
    // Display summary
    console.log('\n📊 Arabic Localization Coverage Summary:');
    console.log('=' .repeat(60));
    console.log(`📱 Frontend: ${coverage.frontend.translated}/${coverage.frontend.total} (${coverage.frontend.coverage}%)`);
    console.log(`🖥️ Backend: ${coverage.backend.translated}/${coverage.backend.total} (${coverage.backend.coverage}%)`);
    console.log(`🌐 Overall: ${coverage.overall.translated}/${coverage.overall.total} (${coverage.overall.coverage}%)`);
    
    console.log('\n🎯 Target: 85%+ Arabic Coverage');
    if (coverage.overall.coverage >= 85) {
      console.log('✅ Target achieved!');
    } else {
      const needed = Math.ceil((0.85 * coverage.overall.total) - coverage.overall.translated);
      console.log(`📈 Need ${needed} more translations to reach 85%`);
    }
    
    // Save results
    const report = {
      coverage,
      results,
      suggestions,
      timestamp: new Date().toISOString()
    };
    
    fs.writeFileSync('scripts/arabic-localization-improvement.json', JSON.stringify(report, null, 2));
    console.log('\n📄 Report saved to scripts/arabic-localization-improvement.json');
    
    console.log('\n💡 Next Steps:');
    console.log('  1. Review missing translations above');
    console.log('  2. Add missing Arabic translations to language files');
    console.log('  3. Test Arabic text display in browser');
    console.log('  4. Verify RTL layout works correctly');
    
    return report;
    
  } catch (error) {
    console.error('❌ Error improving Arabic localization:', error.message);
    return null;
  }
}

// Run the improvement
runArabicLocalizationImprovement().then(report => {
  if (report) {
    console.log('\n🎉 Arabic localization improvement analysis completed!');
  }
}).catch(console.error);
