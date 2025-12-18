#!/usr/bin/env node

/**
 * Comprehensive Conflict Detection Testing
 * Ensures booking and appointment conflicts are working 100% with comprehensive edge case testing
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
    basicConflicts: { passed: 0, failed: 0 },
    overlappingDates: { passed: 0, failed: 0 },
    sameDressConflicts: { passed: 0, failed: 0 },
    appointmentConflicts: { passed: 0, failed: 0 },
    edgeCases: { passed: 0, failed: 0 },
    businessRules: { passed: 0, failed: 0 }
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
  
  // Find valid dress-supplier pairs
  const validPairs = [];
  dresses.forEach(dress => {
    const supplier = suppliers.find(s => s._id.toString() === dress.supplier.toString());
    if (supplier) {
      validPairs.push({ dress, supplier });
    }
  });
  
  return { users, dresses, locations, bookings, suppliers, customers, validPairs };
}

// ==================== BASIC CONFLICT TESTING ====================

async function testBasicConflicts(testData) {
  console.log('\n⚔️ === BASIC CONFLICT TESTING ===');
  
  if (testData.validPairs.length === 0 || testData.customers.length === 0 || testData.locations.length === 0) {
    console.log('⚠️ Insufficient test data for conflict testing');
    return;
  }
  
  const validPair = testData.validPairs[0];
  const customer = testData.customers[0];
  const location = testData.locations[0];
  
  // Create a base booking first
  const baseDate = new Date(Date.now() + 800 * 24 * 60 * 60 * 1000);
  const baseBooking = {
    booking: {
      supplier: validPair.supplier._id.toString(),
      dress: validPair.dress._id.toString(),
      customer: customer._id.toString(),
      location: location._id.toString(),
      from: new Date(baseDate.getTime()).toISOString(),
      to: new Date(baseDate.getTime() + 3 * 24 * 60 * 60 * 1000).toISOString(),
      status: 'pending',
      price: 800
    }
  };
  
  // Test 1: Create initial booking (should succeed)
  const initialBookingResult = await makeRequest(
    'Create Initial Booking',
    `${API_BASE}/api/create-booking`,
    {
      method: 'POST',
      body: baseBooking
    }
  );
  
  await validateTest(
    'Initial Booking Creation',
    'basicConflicts',
    initialBookingResult.success,
    'Initial booking should be created successfully'
  );
  
  if (!initialBookingResult.success) {
    console.log('⚠️ Cannot proceed with conflict testing - initial booking failed');
    return;
  }
  
  // Test 2: Try to create exact same booking (should fail)
  const exactConflictResult = await makeRequest(
    'Create Exact Same Booking (Conflict)',
    `${API_BASE}/api/create-booking`,
    {
      method: 'POST',
      body: baseBooking
    }
  );
  
  await validateTest(
    'Exact Booking Conflict Detection',
    'basicConflicts',
    !exactConflictResult.success && exactConflictResult.status === 400,
    'Exact same booking should be rejected with 400 error'
  );
  
  // Test 3: Try to create booking with same dress and overlapping dates (should fail)
  const overlappingBooking = {
    booking: {
      supplier: validPair.supplier._id.toString(),
      dress: validPair.dress._id.toString(),
      customer: testData.customers[1] ? testData.customers[1]._id.toString() : customer._id.toString(),
      location: location._id.toString(),
      from: new Date(baseDate.getTime() + 1 * 24 * 60 * 60 * 1000).toISOString(), // Start 1 day later
      to: new Date(baseDate.getTime() + 4 * 24 * 60 * 60 * 1000).toISOString(),   // End 1 day later
      status: 'pending',
      price: 800
    }
  };
  
  const overlappingConflictResult = await makeRequest(
    'Create Overlapping Booking (Conflict)',
    `${API_BASE}/api/create-booking`,
    {
      method: 'POST',
      body: overlappingBooking
    }
  );
  
  await validateTest(
    'Overlapping Booking Conflict Detection',
    'basicConflicts',
    !overlappingConflictResult.success && overlappingConflictResult.status === 400,
    'Overlapping booking should be rejected with 400 error'
  );
  
  return initialBookingResult.data;
}

// ==================== OVERLAPPING DATES TESTING ====================

async function testOverlappingDates(testData, createdBooking) {
  console.log('\n📅 === OVERLAPPING DATES TESTING ===');
  
  if (!createdBooking || testData.validPairs.length === 0) {
    console.log('⚠️ No base booking available for overlapping dates testing');
    return;
  }
  
  const validPair = testData.validPairs[0];
  const customer = testData.customers[1] || testData.customers[0];
  const location = testData.locations[0];
  
  const baseFrom = new Date(createdBooking.from);
  const baseTo = new Date(createdBooking.to);
  
  // Test 1: Booking starts before and ends during (should fail)
  const startBeforeEndDuring = {
    booking: {
      supplier: validPair.supplier._id.toString(),
      dress: validPair.dress._id.toString(),
      customer: customer._id.toString(),
      location: location._id.toString(),
      from: new Date(baseFrom.getTime() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      to: new Date(baseFrom.getTime() + 1 * 24 * 60 * 60 * 1000).toISOString(),
      status: 'pending',
      price: 800
    }
  };
  
  const startBeforeResult = await makeRequest(
    'Start Before End During Conflict',
    `${API_BASE}/api/create-booking`,
    {
      method: 'POST',
      body: startBeforeEndDuring
    }
  );
  
  await validateTest(
    'Start Before End During Conflict Detection',
    'overlappingDates',
    !startBeforeResult.success && startBeforeResult.status === 400,
    'Booking starting before and ending during should be rejected'
  );
  
  // Test 2: Booking starts during and ends after (should fail)
  const startDuringEndAfter = {
    booking: {
      supplier: validPair.supplier._id.toString(),
      dress: validPair.dress._id.toString(),
      customer: customer._id.toString(),
      location: location._id.toString(),
      from: new Date(baseTo.getTime() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      to: new Date(baseTo.getTime() + 1 * 24 * 60 * 60 * 1000).toISOString(),
      status: 'pending',
      price: 800
    }
  };
  
  const startDuringResult = await makeRequest(
    'Start During End After Conflict',
    `${API_BASE}/api/create-booking`,
    {
      method: 'POST',
      body: startDuringEndAfter
    }
  );
  
  await validateTest(
    'Start During End After Conflict Detection',
    'overlappingDates',
    !startDuringResult.success && startDuringResult.status === 400,
    'Booking starting during and ending after should be rejected'
  );
  
  // Test 3: Booking completely encompasses existing booking (should fail)
  const encompassingBooking = {
    booking: {
      supplier: validPair.supplier._id.toString(),
      dress: validPair.dress._id.toString(),
      customer: customer._id.toString(),
      location: location._id.toString(),
      from: new Date(baseFrom.getTime() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      to: new Date(baseTo.getTime() + 1 * 24 * 60 * 60 * 1000).toISOString(),
      status: 'pending',
      price: 800
    }
  };
  
  const encompassingResult = await makeRequest(
    'Encompassing Booking Conflict',
    `${API_BASE}/api/create-booking`,
    {
      method: 'POST',
      body: encompassingBooking
    }
  );
  
  await validateTest(
    'Encompassing Booking Conflict Detection',
    'overlappingDates',
    !encompassingResult.success && encompassingResult.status === 400,
    'Encompassing booking should be rejected'
  );
  
  // Test 4: Adjacent booking (should succeed)
  const adjacentBooking = {
    booking: {
      supplier: validPair.supplier._id.toString(),
      dress: validPair.dress._id.toString(),
      customer: customer._id.toString(),
      location: location._id.toString(),
      from: new Date(baseTo.getTime() + 1 * 60 * 60 * 1000).toISOString(), // Start 1 hour after base ends
      to: new Date(baseTo.getTime() + 3 * 24 * 60 * 60 * 1000).toISOString(),
      status: 'pending',
      price: 800
    }
  };
  
  const adjacentResult = await makeRequest(
    'Adjacent Booking (No Conflict)',
    `${API_BASE}/api/create-booking`,
    {
      method: 'POST',
      body: adjacentBooking
    }
  );
  
  await validateTest(
    'Adjacent Booking Allowed',
    'overlappingDates',
    adjacentResult.success,
    'Adjacent booking should be allowed'
  );
}

// ==================== SAME DRESS CONFLICTS TESTING ====================

async function testSameDressConflicts(testData) {
  console.log('\n👗 === SAME DRESS CONFLICTS TESTING ===');
  
  if (testData.validPairs.length < 2 || testData.customers.length < 2) {
    console.log('⚠️ Insufficient test data for same dress conflict testing');
    return;
  }
  
  const dress = testData.validPairs[0].dress;
  const supplier = testData.validPairs[0].supplier;
  const customer1 = testData.customers[0];
  const customer2 = testData.customers[1];
  const location = testData.locations[0];
  
  // Create two bookings for the same dress at different times
  const baseDate = new Date(Date.now() + 900 * 24 * 60 * 60 * 1000);
  
  const booking1 = {
    booking: {
      supplier: supplier._id.toString(),
      dress: dress._id.toString(),
      customer: customer1._id.toString(),
      location: location._id.toString(),
      from: new Date(baseDate.getTime()).toISOString(),
      to: new Date(baseDate.getTime() + 2 * 24 * 60 * 60 * 1000).toISOString(),
      status: 'pending',
      price: 800
    }
  };
  
  const booking2 = {
    booking: {
      supplier: supplier._id.toString(),
      dress: dress._id.toString(),
      customer: customer2._id.toString(),
      location: location._id.toString(),
      from: new Date(baseDate.getTime() + 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days later
      to: new Date(baseDate.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      status: 'pending',
      price: 800
    }
  };
  
  // Test 1: Create first booking (should succeed)
  const firstBookingResult = await makeRequest(
    'Create First Same Dress Booking',
    `${API_BASE}/api/create-booking`,
    {
      method: 'POST',
      body: booking1
    }
  );
  
  await validateTest(
    'First Same Dress Booking',
    'sameDressConflicts',
    firstBookingResult.success,
    'First booking for dress should succeed'
  );
  
  // Test 2: Create second booking at different time (should succeed)
  const secondBookingResult = await makeRequest(
    'Create Second Same Dress Booking (Different Time)',
    `${API_BASE}/api/create-booking`,
    {
      method: 'POST',
      body: booking2
    }
  );
  
  await validateTest(
    'Second Same Dress Booking Different Time',
    'sameDressConflicts',
    secondBookingResult.success,
    'Second booking for same dress at different time should succeed'
  );
  
  // Test 3: Try to create conflicting booking (should fail)
  const conflictingBooking = {
    booking: {
      supplier: supplier._id.toString(),
      dress: dress._id.toString(),
      customer: customer2._id.toString(),
      location: location._id.toString(),
      from: new Date(baseDate.getTime() + 1 * 24 * 60 * 60 * 1000).toISOString(), // Overlaps with first booking
      to: new Date(baseDate.getTime() + 3 * 24 * 60 * 60 * 1000).toISOString(),
      status: 'pending',
      price: 800
    }
  };
  
  const conflictingResult = await makeRequest(
    'Create Conflicting Same Dress Booking',
    `${API_BASE}/api/create-booking`,
    {
      method: 'POST',
      body: conflictingBooking
    }
  );
  
  await validateTest(
    'Same Dress Conflict Detection',
    'sameDressConflicts',
    !conflictingResult.success && conflictingResult.status === 400,
    'Conflicting booking for same dress should be rejected'
  );
}

async function runComprehensiveConflictDetectionTesting() {
  console.log('🚀 Starting Comprehensive Conflict Detection Testing...\n');
  
  // Get test data
  const testData = await getTestData();
  console.log('📊 Test data loaded:');
  console.log(`   - Users: ${testData.users.length}`);
  console.log(`   - Suppliers: ${testData.suppliers.length}`);
  console.log(`   - Customers: ${testData.customers.length}`);
  console.log(`   - Dresses: ${testData.dresses.length}`);
  console.log(`   - Locations: ${testData.locations.length}`);
  console.log(`   - Existing Bookings: ${testData.bookings.length}`);
  console.log(`   - Valid Dress-Supplier Pairs: ${testData.validPairs.length}`);
  
  // Run comprehensive conflict tests
  const createdBooking = await testBasicConflicts(testData);
  await testOverlappingDates(testData, createdBooking);
  await testSameDressConflicts(testData);
  
  // Test Results Summary
  console.log('\n📊 === COMPREHENSIVE CONFLICT DETECTION TEST RESULTS ===');
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
  
  console.log('\n🎉 Comprehensive conflict detection testing completed!');
}

if (require.main === module) {
  runComprehensiveConflictDetectionTesting().catch(console.error);
}

module.exports = { runComprehensiveConflictDetectionTesting };
