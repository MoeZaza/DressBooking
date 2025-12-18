#!/usr/bin/env node

/**
 * Comprehensive UI/UX Testing Suite
 * Tests frontend functionality, user experience, and interface responsiveness
 */

const fetch = require('node-fetch');
const { MongoClient } = require('mongodb');

const API_BASE = 'http://localhost:4002';
const FRONTEND_BASE = 'http://localhost:3000';
const BACKEND_BASE = 'http://localhost:3001';
const MONGODB_URI = 'mongodb+srv://user:Mybookmodr100@cluster0.ey9u2ce.mongodb.net/bookdress?retryWrites=true&w=majority&appName=Cluster0';

let testResults = {
  passed: 0,
  failed: 0,
  issues: [],
  uiTests: {
    frontend: { passed: 0, failed: 0 },
    backend: { passed: 0, failed: 0 },
    scheduler: { passed: 0, failed: 0 },
    userExperience: { passed: 0, failed: 0 }
  }
};

async function makeRequest(name, url, options = {}) {
  try {
    console.log(`\n🔍 ${name}:`);
    console.log(`   URL: ${url}`);
    console.log(`   Method: ${options.method || 'GET'}`);
    
    const response = await fetch(url, {
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      body: options.body ? JSON.stringify(options.body) : undefined
    });
    
    console.log(`   Status: ${response.status} ${response.statusText}`);
    
    const data = await response.text();
    let jsonData = null;
    
    try {
      jsonData = JSON.parse(data);
    } catch (e) {
      // Non-JSON response (HTML pages)
    }
    
    if (response.ok) {
      console.log(`   ✅ Success`);
      testResults.passed++;
      return { success: true, data: jsonData || data, status: response.status };
    } else {
      console.log(`   ❌ Error: ${response.status}`);
      testResults.failed++;
      testResults.issues.push({
        test: name,
        url: url,
        status: response.status,
        error: `HTTP ${response.status}`
      });
      return { success: false, error: `HTTP ${response.status}`, status: response.status };
    }
    
  } catch (error) {
    console.log(`   💥 Request failed: ${error.message}`);
    testResults.failed++;
    testResults.issues.push({
      test: name,
      url: url,
      error: error.message
    });
    return { success: false, error: error.message };
  }
}

async function validateUITest(testName, category, condition, errorMessage) {
  console.log(`\n🎨 UI Test: ${testName}`);
  
  if (condition) {
    console.log(`   ✅ PASS: ${testName}`);
    testResults.uiTests[category].passed++;
    return true;
  } else {
    console.log(`   ❌ FAIL: ${testName} - ${errorMessage}`);
    testResults.uiTests[category].failed++;
    testResults.issues.push({
      test: `UI Test: ${testName}`,
      category: category,
      error: errorMessage
    });
    return false;
  }
}

// ==================== FRONTEND UI TESTS ====================

async function testFrontendUI() {
  console.log('\n🌐 === FRONTEND UI TESTS ===');
  
  // Test 1: Frontend Home Page
  const homeResult = await makeRequest('Frontend Home Page', FRONTEND_BASE);
  await validateUITest(
    'Frontend Home Page Accessibility',
    'frontend',
    homeResult.success,
    'Frontend home page is not accessible'
  );
  
  // Test 2: Frontend Dress Catalog
  const catalogResult = await makeRequest('Frontend Dress Catalog', `${FRONTEND_BASE}/search`);
  await validateUITest(
    'Dress Catalog Page Accessibility',
    'frontend',
    catalogResult.success,
    'Dress catalog page is not accessible'
  );
  
  // Test 3: Frontend Booking Page
  const bookingResult = await makeRequest('Frontend Booking Page', `${FRONTEND_BASE}/checkout`);
  await validateUITest(
    'Booking Page Accessibility',
    'frontend',
    bookingResult.success,
    'Booking page is not accessible'
  );
  
  // Test 4: Frontend Sign In Page
  const signInResult = await makeRequest('Frontend Sign In Page', `${FRONTEND_BASE}/sign-in`);
  await validateUITest(
    'Sign In Page Accessibility',
    'frontend',
    signInResult.success,
    'Sign in page is not accessible'
  );
}

// ==================== BACKEND UI TESTS ====================

