#!/usr/bin/env node

/**
 * Booked Slot Visibility Testing
 * Tests that booked time slots appear correctly in availability queries after appointment creation
 */

const fetch = require('node-fetch');
const { MongoClient } = require('mongodb');

const API_BASE = 'http://localhost:4002';
const MONGODB_URI = 'mongodb+srv://user:Mybookmodr100@cluster0.ey9u2ce.mongodb.net/bookdress?retryWrites=true&w=majority&appName=Cluster0';

let testResults = {
  passed: 0,
  failed: 0,
  issues: []
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

async function validateTest(testName, condition, errorMessage) {
  console.log(`\n🧪 ${testName}`);
  
  if (condition) {
    console.log(`   ✅ PASS: ${testName}`);
    testResults.passed++;
    return true;
  } else {
    console.log(`   ❌ FAIL: ${testName} - ${errorMessage}`);
    testResults.failed++;
    testResults.issues.push({
      test: testName,
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
  
  await client.close();
  
  const suppliers = users.filter(u => u.type === 'supplier');
  const customers = users.filter(u => u.type === 'user');
  
  return { users, dresses, locations, suppliers, customers };
}

async function testBookedSlotVisibility(testData) {
  console.log('\n⏰ === BOOKED SLOT VISIBILITY TESTING ===');
  
  if (testData.suppliers.length === 0 || testData.customers.length === 0 || 
      testData.dresses.length === 0 || testData.locations.length === 0) {
    console.log('⚠️ Insufficient data for booked slot visibility testing');
    return;
  }
  
  const supplier = testData.suppliers[0];
  const customer = testData.customers[0];
  const dress = testData.dresses.find(d => d.supplier.toString() === supplier._id.toString());
  const location = testData.locations[0];
  
  if (!dress) {
    console.log('⚠️ No dress found for supplier in booked slot testing');
    return;
  }
  
  const testDate = new Date(Date.now() + 1900 * 24 * 60 * 60 * 1000); // Future date
  const dateString = testDate.toISOString().split('T')[0];
  const testTimeSlot = '16:00-17:00';
  
  // Step 1: Check initial availability
  const initialAvailabilityResult = await makeRequest(
    'Check Initial Availability',
    `${API_BASE}/api/fitting-appointments/available-slots/${supplier._id}/${dateString}`
  );
  
  await validateTest(
    'Initial Availability Check',
    initialAvailabilityResult.success,
    'Should be able to check initial availability'
  );
  
  let initialBookedSlots = [];
  if (initialAvailabilityResult.success) {
    initialBookedSlots = initialAvailabilityResult.data.bookedSlots || [];
    console.log(`   📊 Initial booked slots:`, initialBookedSlots);
    console.log(`   📊 Initial available slots:`, initialAvailabilityResult.data.availableSlots?.length || 0);
  }
  
  // Step 2: Create an appointment
  const appointmentData = {
    supplier: supplier._id.toString(),
    customer: customer._id.toString(),
    dress: dress._id.toString(),
    location: location._id.toString(),
    appointmentDate: testDate.toISOString(),
    timeSlot: testTimeSlot,
    customerName: customer.fullName || 'Test Customer',
    customerPhone: customer.phone || '0591234567',
    customerEmail: customer.email || 'testcustomer@example.com',
    notes: 'Booked slot visibility test appointment'
  };
  
  const appointmentResult = await makeRequest(
    'Create Test Appointment',
    `${API_BASE}/api/fitting-appointments`,
    {
      method: 'POST',
      body: appointmentData
    }
  );
  
  await validateTest(
    'Test Appointment Creation',
    appointmentResult.success,
    'Should be able to create test appointment'
  );
  
  if (!appointmentResult.success) {
    console.log('⚠️ Cannot continue testing without successful appointment creation');
    return;
  }
  
  // Step 3: Wait a moment for database consistency
  console.log('   ⏳ Waiting for database consistency...');
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Step 4: Check availability after appointment creation
  const updatedAvailabilityResult = await makeRequest(
    'Check Availability After Appointment',
    `${API_BASE}/api/fitting-appointments/available-slots/${supplier._id}/${dateString}`
  );
  
  await validateTest(
    'Availability Check After Appointment',
    updatedAvailabilityResult.success,
    'Should be able to check availability after appointment creation'
  );
  
  if (updatedAvailabilityResult.success) {
    const updatedBookedSlots = updatedAvailabilityResult.data.bookedSlots || [];
    const updatedAvailableSlots = updatedAvailabilityResult.data.availableSlots || [];
    
    console.log(`   📊 Updated booked slots:`, updatedBookedSlots);
    console.log(`   📊 Updated available slots:`, updatedAvailableSlots.length);
    
    // Test 5: Verify the new slot appears in booked slots
    await validateTest(
      'New Slot Appears in Booked Slots',
      updatedBookedSlots.includes(testTimeSlot),
      `Time slot ${testTimeSlot} should appear in booked slots after appointment creation`
    );
    
    // Test 6: Verify the new slot is removed from available slots
    await validateTest(
      'New Slot Removed from Available Slots',
      !updatedAvailableSlots.includes(testTimeSlot),
      `Time slot ${testTimeSlot} should be removed from available slots after booking`
    );
    
    // Test 7: Verify booked slots count increased
    await validateTest(
      'Booked Slots Count Increased',
      updatedBookedSlots.length > initialBookedSlots.length,
      'Number of booked slots should increase after appointment creation'
    );
    
    // Test 8: Verify data consistency
    const totalSlots = updatedBookedSlots.length + updatedAvailableSlots.length;
    const expectedTotalSlots = 11; // Based on the time slots defined in the controller
    
    await validateTest(
      'Slot Data Consistency',
      totalSlots === expectedTotalSlots,
      `Total slots (${totalSlots}) should equal expected slots (${expectedTotalSlots})`
    );
  }
  
  // Step 9: Test immediate re-booking prevention
  const duplicateAppointmentResult = await makeRequest(
    'Try to Book Same Slot Again',
    `${API_BASE}/api/fitting-appointments`,
    {
      method: 'POST',
      body: {
        ...appointmentData,
        customerName: 'Different Customer',
        customerPhone: '0597654321',
        customerEmail: 'different@example.com'
      }
    }
  );
  
  await validateTest(
    'Duplicate Slot Booking Prevention',
    !duplicateAppointmentResult.success && duplicateAppointmentResult.status === 409,
    'Should prevent booking the same time slot twice with 409 conflict error'
  );
}

async function runBookedSlotVisibilityTest() {
  console.log('🚀 Starting Booked Slot Visibility Testing...\n');
  
  // Get test data
  const testData = await getTestData();
  console.log('📊 Test data loaded:');
  console.log(`   - Users: ${testData.users.length}`);
  console.log(`   - Suppliers: ${testData.suppliers.length}`);
  console.log(`   - Customers: ${testData.customers.length}`);
  console.log(`   - Dresses: ${testData.dresses.length}`);
  console.log(`   - Locations: ${testData.locations.length}`);
  
  // Run booked slot visibility tests
  await testBookedSlotVisibility(testData);
  
  // Test Results Summary
  console.log('\n📊 === BOOKED SLOT VISIBILITY TEST RESULTS ===');
  console.log(`✅ Total Tests Passed: ${testResults.passed}`);
  console.log(`❌ Total Tests Failed: ${testResults.failed}`);
  console.log(`📈 Success Rate: ${testResults.passed + testResults.failed > 0 ? ((testResults.passed / (testResults.passed + testResults.failed)) * 100).toFixed(1) : 0}%`);
  
  if (testResults.issues.length > 0) {
    console.log('\n🐛 === ISSUES FOUND ===');
    testResults.issues.forEach((issue, index) => {
      console.log(`\n${index + 1}. ${issue.test}`);
      if (issue.url) console.log(`   URL: ${issue.url}`);
      if (issue.status) console.log(`   Status: ${issue.status}`);
      console.log(`   Error: ${issue.error}`);
    });
  }
  
  console.log('\n🎉 Booked slot visibility testing completed!');
  
  if (testResults.failed === 0) {
    console.log('\n✅ All booked slot visibility tests passed!');
    console.log('🔧 Real-time slot availability updates are working correctly.');
  } else {
    console.log('\n⚠️ Some issues were found. Please review the results above.');
  }
}

if (require.main === module) {
  runBookedSlotVisibilityTest().catch(console.error);
}

module.exports = { runBookedSlotVisibilityTest };
