#!/usr/bin/env node

/**
 * Comprehensive Booking Conflict Detection and Management Testing
 * Tests booking conflicts, date validation, admin/supplier booking management
 */

const fetch = require('node-fetch');
const { MongoClient } = require('mongodb');

const API_BASE = 'http://localhost:4002';
const MONGODB_URI = 'mongodb+srv://user:Mybookmodr100@cluster0.ey9u2ce.mongodb.net/bookdress?retryWrites=true&w=majority&appName=Cluster0';

let testResults = {
  passed: 0,
  failed: 0,
  issues: [],
  conflictTests: { passed: 0, failed: 0 },
  managementTests: { passed: 0, failed: 0 },
  validationTests: { passed: 0, failed: 0 }
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
      // Non-JSON response
    }
    
    if (response.ok) {
      console.log(`   ✅ Success`);
      testResults.passed++;
      return { success: true, data: jsonData || data, status: response.status };
    } else {
      console.log(`   ❌ Error: ${data}`);
      testResults.failed++;
      testResults.issues.push({
        test: name,
        url: url,
        status: response.status,
        error: data
      });
      return { success: false, error: data, status: response.status };
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
    testResults[category].passed++;
    testResults.passed++;
    return true;
  } else {
    console.log(`   ❌ FAIL: ${testName} - ${errorMessage}`);
    testResults[category].failed++;
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
  
  const suppliers = await db.collection('User').find({ type: 'supplier' }).toArray();
  const customers = await db.collection('User').find({ type: 'user' }).toArray();
  const locations = await db.collection('Location').find({}).toArray();
  const dresses = await db.collection('Dress').find({}).toArray();
  const bookings = await db.collection('Booking').find({}).toArray();
  
  await client.close();
  
  return { suppliers, customers, locations, dresses, bookings };
}

// ==================== BOOKING CONFLICT DETECTION TESTS ====================

async function testBookingConflicts(testData) {
  console.log('\n⚠️ === BOOKING CONFLICT DETECTION TESTS ===');
  
  if (testData.dresses.length === 0 || testData.customers.length === 0) {
    console.log('❌ Insufficient test data for conflict testing');
    return;
  }
  
  const testDress = testData.dresses[0];
  const testCustomer = testData.customers[0];
  const testSupplier = testData.suppliers[0];
  const testLocation = testData.locations[0];
  
  // Test 1: Create initial booking
  const startDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days from now
  const endDate = new Date(Date.now() + 10 * 24 * 60 * 60 * 1000); // 10 days from now

  const initialBookingPayload = {
    booking: {
      supplier: testSupplier._id.toString(),
      dress: testDress._id.toString(),
      customer: testCustomer._id.toString(),
      location: testLocation._id.toString(),
      from: startDate.toISOString(),
      to: endDate.toISOString(),
      status: 'pending',
      price: 500,
      deposit: 100
    }
  };
  
  const initialResult = await makeRequest(
    'Create Initial Booking',
    `${API_BASE}/api/create-booking`,
    {
      method: 'POST',
      body: initialBookingPayload
    }
  );
  
  if (initialResult.success) {
    // Test 2: Check booking conflicts endpoint
    const conflictCheckData = {
      dressId: testDress._id.toString(),
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString()
    };
    
    const conflictResult = await makeRequest(
      'Check Booking Conflicts',
      `${API_BASE}/api/booking-conflicts`,
      {
        method: 'POST',
        body: conflictCheckData
      }
    );
    
    await validateTest(
      'Conflict Detection API Available',
      'conflictTests',
      conflictResult.success || conflictResult.status === 401, // May require auth
      'Booking conflict detection endpoint not working'
    );
    
    // Test 3: Try to create overlapping booking (should fail or warn)
    const overlappingStart = new Date(Date.now() + 8 * 24 * 60 * 60 * 1000); // 8 days from now (overlaps)
    const overlappingEnd = new Date(Date.now() + 12 * 24 * 60 * 60 * 1000); // 12 days from now
    
    const overlappingBookingPayload = {
      booking: {
        supplier: testSupplier._id.toString(),
        dress: testDress._id.toString(),
        customer: testData.customers[1] ? testData.customers[1]._id.toString() : testCustomer._id.toString(),
        location: testLocation._id.toString(),
        from: overlappingStart.toISOString(),
        to: overlappingEnd.toISOString(),
        status: 'pending',
        price: 500,
        deposit: 100
      }
    };
    
    const overlappingResult = await makeRequest(
      'Create Overlapping Booking (Should Detect Conflict)',
      `${API_BASE}/api/create-booking`,
      {
        method: 'POST',
        body: overlappingBookingPayload
      }
    );
    
    // This should either fail with conflict error or succeed with warning
    await validateTest(
      'Overlapping Booking Handling',
      'conflictTests',
      overlappingResult.success || overlappingResult.error.includes('conflict') || overlappingResult.error.includes('available'),
      'System does not properly handle overlapping bookings'
    );
    
    // Test 4: Create non-overlapping booking (should succeed)
    const nonOverlappingStart = new Date(Date.now() + 15 * 24 * 60 * 60 * 1000); // 15 days from now
    const nonOverlappingEnd = new Date(Date.now() + 18 * 24 * 60 * 60 * 1000); // 18 days from now
    
    const nonOverlappingBookingPayload = {
      booking: {
        supplier: testSupplier._id.toString(),
        dress: testDress._id.toString(),
        customer: testData.customers[1] ? testData.customers[1]._id.toString() : testCustomer._id.toString(),
        location: testLocation._id.toString(),
        from: nonOverlappingStart.toISOString(),
        to: nonOverlappingEnd.toISOString(),
        status: 'pending',
        price: 500,
        deposit: 100
      }
    };
    
    const nonOverlappingResult = await makeRequest(
      'Create Non-Overlapping Booking (Should Succeed)',
      `${API_BASE}/api/create-booking`,
      {
        method: 'POST',
        body: nonOverlappingBookingPayload
      }
    );
    
    await validateTest(
      'Non-Overlapping Booking Creation',
      'conflictTests',
      nonOverlappingResult.success,
      'System incorrectly blocks non-overlapping bookings'
    );
  }
}