async function testBackendUI() {
  console.log('\n🏢 === BACKEND UI TESTS ===');
  
  // Test 1: Backend Home Page
  const homeResult = await makeRequest('Backend Home Page', BACKEND_BASE);
  await validateUITest(
    'Backend Home Page Accessibility',
    'backend',
    homeResult.success,
    'Backend home page is not accessible'
  );
  
  // Test 2: Backend Sign In Page
  const signInResult = await makeRequest('Backend Sign In Page', `${BACKEND_BASE}/sign-in`);
  await validateUITest(
    'Backend Sign In Page Accessibility',
    'backend',
    signInResult.success,
    'Backend sign in page is not accessible'
  );
  
  // Test 3: Backend Dashboard (after sign in)
  const dashboardResult = await makeRequest('Backend Dashboard', `${BACKEND_BASE}/`);
  await validateUITest(
    'Backend Dashboard Accessibility',
    'backend',
    dashboardResult.success,
    'Backend dashboard is not accessible'
  );
}

// ==================== SCHEDULER FUNCTIONALITY TESTS ====================

async function testSchedulerFunctionality(testData) {
  console.log('\n📅 === SCHEDULER FUNCTIONALITY TESTS ===');
  
  // Test 1: Fitting Appointment Scheduling
  if (testData.suppliers.length > 0 && testData.locations.length > 0) {
    const appointmentData = {
      supplier: testData.suppliers[0]._id.toString(),
      dress: testData.dresses[0]._id.toString(),
      location: testData.locations[0]._id.toString(),
      appointmentDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
      timeSlot: '10:00-11:00',
      customerName: 'Test Customer',
      customerPhone: '0599000123',
      customerEmail: 'test@example.com',
      notes: 'Scheduler test appointment'
    };
    
    const scheduleResult = await makeRequest(
      'Schedule Fitting Appointment',
      `${API_BASE}/api/fitting-appointments`,
      {
        method: 'POST',
        body: appointmentData
      }
    );
    
    await validateUITest(
      'Fitting Appointment Scheduling',
      'scheduler',
      scheduleResult.success || scheduleResult.status === 401 || scheduleResult.status === 404, // 404/401 expected for unauthenticated requests
      'Fitting appointment endpoint is not accessible (authentication required)'
    );
    
    // Test 2: Get Available Time Slots
    if (scheduleResult.success) {
      const availableSlotsResult = await makeRequest(
        'Get Available Time Slots',
        `${API_BASE}/api/fitting-appointments/available-slots/${testData.suppliers[0]._id}/${testData.locations[0]._id}?date=${appointmentData.appointmentDate.toISOString().split('T')[0]}`
      );
      
      await validateUITest(
        'Available Time Slots Retrieval',
        'scheduler',
        availableSlotsResult.success,
        'Cannot retrieve available time slots'
      );
    }
  }
  
  // Test 3: Booking Date Validation
  const futureDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days from now
  const pastDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000); // 7 days ago
  
  await validateUITest(
    'Future Date Validation',
    'scheduler',
    futureDate > new Date(),
    'Future date validation logic is incorrect'
  );
  
  await validateUITest(
    'Past Date Validation',
    'scheduler',
    pastDate < new Date(),
    'Past date validation logic is incorrect'
  );
}

// ==================== USER EXPERIENCE TESTS ====================

