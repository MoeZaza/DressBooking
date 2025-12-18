#!/usr/bin/env node

/**
 * Comprehensive End-to-End Testing Suite for BookDress Application
 * 
 * This script tests all major functionality to ensure the application works correctly:
 * - API endpoints
 * - Database operations
 * - Authentication
 * - Business logic
 * - Data integrity
 */

const axios = require('axios');
const fs = require('fs');
const path = require('path');

// Configuration
const API_BASE = 'http://localhost:4002';
const FRONTEND_BASE = 'http://localhost:3000';
const BACKEND_BASE = 'http://localhost:3001';

// Test results tracking
const testResults = {
  passed: 0,
  failed: 0,
  total: 0,
  details: []
};

// Helper function to make API requests
async function makeRequest(name, url, options = {}) {
  try {
    console.log(`🧪 Testing: ${name}`);
    
    const config = {
      method: options.method || 'GET',
      url,
      timeout: 10000,
      validateStatus: () => true, // Don't throw on any status
      ...options
    };

    if (options.body) {
      config.data = options.body;
      config.headers = {
        'Content-Type': 'application/json',
        ...options.headers
      };
    }

    const response = await axios(config);
    
    const success = response.status >= 200 && response.status < 400;
    const result = {
      name,
      success,
      status: response.status,
      data: response.data,
      error: success ? null : response.data?.error || `HTTP ${response.status}`
    };

    if (success) {
      console.log(`✅ ${name}: ${response.status}`);
    } else {
      console.log(`❌ ${name}: ${response.status} - ${result.error}`);
    }

    return result;
  } catch (error) {
    console.log(`❌ ${name}: ${error.message}`);
    return {
      name,
      success: false,
      status: 0,
      data: null,
      error: error.message
    };
  }
}

// Helper function to validate test results
async function validateTest(testName, category, condition, message) {
  testResults.total++;
  
  if (condition) {
    testResults.passed++;
    console.log(`✅ ${testName}: PASSED`);
    testResults.details.push({
      name: testName,
      category,
      status: 'PASSED',
      message
    });
  } else {
    testResults.failed++;
    console.log(`❌ ${testName}: FAILED - ${message}`);
    testResults.details.push({
      name: testName,
      category,
      status: 'FAILED',
      message
    });
  }
}

// Test 1: Basic API Health Checks
async function testAPIHealth() {
  console.log('\n🏥 === API HEALTH CHECKS ===');
  
  const healthResult = await makeRequest('API Health Check', `${API_BASE}/api/health`);
  await validateTest(
    'API Server Health',
    'infrastructure',
    healthResult.success,
    'API server should be healthy and responding'
  );

  // Test database connection
  const countriesResult = await makeRequest('Database Connection Test', `${API_BASE}/api/countries/1/5/en/?s=`);
  await validateTest(
    'Database Connection',
    'infrastructure',
    countriesResult.success,
    'Database should be accessible'
  );
}

// Test 2: Authentication System
async function testAuthentication() {
  console.log('\n🔐 === AUTHENTICATION TESTS ===');
  
  // Test admin login
  const adminLoginResult = await makeRequest(
    'Admin Login',
    `${API_BASE}/api/sign-in/backend`,
    {
      method: 'POST',
      body: {
        email: 'admin@bookdress.io',
        password: 'Un1corn2024!'
      }
    }
  );

  await validateTest(
    'Admin Authentication',
    'authentication',
    adminLoginResult.success,
    'Admin should be able to login'
  );

  // Extract token from response headers or cookies
  let authToken = null;
  if (adminLoginResult.success && adminLoginResult.data) {
    // Try to get token from response data or headers
    authToken = adminLoginResult.data.accessToken || adminLoginResult.data.token;
  }

  return authToken;
}

// Test 3: Core Data APIs
async function testCoreDataAPIs(authToken) {
  console.log('\n📊 === CORE DATA API TESTS ===');
  
  const authHeaders = authToken ? {
    'Authorization': `Bearer ${authToken}`,
    'Cookie': `bc-x-access-token-backend=${authToken}`
  } : {};

  // Test locations API
  const locationsResult = await makeRequest(
    'Locations API',
    `${API_BASE}/api/locations/1/10/en/?s=`,
    { headers: authHeaders }
  );

  await validateTest(
    'Locations Data Retrieval',
    'coreData',
    locationsResult.success,
    'Locations API should return data'
  );

  // Test dresses API
  const dressesResult = await makeRequest(
    'Dresses API',
    `${API_BASE}/api/frontend-dresses/1/10`,
    {
      method: 'POST',
      body: {},
      headers: authHeaders
    }
  );

  await validateTest(
    'Dresses Data Retrieval',
    'coreData',
    dressesResult.success,
    'Dresses API should return data'
  );

  // Test suppliers API (requires POST with location)
  const suppliersResult = await makeRequest(
    'Suppliers API',
    `${API_BASE}/api/frontend-suppliers`,
    {
      method: 'POST',
      body: {
        location: '507f1f77bcf86cd799439011' // Test location ID
      },
      headers: authHeaders
    }
  );

  await validateTest(
    'Suppliers Data Retrieval',
    'coreData',
    suppliersResult.success,
    'Suppliers API should return data'
  );

  return {
    locations: locationsResult.data,
    dresses: dressesResult.data,
    suppliers: suppliersResult.data
  };
}