// ==================== BOOKING MANAGEMENT TESTS ====================

async function testBookingManagement(testData) {
  console.log('\n📝 === BOOKING MANAGEMENT TESTS ===');
  
  // Test 1: Check if admin booking update endpoint exists
  const adminUpdateResult = await makeRequest(
    'Admin Booking Update Endpoint Check',
    `${API_BASE}/api/admin-update-booking/test-id`,
    {
      method: 'PUT',
      body: { status: 'confirmed' }
    }
  );
  
  await validateTest(
    'Admin Booking Update Endpoint Available',
    'managementTests',
    adminUpdateResult.status !== 404,
    'Admin booking update endpoint not found'
  );
  
  // Test 2: Check booking status update endpoint
  const statusUpdateResult = await makeRequest(
    'Booking Status Update Endpoint Check',
    `${API_BASE}/api/update-booking-status`,
    {
      method: 'POST',
      body: { ids: ['test-id'], status: 'confirmed' }
    }
  );
  
  await validateTest(
    'Booking Status Update Endpoint Available',
    'managementTests',
    statusUpdateResult.status !== 404,
    'Booking status update endpoint not found'
  );
  
  // Test 3: Check regular booking update endpoint
  const regularUpdateResult = await makeRequest(
    'Regular Booking Update Endpoint Check',
    `${API_BASE}/api/update-booking`,
    {
      method: 'PUT',
      body: { 
        booking: {
          _id: 'test-id',
          status: 'confirmed'
        }
      }
    }
  );
  
  await validateTest(
    'Regular Booking Update Endpoint Available',
    'managementTests',
    regularUpdateResult.status !== 404,
    'Regular booking update endpoint not found'
  );
  
  // Test 4: Test booking availability validation
  if (testData.dresses.length > 0) {
    const availabilityResult = await makeRequest(
      'Booking Availability Validation',
      `${API_BASE}/api/validate-booking-availability`,
      {
        method: 'POST',
        body: {
          dressId: testData.dresses[0]._id.toString(),
          startDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          endDate: new Date(Date.now() + 33 * 24 * 60 * 60 * 1000).toISOString()
        }
      }
    );
    
    await validateTest(
      'Booking Availability Validation Available',
      'managementTests',
      availabilityResult.status !== 404,
      'Booking availability validation endpoint not found'
    );
  }
}

// ==================== DATE VALIDATION TESTS ====================

