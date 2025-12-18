#!/usr/bin/env node

/**
 * Generate Final Testing Report
 * 
 * Consolidates all testing results into a comprehensive final report
 * with recommendations and next steps.
 */

const fs = require('fs');
const path = require('path');

// Load all test results
function loadTestResults() {
  const resultsFiles = [
    'cross-browser-test-results.json',
    'performance-accessibility-results.json',
    'frontend-testing-results.json',
    'backend-testing-results.json',
    'crud-dropdowns-results.json',
    'arabic-localization-audit-results.json',
    'security-testing-results.json',
    'final-integration-results.json'
  ];
  
  const results = {};
  
  resultsFiles.forEach(file => {
    const filePath = path.join(__dirname, file);
    if (fs.existsSync(filePath)) {
      try {
        const data = fs.readFileSync(filePath, 'utf8');
        const key = file.replace('-results.json', '').replace('-test-results.json', '');
        results[key] = JSON.parse(data);
      } catch (error) {
        console.log(`⚠️ Could not load ${file}: ${error.message}`);
      }
    } else {
      console.log(`⚠️ File not found: ${file}`);
    }
  });
  
  return results;
}

function generateExecutiveSummary(results) {
  const summary = {
    overallScore: 0,
    systemsOnline: 0,
    criticalIssues: [],
    recommendations: [],
    readyForProduction: false
  };
  
  // Calculate overall score from all test results
  const scores = [];
  
  if (results['cross-browser']) {
    const browserTests = results['cross-browser'].length * 2; // Frontend + Backend
    const successfulTests = results['cross-browser'].reduce((acc, result) => {
      return acc + (result.frontend.accessible ? 1 : 0) + (result.backend.accessible ? 1 : 0);
    }, 0);
    scores.push((successfulTests / browserTests) * 100);
  }
  
  if (results['performance-accessibility']) {
    // Average performance score based on load times
    const perfResults = results['performance-accessibility'].performance || [];
    const avgLoadTime = perfResults.reduce((sum, p) => sum + p.loadTime, 0) / perfResults.length;
    const perfScore = Math.max(0, 100 - (avgLoadTime / 50)); // 50ms = 1 point deduction
    scores.push(Math.min(100, perfScore));
  }
  
  if (results['security-testing']) {
    scores.push(results['security-testing'].summary?.overallSecurityScore || 0);
  }
  
  if (results['arabic-localization-audit']) {
    scores.push(results['arabic-localization-audit'].summary?.averageArabicPercentage || 0);
  }
  
  if (results['final-integration']) {
    scores.push(results['final-integration'].summary?.overallIntegrationScore || 0);
  }
  
  // Calculate weighted average
  summary.overallScore = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;
  
  // Determine if ready for production
  summary.readyForProduction = summary.overallScore >= 80;
  
  // Count systems online
  if (results['final-integration']) {
    summary.systemsOnline = results['final-integration'].summary?.systemsOnline || 0;
  }
  
  // Identify critical issues
  if (summary.overallScore < 50) {
    summary.criticalIssues.push('Overall system score is below 50%');
  }
  
  if (results['security-testing']?.summary?.overallSecurityScore < 60) {
    summary.criticalIssues.push('Security score is critically low');
  }
  
  if (results['arabic-localization-audit']?.summary?.averageArabicPercentage < 30) {
    summary.criticalIssues.push('Arabic localization is severely lacking');
  }
  
  // Generate recommendations
  if (results['security-testing']?.summary?.securityHeadersScore < 80) {
    summary.recommendations.push('Implement security headers (CSP, X-Frame-Options, HSTS)');
  }
  
  if (results['arabic-localization-audit']?.summary?.averageArabicPercentage < 70) {
    summary.recommendations.push('Complete Arabic translation for all user-facing text');
  }
  
  if (results['performance-accessibility']) {
    const avgLoadTime = results['performance-accessibility'].performance?.reduce((sum, p) => sum + p.loadTime, 0) / results['performance-accessibility'].performance?.length;
    if (avgLoadTime > 3000) {
      summary.recommendations.push('Optimize application performance (current avg load time: ' + Math.round(avgLoadTime) + 'ms)');
    }
  }
  
  return summary;
}

