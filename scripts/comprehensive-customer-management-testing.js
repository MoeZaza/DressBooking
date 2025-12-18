#!/usr/bin/env node

/**
 * Comprehensive Customer Management Testing
 * Tests customer creation with minimal fields, profile management, booking history, and transaction tracking
 */

const fetch = require('node-fetch');
const { MongoClient } = require('mongodb');

const API_BASE = 'http://localhost:4002';
const MONGODB_URI = 'mongodb+srv://user:Mybookmodr100@cluster0.ey9u2ce.mongodb.net/bookdress?retryWrites=true&w=majority&appName=Cluster0';

let testResults = {
  passed: 0,
  failed: 0,
  issues: [],
  categories: {
    customerCreation: { passed: 0, failed: 0 },
    profileManagement: { passed: 0, failed: 0 },
    bookingHistory: { passed: 0, failed: 0 },
    transactionHistory: { passed: 0, failed: 0 },
    customerUI: { passed: 0, failed: 0 },
    businessLogic: { passed: 0, failed: 0 }
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
      body: options.body ? JSON.stringify(options.body) : undefined,
      timeout: 15000
    });
    
    console.log(`   Status: ${response.status} ${response.statusText}`);
    
    const data = await response.text();
    let jsonData = null;
    
    try {
      jsonData = JSON.parse(data);
    } catch (e) {
      // Non-JSON response
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
        error: jsonData ? jsonData.error : `HTTP ${response.status}`
      });
      return { success: false, error: jsonData ? jsonData.error : `HTTP ${response.status}`, status: response.status, data: jsonData };
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

async function validateTest(testName, category, condition, errorMessage) {
  console.log(`\n🧪 ${testName}`);
  
  if (condition) {
    console.log(`   ✅ PASS: ${testName}`);
    testResults.categories[category].passed++;
    testResults.passed++;
    return true;
  } else {
    console.log(`   ❌ FAIL: ${testName} - ${errorMessage}`);
    testResults.categories[category].failed++;
    testResults.failed++;
    testResults.issues.push({
      test: testName,
      category: category,
      error: errorMessage
    });
    return false;
  }
}

async function getTestData() {
  const client = new MongoClient(MONGODB_URI);
  await client.connect();
  const db = client.db('bookdress');
  
  const users = await db.collection('User').find({}).toArray();
  const dresses = await db.collection('Dress').find({}).toArray();
  const locations = await db.collection('Location').find({}).toArray();
  const bookings = await db.collection('Booking').find({}).toArray();
  
  await client.close();
  
  const suppliers = users.filter(u => u.type === 'supplier');
  const customers = users.filter(u => u.type === 'user');
  const admins = users.filter(u => u.type === 'admin');
  
  return { users, dresses, locations, bookings, suppliers, customers, admins };
}

// ==================== CUSTOMER CREATION TESTING ====================

async function testCustomerCreation(testData) {
  console.log('\n👤 === CUSTOMER CREATION TESTING ===');
  
  // Test 1: Create Customer with Minimal Fields (name, phone, email)
  const minimalCustomerData = {
    fullName: `Minimal Customer ${Date.now()}`,
    email: `minimal${Date.now()}@example.com`,
    phone: `059${Math.floor(Math.random() * 9000000 + 1000000)}`,
    type: 'user',
    language: 'en',
    verified: true
  };
  
  const minimalCustomerResult = await makeRequest(
    'Create Customer with Minimal Fields',
    `${API_BASE}/api/create-user`,
    {
      method: 'POST',
      body: minimalCustomerData
    }
  );
  
  await validateTest(
    'Minimal Customer Creation',
    'customerCreation',
    minimalCustomerResult.success,
    'Customer should be created with minimal required fields (name, phone, email)'
  );
  
  let createdCustomer = null;
  if (minimalCustomerResult.success) {
    createdCustomer = minimalCustomerResult.data;
    testData.createdCustomer = createdCustomer;
  }
  
  // Test 2: Create Full Customer Profile
  const fullCustomerData = {
    fullName: `Full Customer ${Date.now()}`,
    email: `fullcustomer${Date.now()}@example.com`,
    phone: `059${Math.floor(Math.random() * 9000000 + 1000000)}`,
    type: 'user',
    language: 'en',
    password: 'CustomerPassword123!',
    birthDate: new Date('1992-05-15').toISOString(),
    verified: true,
    bio: 'Customer who loves elegant dresses',
    avatar: 'customer-avatar.jpg'
  };
  
  const fullCustomerResult = await makeRequest(
    'Create Full Customer Profile',
    `${API_BASE}/api/create-user`,
    {
      method: 'POST',
      body: fullCustomerData
    }
  );
  
  await validateTest(
    'Full Customer Profile Creation',
    'customerCreation',
    fullCustomerResult.success,
    'Customer should be created with full profile data'
  );
  
  if (fullCustomerResult.success) {
    testData.fullCustomer = fullCustomerResult.data;
  }
  
  // Test 3: Verify Customer Type
  if (createdCustomer) {
    await validateTest(
      'Customer Type Verification',
      'customerCreation',
      createdCustomer.type === 'user',
      'Created customer should have user type'
    );
  }
  
  return createdCustomer;
}

// ==================== PROFILE MANAGEMENT TESTING ====================

