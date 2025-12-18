#!/usr/bin/env node

/**
 * Final Comprehensive Test Suite
 * Complete validation of all BookDress functionality
 */

const fetch = require('node-fetch');
const { MongoClient } = require('mongodb');

const API_BASE = 'http://localhost:4002';
const FRONTEND_BASE = 'http://localhost:3000';
const BACKEND_BASE = 'http://localhost:3001';
const MONGODB_URI = 'mongodb+srv://user:Mybookmodr100@cluster0.ey9u2ce.mongodb.net/bookdress?retryWrites=true&w=majority&appName=Cluster0';

let testResults = {
  totalTests: 0,
  passed: 0,
  failed: 0,
  categories: {
    backend: { passed: 0, failed: 0 },
    frontend: { passed: 0, failed: 0 },
    business: { passed: 0, failed: 0 },
    security: { passed: 0, failed: 0 },
    performance: { passed: 0, failed: 0 }
  },
  issues: []
};

async function runTest(name, category, testFunction) {
  testResults.totalTests++;
  console.log(`\n🧪 ${name}`);
  
  try {
    const result = await testFunction();
    if (result) {
      console.log(`   ✅ PASS`);
      testResults.passed++;
      testResults.categories[category].passed++;
      return true;
    } else {
      console.log(`   ❌ FAIL`);
      testResults.failed++;
      testResults.categories[category].failed++;
      testResults.issues.push({ test: name, category });
      return false;
    }
  } catch (error) {
    console.log(`   💥 ERROR: ${error.message}`);
    testResults.failed++;
    testResults.categories[category].failed++;
    testResults.issues.push({ test: name, category, error: error.message });
    return false;
  }
}

async function makeRequest(url, options = {}) {
  const response = await fetch(url, {
    method: options.method || 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...options.headers
    },
    body: options.body ? JSON.stringify(options.body) : undefined
  });
  
  return {
    ok: response.ok,
    status: response.status,
    data: response.ok ? await response.json().catch(() => null) : null
  };
}

// ==================== BACKEND API TESTS ====================

async function testBackendAPIs() {
  console.log('\n🔧 === BACKEND API TESTS ===');
  
  await runTest('All Suppliers Endpoint', 'backend', async () => {
    const result = await makeRequest(`${API_BASE}/api/all-suppliers`);
    return result.ok && result.data && Array.isArray(result.data);
  });
  
  await runTest('All Locations Endpoint', 'backend', async () => {
    const result = await makeRequest(`${API_BASE}/api/locations/1/10/en`);
    return result.ok && result.data;
  });
  
  await runTest('Frontend Dress Search', 'backend', async () => {
    const result = await makeRequest(`${API_BASE}/api/frontend-dresses/1/10`, {
      method: 'POST',
      body: {}
    });
    return result.ok && result.data && result.data.docs;
  });
  
  await runTest('Dress Type Filtering', 'backend', async () => {
    const result = await makeRequest(`${API_BASE}/api/frontend-dresses/1/10`, {
      method: 'POST',
      body: { dressType: ['evening'] }
    });
    return result.ok && result.data && result.data.docs;
  });
  
  await runTest('Supplier Filtering', 'backend', async () => {
    // Get a supplier first
    const suppliersResult = await makeRequest(`${API_BASE}/api/all-suppliers`);
    if (!suppliersResult.ok || !suppliersResult.data.length) return false;
    
    const result = await makeRequest(`${API_BASE}/api/frontend-dresses/1/10`, {
      method: 'POST',
      body: { suppliers: [suppliersResult.data[0]._id] }
    });
    return result.ok && result.data;
  });
}

// ==================== FRONTEND UI TESTS ====================

async function testFrontendUI() {
  console.log('\n🌐 === FRONTEND UI TESTS ===');
  
  await runTest('Frontend Home Page', 'frontend', async () => {
    const result = await makeRequest(FRONTEND_BASE);
    return result.ok;
  });
  
  await runTest('Dress Search Page', 'frontend', async () => {
    const result = await makeRequest(`${FRONTEND_BASE}/search`);
    return result.ok;
  });
  
  await runTest('Booking Checkout Page', 'frontend', async () => {
    const result = await makeRequest(`${FRONTEND_BASE}/checkout`);
    return result.ok;
  });
  
  await runTest('Sign In Page', 'frontend', async () => {
    const result = await makeRequest(`${FRONTEND_BASE}/sign-in`);
    return result.ok;
  });
  
  await runTest('Backend Admin Panel', 'frontend', async () => {
    const result = await makeRequest(BACKEND_BASE);
    return result.ok;
  });
}

// ==================== BUSINESS LOGIC TESTS ====================