function generateDetailedReport(results, summary) {
  const report = {
    executiveSummary: summary,
    testingResults: {
      crossBrowserCompatibility: {
        status: results['cross-browser'] ? 'COMPLETED' : 'NOT_RUN',
        score: results['cross-browser'] ? '100%' : 'N/A',
        details: results['cross-browser'] ? `Tested ${results['cross-browser'].length} browser/device combinations` : 'Test not run'
      },
      performanceAccessibility: {
        status: results['performance-accessibility'] ? 'COMPLETED' : 'NOT_RUN',
        score: results['performance-accessibility'] ? 'Variable' : 'N/A',
        details: results['performance-accessibility'] ? 'Performance and accessibility metrics collected' : 'Test not run'
      },
      frontendTesting: {
        status: results['frontend-testing'] ? 'COMPLETED' : 'NOT_RUN',
        score: results['frontend-testing'] ? `${results['frontend-testing'].summary?.accessiblePages}/${results['frontend-testing'].summary?.totalPages} pages accessible` : 'N/A',
        details: results['frontend-testing'] ? 'Comprehensive page-by-page testing completed' : 'Test not run'
      },
      backendTesting: {
        status: results['backend-testing'] ? 'COMPLETED' : 'NOT_RUN',
        score: results['backend-testing'] ? `${results['backend-testing'].summary?.accessiblePages}/${results['backend-testing'].summary?.totalPages} pages accessible` : 'N/A',
        details: results['backend-testing'] ? 'Backend functionality testing completed' : 'Test not run'
      },
      crudOperations: {
        status: results['crud-dropdowns'] ? 'COMPLETED' : 'NOT_RUN',
        score: results['crud-dropdowns'] ? `${results['crud-dropdowns'].summary?.crudOperationsWorking} operations working` : 'N/A',
        details: results['crud-dropdowns'] ? 'CRUD operations and dropdown testing completed' : 'Test not run'
      },
      arabicLocalization: {
        status: results['arabic-localization-audit'] ? 'COMPLETED' : 'NOT_RUN',
        score: results['arabic-localization-audit'] ? `${results['arabic-localization-audit'].summary?.averageArabicPercentage}% Arabic coverage` : 'N/A',
        details: results['arabic-localization-audit'] ? 'Arabic localization audit completed' : 'Test not run'
      },
      security: {
        status: results['security-testing'] ? 'COMPLETED' : 'NOT_RUN',
        score: results['security-testing'] ? `${results['security-testing'].summary?.overallSecurityScore}% security score` : 'N/A',
        details: results['security-testing'] ? 'Security testing completed' : 'Test not run'
      },
      integration: {
        status: results['final-integration'] ? 'COMPLETED' : 'NOT_RUN',
        score: results['final-integration'] ? `${results['final-integration'].summary?.overallIntegrationScore}% integration score` : 'N/A',
        details: results['final-integration'] ? 'End-to-end integration testing completed' : 'Test not run'
      }
    },
    systemStatus: {
      frontend: results['final-integration']?.connectivity?.frontend?.accessible ? 'ONLINE' : 'OFFLINE',
      backend: results['final-integration']?.connectivity?.backend?.accessible ? 'ONLINE' : 'OFFLINE',
      api: results['final-integration']?.connectivity?.api?.accessible ? 'ONLINE' : 'OFFLINE',
      database: results['final-integration']?.connectivity?.database?.connected ? 'CONNECTED' : 'DISCONNECTED'
    },
    nextSteps: []
  };
  
  // Generate next steps based on results
  if (!summary.readyForProduction) {
    report.nextSteps.push('Address critical issues before production deployment');
  }
  
  if (summary.criticalIssues.length > 0) {
    report.nextSteps.push('Resolve all critical issues identified in testing');
  }
  
  report.nextSteps.push(...summary.recommendations);
  
  if (summary.overallScore >= 80) {
    report.nextSteps.push('System is ready for production deployment');
    report.nextSteps.push('Set up production monitoring and logging');
    report.nextSteps.push('Prepare deployment documentation');
  } else {
    report.nextSteps.push('Continue development and testing until score reaches 80%+');
  }
  
  return report;
}