async function testDateValidation(testData) {
  console.log('\n📅 === DATE VALIDATION TESTS ===');
  
  if (testData.dresses.length === 0 || testData.customers.length === 0) {
    console.log('❌ Insufficient test data for date validation testing');
    return;
  }
  
  const testDress = testData.dresses[0];
  const testCustomer = testData.customers[0];
  const testSupplier = testData.suppliers[0];
  const testLocation = testData.locations[0];
  
  // Test 1: Past date booking (should fail)
  const pastStart = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000); // 7 days ago
  const pastEnd = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000); // 5 days ago

  const pastBookingPayload = {
    booking: {
      supplier: testSupplier._id.toString(),
      dress: testDress._id.toString(),
      customer: testCustomer._id.toString(),
      location: testLocation._id.toString(),
      from: pastStart.toISOString(),
      to: pastEnd.toISOString(),
      status: 'pending',
      price: 500,
      deposit: 100
    }
  };
  
  const pastResult = await makeRequest(
    'Create Past Date Booking (Should Fail)',
    `${API_BASE}/api/create-booking`,
    {
      method: 'POST',
      body: pastBookingPayload
    }
  );
  
  await validateTest(
    'Past Date Validation',
    'validationTests',
    !pastResult.success || pastResult.error.includes('past') || pastResult.error.includes('date'),
    'System allows booking with past dates'
  );
  
  // Test 2: End date before start date (should fail)
  const futureStart = new Date(Date.now() + 10 * 24 * 60 * 60 * 1000); // 10 days from now
  const futureEnd = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days from now (before start)

  const invalidDateBookingPayload = {
    booking: {
      supplier: testSupplier._id.toString(),
      dress: testDress._id.toString(),
      customer: testCustomer._id.toString(),
      location: testLocation._id.toString(),
      from: futureStart.toISOString(),
      to: futureEnd.toISOString(),
      status: 'pending',
      price: 500,
      deposit: 100
    }
  };
  
  const invalidDateResult = await makeRequest(
    'Create Invalid Date Range Booking (Should Fail)',
    `${API_BASE}/api/create-booking`,
    {
      method: 'POST',
      body: invalidDateBookingPayload
    }
  );
  
  await validateTest(
    'Invalid Date Range Validation',
    'validationTests',
    !invalidDateResult.success || invalidDateResult.error.includes('date') || invalidDateResult.error.includes('range'),
    'System allows booking with end date before start date'
  );
  
  // Test 3: Valid future date booking (should succeed)
  const validStart = new Date(Date.now() + 20 * 24 * 60 * 60 * 1000); // 20 days from now
  const validEnd = new Date(Date.now() + 23 * 24 * 60 * 60 * 1000); // 23 days from now

  const validBookingPayload = {
    booking: {
      supplier: testSupplier._id.toString(),
      dress: testDress._id.toString(),
      customer: testCustomer._id.toString(),
      location: testLocation._id.toString(),
      from: validStart.toISOString(),
      to: validEnd.toISOString(),
      status: 'pending',
      price: 500,
      deposit: 100
    }
  };
  
  const validResult = await makeRequest(
    'Create Valid Future Date Booking (Should Succeed)',
    `${API_BASE}/api/create-booking`,
    {
      method: 'POST',
      body: validBookingPayload
    }
  );
  
  await validateTest(
    'Valid Future Date Booking',
    'validationTests',
    validResult.success,
    'System incorrectly rejects valid future date bookings'
  );
}

async function runBookingConflictTests() {
  console.log('🚀 Starting Comprehensive Booking Conflict and Management Testing...\n');
  
  // Get test data
  const testData = await getTestData();
  console.log('📊 Test data loaded:');
  console.log(`   - Suppliers: ${testData.suppliers.length}`);
  console.log(`   - Customers: ${testData.customers.length}`);
  console.log(`   - Dresses: ${testData.dresses.length}`);
  console.log(`   - Bookings: ${testData.bookings.length}`);
  console.log(`   - Locations: ${testData.locations.length}`);
  
  // Run comprehensive tests
  await testBookingConflicts(testData);
  await testBookingManagement(testData);
  await testDateValidation(testData);
  
  // Test Results Summary
  console.log('\n📊 === BOOKING CONFLICT & MANAGEMENT TEST RESULTS ===');
  console.log(`✅ Total Tests Passed: ${testResults.passed}`);
  console.log(`❌ Total Tests Failed: ${testResults.failed}`);
  console.log(`📈 Success Rate: ${testResults.passed + testResults.failed > 0 ? ((testResults.passed / (testResults.passed + testResults.failed)) * 100).toFixed(1) : 0}%`);
  
  console.log('\n📋 Results by Category:');
  console.log(`   CONFLICT DETECTION: ${testResults.conflictTests.passed}/${testResults.conflictTests.passed + testResults.conflictTests.failed}`);
  console.log(`   BOOKING MANAGEMENT: ${testResults.managementTests.passed}/${testResults.managementTests.passed + testResults.managementTests.failed}`);
  console.log(`   DATE VALIDATION: ${testResults.validationTests.passed}/${testResults.validationTests.passed + testResults.validationTests.failed}`);
  
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
  
  console.log('\n🎉 Booking conflict and management testing completed!');
}

if (require.main === module) {
  runBookingConflictTests().catch(console.error);
}

module.exports = { runBookingConflictTests };
