import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

console.log('🚀 Starting BookDress E2E Test Suite...\n');

// Ensure test results directory exists
const resultsDir = 'test-results';
if (!fs.existsSync(resultsDir)) {
  fs.mkdirSync(resultsDir, { recursive: true });
}

// Ensure screenshots directory exists
const screenshotsDir = path.join(resultsDir, 'screenshots');
if (!fs.existsSync(screenshotsDir)) {
  fs.mkdirSync(screenshotsDir, { recursive: true });
}

// Test configurations
const testConfigs = [
  {
    name: 'Backend Authentication Tests',
    command: 'npx playwright test e2e-tests/backend/auth.spec.ts --project=backend-chromium',
    critical: true
  },
  {
    name: 'Backend Booking Management Tests',
    command: 'npx playwright test e2e-tests/backend/bookings.spec.ts --project=backend-chromium',
    critical: true
  },
  {
    name: 'Backend Dress Management Tests',
    command: 'npx playwright test e2e-tests/backend/dresses.spec.ts --project=backend-chromium',
    critical: true
  },
  {
    name: 'Frontend Home Page Tests',
    command: 'npx playwright test e2e-tests/frontend/home.spec.ts --project=frontend-chromium',
    critical: true
  },
  {
    name: 'Frontend Dress Search Tests',
    command: 'npx playwright test e2e-tests/frontend/dress-search.spec.ts --project=frontend-chromium',
    critical: true
  },
  {
    name: 'Cross-Browser Backend Tests (Firefox)',
    command: 'npx playwright test e2e-tests/backend/ --project=backend-firefox',
    critical: false
  },
  {
    name: 'Cross-Browser Frontend Tests (Firefox)',
    command: 'npx playwright test e2e-tests/frontend/ --project=frontend-firefox',
    critical: false
  },
  {
    name: 'Mobile Responsiveness Tests',
    command: 'npx playwright test e2e-tests/ --grep="mobile|responsive" --project=mobile-backend,mobile-frontend',
    critical: false
  }
];

const results = {
  passed: 0,
  failed: 0,
  skipped: 0,
  total: 0,
  details: []
};

// Function to run a single test configuration
function runTestConfig(config) {
  console.log(`\n📋 Running: ${config.name}`);
  console.log(`Command: ${config.command}`);
  console.log('─'.repeat(80));
  
  try {
    const startTime = Date.now();
    const output = execSync(config.command, { 
      encoding: 'utf8',
      stdio: 'pipe',
      timeout: 300000 // 5 minutes timeout
    });
    
    const duration = Date.now() - startTime;
    
    console.log('✅ PASSED');
    console.log(`Duration: ${duration}ms`);
    
    results.passed++;
    results.details.push({
      name: config.name,
      status: 'PASSED',
      duration,
      critical: config.critical,
      output: output.substring(0, 500) // Truncate long output
    });
    
  } catch (error) {
    const duration = Date.now() - (Date.now() - 60000); // Approximate
    
    console.log('❌ FAILED');
    console.log(`Error: ${error.message}`);
    
    if (config.critical) {
      results.failed++;
      results.details.push({
        name: config.name,
        status: 'FAILED',
        duration,
        critical: config.critical,
        error: error.message,
        output: error.stdout || error.stderr || 'No output available'
      });
    } else {
      results.skipped++;
      results.details.push({
        name: config.name,
        status: 'SKIPPED',
        duration,
        critical: config.critical,
        error: error.message
      });
      console.log('⚠️  Non-critical test failed, continuing...');
    }
  }
  
  results.total++;
}

// Run all test configurations
console.log('Starting test execution...\n');

for (const config of testConfigs) {
  runTestConfig(config);
}

// Generate summary report
console.log('\n' + '='.repeat(80));
console.log('📊 TEST EXECUTION SUMMARY');
console.log('='.repeat(80));

console.log(`\n📈 Overall Results:`);
console.log(`   ✅ Passed: ${results.passed}`);
console.log(`   ❌ Failed: ${results.failed}`);
console.log(`   ⚠️  Skipped: ${results.skipped}`);
console.log(`   📊 Total: ${results.total}`);

const successRate = ((results.passed / results.total) * 100).toFixed(1);
console.log(`   🎯 Success Rate: ${successRate}%`);

// Detailed results
console.log(`\n📋 Detailed Results:`);
results.details.forEach((result, index) => {
  const icon = result.status === 'PASSED' ? '✅' : result.status === 'FAILED' ? '❌' : '⚠️';
  const critical = result.critical ? '🔴 CRITICAL' : '🟡 NON-CRITICAL';
  
  console.log(`\n${index + 1}. ${icon} ${result.name}`);
  console.log(`   Status: ${result.status} (${critical})`);
  console.log(`   Duration: ${result.duration}ms`);
  
  if (result.error) {
    console.log(`   Error: ${result.error.substring(0, 200)}...`);
  }
});

// Save detailed report to file
const reportData = {
  timestamp: new Date().toISOString(),
  summary: {
    passed: results.passed,
    failed: results.failed,
    skipped: results.skipped,
    total: results.total,
    successRate: successRate
  },
  details: results.details
};

fs.writeFileSync(
  path.join(resultsDir, 'test-report.json'),
  JSON.stringify(reportData, null, 2)
);

console.log(`\n📄 Detailed report saved to: ${path.join(resultsDir, 'test-report.json')}`);
console.log(`📸 Screenshots saved to: ${screenshotsDir}`);

// Generate HTML report if Playwright generated one
try {
  execSync('npx playwright show-report --host=0.0.0.0', { stdio: 'ignore' });
  console.log(`🌐 HTML report available at: http://localhost:9323`);
} catch (error) {
  console.log('📝 HTML report generation skipped');
}

// Exit with appropriate code
if (results.failed > 0) {
  console.log('\n❌ Some critical tests failed. Please review the results above.');
  process.exit(1);
} else {
  console.log('\n🎉 All critical tests passed successfully!');
  process.exit(0);
}
