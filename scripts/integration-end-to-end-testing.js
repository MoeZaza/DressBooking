#!/usr/bin/env node

/**
 * Comprehensive Integration and End-to-End Testing
 * Tests complete user journeys, system integration, and end-to-end workflows
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
    customerJourney: { passed: 0, failed: 0 },
    supplierJourney: { passed: 0, failed: 0 },
    bookingWorkflow: { passed: 0, failed: 0 },
    appointmentWorkflow: { passed: 0, failed: 0 },
    systemIntegration: { passed: 0, failed: 0 },
    dataConsistency: { passed: 0, failed: 0 }
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

// ==================== CUSTOMER JOURNEY TESTING ====================

async function testCustomerJourney(testData) {
  console.log('\n👤 === CUSTOMER JOURNEY TESTING ===');
  
  // Step 1: Customer browses dress catalog
  const browseCatalogResult = await makeRequest(
    'Customer Browse Dress Catalog',
    `${API_BASE}/api/dresses/1/10`,
    {
      method: 'POST',
      body: {
        suppliers: testData.suppliers.map(s => s._id.toString())
      }
    }
  );
  
  await validateTest(
    'Customer Can Browse Catalog',
    'customerJourney',
    browseCatalogResult.success,
    'Customer should be able to browse dress catalog'
  );
  
  // Step 2: Customer views dress details
  if (browseCatalogResult.success && testData.dresses.length > 0) {
    const dress = testData.dresses[0];
    const dressDetailsResult = await makeRequest(
      'Customer View Dress Details',
      `${API_BASE}/api/dress/${dress._id}/en`
    );
    
    await validateTest(
      'Customer Can View Dress Details',
      'customerJourney',
      dressDetailsResult.success,
      'Customer should be able to view dress details'
    );
  }
  
  // Step 3: Customer creates account
  const customerData = {
    fullName: `E2E Customer ${Date.now()}`,
    email: `e2ecustomer${Date.now()}@example.com`,
    phone: `059${Math.floor(Math.random() * 9000000 + 1000000)}`,
    language: 'en',
    type: 'user',
    verified: true
  };
  
  const customerCreationResult = await makeRequest(
    'Customer Account Creation',
    `${API_BASE}/api/create-user`,
    {
      method: 'POST',
      body: customerData
    }
  );
  
  await validateTest(
    'Customer Can Create Account',
    'customerJourney',
    customerCreationResult.success,
    'Customer should be able to create account'
  );
  
  // Step 4: Customer makes booking
  if (customerCreationResult.success && testData.suppliers.length > 0 && testData.dresses.length > 0 && testData.locations.length > 0) {
    const supplier = testData.suppliers[0];
    const dress = testData.dresses.find(d => d.supplier.toString() === supplier._id.toString());
    const location = testData.locations[0];
    
    if (dress) {
      const bookingData = {
        booking: {
          supplier: supplier._id.toString(),
          dress: dress._id.toString(),
          customer: customerCreationResult.data._id.toString(),
          location: location._id.toString(),
          from: new Date(Date.now() + 1700 * 24 * 60 * 60 * 1000).toISOString(),
          to: new Date(Date.now() + 1703 * 24 * 60 * 60 * 1000).toISOString(),
          status: 'pending',
          price: 1500
        }
      };
      
      const bookingResult = await makeRequest(
        'Customer Create Booking',
        `${API_BASE}/api/create-booking`,
        {
          method: 'POST',
          body: bookingData
        }
      );
      
      await validateTest(
        'Customer Can Create Booking',
        'customerJourney',
        bookingResult.success,
        'Customer should be able to create booking'
      );
      
      if (bookingResult.success) {
        testData.e2eBooking = bookingResult.data;
        testData.e2eCustomer = customerCreationResult.data;
      }
    }
  }
}

// ==================== SUPPLIER JOURNEY TESTING ====================

async function testSupplierJourney(testData) {
  console.log('\n🏪 === SUPPLIER JOURNEY TESTING ===');
  
  // Step 1: Supplier creates account
  const supplierData = {
    fullName: `E2E Supplier ${Date.now()}`,
    email: `e2esupplier${Date.now()}@example.com`,
    phone: `059${Math.floor(Math.random() * 9000000 + 1000000)}`,
    language: 'en',
    type: 'supplier',
    verified: true,
    bio: 'End-to-end test supplier'
  };
  
  const supplierCreationResult = await makeRequest(
    'Supplier Account Creation',
    `${API_BASE}/api/create-user`,
    {
      method: 'POST',
      body: supplierData
    }
  );
  
  await validateTest(
    'Supplier Can Create Account',
    'supplierJourney',
    supplierCreationResult.success,
    'Supplier should be able to create account'
  );
  
  // Step 2: Supplier adds dress
  if (supplierCreationResult.success && testData.locations.length > 0) {
    const supplier = supplierCreationResult.data;
    const location = testData.locations[0];
    
    const dressData = {
      loggedUser: supplier._id,
      name: `E2E Test Dress ${Date.now()}`,
      supplier: supplier._id,
      locations: [location._id.toString()],
      price: 1800,
      deposit: 500,
      available: true,
      type: 'evening',
      size: 'l',
      style: 'modern',
      color: 'Black',
      length: 170,
      material: 'silk',
      cancellation: 48,
      amendments: 72,
      range: 'evening'
    };
    
    const dressCreationResult = await makeRequest(
      'Supplier Add Dress',
      `${API_BASE}/api/create-dress`,
      {
        method: 'POST',
        body: dressData
      }
    );
    
    await validateTest(
      'Supplier Can Add Dress',
      'supplierJourney',
      dressCreationResult.success,
      'Supplier should be able to add dress'
    );
    
    if (dressCreationResult.success) {
      testData.e2eSupplier = supplier;
      testData.e2eDress = dressCreationResult.data;
    }
  }
  
  // Step 3: Supplier appears in supplier list
  const supplierListResult = await makeRequest(
    'Supplier Appears in List',
    `${API_BASE}/api/all-suppliers`
  );
  
  if (supplierListResult.success && supplierCreationResult.success) {
    const suppliers = supplierListResult.data;
    const foundSupplier = suppliers.find(s => s._id.toString() === supplierCreationResult.data._id.toString());
    
    await validateTest(
      'Supplier Appears in Public List',
      'supplierJourney',
      !!foundSupplier,
      'New supplier should appear in public supplier list'
    );
  }
}

// ==================== BOOKING WORKFLOW TESTING ====================

async function testBookingWorkflow(testData) {
  console.log('\n📋 === BOOKING WORKFLOW TESTING ===');
  
  if (!testData.e2eBooking || !testData.e2eCustomer) {
    console.log('⚠️ No E2E booking available for workflow testing');
    return;
  }
  
  // Step 1: Verify booking was created
  await validateTest(
    'Booking Creation in Workflow',
    'bookingWorkflow',
    testData.e2eBooking && testData.e2eBooking._id,
    'Booking should be created successfully in workflow'
  );
  
  // Step 2: Verify booking has correct status
  await validateTest(
    'Booking Initial Status',
    'bookingWorkflow',
    testData.e2eBooking.status === 'pending',
    'New booking should have pending status'
  );
  
  // Step 3: Verify booking relationships
  await validateTest(
    'Booking Relationships',
    'bookingWorkflow',
    testData.e2eBooking.customer && testData.e2eBooking.dress && testData.e2eBooking.supplier,
    'Booking should have proper customer, dress, and supplier relationships'
  );
}

// ==================== APPOINTMENT WORKFLOW TESTING ====================

async function testAppointmentWorkflow(testData) {
  console.log('\n📅 === APPOINTMENT WORKFLOW TESTING ===');
  
  if (!testData.e2eCustomer || !testData.e2eDress || !testData.e2eSupplier || testData.locations.length === 0) {
    console.log('⚠️ Insufficient E2E data for appointment workflow testing');
    return;
  }
  
  // Step 1: Create fitting appointment
  const appointmentData = {
    supplier: testData.e2eSupplier._id.toString(),
    customer: testData.e2eCustomer._id.toString(),
    dress: testData.e2eDress._id.toString(),
    location: testData.locations[0]._id.toString(),
    appointmentDate: new Date(Date.now() + 1710 * 24 * 60 * 60 * 1000).toISOString(),
    timeSlot: '15:00-16:00',
    customerName: testData.e2eCustomer.fullName,
    customerPhone: testData.e2eCustomer.phone,
    customerEmail: testData.e2eCustomer.email,
    notes: 'E2E test fitting appointment'
  };
  
  const appointmentResult = await makeRequest(
    'Create Fitting Appointment in Workflow',
    `${API_BASE}/api/fitting-appointments`,
    {
      method: 'POST',
      body: appointmentData
    }
  );
  
  await validateTest(
    'Appointment Creation in Workflow',
    'appointmentWorkflow',
    appointmentResult.success,
    'Fitting appointment should be created in workflow'
  );
  
  // Step 2: Check appointment availability
  if (appointmentResult.success) {
    const dateString = new Date(appointmentData.appointmentDate).toISOString().split('T')[0];
    
    const availabilityResult = await makeRequest(
      'Check Appointment Availability',
      `${API_BASE}/api/fitting-appointments/available-slots/${testData.e2eSupplier._id}/${dateString}`
    );
    
    if (availabilityResult.success) {
      const slotsData = availabilityResult.data;
      const bookedSlots = slotsData.bookedSlots || [];
      
      await validateTest(
        'Appointment Slot Booking Verification',
        'appointmentWorkflow',
        bookedSlots.includes('15:00-16:00'),
        'Booked appointment slot should appear in booked slots'
      );
    }
  }
}

// ==================== SYSTEM INTEGRATION TESTING ====================

async function testSystemIntegration(testData) {
  console.log('\n🔗 === SYSTEM INTEGRATION TESTING ===');
  
  // Test 1: Database-API Integration
  const databaseApiResult = await makeRequest(
    'Database-API Integration',
    `${API_BASE}/api/dresses/1/5`,
    {
      method: 'POST',
      body: {
        suppliers: testData.suppliers.map(s => s._id.toString())
      }
    }
  );
  
  await validateTest(
    'Database-API Integration',
    'systemIntegration',
    databaseApiResult.success,
    'Database and API should be properly integrated'
  );
  
  // Test 2: Cross-Collection Relationships
  if (databaseApiResult.success) {
    const dresses = databaseApiResult.data.docs || [];
    const hasSupplierInfo = dresses.every(dress => dress.supplier && dress.supplier._id);
    
    await validateTest(
      'Cross-Collection Relationships',
      'systemIntegration',
      hasSupplierInfo,
      'Cross-collection relationships should be properly populated'
    );
  }
  
  // Test 3: Multi-Step Operations
  const multiStepSuccess = testData.e2eCustomer && testData.e2eBooking && testData.e2eSupplier && testData.e2eDress;
  
  await validateTest(
    'Multi-Step Operations Integration',
    'systemIntegration',
    multiStepSuccess,
    'Multi-step operations should work together seamlessly'
  );
}

async function runIntegrationEndToEndTesting() {
  console.log('🚀 Starting Comprehensive Integration and End-to-End Testing...\n');
  
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
  
  // Run comprehensive integration and end-to-end tests
  await testCustomerJourney(testData);
  await testSupplierJourney(testData);
  await testBookingWorkflow(testData);
  await testAppointmentWorkflow(testData);
  await testSystemIntegration(testData);
  
  // Test Results Summary
  console.log('\n📊 === COMPREHENSIVE INTEGRATION AND END-TO-END TEST RESULTS ===');
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
  
  console.log('\n🎉 Comprehensive integration and end-to-end testing completed!');
}

if (require.main === module) {
  runIntegrationEndToEndTesting().catch(console.error);
}

module.exports = { runIntegrationEndToEndTesting };