async function testBusinessLogic() {
  console.log('\n💼 === BUSINESS LOGIC TESTS ===');
  
  const client = new MongoClient(MONGODB_URI);
  await client.connect();
  const db = client.db('bookdress');
  
  const suppliers = await db.collection('User').find({ type: 'supplier' }).toArray();
  const customers = await db.collection('User').find({ type: 'user' }).toArray();
  const dresses = await db.collection('Dress').find({}).toArray();
  const bookings = await db.collection('Booking').find({}).toArray();
  const revenues = await db.collection('Revenue').find({}).toArray();
  
  await client.close();
  
  await runTest('Inventory Data Integrity', 'business', async () => {
    const validDresses = dresses.filter(dress => 
      dress.name && dress.price > 0 && dress.supplier && dress.available !== undefined
    );
    return validDresses.length === dresses.length;
  });
  
  await runTest('Revenue Calculation Accuracy', 'business', async () => {
    const paidBookings = bookings.filter(b => b.status === 'paid' || b.status === 'deposit');
    const bookingRevenue = paidBookings.reduce((sum, b) => sum + (b.paidAmount || b.price || 0), 0);
    const revenueRecords = revenues.reduce((sum, r) => sum + (r.amount || 0), 0);
    return Math.abs(bookingRevenue - revenueRecords) < 10; // Allow small discrepancy
  });
  
  await runTest('Supplier-Dress Relationships', 'business', async () => {
    const validRelationships = dresses.filter(dress => 
      suppliers.some(supplier => supplier._id.toString() === dress.supplier.toString())
    );
    return validRelationships.length === dresses.length;
  });
  
  await runTest('Customer Profile Completeness', 'business', async () => {
    const completeProfiles = customers.filter(customer => 
      customer.fullName && customer.phone
    );
    return completeProfiles.length === customers.length;
  });
  
  await runTest('Booking Status Consistency', 'business', async () => {
    const validStatuses = ['void', 'pending', 'deposit', 'paid', 'reserved', 'cancelled'];
    const validBookings = bookings.filter(booking => 
      validStatuses.includes(booking.status)
    );
    return validBookings.length === bookings.length;
  });
}

// ==================== SECURITY TESTS ====================

async function testSecurity() {
  console.log('\n🔒 === SECURITY TESTS ===');
  
  await runTest('Fitting Appointment Authentication', 'security', async () => {
    const result = await makeRequest(`${API_BASE}/api/fitting-appointments`, {
      method: 'POST',
      body: { test: 'data' }
    });
    // Should return 401/404 for unauthenticated requests
    return result.status === 401 || result.status === 404;
  });
  
  await runTest('Admin Endpoints Protection', 'security', async () => {
    const result = await makeRequest(`${API_BASE}/api/users/1/10`, {
      method: 'POST',
      body: {}
    });
    // Should require authentication
    return result.status === 401 || result.status === 404;
  });
  
  await runTest('Supplier Data Isolation', 'security', async () => {
    const result = await makeRequest(`${API_BASE}/api/dresses/1/10`, {
      method: 'POST',
      body: {}
    });
    // Should require authentication for supplier-specific data
    return result.status === 401 || result.status === 404;
  });
}

// ==================== PERFORMANCE TESTS ====================

async function testPerformance() {
  console.log('\n⚡ === PERFORMANCE TESTS ===');
  
  await runTest('API Response Time', 'performance', async () => {
    const start = Date.now();
    const result = await makeRequest(`${API_BASE}/api/all-suppliers`);
    const duration = Date.now() - start;
    console.log(`     Response time: ${duration}ms`);
    return result.ok && duration < 2000; // Should respond within 2 seconds
  });
  
  await runTest('Dress Search Performance', 'performance', async () => {
    const start = Date.now();
    const result = await makeRequest(`${API_BASE}/api/frontend-dresses/1/50`, {
      method: 'POST',
      body: {}
    });
    const duration = Date.now() - start;
    console.log(`     Search time: ${duration}ms`);
    return result.ok && duration < 3000; // Should search within 3 seconds
  });
  
  await runTest('Frontend Page Load', 'performance', async () => {
    const start = Date.now();
    const result = await makeRequest(FRONTEND_BASE);
    const duration = Date.now() - start;
    console.log(`     Load time: ${duration}ms`);
    return result.ok && duration < 5000; // Should load within 5 seconds
  });
}

// ==================== MAIN TEST RUNNER ====================

async function runFinalComprehensiveTest() {
  console.log('🚀 Starting Final Comprehensive Test Suite...\n');
  console.log('📋 Testing all BookDress functionality for production readiness\n');
  
  // Run all test categories
  await testBackendAPIs();
  await testFrontendUI();
  await testBusinessLogic();
  await testSecurity();
  await testPerformance();
  
  // Final Results
  console.log('\n📊 === FINAL COMPREHENSIVE TEST RESULTS ===');
  console.log(`🎯 Total Tests: ${testResults.totalTests}`);
  console.log(`✅ Passed: ${testResults.passed}`);
  console.log(`❌ Failed: ${testResults.failed}`);
  console.log(`📈 Success Rate: ${((testResults.passed / testResults.totalTests) * 100).toFixed(1)}%`);
  
  console.log('\n📋 Results by Category:');
  Object.entries(testResults.categories).forEach(([category, results]) => {
    const total = results.passed + results.failed;
    const rate = total > 0 ? ((results.passed / total) * 100).toFixed(1) : 0;
    console.log(`   ${category.toUpperCase()}: ${results.passed}/${total} (${rate}%)`);
  });
  
  if (testResults.issues.length > 0) {
    console.log('\n🐛 Issues Found:');
    testResults.issues.forEach((issue, index) => {
      console.log(`   ${index + 1}. ${issue.test} (${issue.category})`);
      if (issue.error) console.log(`      Error: ${issue.error}`);
    });
  }
  
  // Production Readiness Assessment
  const successRate = (testResults.passed / testResults.totalTests) * 100;
  console.log('\n🏆 === PRODUCTION READINESS ASSESSMENT ===');
  
  if (successRate >= 95) {
    console.log('🎉 EXCELLENT: System is production-ready with outstanding performance!');
  } else if (successRate >= 90) {
    console.log('✅ GOOD: System is production-ready with minor issues to monitor.');
  } else if (successRate >= 80) {
    console.log('⚠️  ACCEPTABLE: System is functional but needs improvements before production.');
  } else {
    console.log('❌ NEEDS WORK: System requires significant fixes before production deployment.');
  }
  
  console.log('\n🎉 Final comprehensive testing completed!');
}

if (require.main === module) {
  runFinalComprehensiveTest().catch(console.error);
}

module.exports = { runFinalComprehensiveTest };