// Test 4: Business Logic APIs
async function testBusinessLogicAPIs(authToken, testData) {
  console.log('\n💼 === BUSINESS LOGIC TESTS ===');
  
  const authHeaders = authToken ? {
    'Authorization': `Bearer ${authToken}`,
    'Cookie': `bc-x-access-token-backend=${authToken}`
  } : {};

  // Test booking calendar
  const calendarResult = await makeRequest(
    'Booking Calendar API',
    `${API_BASE}/api/booking-calendar?startDate=2025-07-01T00:00:00.000Z&endDate=2025-07-31T23:59:59.999Z`,
    { headers: authHeaders }
  );

  await validateTest(
    'Booking Calendar',
    'businessLogic',
    calendarResult.success,
    'Booking calendar should work'
  );

  // Test business intelligence
  const biResult = await makeRequest(
    'Business Intelligence API',
    `${API_BASE}/api/business-intelligence/business-summary`,
    { headers: authHeaders }
  );

  await validateTest(
    'Business Intelligence',
    'businessLogic',
    biResult.success,
    'Business intelligence should be accessible'
  );
}

// Test 5: Error Handling
async function testErrorHandling() {
  console.log('\n🚨 === ERROR HANDLING TESTS ===');
  
  // Test invalid endpoint
  const invalidResult = await makeRequest(
    'Invalid Endpoint',
    `${API_BASE}/api/nonexistent-endpoint`
  );

  await validateTest(
    'Invalid Endpoint Handling',
    'errorHandling',
    !invalidResult.success && invalidResult.status === 404,
    'Invalid endpoints should return 404'
  );

  // Test malformed request
  const malformedResult = await makeRequest(
    'Malformed Request',
    `${API_BASE}/api/frontend-dresses/1/10`,
    {
      method: 'POST',
      body: 'invalid-json'
    }
  );

  await validateTest(
    'Malformed Request Handling',
    'errorHandling',
    !malformedResult.success,
    'Malformed requests should be handled gracefully'
  );
}

// Test 6: Performance and Load
async function testPerformance() {
  console.log('\n⚡ === PERFORMANCE TESTS ===');
  
  const startTime = Date.now();
  
  // Make multiple concurrent requests
  const promises = [];
  for (let i = 0; i < 5; i++) {
    promises.push(makeRequest(`Concurrent Request ${i + 1}`, `${API_BASE}/api/health`));
  }
  
  const results = await Promise.all(promises);
  const endTime = Date.now();
  const duration = endTime - startTime;
  
  const allSuccessful = results.every(r => r.success);
  
  await validateTest(
    'Concurrent Request Handling',
    'performance',
    allSuccessful && duration < 5000,
    `Should handle 5 concurrent requests in under 5 seconds (took ${duration}ms)`
  );
}

// Generate test report
function generateReport() {
  console.log('\n📋 === TEST REPORT ===');
  console.log(`Total Tests: ${testResults.total}`);
  console.log(`Passed: ${testResults.passed}`);
  console.log(`Failed: ${testResults.failed}`);
  console.log(`Success Rate: ${((testResults.passed / testResults.total) * 100).toFixed(2)}%`);
  
  // Group by category
  const categories = {};
  testResults.details.forEach(test => {
    if (!categories[test.category]) {
      categories[test.category] = { passed: 0, failed: 0, total: 0 };
    }
    categories[test.category].total++;
    if (test.status === 'PASSED') {
      categories[test.category].passed++;
    } else {
      categories[test.category].failed++;
    }
  });
  
  console.log('\n📊 Results by Category:');
  Object.entries(categories).forEach(([category, stats]) => {
    const rate = ((stats.passed / stats.total) * 100).toFixed(2);
    console.log(`  ${category}: ${stats.passed}/${stats.total} (${rate}%)`);
  });
  
  // Save detailed report
  const reportPath = path.join(__dirname, 'e2e-test-report.json');
  fs.writeFileSync(reportPath, JSON.stringify({
    timestamp: new Date().toISOString(),
    summary: {
      total: testResults.total,
      passed: testResults.passed,
      failed: testResults.failed,
      successRate: (testResults.passed / testResults.total) * 100
    },
    categories,
    details: testResults.details
  }, null, 2));
  
  console.log(`\n📄 Detailed report saved to: ${reportPath}`);
  
  if (testResults.failed > 0) {
    console.log('\n❌ FAILED TESTS:');
    testResults.details
      .filter(test => test.status === 'FAILED')
      .forEach(test => {
        console.log(`  - ${test.name}: ${test.message}`);
      });
  }
}

// Main test execution
async function runE2ETests() {
  console.log('🚀 Starting Comprehensive End-to-End Tests for BookDress Application');
  console.log('================================================================');
  
  try {
    // Run all test suites
    await testAPIHealth();
    const authToken = await testAuthentication();
    const testData = await testCoreDataAPIs(authToken);
    await testBusinessLogicAPIs(authToken, testData);
    await testErrorHandling();
    await testPerformance();
    
    // Generate final report
    generateReport();
    
    console.log('\n🎉 End-to-End Testing Complete!');
    
    // Exit with appropriate code
    process.exit(testResults.failed > 0 ? 1 : 0);
    
  } catch (error) {
    console.error('\n💥 Test execution failed:', error);
    process.exit(1);
  }
}

// Run tests if this script is executed directly
if (require.main === module) {
  runE2ETests();
}

module.exports = { runE2ETests };
