#!/usr/bin/env node

/**
 * Comprehensive Booking UI Testing
 * Tests the booking UI fixes including supplier dropdown, dress dropdown, and customer creation
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
    supplierEndpoints: { passed: 0, failed: 0 },
    dressEndpoints: { passed: 0, failed: 0 },
    customerCreation: { passed: 0, failed: 0 },
    bookingCreation: { passed: 0, failed: 0 },
    uiDataFlow: { passed: 0, failed: 0 }
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
  
  await client.close();
  
  const suppliers = users.filter(u => u.type === 'supplier');
  const customers = users.filter(u => u.type === 'user');
  
  return { users, dresses, locations, suppliers, customers };
}

// ==================== SUPPLIER ENDPOINTS TESTING ====================

async function testSupplierEndpoints(testData) {
  console.log('\n👔 === SUPPLIER ENDPOINTS TESTING ===');
  
  // Test 1: Get All Suppliers Endpoint (public)
  const suppliersResult = await makeRequest(
    'Get All Suppliers Endpoint',
    `${API_BASE}/api/all-suppliers`
  );
  
  await validateTest(
    'All Suppliers Endpoint Accessible',
    'supplierEndpoints',
    suppliersResult.success,
    'All suppliers endpoint should be accessible'
  );

  if (suppliersResult.success && suppliersResult.data) {
    const suppliers = Array.isArray(suppliersResult.data) ? suppliersResult.data : [];

    await validateTest(
      'Suppliers Data Available',
      'supplierEndpoints',
      suppliers.length > 0,
      'Should return supplier data'
    );

    if (suppliers.length > 0) {
      await validateTest(
        'Suppliers Have Required Fields',
        'supplierEndpoints',
        suppliers.every(user => user._id && user.fullName),
        'Suppliers should have required fields (_id, fullName)'
      );
    }
  }
}

// ==================== DRESS ENDPOINTS TESTING ====================

async function testDressEndpoints(testData) {
  console.log('\n👗 === DRESS ENDPOINTS TESTING ===');
  
  if (testData.suppliers.length === 0) {
    console.log('⚠️ No suppliers available for dress testing');
    return;
  }
  
  const testSupplier = testData.suppliers[0];
  
  // Test 1: Get Dresses by Supplier
  const dressesResult = await makeRequest(
    'Get Dresses by Supplier',
    `${API_BASE}/api/dresses/1/10`,
    {
      method: 'POST',
      body: {
        suppliers: [testSupplier._id.toString()]
      }
    }
  );
  
  await validateTest(
    'Dresses by Supplier Endpoint',
    'dressEndpoints',
    dressesResult.success,
    'Dresses by supplier endpoint should be accessible'
  );
  
  if (dressesResult.success && dressesResult.data) {
    const dresses = Array.isArray(dressesResult.data) ? dressesResult.data : [];
    
    await validateTest(
      'Dresses Filtered by Supplier',
      'dressEndpoints',
      dresses.length > 0,
      'Should return dresses for the specified supplier'
    );
    
    if (dresses.length > 0) {
      await validateTest(
        'Dresses Have Required Fields',
        'dressEndpoints',
        dresses.every(dress => dress._id && dress.name && dress.supplier),
        'Dresses should have required fields (_id, name, supplier)'
      );
      
      await validateTest(
        'Dresses Belong to Correct Supplier',
        'dressEndpoints',
        dresses.every(dress => dress.supplier.toString() === testSupplier._id.toString()),
        'All returned dresses should belong to the specified supplier'
      );
    }
  }
}

// ==================== CUSTOMER CREATION TESTING ====================

async function testCustomerCreation(testData) {
  console.log('\n👤 === CUSTOMER CREATION TESTING ===');
  
  // Test 1: Create New Customer
  const newCustomerData = {
    fullName: `Test Customer ${Date.now()}`,
    email: `testcustomer${Date.now()}@example.com`,
    phone: `+1234567${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`,
    language: 'en',
    type: 'user',
    password: 'TestPassword123!',
    birthDate: new Date('1990-01-01').toISOString(),
    verified: true
  };
  
  const createCustomerResult = await makeRequest(
    'Create New Customer',
    `${API_BASE}/api/create-user`,
    {
      method: 'POST',
      body: newCustomerData
    }
  );
  
  await validateTest(
    'Customer Creation Endpoint',
    'customerCreation',
    createCustomerResult.success,
    'Customer creation should work'
  );
  
  if (createCustomerResult.success && createCustomerResult.data) {
    await validateTest(
      'Customer Creation Returns User Data',
      'customerCreation',
      createCustomerResult.data._id && createCustomerResult.data.fullName && createCustomerResult.data.email,
      'Customer creation should return the created user data with _id'
    );
    
    await validateTest(
      'Created Customer Has Correct Type',
      'customerCreation',
      createCustomerResult.data.type === 'user',
      'Created customer should have type "user"'
    );
    
    // Store created customer for booking test
    testData.createdCustomer = createCustomerResult.data;
  }
}

// ==================== BOOKING CREATION TESTING ====================

async function testBookingCreation(testData) {
  console.log('\n📅 === BOOKING CREATION TESTING ===');
  
  if (!testData.createdCustomer || testData.suppliers.length === 0 || testData.dresses.length === 0 || testData.locations.length === 0) {
    console.log('⚠️ Missing required data for booking creation test');
    return;
  }
  
  const supplier = testData.suppliers[0];
  const dress = testData.dresses.find(d => d.supplier.toString() === supplier._id.toString());
  const customer = testData.createdCustomer;
  const location = testData.locations[0];
  
  if (!dress) {
    console.log('⚠️ No dress found for the test supplier');
    return;
  }
  
  // Test 1: Create Booking with New Customer
  const baseDate = new Date(Date.now() + 700 * 24 * 60 * 60 * 1000);
  const bookingData = {
    booking: {
      supplier: supplier._id.toString(),
      dress: dress._id.toString(),
      customer: customer._id.toString(),
      location: location._id.toString(),
      from: new Date(baseDate.getTime()).toISOString(),
      to: new Date(baseDate.getTime() + 3 * 24 * 60 * 60 * 1000).toISOString(),
      status: 'pending',
      price: 800
    }
  };
  
  const createBookingResult = await makeRequest(
    'Create Booking with New Customer',
    `${API_BASE}/api/create-booking`,
    {
      method: 'POST',
      body: bookingData
    }
  );
  
  await validateTest(
    'Booking Creation with New Customer',
    'bookingCreation',
    createBookingResult.success,
    'Booking creation should work with newly created customer'
  );
  
  if (createBookingResult.success && createBookingResult.data) {
    await validateTest(
      'Created Booking Has Correct Data',
      'bookingCreation',
      createBookingResult.data._id && createBookingResult.data.customer === customer._id,
      'Created booking should have correct customer reference'
    );
  }
}

// ==================== UI DATA FLOW TESTING ====================

async function testUiDataFlow(testData) {
  console.log('\n🔄 === UI DATA FLOW TESTING ===');
  
  // Test 1: Supplier -> Dress Flow
  if (testData.suppliers.length > 0) {
    const supplier = testData.suppliers[0];
    
    // Get dresses for this supplier
    const dressesResult = await makeRequest(
      'UI Flow: Get Dresses for Supplier',
      `${API_BASE}/api/dresses/1/10`,
      {
        method: 'POST',
        body: {
          suppliers: [supplier._id.toString()]
        }
      }
    );
    
    await validateTest(
      'UI Flow: Supplier to Dresses',
      'uiDataFlow',
      dressesResult.success && Array.isArray(dressesResult.data) && dressesResult.data.length > 0,
      'Should be able to get dresses when supplier is selected'
    );
  }
  
  // Test 2: Customer Search Flow
  const customerSearchResult = await makeRequest(
    'UI Flow: Customer Search',
    `${API_BASE}/api/users/1/10`,
    {
      method: 'POST',
      body: {
        user: '',
        types: ['user']
      }
    }
  );
  
  await validateTest(
    'UI Flow: Customer Search',
    'uiDataFlow',
    customerSearchResult.success,
    'Should be able to search for customers'
  );
  
  // Test 3: Location Data Available
  const locationsResult = await makeRequest(
    'UI Flow: Get Locations',
    `${API_BASE}/api/locations/1/10/en`
  );
  
  await validateTest(
    'UI Flow: Locations Available',
    'uiDataFlow',
    locationsResult.success,
    'Should be able to get locations for booking'
  );
}

async function runComprehensiveBookingUiTesting() {
  console.log('🚀 Starting Comprehensive Booking UI Testing...\n');
  
  // Get test data
  const testData = await getTestData();
  console.log('📊 Test data loaded:');
  console.log(`   - Users: ${testData.users.length}`);
  console.log(`   - Suppliers: ${testData.suppliers.length}`);
  console.log(`   - Customers: ${testData.customers.length}`);
  console.log(`   - Dresses: ${testData.dresses.length}`);
  console.log(`   - Locations: ${testData.locations.length}`);
  
  // Run comprehensive tests
  await testSupplierEndpoints(testData);
  await testDressEndpoints(testData);
  await testCustomerCreation(testData);
  await testBookingCreation(testData);
  await testUiDataFlow(testData);
  
  // Test Results Summary
  console.log('\n📊 === COMPREHENSIVE BOOKING UI TEST RESULTS ===');
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
  
  console.log('\n🎉 Comprehensive booking UI testing completed!');
}

if (require.main === module) {
  runComprehensiveBookingUiTesting().catch(console.error);
}

module.exports = { runComprehensiveBookingUiTesting };