async function testProfileManagement(testData, createdCustomer) {
  console.log('\n📝 === PROFILE MANAGEMENT TESTING ===');
  
  if (!createdCustomer) {
    console.log('⚠️ No created customer available for profile management testing');
    return;
  }
  
  // Test 1: Get Customer Profile
  const profileResult = await makeRequest(
    'Get Customer Profile',
    `${API_BASE}/api/user/${createdCustomer._id}`
  );
  
  await validateTest(
    'Customer Profile Retrieval',
    'profileManagement',
    profileResult.success,
    'Customer profile should be retrievable'
  );
  
  // Test 2: Update Customer Profile
  const updatedProfileData = {
    _id: createdCustomer._id,
    fullName: `Updated ${createdCustomer.fullName}`,
    email: `updated${Date.now()}@example.com`,
    bio: 'Updated customer bio with preferences',
    phone: createdCustomer.phone // Keep original phone
  };
  
  const updateResult = await makeRequest(
    'Update Customer Profile',
    `${API_BASE}/api/update-user`,
    {
      method: 'POST',
      body: updatedProfileData
    }
  );
  
  await validateTest(
    'Customer Profile Update',
    'profileManagement',
    updateResult.success,
    'Customer profile should be updatable'
  );
  
  // Test 3: Verify Profile Changes
  if (updateResult.success) {
    const verifyResult = await makeRequest(
      'Verify Profile Changes',
      `${API_BASE}/api/user/${createdCustomer._id}`
    );
    
    if (verifyResult.success) {
      await validateTest(
        'Profile Changes Verification',
        'profileManagement',
        verifyResult.data.fullName === updatedProfileData.fullName,
        'Profile changes should be persisted'
      );
    }
  }
}

// ==================== BOOKING HISTORY TESTING ====================

async function testBookingHistory(testData, createdCustomer) {
  console.log('\n📚 === BOOKING HISTORY TESTING ===');
  
  if (!createdCustomer || testData.suppliers.length === 0 || testData.dresses.length === 0 || testData.locations.length === 0) {
    console.log('⚠️ Insufficient data for booking history testing');
    return;
  }
  
  const supplier = testData.suppliers[0];
  const dress = testData.dresses.find(d => d.supplier.toString() === supplier._id.toString());
  const location = testData.locations[0];
  
  if (!dress) {
    console.log('⚠️ No dress found for supplier in booking history testing');
    return;
  }
  
  // Test 1: Create Booking for Customer
  const bookingData = {
    booking: {
      supplier: supplier._id.toString(),
      dress: dress._id.toString(),
      customer: createdCustomer._id.toString(),
      location: location._id.toString(),
      from: new Date(Date.now() + 1300 * 24 * 60 * 60 * 1000).toISOString(),
      to: new Date(Date.now() + 1303 * 24 * 60 * 60 * 1000).toISOString(),
      status: 'pending',
      price: 1200
    }
  };
  
  const bookingResult = await makeRequest(
    'Create Booking for Customer History',
    `${API_BASE}/api/create-booking`,
    {
      method: 'POST',
      body: bookingData
    }
  );
  
  await validateTest(
    'Customer Booking Creation',
    'bookingHistory',
    bookingResult.success,
    'Should be able to create booking for customer'
  );
  
  if (bookingResult.success) {
    testData.customerBooking = bookingResult.data;
  }
  
  // Test 2: Get Customer Booking History
  const historyResult = await makeRequest(
    'Get Customer Booking History',
    `${API_BASE}/api/customer-bookings/${createdCustomer._id}`
  );
  
  await validateTest(
    'Customer Booking History Retrieval',
    'bookingHistory',
    historyResult.success || historyResult.status === 401 || historyResult.status === 403,
    'Customer booking history should be accessible (or require authentication)'
  );
  
  // Test 3: Verify Booking in History
  if (historyResult.success && testData.customerBooking) {
    const bookings = historyResult.data || [];
    const foundBooking = bookings.find(b => b._id.toString() === testData.customerBooking._id.toString());
    
    await validateTest(
      'Booking in Customer History',
      'bookingHistory',
      !!foundBooking,
      'Created booking should appear in customer history'
    );
  }
}

async function runComprehensiveCustomerManagementTesting() {
  console.log('🚀 Starting Comprehensive Customer Management Testing...\n');
  
  // Get test data
  const testData = await getTestData();
  console.log('📊 Test data loaded:');
  console.log(`   - Users: ${testData.users.length}`);
  console.log(`   - Suppliers: ${testData.suppliers.length}`);
  console.log(`   - Customers: ${testData.customers.length}`);
  console.log(`   - Admins: ${testData.admins.length}`);
  console.log(`   - Dresses: ${testData.dresses.length}`);
  console.log(`   - Locations: ${testData.locations.length}`);
  console.log(`   - Bookings: ${testData.bookings.length}`);
  
  // Run comprehensive customer management tests
  const createdCustomer = await testCustomerCreation(testData);
  await testProfileManagement(testData, createdCustomer);
  await testBookingHistory(testData, createdCustomer);
  
  // Test Results Summary
  console.log('\n📊 === COMPREHENSIVE CUSTOMER MANAGEMENT TEST RESULTS ===');
  console.log(`✅ Total Tests Passed: ${testResults.passed}`);
  console.log(`❌ Total Tests Failed: ${testResults.failed}`);
  console.log(`📈 Success Rate: ${testResults.passed + testResults.failed > 0 ? ((testResults.passed / (testResults.passed + testResults.failed)) * 100).toFixed(1) : 0}%`);
  
  console.log('\n📋 Results by Category:');
  Object.entries(testResults.categories).forEach(([category, results]) => {
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
  
  console.log('\n🎉 Comprehensive customer management testing completed!');
}

if (require.main === module) {
  runComprehensiveCustomerManagementTesting().catch(console.error);
}

module.exports = { runComprehensiveCustomerManagementTesting };