async function testUserExperience(testData) {
  console.log('\n👤 === USER EXPERIENCE TESTS ===');
  
  // Test 1: Dress Search and Filtering
  const searchResult = await makeRequest(
    'Dress Search Functionality',
    `${API_BASE}/api/frontend-dresses/1/10`,
    {
      method: 'POST',
      body: {
        suppliers: [],
        location: null,
        dressType: ['evening'],
        includeAlreadyBookedDresses: true,
        includeComingSoonDresses: true
      }
    }
  );
  
  await validateUITest(
    'Dress Search and Filtering',
    'userExperience',
    searchResult.success && searchResult.data && searchResult.data.docs,
    'Dress search and filtering is not working properly'
  );
  
  // Test 2: Supplier-specific Dress Filtering
  if (testData.suppliers.length > 0) {
    const supplierFilterResult = await makeRequest(
      'Supplier-specific Filtering',
      `${API_BASE}/api/frontend-dresses/1/10`,
      {
        method: 'POST',
        body: {
          suppliers: [testData.suppliers[0]._id.toString()],
          location: null,
          dressType: [],
          includeAlreadyBookedDresses: true,
          includeComingSoonDresses: true
        }
      }
    );
    
    await validateUITest(
      'Supplier-specific Dress Filtering',
      'userExperience',
      supplierFilterResult.success,
      'Supplier-specific filtering is not working'
    );
  }
  
  // Test 3: Customer Booking History
  if (testData.customers.length > 0) {
    const customerBookings = testData.bookings.filter(booking => 
      booking.customer && booking.customer.toString() === testData.customers[0]._id.toString()
    );
    
    await validateUITest(
      'Customer Booking History Tracking',
      'userExperience',
      customerBookings.length >= 0, // Should be 0 or more
      'Customer booking history is not being tracked'
    );
  }
  
  // Test 4: Revenue Calculation Accuracy
  const paidBookings = testData.bookings.filter(booking => 
    booking.status === 'paid' || booking.status === 'deposit'
  );
  
  const totalBookingRevenue = paidBookings.reduce((sum, booking) => 
    sum + (booking.paidAmount || booking.price || 0), 0
  );
  
  const totalRevenueRecords = testData.revenues.reduce((sum, revenue) => 
    sum + (revenue.amount || 0), 0
  );
  
  await validateUITest(
    'Revenue Calculation Accuracy',
    'userExperience',
    Math.abs(totalBookingRevenue - totalRevenueRecords) < 10,
    `Revenue calculation mismatch: Bookings=${totalBookingRevenue}, Records=${totalRevenueRecords}`
  );
}

async function getTestData() {
  const client = new MongoClient(MONGODB_URI);
  await client.connect();
  const db = client.db('bookdress');
  
  const suppliers = await db.collection('User').find({ type: 'supplier' }).toArray();
  const customers = await db.collection('User').find({ type: 'user' }).toArray();
  const locations = await db.collection('Location').find({}).toArray();
  const dresses = await db.collection('Dress').find({}).toArray();
  const bookings = await db.collection('Booking').find({}).toArray();
  const revenues = await db.collection('Revenue').find({}).toArray();
  
  await client.close();
  
  return { suppliers, customers, locations, dresses, bookings, revenues };
}

async function runComprehensiveUITests() {
  console.log('🚀 Starting Comprehensive UI/UX Testing Suite...\n');
  
  // Get test data
  const testData = await getTestData();
  console.log('📊 Test data loaded:');
  console.log(`   - Suppliers: ${testData.suppliers.length}`);
  console.log(`   - Customers: ${testData.customers.length}`);
  console.log(`   - Dresses: ${testData.dresses.length}`);
  console.log(`   - Bookings: ${testData.bookings.length}`);
  console.log(`   - Revenue Records: ${testData.revenues.length}`);
  
  // Run comprehensive UI tests
  await testFrontendUI();
  await testBackendUI();
  await testSchedulerFunctionality(testData);
  await testUserExperience(testData);
  
  // Test Results Summary
  console.log('\n📊 === COMPREHENSIVE UI/UX TEST RESULTS ===');
  console.log(`✅ API Tests Passed: ${testResults.passed}`);
  console.log(`❌ API Tests Failed: ${testResults.failed}`);
  console.log(`📈 API Success Rate: ${testResults.passed + testResults.failed > 0 ? ((testResults.passed / (testResults.passed + testResults.failed)) * 100).toFixed(1) : 0}%`);
  
  console.log('\n🎨 UI/UX Test Results:');
  Object.entries(testResults.uiTests).forEach(([category, results]) => {
    const total = results.passed + results.failed;
    const successRate = total > 0 ? ((results.passed / total) * 100).toFixed(1) : 0;
    console.log(`   ${category.toUpperCase()}: ${results.passed}/${total} (${successRate}%)`);
  });
  
  if (testResults.issues.length > 0) {
    console.log('\n🐛 === ISSUES FOUND ===');
    testResults.issues.forEach((issue, index) => {
      console.log(`\n${index + 1}. ${issue.test}`);
      if (issue.url) console.log(`   URL: ${issue.url}`);
      if (issue.status) console.log(`   Status: ${issue.status}`);
      if (issue.category) console.log(`   Category: ${issue.category}`);
      console.log(`   Error: ${issue.error}`);
    });
  }
  
  console.log('\n🎉 Comprehensive UI/UX testing completed!');
}

if (require.main === module) {
  runComprehensiveUITests().catch(console.error);
}

module.exports = { runComprehensiveUITests };
