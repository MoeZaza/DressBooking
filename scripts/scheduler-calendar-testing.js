#!/usr/bin/env node

/**
 * Comprehensive Scheduler and Calendar Testing
 * Tests calendar functionality, scheduling conflicts, availability management, and time slot management
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
    calendarAccess: { passed: 0, failed: 0 },
    availabilityChecking: { passed: 0, failed: 0 },
    timeSlotManagement: { passed: 0, failed: 0 },
    schedulingConflicts: { passed: 0, failed: 0 },
    dateRangeQueries: { passed: 0, failed: 0 },
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
  const fittingAppointments = await db.collection('FittingAppointment').find({}).toArray();
  
  await client.close();
  
  const suppliers = users.filter(u => u.type === 'supplier');
  const customers = users.filter(u => u.type === 'user');
  const admins = users.filter(u => u.type === 'admin');
  
  return { users, dresses, locations, bookings, fittingAppointments, suppliers, customers, admins };
}

// ==================== CALENDAR ACCESS TESTING ====================

async function testCalendarAccess(testData) {
  console.log('\n📅 === CALENDAR ACCESS TESTING ===');
  
  if (testData.suppliers.length === 0) {
    console.log('⚠️ No suppliers available for calendar testing');
    return;
  }
  
  const supplier = testData.suppliers[0];
  const testDate = new Date(Date.now() + 1500 * 24 * 60 * 60 * 1000);
  const dateString = testDate.toISOString().split('T')[0]; // YYYY-MM-DD format
  
  // Test 1: Get Supplier Calendar
  const calendarResult = await makeRequest(
    'Get Supplier Calendar',
    `${API_BASE}/api/fitting-appointments/supplier/${supplier._id}`
  );
  
  await validateTest(
    'Supplier Calendar Access',
    'calendarAccess',
    calendarResult.success,
    'Supplier calendar should be accessible'
  );
  
  // Test 2: Get Calendar for Specific Date
  const dateCalendarResult = await makeRequest(
    'Get Calendar for Specific Date',
    `${API_BASE}/api/fitting-appointments/supplier/${supplier._id}?date=${dateString}`
  );
  
  await validateTest(
    'Date-Specific Calendar Access',
    'calendarAccess',
    dateCalendarResult.success,
    'Date-specific calendar should be accessible'
  );
  
  // Test 3: Get Monthly Calendar View
  const monthlyCalendarResult = await makeRequest(
    'Get Monthly Calendar View',
    `${API_BASE}/api/fitting-appointments/supplier/${supplier._id}?month=${testDate.getMonth() + 1}&year=${testDate.getFullYear()}`
  );
  
  await validateTest(
    'Monthly Calendar View',
    'calendarAccess',
    monthlyCalendarResult.success,
    'Monthly calendar view should be accessible'
  );
}

// ==================== AVAILABILITY CHECKING TESTING ====================

async function testAvailabilityChecking(testData) {
  console.log('\n🕐 === AVAILABILITY CHECKING TESTING ===');
  
  if (testData.suppliers.length === 0) {
    console.log('⚠️ No suppliers available for availability testing');
    return;
  }
  
  const supplier = testData.suppliers[0];
  const testDate = new Date(Date.now() + 1510 * 24 * 60 * 60 * 1000);
  const dateString = testDate.toISOString().split('T')[0];
  
  // Test 1: Get Available Time Slots
  const availableSlotsResult = await makeRequest(
    'Get Available Time Slots',
    `${API_BASE}/api/fitting-appointments/available-slots/${supplier._id}/${dateString}`
  );
  
  await validateTest(
    'Available Time Slots Retrieval',
    'availabilityChecking',
    availableSlotsResult.success,
    'Available time slots should be retrievable'
  );
  
  if (availableSlotsResult.success) {
    const slotsData = availableSlotsResult.data;
    
    await validateTest(
      'Time Slots Data Structure',
      'availabilityChecking',
      slotsData && (slotsData.availableSlots || slotsData.bookedSlots !== undefined),
      'Time slots data should have proper structure'
    );
  }
  
  // Test 2: Check Multiple Dates Availability
  const futureDates = [];
  for (let i = 1; i <= 3; i++) {
    const futureDate = new Date(Date.now() + (1510 + i) * 24 * 60 * 60 * 1000);
    futureDates.push(futureDate.toISOString().split('T')[0]);
  }
  
  let multiDateSuccess = 0;
  for (const date of futureDates) {
    const dateAvailabilityResult = await makeRequest(
      `Check Availability for ${date}`,
      `${API_BASE}/api/fitting-appointments/available-slots/${supplier._id}/${date}`
    );
    
    if (dateAvailabilityResult.success) {
      multiDateSuccess++;
    }
  }
  
  await validateTest(
    'Multiple Dates Availability Check',
    'availabilityChecking',
    multiDateSuccess >= 2,
    'Should be able to check availability for multiple dates'
  );
}

// ==================== TIME SLOT MANAGEMENT TESTING ====================

async function testTimeSlotManagement(testData) {
  console.log('\n⏰ === TIME SLOT MANAGEMENT TESTING ===');
  
  if (testData.suppliers.length === 0 || testData.customers.length === 0 || testData.dresses.length === 0 || testData.locations.length === 0) {
    console.log('⚠️ Insufficient data for time slot management testing');
    return;
  }
  
  const supplier = testData.suppliers[0];
  const customer = testData.customers[0];
  const dress = testData.dresses.find(d => d.supplier.toString() === supplier._id.toString());
  const location = testData.locations[0];
  
  if (!dress) {
    console.log('⚠️ No dress found for supplier in time slot testing');
    return;
  }
  
  const testDate = new Date(Date.now() + 1520 * 24 * 60 * 60 * 1000);
  const dateString = testDate.toISOString().split('T')[0];
  
  // Test 1: Book a Time Slot
  const appointmentData = {
    supplier: supplier._id.toString(),
    customer: customer._id.toString(),
    dress: dress._id.toString(),
    location: location._id.toString(),
    appointmentDate: testDate.toISOString(),
    timeSlot: '11:00-12:00',
    customerName: customer.fullName || 'Test Customer',
    customerPhone: customer.phone || '0591234567',
    customerEmail: customer.email || 'testcustomer@example.com',
    notes: 'Time slot management test appointment'
  };
  
  const bookSlotResult = await makeRequest(
    'Book Time Slot',
    `${API_BASE}/api/fitting-appointments`,
    {
      method: 'POST',
      body: appointmentData
    }
  );
  
  await validateTest(
    'Time Slot Booking',
    'timeSlotManagement',
    bookSlotResult.success,
    'Time slot should be bookable'
  );
  
  // Test 2: Verify Slot is No Longer Available
  if (bookSlotResult.success) {
    const checkAvailabilityResult = await makeRequest(
      'Check Availability After Booking',
      `${API_BASE}/api/fitting-appointments/available-slots/${supplier._id}/${dateString}`
    );
    
    if (checkAvailabilityResult.success) {
      const slotsData = checkAvailabilityResult.data;
      const bookedSlots = slotsData.bookedSlots || [];
      
      await validateTest(
        'Booked Slot Unavailability',
        'timeSlotManagement',
        bookedSlots.includes('11:00-12:00'),
        'Booked time slot should appear in booked slots'
      );
    }
  }
  
  // Test 3: Try to Book Same Slot (Should Fail)
  const duplicateBookingResult = await makeRequest(
    'Try to Book Same Slot',
    `${API_BASE}/api/fitting-appointments`,
    {
      method: 'POST',
      body: {
        ...appointmentData,
        timeSlot: '11:00-12:00', // Same slot
        customerName: 'Different Customer'
      }
    }
  );
  
  await validateTest(
    'Duplicate Slot Booking Prevention',
    'timeSlotManagement',
    !duplicateBookingResult.success && duplicateBookingResult.status === 409,
    'Duplicate slot booking should be prevented with 409 conflict'
  );
}

// ==================== SCHEDULING CONFLICTS TESTING ====================

async function testSchedulingConflicts(testData) {
  console.log('\n⚠️ === SCHEDULING CONFLICTS TESTING ===');
  
  if (testData.fittingAppointments.length === 0) {
    console.log('⚠️ No existing appointments for conflict testing');
    return;
  }
  
  // Test 1: Verify Existing Appointments Don't Conflict
  const appointments = testData.fittingAppointments;
  const conflicts = [];
  
  for (let i = 0; i < appointments.length; i++) {
    for (let j = i + 1; j < appointments.length; j++) {
      const apt1 = appointments[i];
      const apt2 = appointments[j];
      
      // Check if same supplier, date, and time slot
      if (apt1.supplier.toString() === apt2.supplier.toString() &&
          apt1.appointmentDate.getTime() === apt2.appointmentDate.getTime() &&
          apt1.timeSlot === apt2.timeSlot &&
          apt1.status !== 'cancelled' && apt2.status !== 'cancelled') {
        conflicts.push({ apt1: apt1._id, apt2: apt2._id });
      }
    }
  }
  
  await validateTest(
    'No Existing Scheduling Conflicts',
    'schedulingConflicts',
    conflicts.length === 0,
    'Existing appointments should not have scheduling conflicts'
  );
  
  // Test 2: Business Hours Validation
  const businessHours = [
    '09:00-10:00', '10:00-11:00', '11:00-12:00', '12:00-13:00',
    '13:00-14:00', '14:00-15:00', '15:00-16:00', '16:00-17:00',
    '17:00-18:00', '18:00-19:00', '19:00-20:00'
  ];
  
  const validTimeSlots = appointments.every(apt => businessHours.includes(apt.timeSlot));
  
  await validateTest(
    'Business Hours Compliance',
    'schedulingConflicts',
    validTimeSlots,
    'All appointments should be within business hours'
  );
}

async function runSchedulerCalendarTesting() {
  console.log('🚀 Starting Comprehensive Scheduler and Calendar Testing...\n');
  
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
  console.log(`   - Fitting Appointments: ${testData.fittingAppointments.length}`);
  
  // Run comprehensive scheduler and calendar tests
  await testCalendarAccess(testData);
  await testAvailabilityChecking(testData);
  await testTimeSlotManagement(testData);
  await testSchedulingConflicts(testData);
  
  // Test Results Summary
  console.log('\n📊 === COMPREHENSIVE SCHEDULER AND CALENDAR TEST RESULTS ===');
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
  
  console.log('\n🎉 Comprehensive scheduler and calendar testing completed!');
}

if (require.main === module) {
  runSchedulerCalendarTesting().catch(console.error);
}

module.exports = { runSchedulerCalendarTesting };
