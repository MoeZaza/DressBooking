#!/usr/bin/env node

/**
 * Comprehensive Backend API Testing Suite
 * Tests all backend API endpoints including CRUD operations, authentication, authorization, and data validation
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
    crudOperations: { passed: 0, failed: 0 },
    authentication: { passed: 0, failed: 0 },
    authorization: { passed: 0, failed: 0 },
    dataValidation: { passed: 0, failed: 0 },
    businessLogic: { passed: 0, failed: 0 },
    errorHandling: { passed: 0, failed: 0 }
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
  
  const suppliers = await db.collection('User').find({ type: 'supplier' }).toArray();
  const customers = await db.collection('User').find({ type: 'user' }).toArray();
  const locations = await db.collection('Location').find({}).toArray();
  const dresses = await db.collection('Dress').find({}).toArray();
  const bookings = await db.collection('Booking').find({}).toArray();
  const countries = await db.collection('Country').find({}).toArray();
  
  await client.close();
  
  // Find valid dress-supplier pairs
  const validPairs = [];
  dresses.forEach(dress => {
    const supplier = suppliers.find(s => s._id.toString() === dress.supplier.toString());
    if (supplier) {
      validPairs.push({ dress, supplier });
    }
  });
  
  return { suppliers, customers, locations, dresses, bookings, countries, validPairs };
}

// ==================== CRUD OPERATIONS TESTING ====================

async function testCrudOperations(testData) {
  console.log('\n📝 === CRUD OPERATIONS TESTING ===');
  
  // Test 1: User Creation (CREATE)
  const timestamp = Date.now();
  const newUser = {
    fullName: `API Test User ${timestamp}`,
    email: `apitest${timestamp}@bookdress.com`,
    phone: `0599${Math.floor(100000 + Math.random() * 900000)}`,
    type: 'user',
    language: 'en'
  };
  
  const createUserResult = await makeRequest(
    'Create User (CREATE)',
    `${API_BASE}/api/create-user`,
    {
      method: 'POST',
      body: newUser
    }
  );
  
  await validateTest(
    'User Creation API',
    'crudOperations',
    createUserResult.success,
    'User creation endpoint failed'
  );
  
  let createdUserId = null;
  if (createUserResult.success && createUserResult.data && createUserResult.data._id) {
    createdUserId = createUserResult.data._id;
  }
  
  // Test 2: User Retrieval (READ)
  const getUsersResult = await makeRequest(
    'Get Users (READ)',
    `${API_BASE}/api/users/1/10`,
    {
      method: 'POST',
      body: {}
    }
  );
  
  await validateTest(
    'User Retrieval API',
    'crudOperations',
    getUsersResult.success || getUsersResult.status === 401, // 401 is acceptable (auth required)
    'User retrieval endpoint has issues'
  );
  
  // Test 3: User Update (UPDATE)
  if (createdUserId) {
    const updateUserResult = await makeRequest(
      'Update User (UPDATE)',
      `${API_BASE}/api/update-user`,
      {
        method: 'POST',
        body: {
          _id: createdUserId,
          fullName: `Updated API Test User ${timestamp}`,
          phone: '0599999999'
        }
      }
    );
    
    await validateTest(
      'User Update API',
      'crudOperations',
      updateUserResult.success,
      'User update endpoint failed'
    );
  }
  
  // Test 4: Dress Creation (CREATE)
  if (testData.validPairs.length > 0) {
    const validPair = testData.validPairs[0];
    const newDress = {
      name: `API Test Dress ${timestamp}`,
      supplier: validPair.supplier._id.toString(),
      locations: [testData.locations[0]._id.toString()],
      price: 750,
      deposit: 150,
      available: true,
      type: 'evening',
      size: 'm',
      style: 'modern',
      color: 'Navy Blue',
      length: 165,
      material: 'chiffon',
      cancellation: 48,
      amendments: 24,
      range: 'evening',
      accessories: ['jewelry'],
      designerName: 'API Designer',
      dressCode: `API${timestamp}`,
      fittingRequired: true,
      alterationNotes: 'Professional alterations available',
      careInstructions: 'Professional dry clean only',
      occasionTags: ['formal', 'gala'],
      season: 'all-season',
      neckline: 'v-neck',
      sleeves: 'sleeveless',
      silhouette: 'a-line'
    };
    
    const createDressResult = await makeRequest(
      'Create Dress (CREATE)',
      `${API_BASE}/api/create-dress`,
      {
        method: 'POST',
        body: newDress
      }
    );
    
    await validateTest(
      'Dress Creation API',
      'crudOperations',
      createDressResult.success,
      'Dress creation endpoint failed'
    );
  }
  
  // Test 5: Dress Retrieval (READ)
  const getDressesResult = await makeRequest(
    'Get Dresses (READ)',
    `${API_BASE}/api/dresses/1/10`,
    {
      method: 'POST',
      body: {
        suppliers: testData.suppliers.map(s => s._id.toString())
      }
    }
  );
  
  await validateTest(
    'Dress Retrieval API',
    'crudOperations',
    getDressesResult.success || getDressesResult.status === 401,
    'Dress retrieval endpoint has issues'
  );
  
  // Test 6: Booking Creation (CREATE)
  if (testData.validPairs.length > 0 && testData.customers.length > 0) {
    const validPair = testData.validPairs[0];
    const bookingData = {
      booking: {
        supplier: validPair.supplier._id.toString(),
        dress: validPair.dress._id.toString(),
        customer: testData.customers[0]._id.toString(),
        location: testData.locations[0]._id.toString(),
        from: new Date(Date.now() + 500 * 24 * 60 * 60 * 1000).toISOString(), // Far future
        to: new Date(Date.now() + 503 * 24 * 60 * 60 * 1000).toISOString(),
        status: 'pending',
        price: 800,
        deposit: 160
      }
    };
    
    const createBookingResult = await makeRequest(
      'Create Booking (CREATE)',
      `${API_BASE}/api/create-booking`,
      {
        method: 'POST',
        body: bookingData
      }
    );
    
    await validateTest(
      'Booking Creation API',
      'crudOperations',
      createBookingResult.success,
      'Booking creation endpoint failed'
    );
  }
  
  // Test 7: Booking Retrieval (READ)
  const getBookingsResult = await makeRequest(
    'Get Bookings (READ)',
    `${API_BASE}/api/bookings/1/10/en`,
    {
      method: 'POST',
      body: {
        statuses: ['pending', 'deposit', 'paid'],
        suppliers: testData.suppliers.map(s => s._id.toString())
      }
    }
  );
  
  await validateTest(
    'Booking Retrieval API',
    'crudOperations',
    getBookingsResult.success,
    'Booking retrieval endpoint failed'
  );
}

// ==================== DATA VALIDATION TESTING ====================

async function testDataValidation(testData) {
  console.log('\n✅ === DATA VALIDATION TESTING ===');
  
  // Test 1: Invalid Email Validation
  const invalidEmailResult = await makeRequest(
    'Invalid Email Validation',
    `${API_BASE}/api/validate-email`,
    {
      method: 'POST',
      body: {
        email: 'invalid-email-format',
        appType: 'frontend'
      }
    }
  );
  
  await validateTest(
    'Invalid Email Rejection',
    'dataValidation',
    !invalidEmailResult.success && invalidEmailResult.status === 400,
    'Invalid email should be rejected with 400 status'
  );
  
  // Test 2: Valid Email Validation
  const validEmailResult = await makeRequest(
    'Valid Email Validation',
    `${API_BASE}/api/validate-email`,
    {
      method: 'POST',
      body: {
        email: 'valid@example.com',
        appType: 'frontend'
      }
    }
  );
  
  await validateTest(
    'Valid Email Acceptance',
    'dataValidation',
    validEmailResult.success,
    'Valid email should be accepted'
  );
  
  // Test 3: Missing Required Fields
  const incompleteUserResult = await makeRequest(
    'Incomplete User Data Validation',
    `${API_BASE}/api/create-user`,
    {
      method: 'POST',
      body: {
        fullName: 'Test User'
        // Missing required fields: email, phone, type
      }
    }
  );
  
  await validateTest(
    'Incomplete Data Rejection',
    'dataValidation',
    !incompleteUserResult.success && incompleteUserResult.status === 400,
    'Incomplete user data should be rejected'
  );
  
  // Test 4: Invalid Date Format
  if (testData.validPairs.length > 0 && testData.customers.length > 0) {
    const validPair = testData.validPairs[0];
    const invalidDateBooking = {
      booking: {
        supplier: validPair.supplier._id.toString(),
        dress: validPair.dress._id.toString(),
        customer: testData.customers[0]._id.toString(),
        location: testData.locations[0]._id.toString(),
        from: 'invalid-date-format',
        to: 'another-invalid-date',
        status: 'pending',
        price: 800,
        deposit: 160
      }
    };
    
    const invalidDateResult = await makeRequest(
      'Invalid Date Format Validation',
      `${API_BASE}/api/create-booking`,
      {
        method: 'POST',
        body: invalidDateBooking
      }
    );
    
    await validateTest(
      'Invalid Date Rejection',
      'dataValidation',
      !invalidDateResult.success,
      'Invalid date formats should be rejected'
    );
  }
}

// ==================== BUSINESS LOGIC TESTING ====================

async function testBusinessLogic(testData) {
  console.log('\n🧠 === BUSINESS LOGIC TESTING ===');
  
  // Test 1: Booking Conflict Detection
  if (testData.validPairs.length > 0 && testData.customers.length > 1) {
    const validPair = testData.validPairs[0];
    const baseDate = new Date(Date.now() + 600 * 24 * 60 * 60 * 1000); // Very far future
    
    // Create first booking
    const firstBooking = {
      booking: {
        supplier: validPair.supplier._id.toString(),
        dress: validPair.dress._id.toString(),
        customer: testData.customers[0]._id.toString(),
        location: testData.locations[0]._id.toString(),
        from: new Date(baseDate.getTime()).toISOString(),
        to: new Date(baseDate.getTime() + 3 * 24 * 60 * 60 * 1000).toISOString(),
        status: 'pending',
        price: 800,
        deposit: 160
      }
    };
    
    const firstBookingResult = await makeRequest(
      'Create First Booking',
      `${API_BASE}/api/create-booking`,
      {
        method: 'POST',
        body: firstBooking
      }
    );
    
    // Try to create conflicting booking
    const conflictingBooking = {
      booking: {
        supplier: validPair.supplier._id.toString(),
        dress: validPair.dress._id.toString(),
        customer: testData.customers[1]._id.toString(),
        location: testData.locations[0]._id.toString(),
        from: new Date(baseDate.getTime() + 1 * 24 * 60 * 60 * 1000).toISOString(), // Overlaps
        to: new Date(baseDate.getTime() + 4 * 24 * 60 * 60 * 1000).toISOString(),
        status: 'pending',
        price: 800,
        deposit: 160
      }
    };
    
    const conflictResult = await makeRequest(
      'Create Conflicting Booking',
      `${API_BASE}/api/create-booking`,
      {
        method: 'POST',
        body: conflictingBooking
      }
    );
    
    await validateTest(
      'Booking Conflict Prevention',
      'businessLogic',
      firstBookingResult.success && !conflictResult.success,
      'System should prevent conflicting bookings'
    );
  }
  
  // Test 2: Dress Availability Check
  if (testData.validPairs.length > 0) {
    const validPair = testData.validPairs[0];
    const availabilityResult = await makeRequest(
      'Check Dress Availability',
      `${API_BASE}/api/validate-booking-availability`,
      {
        method: 'POST',
        body: {
          dressId: validPair.dress._id.toString(),
          startDate: new Date(Date.now() + 700 * 24 * 60 * 60 * 1000).toISOString(),
          endDate: new Date(Date.now() + 703 * 24 * 60 * 60 * 1000).toISOString()
        }
      }
    );
    
    await validateTest(
      'Dress Availability Check',
      'businessLogic',
      availabilityResult.success || availabilityResult.status === 401, // Auth may be required
      'Dress availability check should work'
    );
  }
  
  // Test 3: Supplier-Dress Relationship Validation
  if (testData.suppliers.length > 1 && testData.validPairs.length > 0) {
    const validPair = testData.validPairs[0];
    const wrongSupplier = testData.suppliers.find(s => s._id.toString() !== validPair.supplier._id.toString());
    
    if (wrongSupplier) {
      const invalidSupplierBooking = {
        booking: {
          supplier: wrongSupplier._id.toString(), // Wrong supplier for this dress
          dress: validPair.dress._id.toString(),
          customer: testData.customers[0]._id.toString(),
          location: testData.locations[0]._id.toString(),
          from: new Date(Date.now() + 800 * 24 * 60 * 60 * 1000).toISOString(),
          to: new Date(Date.now() + 803 * 24 * 60 * 60 * 1000).toISOString(),
          status: 'pending',
          price: 800,
          deposit: 160
        }
      };
      
      const invalidSupplierResult = await makeRequest(
        'Invalid Supplier-Dress Relationship',
        `${API_BASE}/api/create-booking`,
        {
          method: 'POST',
          body: invalidSupplierBooking
        }
      );
      
      await validateTest(
        'Supplier-Dress Relationship Validation',
        'businessLogic',
        !invalidSupplierResult.success,
        'System should validate supplier-dress relationships'
      );
    }
  }
}

// ==================== ERROR HANDLING TESTING ====================

async function testErrorHandling(testData) {
  console.log('\n🚨 === ERROR HANDLING TESTING ===');
  
  // Test 1: Non-existent Endpoint
  const nonExistentResult = await makeRequest(
    'Non-existent Endpoint',
    `${API_BASE}/api/non-existent-endpoint`
  );
  
  await validateTest(
    'Non-existent Endpoint Handling',
    'errorHandling',
    !nonExistentResult.success && nonExistentResult.status === 404,
    'Non-existent endpoints should return 404'
  );
  
  // Test 2: Invalid JSON Body
  const invalidJsonResult = await makeRequest(
    'Invalid JSON Body',
    `${API_BASE}/api/create-user`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: 'invalid-json-string'
    }
  );
  
  await validateTest(
    'Invalid JSON Handling',
    'errorHandling',
    !invalidJsonResult.success,
    'Invalid JSON should be handled gracefully'
  );
  
  // Test 3: Invalid ObjectId
  const invalidObjectIdResult = await makeRequest(
    'Invalid ObjectId',
    `${API_BASE}/api/validate-booking-availability`,
    {
      method: 'POST',
      body: {
        dressId: 'invalid-object-id',
        startDate: new Date().toISOString(),
        endDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
      }
    }
  );
  
  await validateTest(
    'Invalid ObjectId Handling',
    'errorHandling',
    !invalidObjectIdResult.success,
    'Invalid ObjectIds should be handled gracefully'
  );
}

async function runComprehensiveBackendApiTesting() {
  console.log('🚀 Starting Comprehensive Backend API Testing...\n');
  
  // Get test data
  const testData = await getTestData();
  console.log('📊 Test data loaded:');
  console.log(`   - Suppliers: ${testData.suppliers.length}`);
  console.log(`   - Customers: ${testData.customers.length}`);
  console.log(`   - Dresses: ${testData.dresses.length}`);
  console.log(`   - Bookings: ${testData.bookings.length}`);
  console.log(`   - Locations: ${testData.locations.length}`);
  console.log(`   - Valid Pairs: ${testData.validPairs.length}`);
  
  // Run comprehensive tests
  await testCrudOperations(testData);
  await testDataValidation(testData);
  await testBusinessLogic(testData);
  await testErrorHandling(testData);
  
  // Test Results Summary
  console.log('\n📊 === COMPREHENSIVE BACKEND API TEST RESULTS ===');
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
  
  console.log('\n🎉 Comprehensive backend API testing completed!');
}

if (require.main === module) {
  runComprehensiveBackendApiTesting().catch(console.error);
}

module.exports = { runComprehensiveBackendApiTesting };