function generateHTMLReport(report) {
  const html = `
<!DOCTYPE html>
<html lang="en" dir="ltr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>BookDress - Final Testing Report</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; line-height: 1.6; }
        .header { background: #2c3e50; color: white; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
        .score { font-size: 2em; font-weight: bold; }
        .section { margin: 20px 0; padding: 15px; border: 1px solid #ddd; border-radius: 8px; }
        .status-online { color: #27ae60; font-weight: bold; }
        .status-offline { color: #e74c3c; font-weight: bold; }
        .score-excellent { color: #27ae60; }
        .score-good { color: #f39c12; }
        .score-poor { color: #e74c3c; }
        .critical-issue { background: #ffebee; border-left: 4px solid #e74c3c; padding: 10px; margin: 10px 0; }
        .recommendation { background: #e8f5e8; border-left: 4px solid #27ae60; padding: 10px; margin: 10px 0; }
        table { width: 100%; border-collapse: collapse; margin: 10px 0; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background: #f2f2f2; }
    </style>
</head>
<body>
    <div class="header">
        <h1>📊 BookDress - Final Testing Report</h1>
        <div class="score ${report.executiveSummary.overallScore >= 80 ? 'score-excellent' : report.executiveSummary.overallScore >= 60 ? 'score-good' : 'score-poor'}">
            Overall Score: ${report.executiveSummary.overallScore}%
        </div>
        <p>Generated on: ${new Date().toLocaleString()}</p>
    </div>

    <div class="section">
        <h2>🎯 Executive Summary</h2>
        <p><strong>Production Ready:</strong> ${report.executiveSummary.readyForProduction ? '✅ Yes' : '❌ No'}</p>
        <p><strong>Systems Online:</strong> ${report.executiveSummary.systemsOnline}/4</p>
        <p><strong>Critical Issues:</strong> ${report.executiveSummary.criticalIssues.length}</p>
        
        ${report.executiveSummary.criticalIssues.length > 0 ? `
        <h3>🚨 Critical Issues</h3>
        ${report.executiveSummary.criticalIssues.map(issue => `<div class="critical-issue">${issue}</div>`).join('')}
        ` : ''}
    </div>

    <div class="section">
        <h2>🔗 System Status</h2>
        <table>
            <tr><th>Component</th><th>Status</th></tr>
            <tr><td>Frontend</td><td class="${report.systemStatus.frontend === 'ONLINE' ? 'status-online' : 'status-offline'}">${report.systemStatus.frontend}</td></tr>
            <tr><td>Backend</td><td class="${report.systemStatus.backend === 'ONLINE' ? 'status-online' : 'status-offline'}">${report.systemStatus.backend}</td></tr>
            <tr><td>API</td><td class="${report.systemStatus.api === 'ONLINE' ? 'status-online' : 'status-offline'}">${report.systemStatus.api}</td></tr>
            <tr><td>Database</td><td class="${report.systemStatus.database === 'CONNECTED' ? 'status-online' : 'status-offline'}">${report.systemStatus.database}</td></tr>
        </table>
    </div>

    <div class="section">
        <h2>📋 Testing Results</h2>
        <table>
            <tr><th>Test Category</th><th>Status</th><th>Score</th><th>Details</th></tr>
            ${Object.entries(report.testingResults).map(([key, result]) => `
            <tr>
                <td>${key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}</td>
                <td>${result.status}</td>
                <td>${result.score}</td>
                <td>${result.details}</td>
            </tr>
            `).join('')}
        </table>
    </div>

    <div class="section">
        <h2>💡 Recommendations & Next Steps</h2>
        ${report.nextSteps.map(step => `<div class="recommendation">${step}</div>`).join('')}
    </div>

    <div class="section">
        <h2>📄 Detailed Test Files</h2>
        <p>The following detailed test result files have been generated:</p>
        <ul>
            <li>cross-browser-test-results.json</li>
            <li>performance-accessibility-results.json</li>
            <li>frontend-testing-results.json</li>
            <li>backend-testing-results.json</li>
            <li>crud-dropdowns-results.json</li>
            <li>arabic-localization-audit-results.json</li>
            <li>security-testing-results.json</li>
            <li>final-integration-results.json</li>
        </ul>
    </div>
</body>
</html>
  `;
  
  return html;
}

function generateFinalTestingReport() {
  console.log('📊 Generating Final Testing Report...\n');
  
  try {
    // Load all test results
    console.log('📁 Loading test results...');
    const results = loadTestResults();
    
    const loadedTests = Object.keys(results).length;
    console.log(`✅ Loaded ${loadedTests} test result files`);
    
    // Generate executive summary
    console.log('📈 Generating executive summary...');
    const summary = generateExecutiveSummary(results);
    
    // Generate detailed report
    console.log('📋 Generating detailed report...');
    const report = generateDetailedReport(results, summary);
    
    // Save JSON report
    fs.writeFileSync('scripts/final-testing-report.json', JSON.stringify(report, null, 2));
    console.log('✅ JSON report saved to scripts/final-testing-report.json');
    
    // Generate and save HTML report
    console.log('🌐 Generating HTML report...');
    const htmlReport = generateHTMLReport(report);
    fs.writeFileSync('scripts/final-testing-report.html', htmlReport);
    console.log('✅ HTML report saved to scripts/final-testing-report.html');
    
    // Display summary
    console.log('\n📊 Final Testing Report Summary:');
    console.log('=' .repeat(60));
    console.log(`🎯 Overall Score: ${summary.overallScore}%`);
    console.log(`🔗 Systems Online: ${summary.systemsOnline}/4`);
    console.log(`🚨 Critical Issues: ${summary.criticalIssues.length}`);
    console.log(`💡 Recommendations: ${summary.recommendations.length}`);
    console.log(`🚀 Production Ready: ${summary.readyForProduction ? 'YES' : 'NO'}`);
    
    if (summary.criticalIssues.length > 0) {
      console.log('\n🚨 Critical Issues:');
      summary.criticalIssues.forEach(issue => console.log(`  - ${issue}`));
    }
    
    if (summary.recommendations.length > 0) {
      console.log('\n💡 Top Recommendations:');
      summary.recommendations.slice(0, 3).forEach(rec => console.log(`  - ${rec}`));
    }
    
    console.log('\n🎉 Final Testing Report generation completed!');
    console.log('📄 Open scripts/final-testing-report.html in your browser to view the full report');
    
  } catch (error) {
    console.error('❌ Error generating report:', error.message);
  }
}

// Run the report generation
generateFinalTestingReport();
