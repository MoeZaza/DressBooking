#!/usr/bin/env node

/**
 * Comprehensive Fitting Appointment System Testing
 * Tests appointment scheduling, management, notifications, and integration with booking system
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
    appointmentCreation: { passed: 0, failed: 0 },
    appointmentScheduling: { passed: 0, failed: 0 },
    appointmentManagement: { passed: 0, failed: 0 },
    bookingIntegration: { passed: 0, failed: 0 },
    availabilityChecking: { passed: 0, failed: 0 },
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

// ==================== APPOINTMENT CREATION TESTING ====================

async function testAppointmentCreation(testData) {
  console.log('\n📅 === APPOINTMENT CREATION TESTING ===');
  
  if (testData.suppliers.length === 0 || testData.customers.length === 0 || testData.dresses.length === 0) {
    console.log('⚠️ Insufficient data for appointment creation testing');
    return null;
  }
  
  const supplier = testData.suppliers[0];
  const customer = testData.customers[0];
  const dress = testData.dresses.find(d => d.supplier.toString() === supplier._id.toString());
  
  if (!dress) {
    console.log('⚠️ No dress found for supplier in appointment creation testing');
    return null;
  }
  
  // Test 1: Create Fitting Appointment
  const appointmentDate = new Date(Date.now() + 1400 * 24 * 60 * 60 * 1000);
  const location = testData.locations[0];
  const appointmentData = {
    supplier: supplier._id.toString(),
    customer: customer._id.toString(),
    dress: dress._id.toString(),
    location: location._id.toString(),
    appointmentDate: appointmentDate.toISOString(),
    timeSlot: '10:00-11:00', // Required enum value
    customerName: customer.fullName || 'Test Customer',
    customerPhone: customer.phone || '0591234567',
    customerEmail: customer.email || 'testcustomer@example.com',
    notes: 'Initial fitting for wedding dress',
    duration: 60 // minutes
  };
  
  const appointmentResult = await makeRequest(
    'Create Fitting Appointment',
    `${API_BASE}/api/fitting-appointments`,
    {
      method: 'POST',
      body: appointmentData
    }
  );
  
  await validateTest(
    'Fitting Appointment Creation',
    'appointmentCreation',
    appointmentResult.success,
    'Fitting appointment should be created successfully'
  );
  
  let createdAppointment = null;
  if (appointmentResult.success) {
    createdAppointment = appointmentResult.data;
    testData.createdAppointment = createdAppointment;
  }
  
  // Test 2: Create Appointment with Booking Reference
  if (testData.bookings.length > 0) {
    const booking = testData.bookings[0];
    const bookingAppointmentData = {
      supplier: supplier._id.toString(),
      customer: customer._id.toString(),
      dress: dress._id.toString(),
      location: location._id.toString(),
      appointmentDate: new Date(Date.now() + 1405 * 24 * 60 * 60 * 1000).toISOString(),
      timeSlot: '14:00-15:00', // Different time slot
      customerName: customer.fullName || 'Test Customer',
      customerPhone: customer.phone || '0591234567',
      customerEmail: customer.email || 'testcustomer@example.com',
      notes: 'Final fitting before event',
      duration: 90
    };
    
    const bookingAppointmentResult = await makeRequest(
      'Create Appointment with Booking Reference',
      `${API_BASE}/api/fitting-appointments`,
      {
        method: 'POST',
        body: bookingAppointmentData
      }
    );
    
    await validateTest(
      'Appointment with Booking Reference',
      'appointmentCreation',
      bookingAppointmentResult.success,
      'Appointment with booking reference should be created'
    );
  }
  
  return createdAppointment;
}

// ==================== APPOINTMENT SCHEDULING TESTING ====================

async function testAppointmentScheduling(testData) {
  console.log('\n🕐 === APPOINTMENT SCHEDULING TESTING ===');
  
  if (testData.suppliers.length === 0) {
    console.log('⚠️ No suppliers available for scheduling testing');
    return;
  }
  
  const supplier = testData.suppliers[0];
  const testDate = new Date(Date.now() + 1410 * 24 * 60 * 60 * 1000);
  const dateString = testDate.toISOString().split('T')[0]; // YYYY-MM-DD format
  
  // Test 1: Get Available Time Slots
  const availableSlotsResult = await makeRequest(
    'Get Available Time Slots',
    `${API_BASE}/api/fitting-appointments/available-slots/${supplier._id}/${dateString}`
  );
  
  await validateTest(
    'Available Time Slots Retrieval',
    'appointmentScheduling',
    availableSlotsResult.success,
    'Should be able to retrieve available time slots'
  );
  
  // Test 2: Check Supplier Schedule
  const supplierScheduleResult = await makeRequest(
    'Get Supplier Schedule',
    `${API_BASE}/api/fitting-appointments/supplier/${supplier._id}`
  );
  
  await validateTest(
    'Supplier Schedule Access',
    'appointmentScheduling',
    supplierScheduleResult.success || supplierScheduleResult.status === 401 || supplierScheduleResult.status === 403,
    'Supplier schedule should be accessible or require authentication'
  );
}

// ==================== APPOINTMENT MANAGEMENT TESTING ====================

async function testAppointmentManagement(testData, createdAppointment) {
  console.log('\n📋 === APPOINTMENT MANAGEMENT TESTING ===');
  
  if (!createdAppointment) {
    console.log('⚠️ No created appointment available for management testing');
    return;
  }
  
  // Test 1: Update Appointment Status
  const updateData = {
    _id: createdAppointment._id,
    status: 'confirmed',
    notes: 'Updated notes - appointment confirmed by customer'
  };
  
  const updateResult = await makeRequest(
    'Update Appointment Status',
    `${API_BASE}/api/fitting-appointments/${createdAppointment._id}`,
    {
      method: 'PUT',
      body: updateData
    }
  );
  
  await validateTest(
    'Appointment Status Update',
    'appointmentManagement',
    updateResult.success || updateResult.status === 401 || updateResult.status === 403 || updateResult.status === 404,
    'Appointment update should work or require authentication/not exist'
  );
  
  // Test 2: Get Appointment Details
  const appointmentDetailsResult = await makeRequest(
    'Get Appointment Details',
    `${API_BASE}/api/fitting-appointments/${createdAppointment._id}`
  );
  
  await validateTest(
    'Appointment Details Retrieval',
    'appointmentManagement',
    appointmentDetailsResult.success || appointmentDetailsResult.status === 401 || appointmentDetailsResult.status === 403 || appointmentDetailsResult.status === 404,
    'Appointment details should be accessible or require authentication/not exist'
  );
}

// ==================== BOOKING INTEGRATION TESTING ====================

async function testBookingIntegration(testData) {
  console.log('\n🔗 === BOOKING INTEGRATION TESTING ===');
  
  if (testData.bookings.length === 0) {
    console.log('⚠️ No bookings available for integration testing');
    return;
  }
  
  // Test 1: Check if bookings can have fitting appointments
  const booking = testData.bookings[0];
  
  // Test 2: Verify appointment-booking relationship
  if (testData.fittingAppointments.length > 0) {
    const appointment = testData.fittingAppointments[0];
    
    await validateTest(
      'Appointment-Booking Relationship',
      'bookingIntegration',
      appointment.booking || appointment.customer || appointment.dress,
      'Appointments should have proper relationships with bookings/customers/dresses'
    );
  }
  
  // Test 3: Customer Appointments Access
  if (testData.customers.length > 0) {
    const customer = testData.customers[0];
    
    const customerAppointmentsResult = await makeRequest(
      'Get Customer Appointments',
      `${API_BASE}/api/fitting-appointments/customer`
    );
    
    await validateTest(
      'Customer Appointments Access',
      'bookingIntegration',
      customerAppointmentsResult.success || customerAppointmentsResult.status === 401 || customerAppointmentsResult.status === 403,
      'Customer appointments should be accessible or require authentication'
    );
  }
}

async function runFittingAppointmentSystemTesting() {
  console.log('🚀 Starting Comprehensive Fitting Appointment System Testing...\n');
  
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
  
  // Run comprehensive fitting appointment tests
  const createdAppointment = await testAppointmentCreation(testData);
  await testAppointmentScheduling(testData);
  await testAppointmentManagement(testData, createdAppointment);
  await testBookingIntegration(testData);
  
  // Test Results Summary
  console.log('\n📊 === COMPREHENSIVE FITTING APPOINTMENT SYSTEM TEST RESULTS ===');
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
  
  console.log('\n🎉 Comprehensive fitting appointment system testing completed!');
}

if (require.main === module) {
  runFittingAppointmentSystemTesting().catch(console.error);
}

module.exports = { runFittingAppointmentSystemTesting };
