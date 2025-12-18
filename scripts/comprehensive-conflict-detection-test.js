#!/usr/bin/env node

/**
 * Comprehensive Conflict Detection Testing
 * Tests both booking and fitting appointment conflict detection to ensure 100% accuracy
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
    bookingConflicts: { passed: 0, failed: 0 },
    fittingConflicts: { passed: 0, failed: 0 },
    preventionTests: { passed: 0, failed: 0 },
    edgeCases: { passed: 0, failed: 0 }
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
      // Non-JSON response
    }
    
    if (response.ok) {
      console.log(`   ✅ Success`);
      testResults.passed++;
      return { success: true, data: jsonData || data, status: response.status };
    } else {
      console.log(`   ❌ Error: ${response.status}`);
      if (jsonData && jsonData.error) {
        console.log(`   Details: ${jsonData.error}`);
      }
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

  const suppliers = await db.collection('User').find({ type: 'supplier' }).toArray();
  const customers = await db.collection('User').find({ type: 'user' }).toArray();
  const locations = await db.collection('Location').find({}).toArray();
  const dresses = await db.collection('Dress').find({}).toArray();
  const bookings = await db.collection('Booking').find({}).toArray();
  const fittingAppointments = await db.collection('FittingAppointment').find({}).toArray();

  await client.close();

  // Find valid dress-supplier pairs
  const validPairs = [];
  dresses.forEach(dress => {
    const supplier = suppliers.find(s => s._id.toString() === dress.supplier.toString());
    if (supplier) {
      validPairs.push({ dress, supplier });
    }
  });

  return { suppliers, customers, locations, dresses, bookings, fittingAppointments, validPairs };
}

// ==================== BOOKING CONFLICT DETECTION TESTS ====================

async function testBookingConflictDetection(testData) {
  console.log('\n📅 === BOOKING CONFLICT DETECTION TESTS ===');

  if (testData.suppliers.length === 0 || testData.customers.length === 0 || testData.dresses.length === 0 || testData.locations.length === 0 || testData.validPairs.length === 0) {
    console.log('❌ Insufficient test data for booking conflict tests');
    return;
  }

  // Use a valid dress-supplier pair
  const validPair = testData.validPairs[0];
  const testDress = validPair.dress;
  const testSupplier = validPair.supplier;
  const testCustomer = testData.customers[0];
  const testLocation = testData.locations[0];
  
  // Test 1: Create initial booking - use very far future dates to avoid existing conflicts
  const baseDate = new Date(Date.now() + 400 * 24 * 60 * 60 * 1000); // 400 days from now (over 1 year)
  const initialBooking = {
    booking: {
      supplier: testSupplier._id.toString(),
      dress: testDress._id.toString(),
      customer: testCustomer._id.toString(),
      location: testLocation._id.toString(),
      from: new Date(baseDate.getTime()).toISOString(),
      to: new Date(baseDate.getTime() + 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days
      status: 'pending',
      price: 800,
      deposit: 160
    }
  };
  
  const createResult = await makeRequest(
    'Create Initial Booking',
    `${API_BASE}/api/create-booking`,
    {
      method: 'POST',
      body: initialBooking
    }
  );
  
  await validateTest(
    'Initial Booking Creation',
    'bookingConflicts',
    createResult.success,
    'Failed to create initial booking for conflict testing'
  );
  
  let createdBookingId = null;
  if (createResult.success && createResult.data && createResult.data._id) {
    createdBookingId = createResult.data._id;
  }
  
  // Test 2: Try to create overlapping booking (should fail)
  const overlappingBooking = {
    booking: {
      supplier: testSupplier._id.toString(),
      dress: testDress._id.toString(),
      customer: testData.customers[1] ? testData.customers[1]._id.toString() : testCustomer._id.toString(),
      location: testLocation._id.toString(),
      from: new Date(baseDate.getTime() + 1 * 24 * 60 * 60 * 1000).toISOString(), // 1 day later (overlaps)
      to: new Date(baseDate.getTime() + 4 * 24 * 60 * 60 * 1000).toISOString(), // 4 days
      status: 'pending',
      price: 800,
      deposit: 160
    }
  };
  
  const conflictResult = await makeRequest(
    'Create Overlapping Booking (Should Fail)',
    `${API_BASE}/api/create-booking`,
    {
      method: 'POST',
      body: overlappingBooking
    }
  );
  
  await validateTest(
    'Booking Conflict Prevention',
    'preventionTests',
    !conflictResult.success && (
      conflictResult.status === 409 ||
      conflictResult.status === 400 ||
      (typeof conflictResult.error === 'string' && conflictResult.error.includes('not available')) ||
      (conflictResult.data && conflictResult.data.error && conflictResult.data.error.message && conflictResult.data.error.message.includes('not available'))
    ),
    `Overlapping booking was allowed when it should be prevented. Status: ${conflictResult.status}, Error: ${JSON.stringify(conflictResult.error)}`
  );
  
  // Test 3: Create non-overlapping booking (should succeed)
  const nonOverlappingBooking = {
    booking: {
      supplier: testSupplier._id.toString(),
      dress: testDress._id.toString(),
      customer: testData.customers[1] ? testData.customers[1]._id.toString() : testCustomer._id.toString(),
      location: testLocation._id.toString(),
      from: new Date(baseDate.getTime() + 10 * 24 * 60 * 60 * 1000).toISOString(), // 10 days later (no overlap)
      to: new Date(baseDate.getTime() + 13 * 24 * 60 * 60 * 1000).toISOString(), // 13 days
      status: 'pending',
      price: 800,
      deposit: 160
    }
  };
  
  const nonOverlapResult = await makeRequest(
    'Create Non-Overlapping Booking (Should Succeed)',
    `${API_BASE}/api/create-booking`,
    {
      method: 'POST',
      body: nonOverlappingBooking
    }
  );
  
  await validateTest(
    'Non-Overlapping Booking Creation',
    'bookingConflicts',
    nonOverlapResult.success,
    'Non-overlapping booking was rejected when it should be allowed'
  );
  
  // Test 4: Test booking availability validation endpoint
  const availabilityCheck = await makeRequest(
    'Check Booking Availability (Conflicting Dates)',
    `${API_BASE}/api/validate-booking-availability`,
    {
      method: 'POST',
      body: {
        dressId: testDress._id.toString(),
        startDate: new Date(baseDate.getTime() + 1 * 24 * 60 * 60 * 1000).toISOString(),
        endDate: new Date(baseDate.getTime() + 4 * 24 * 60 * 60 * 1000).toISOString()
      }
    }
  );
  
  await validateTest(
    'Booking Availability Check (Conflicting)',
    'bookingConflicts',
    availabilityCheck.success && availabilityCheck.data && !availabilityCheck.data.available,
    'Availability check should show dress as unavailable for conflicting dates'
  );
  
  // Test 5: Test booking availability for free dates
  const freeAvailabilityCheck = await makeRequest(
    'Check Booking Availability (Free Dates)',
    `${API_BASE}/api/validate-booking-availability`,
    {
      method: 'POST',
      body: {
        dressId: testDress._id.toString(),
        startDate: new Date(baseDate.getTime() + 20 * 24 * 60 * 60 * 1000).toISOString(),
        endDate: new Date(baseDate.getTime() + 23 * 24 * 60 * 60 * 1000).toISOString()
      }
    }
  );
  
  await validateTest(
    'Booking Availability Check (Free Dates)',
    'bookingConflicts',
    freeAvailabilityCheck.success && freeAvailabilityCheck.data && freeAvailabilityCheck.data.available,
    'Availability check should show dress as available for free dates'
  );
  
  // Test 6: Test booking conflicts endpoint
  const conflictsCheck = await makeRequest(
    'Get Booking Conflicts',
    `${API_BASE}/api/booking-conflicts`,
    {
      method: 'POST',
      body: {
        dressId: testDress._id.toString(),
        startDate: new Date(baseDate.getTime() + 1 * 24 * 60 * 60 * 1000).toISOString(),
        endDate: new Date(baseDate.getTime() + 4 * 24 * 60 * 60 * 1000).toISOString()
      }
    }
  );
  
  await validateTest(
    'Booking Conflicts Endpoint',
    'bookingConflicts',
    conflictsCheck.success && Array.isArray(conflictsCheck.data) && conflictsCheck.data.length > 0,
    'Booking conflicts endpoint should return existing conflicts'
  );
}

// ==================== FITTING APPOINTMENT CONFLICT DETECTION TESTS ====================

async function testFittingAppointmentConflictDetection(testData) {
  console.log('\n👗 === FITTING APPOINTMENT CONFLICT DETECTION TESTS ===');

  if (testData.suppliers.length === 0 || testData.customers.length === 0 || testData.dresses.length === 0 || testData.locations.length === 0 || testData.validPairs.length === 0) {
    console.log('❌ Insufficient test data for fitting appointment conflict tests');
    return;
  }

  // Use a valid dress-supplier pair
  const validPair = testData.validPairs[0];
  const testDress = validPair.dress;
  const testSupplier = validPair.supplier;
  const testCustomer = testData.customers[0];
  const testLocation = testData.locations[0];
  
  // Test 1: Create initial fitting appointment
  const appointmentDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days from now
  const initialAppointment = {
    dress: testDress._id.toString(),
    supplier: testSupplier._id.toString(),
    location: testLocation._id.toString(),
    customer: testCustomer._id.toString(), // Add customer ID
    appointmentDate: appointmentDate.toISOString(),
    timeSlot: '10:00-11:00',
    customerName: testCustomer.fullName || 'Test Customer',
    customerPhone: testCustomer.phone || '0599123456',
    customerEmail: testCustomer.email || 'test@example.com',
    notes: 'Initial fitting appointment for conflict testing'
  };
  
  const createAppointmentResult = await makeRequest(
    'Create Initial Fitting Appointment',
    `${API_BASE}/api/fitting-appointments`,
    {
      method: 'POST',
      body: initialAppointment
    }
  );
  
  await validateTest(
    'Initial Fitting Appointment Creation',
    'fittingConflicts',
    createAppointmentResult.success,
    'Failed to create initial fitting appointment for conflict testing'
  );
  
  // Test 2: Try to create conflicting appointment (same supplier, date, time slot)
  const conflictingAppointment = {
    dress: testData.dresses[1] ? testData.dresses[1]._id.toString() : testDress._id.toString(),
    supplier: testSupplier._id.toString(),
    location: testLocation._id.toString(),
    customer: testData.customers[1] ? testData.customers[1]._id.toString() : testCustomer._id.toString(), // Add customer ID
    appointmentDate: appointmentDate.toISOString(),
    timeSlot: '10:00-11:00', // Same time slot
    customerName: 'Another Customer',
    customerPhone: '0599654321',
    customerEmail: 'another@example.com',
    notes: 'Conflicting appointment'
  };
  
  const appointmentConflictResult = await makeRequest(
    'Create Conflicting Fitting Appointment (Should Fail)',
    `${API_BASE}/api/fitting-appointments`,
    {
      method: 'POST',
      body: conflictingAppointment
    }
  );
  
  await validateTest(
    'Fitting Appointment Conflict Prevention',
    'preventionTests',
    !appointmentConflictResult.success && (appointmentConflictResult.status === 409 || (typeof appointmentConflictResult.error === 'string' && appointmentConflictResult.error.includes('already booked'))),
    `Conflicting fitting appointment was allowed when it should be prevented. Status: ${appointmentConflictResult.status}, Error: ${JSON.stringify(appointmentConflictResult.error)}`
  );
  
  // Test 3: Create non-conflicting appointment (different time slot)
  const nonConflictingAppointment = {
    dress: testData.dresses[1] ? testData.dresses[1]._id.toString() : testDress._id.toString(),
    supplier: testSupplier._id.toString(),
    location: testLocation._id.toString(),
    customer: testData.customers[1] ? testData.customers[1]._id.toString() : testCustomer._id.toString(), // Add customer ID
    appointmentDate: appointmentDate.toISOString(),
    timeSlot: '11:00-12:00', // Different time slot
    customerName: 'Another Customer',
    customerPhone: '0599654321',
    customerEmail: 'another@example.com',
    notes: 'Non-conflicting appointment'
  };
  
  const nonConflictAppointmentResult = await makeRequest(
    'Create Non-Conflicting Fitting Appointment (Should Succeed)',
    `${API_BASE}/api/fitting-appointments`,
    {
      method: 'POST',
      body: nonConflictingAppointment
    }
  );
  
  await validateTest(
    'Non-Conflicting Fitting Appointment Creation',
    'fittingConflicts',
    nonConflictAppointmentResult.success,
    'Non-conflicting fitting appointment was rejected when it should be allowed'
  );
  
  // Test 4: Test available time slots endpoint
  const availableSlotsResult = await makeRequest(
    'Get Available Time Slots',
    `${API_BASE}/api/fitting-appointments/available-slots/${testSupplier._id.toString()}/${appointmentDate.toISOString().split('T')[0]}`
  );
  
  await validateTest(
    'Available Time Slots Endpoint',
    'fittingConflicts',
    availableSlotsResult.success && availableSlotsResult.data && Array.isArray(availableSlotsResult.data.availableSlots),
    'Available time slots endpoint should return available slots'
  );
  
  // Verify that booked slots are not in available slots
  if (availableSlotsResult.success && availableSlotsResult.data) {
    const bookedSlots = availableSlotsResult.data.bookedSlots || [];
    const availableSlots = availableSlotsResult.data.availableSlots || [];
    
    await validateTest(
      'Booked Slots Excluded from Available',
      'fittingConflicts',
      bookedSlots.includes('10:00-11:00') && !availableSlots.includes('10:00-11:00'),
      'Booked time slots should not appear in available slots'
    );
  }
}

// ==================== EDGE CASES TESTING ====================

async function testEdgeCases(testData) {
  console.log('\n🔬 === EDGE CASES TESTING ===');

  if (testData.suppliers.length === 0 || testData.customers.length === 0 || testData.dresses.length === 0 || testData.locations.length === 0 || testData.validPairs.length === 0) {
    console.log('❌ Insufficient test data for edge case tests');
    return;
  }

  // Use a valid dress-supplier pair
  const validPair = testData.validPairs[0];
  const testDress = validPair.dress;
  const testSupplier = validPair.supplier;
  const testCustomer = testData.customers[0];
  const testLocation = testData.locations[0];
  
  // Test 1: Same-day booking conflict (start and end on same day)
  const sameDay = new Date(Date.now() + 450 * 24 * 60 * 60 * 1000); // 450 days from now
  const sameDayBooking1 = {
    booking: {
      supplier: testSupplier._id.toString(),
      dress: testDress._id.toString(),
      customer: testCustomer._id.toString(),
      location: testLocation._id.toString(),
      from: new Date(sameDay.getTime()).toISOString(),
      to: new Date(sameDay.getTime() + 12 * 60 * 60 * 1000).toISOString(), // 12 hours later
      status: 'pending',
      price: 400,
      deposit: 80
    }
  };
  
  const sameDayResult1 = await makeRequest(
    'Create Same-Day Booking 1',
    `${API_BASE}/api/create-booking`,
    {
      method: 'POST',
      body: sameDayBooking1
    }
  );
  
  // Try to create another booking on the same day (should conflict)
  const sameDayBooking2 = {
    booking: {
      supplier: testSupplier._id.toString(),
      dress: testDress._id.toString(),
      customer: testData.customers[1] ? testData.customers[1]._id.toString() : testCustomer._id.toString(),
      location: testLocation._id.toString(),
      from: new Date(sameDay.getTime() + 6 * 60 * 60 * 1000).toISOString(), // 6 hours later (overlaps)
      to: new Date(sameDay.getTime() + 18 * 60 * 60 * 1000).toISOString(), // 18 hours later
      status: 'pending',
      price: 400,
      deposit: 80
    }
  };
  
  const sameDayResult2 = await makeRequest(
    'Create Same-Day Booking 2 (Should Conflict)',
    `${API_BASE}/api/create-booking`,
    {
      method: 'POST',
      body: sameDayBooking2
    }
  );
  
  await validateTest(
    'Same-Day Booking Conflict Detection',
    'edgeCases',
    sameDayResult1.success && !sameDayResult2.success,
    'Same-day booking conflicts not properly detected'
  );
  
  // Test 2: Adjacent bookings (should not conflict)
  const adjacentBooking = {
    booking: {
      supplier: testSupplier._id.toString(),
      dress: testDress._id.toString(),
      customer: testData.customers[1] ? testData.customers[1]._id.toString() : testCustomer._id.toString(),
      location: testLocation._id.toString(),
      from: new Date(sameDay.getTime() + 12 * 60 * 60 * 1000).toISOString(), // Starts exactly when first ends
      to: new Date(sameDay.getTime() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours later
      status: 'pending',
      price: 400,
      deposit: 80
    }
  };
  
  const adjacentResult = await makeRequest(
    'Create Adjacent Booking (Should Succeed)',
    `${API_BASE}/api/create-booking`,
    {
      method: 'POST',
      body: adjacentBooking
    }
  );
  
  await validateTest(
    'Adjacent Booking Handling',
    'edgeCases',
    adjacentResult.success,
    'Adjacent bookings should be allowed (no overlap)'
  );
  
  // Test 3: Past date validation
  const pastBooking = {
    booking: {
      supplier: testSupplier._id.toString(),
      dress: testDress._id.toString(),
      customer: testCustomer._id.toString(),
      location: testLocation._id.toString(),
      from: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // Yesterday
      to: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(), // 12 hours ago
      status: 'pending',
      price: 400,
      deposit: 80
    }
  };
  
  const pastResult = await makeRequest(
    'Create Past Date Booking (Should Fail)',
    `${API_BASE}/api/create-booking`,
    {
      method: 'POST',
      body: pastBooking
    }
  );
  
  await validateTest(
    'Past Date Validation',
    'edgeCases',
    !pastResult.success,
    'Past date bookings should be rejected'
  );
}

async function runComprehensiveConflictDetectionTests() {
  console.log('🚀 Starting Comprehensive Conflict Detection Testing...\n');
  
  // Get test data
  const testData = await getTestData();
  console.log('📊 Test data loaded:');
  console.log(`   - Suppliers: ${testData.suppliers.length}`);
  console.log(`   - Customers: ${testData.customers.length}`);
  console.log(`   - Dresses: ${testData.dresses.length}`);
  console.log(`   - Bookings: ${testData.bookings.length}`);
  console.log(`   - Locations: ${testData.locations.length}`);
  console.log(`   - Fitting Appointments: ${testData.fittingAppointments.length}`);
  
  // Run comprehensive tests
  await testBookingConflictDetection(testData);
  await testFittingAppointmentConflictDetection(testData);
  await testEdgeCases(testData);
  
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
  runComprehensiveConflictDetectionTests().catch(console.error);
}

module.exports = { runComprehensiveConflictDetectionTests };
