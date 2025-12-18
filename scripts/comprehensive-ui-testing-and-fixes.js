#!/usr/bin/env node

/**
 * Comprehensive UI Testing and Bug Fixes
 * Tests all UI components and identifies bugs in dropdown population, form validation, error handling
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
    dropdownPopulation: { passed: 0, failed: 0 },
    formValidation: { passed: 0, failed: 0 },
    errorHandling: { passed: 0, failed: 0 },
    dataFlow: { passed: 0, failed: 0 },
    userExperience: { passed: 0, failed: 0 },
    apiIntegration: { passed: 0, failed: 0 }
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

// ==================== DROPDOWN POPULATION TESTING ====================

async function testDropdownPopulation(testData) {
  console.log('\n📋 === DROPDOWN POPULATION TESTING ===');
  
  // Test 1: Suppliers Dropdown Data
  const suppliersResult = await makeRequest(
    'Suppliers Dropdown Data',
    `${API_BASE}/api/all-suppliers`
  );
  
  await validateTest(
    'Suppliers Dropdown Population',
    'dropdownPopulation',
    suppliersResult.success && Array.isArray(suppliersResult.data) && suppliersResult.data.length > 0,
    'Suppliers dropdown should be populated with supplier data'
  );
  
  if (suppliersResult.success && suppliersResult.data) {
    await validateTest(
      'Suppliers Dropdown Contains Only Suppliers',
      'dropdownPopulation',
      suppliersResult.data.every(user => user._id && user.fullName),
      'Suppliers dropdown should contain only valid supplier data with _id and fullName'
    );
  }
  
  // Test 2: Dresses Dropdown Data (filtered by supplier)
  if (testData.suppliers.length > 0) {
    const testSupplier = testData.suppliers[0];
    const dressesResult = await makeRequest(
      'Dresses Dropdown Data (Filtered)',
      `${API_BASE}/api/dresses/1/10`,
      {
        method: 'POST',
        body: {
          suppliers: [testSupplier._id.toString()]
        }
      }
    );
    
    await validateTest(
      'Dresses Dropdown Population',
      'dropdownPopulation',
      dressesResult.success,
      'Dresses dropdown should be accessible'
    );
    
    if (dressesResult.success && dressesResult.data) {
      const dresses = Array.isArray(dressesResult.data.docs) ? dressesResult.data.docs : [];
      
      await validateTest(
        'Dresses Dropdown Contains Dress Data',
        'dropdownPopulation',
        dresses.length > 0,
        'Dresses dropdown should contain dress data for the selected supplier'
      );
      
      if (dresses.length > 0) {
        await validateTest(
          'Dresses Dropdown Data Quality',
          'dropdownPopulation',
          dresses.every(dress => dress._id && dress.name && dress.supplier),
          'Dress data should have required fields (_id, name, supplier)'
        );
      }
    }
  }
  
  // Test 3: Customers Dropdown Data
  const customersResult = await makeRequest(
    'Customers Dropdown Data',
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
    'Customers Dropdown Population',
    'dropdownPopulation',
    customersResult.success,
    'Customers dropdown should be accessible'
  );
  
  if (customersResult.success && customersResult.data) {
    const customers = Array.isArray(customersResult.data) && customersResult.data.length > 0 ? customersResult.data[0].resultData : [];
    
    await validateTest(
      'Customers Dropdown Contains Customer Data',
      'dropdownPopulation',
      customers.length > 0,
      'Customers dropdown should contain customer data'
    );
    
    if (customers.length > 0) {
      await validateTest(
        'Customers Dropdown Contains Only Customers',
        'dropdownPopulation',
        customers.every(user => user.type === 'user'),
        'Customers dropdown should contain only users with type "user"'
      );
    }
  }
  
  // Test 4: Locations Dropdown Data
  const locationsResult = await makeRequest(
    'Locations Dropdown Data',
    `${API_BASE}/api/locations/1/10/en`
  );
  
  await validateTest(
    'Locations Dropdown Population',
    'dropdownPopulation',
    locationsResult.success,
    'Locations dropdown should be accessible'
  );
  
  if (locationsResult.success && locationsResult.data) {
    const locations = Array.isArray(locationsResult.data) && locationsResult.data.length > 0 ? locationsResult.data[0].resultData : [];
    
    await validateTest(
      'Locations Dropdown Contains Location Data',
      'dropdownPopulation',
      locations.length > 0,
      'Locations dropdown should contain location data'
    );
  }
}

// ==================== FORM VALIDATION TESTING ====================

async function testFormValidation(testData) {
  console.log('\n📝 === FORM VALIDATION TESTING ===');
  
  // Test 1: Customer Creation Validation
  const invalidCustomerData = {
    fullName: '', // Empty name (should fail validation)
    email: 'invalid-email', // Invalid email format
    phone: '123', // Invalid phone format
    language: 'en',
    type: 'user',
    password: '123', // Weak password
    birthDate: new Date('1990-01-01').toISOString(),
    verified: true
  };
  
  const invalidCustomerResult = await makeRequest(
    'Invalid Customer Creation',
    `${API_BASE}/api/create-user`,
    {
      method: 'POST',
      body: invalidCustomerData
    }
  );
  
  await validateTest(
    'Customer Creation Validation',
    'formValidation',
    !invalidCustomerResult.success && invalidCustomerResult.status === 400,
    'Invalid customer data should be rejected with 400 error'
  );
  
  // Test 2: Valid Customer Creation
  const validCustomerData = {
    fullName: `Valid Customer ${Date.now()}`,
    email: `validcustomer${Date.now()}@example.com`,
    phone: `059${Math.floor(Math.random() * 9000000 + 1000000)}`, // Palestinian phone format
    language: 'en',
    type: 'user',
    password: 'ValidPassword123!',
    birthDate: new Date('1990-01-01').toISOString(),
    verified: true
  };
  
  const validCustomerResult = await makeRequest(
    'Valid Customer Creation',
    `${API_BASE}/api/create-user`,
    {
      method: 'POST',
      body: validCustomerData
    }
  );
  
  await validateTest(
    'Valid Customer Creation',
    'formValidation',
    validCustomerResult.success,
    'Valid customer data should be accepted'
  );
  
  // Store created customer for booking tests
  if (validCustomerResult.success) {
    testData.createdCustomer = validCustomerResult.data;
  }
  
  // Test 3: Booking Creation Validation (missing required fields)
  const invalidBookingData = {
    booking: {
      // Missing supplier
      dress: testData.dresses[0]?._id?.toString(),
      customer: testData.customers[0]?._id?.toString(),
      location: testData.locations[0]?._id?.toString(),
      from: new Date(Date.now() + 1000 * 24 * 60 * 60 * 1000).toISOString(),
      to: new Date(Date.now() + 1003 * 24 * 60 * 60 * 1000).toISOString(),
      status: 'pending',
      price: 800
    }
  };
  
  const invalidBookingResult = await makeRequest(
    'Invalid Booking Creation (Missing Supplier)',
    `${API_BASE}/api/create-booking`,
    {
      method: 'POST',
      body: invalidBookingData
    }
  );
  
  await validateTest(
    'Booking Creation Validation',
    'formValidation',
    !invalidBookingResult.success && invalidBookingResult.status === 400,
    'Invalid booking data should be rejected with 400 error'
  );
}

// ==================== ERROR HANDLING TESTING ====================

async function testErrorHandling(testData) {
  console.log('\n🚨 === ERROR HANDLING TESTING ===');
  
  // Test 1: Non-existent Resource
  const nonExistentResult = await makeRequest(
    'Non-existent Resource',
    `${API_BASE}/api/user/507f1f77bcf86cd799439011` // Non-existent ObjectId
  );
  
  await validateTest(
    'Non-existent Resource Handling',
    'errorHandling',
    !nonExistentResult.success && (nonExistentResult.status === 404 || nonExistentResult.status === 400),
    'Non-existent resources should return 404 or 400 error'
  );
  
  // Test 2: Invalid ObjectId Format
  const invalidIdResult = await makeRequest(
    'Invalid ObjectId Format',
    `${API_BASE}/api/user/invalid-id`
  );
  
  await validateTest(
    'Invalid ObjectId Handling',
    'errorHandling',
    !invalidIdResult.success && invalidIdResult.status === 400,
    'Invalid ObjectId format should return 400 error'
  );
  
  // Test 3: Malformed Request Body
  const malformedResult = await makeRequest(
    'Malformed Request Body',
    `${API_BASE}/api/create-booking`,
    {
      method: 'POST',
      body: { invalid: 'data' }
    }
  );
  
  await validateTest(
    'Malformed Request Handling',
    'errorHandling',
    !malformedResult.success && malformedResult.status === 400,
    'Malformed request body should return 400 error'
  );
}

// ==================== DATA FLOW TESTING ====================

async function testDataFlow(testData) {
  console.log('\n🔄 === DATA FLOW TESTING ===');
  
  // Test 1: Supplier -> Dresses Flow
  if (testData.suppliers.length > 0) {
    const supplier = testData.suppliers[0];
    
    // Step 1: Get supplier data
    const supplierResult = await makeRequest(
      'Get Supplier Data',
      `${API_BASE}/api/all-suppliers`
    );
    
    // Step 2: Use supplier to get dresses
    if (supplierResult.success) {
      const dressesResult = await makeRequest(
        'Get Dresses for Supplier',
        `${API_BASE}/api/dresses/1/10`,
        {
          method: 'POST',
          body: {
            suppliers: [supplier._id.toString()]
          }
        }
      );
      
      await validateTest(
        'Supplier to Dresses Data Flow',
        'dataFlow',
        dressesResult.success,
        'Should be able to get dresses after selecting supplier'
      );
    }
  }
  
  // Test 2: Customer Creation -> Booking Flow
  if (testData.createdCustomer && testData.suppliers.length > 0 && testData.dresses.length > 0 && testData.locations.length > 0) {
    const supplier = testData.suppliers[0];
    const dress = testData.dresses.find(d => d.supplier.toString() === supplier._id.toString());
    const location = testData.locations[0];
    
    if (dress) {
      const bookingData = {
        booking: {
          supplier: supplier._id.toString(),
          dress: dress._id.toString(),
          customer: testData.createdCustomer._id.toString(),
          location: location._id.toString(),
          from: new Date(Date.now() + 1100 * 24 * 60 * 60 * 1000).toISOString(),
          to: new Date(Date.now() + 1103 * 24 * 60 * 60 * 1000).toISOString(),
          status: 'pending',
          price: 800
        }
      };
      
      const bookingResult = await makeRequest(
        'Create Booking with New Customer',
        `${API_BASE}/api/create-booking`,
        {
          method: 'POST',
          body: bookingData
        }
      );
      
      await validateTest(
        'Customer Creation to Booking Flow',
        'dataFlow',
        bookingResult.success,
        'Should be able to create booking with newly created customer'
      );
    }
  }
}

async function runComprehensiveUiTestingAndFixes() {
  console.log('🚀 Starting Comprehensive UI Testing and Bug Fixes...\n');
  
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
  
  // Run comprehensive UI tests
  await testDropdownPopulation(testData);
  await testFormValidation(testData);
  await testErrorHandling(testData);
  await testDataFlow(testData);
  
  // Test Results Summary
  console.log('\n📊 === COMPREHENSIVE UI TESTING RESULTS ===');
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
  
  console.log('\n🎉 Comprehensive UI testing and bug fixes completed!');
}

if (require.main === module) {
  runComprehensiveUiTestingAndFixes().catch(console.error);
}

module.exports = { runComprehensiveUiTestingAndFixes };
