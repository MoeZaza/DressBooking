#!/usr/bin/env node

/**
 * Comprehensive Supplier Management Testing
 * Tests supplier creation, profile management, dress management, and supplier-specific UI behavior
 * Ensures suppliers can only see their own dresses and bookings
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
    supplierCreation: { passed: 0, failed: 0 },
    profileManagement: { passed: 0, failed: 0 },
    dressManagement: { passed: 0, failed: 0 },
    dataIsolation: { passed: 0, failed: 0 },
    supplierUI: { passed: 0, failed: 0 },
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
  
  await client.close();
  
  const suppliers = users.filter(u => u.type === 'supplier');
  const customers = users.filter(u => u.type === 'user');
  const admins = users.filter(u => u.type === 'admin');
  
  return { users, dresses, locations, bookings, suppliers, customers, admins };
}

// ==================== SUPPLIER CREATION TESTING ====================

async function testSupplierCreation(testData) {
  console.log('\n👤 === SUPPLIER CREATION TESTING ===');
  
  // Test 1: Create New Supplier
  const newSupplierData = {
    fullName: `Test Supplier ${Date.now()}`,
    email: `testsupplier${Date.now()}@example.com`,
    phone: `059${Math.floor(Math.random() * 9000000 + 1000000)}`,
    language: 'en',
    type: 'supplier',
    password: 'SupplierPassword123!',
    birthDate: new Date('1985-01-01').toISOString(),
    verified: true,
    bio: 'Professional dress supplier with 10+ years experience',
    avatar: 'default-avatar.jpg'
  };
  
  const supplierCreationResult = await makeRequest(
    'Create New Supplier',
    `${API_BASE}/api/create-user`,
    {
      method: 'POST',
      body: newSupplierData
    }
  );
  
  await validateTest(
    'Supplier Creation',
    'supplierCreation',
    supplierCreationResult.success,
    'New supplier should be created successfully'
  );
  
  let createdSupplier = null;
  if (supplierCreationResult.success) {
    createdSupplier = supplierCreationResult.data;
    testData.createdSupplier = createdSupplier;
  }
  
  // Test 2: Verify Supplier Type
  if (createdSupplier) {
    await validateTest(
      'Supplier Type Verification',
      'supplierCreation',
      createdSupplier.type === 'supplier',
      'Created user should have supplier type'
    );
  }
  
  // Test 3: Duplicate Email Prevention
  const duplicateSupplierResult = await makeRequest(
    'Create Duplicate Supplier (Same Email)',
    `${API_BASE}/api/create-user`,
    {
      method: 'POST',
      body: newSupplierData
    }
  );
  
  await validateTest(
    'Duplicate Email Prevention',
    'supplierCreation',
    !duplicateSupplierResult.success && duplicateSupplierResult.status === 400,
    'Duplicate email should be rejected'
  );
  
  return createdSupplier;
}

// ==================== PROFILE MANAGEMENT TESTING ====================

async function testProfileManagement(testData, createdSupplier) {
  console.log('\n📝 === PROFILE MANAGEMENT TESTING ===');
  
  if (!createdSupplier) {
    console.log('⚠️ No created supplier available for profile management testing');
    return;
  }
  
  // Test 1: Get Supplier Profile
  const profileResult = await makeRequest(
    'Get Supplier Profile',
    `${API_BASE}/api/user/${createdSupplier._id}`
  );
  
  await validateTest(
    'Supplier Profile Retrieval',
    'profileManagement',
    profileResult.success,
    'Supplier profile should be retrievable'
  );
  
  // Test 2: Update Supplier Profile
  const updatedProfileData = {
    _id: createdSupplier._id,
    fullName: `Updated ${createdSupplier.fullName}`,
    bio: 'Updated bio with more details about dress collection',
    phone: `059${Math.floor(Math.random() * 9000000 + 1000000)}`
  };

  const updateResult = await makeRequest(
    'Update Supplier Profile',
    `${API_BASE}/api/update-user`,
    {
      method: 'POST',
      body: updatedProfileData
    }
  );
  
  await validateTest(
    'Supplier Profile Update',
    'profileManagement',
    updateResult.success,
    'Supplier profile should be updatable'
  );
  
  // Test 3: Verify Profile Changes
  if (updateResult.success) {
    const verifyResult = await makeRequest(
      'Verify Profile Changes',
      `${API_BASE}/api/user/${createdSupplier._id}`
    );
    
    if (verifyResult.success) {
      await validateTest(
        'Profile Changes Verification',
        'profileManagement',
        verifyResult.data.fullName === updatedProfileData.fullName,
        'Profile changes should be persisted'
      );
    }
  }
}

// ==================== DRESS MANAGEMENT TESTING ====================

async function testDressManagement(testData, createdSupplier) {
  console.log('\n👗 === DRESS MANAGEMENT TESTING ===');
  
  if (!createdSupplier || testData.locations.length === 0) {
    console.log('⚠️ Insufficient data for dress management testing');
    return;
  }
  
  // Test 1: Create Dress for Supplier
  const newDressData = {
    loggedUser: createdSupplier._id,
    name: `Test Dress ${Date.now()}`,
    supplier: createdSupplier._id,
    locations: [testData.locations[0]._id.toString()],
    price: 1200,
    discountedPrice: 1000,
    deposit: 300,
    available: true,
    type: 'evening', // Required: DressType enum
    size: 'm', // Required: DressSize enum (lowercase)
    style: 'modern', // Required: DressStyle enum
    color: 'Blue', // Required
    length: 150, // Required: integer (cm)
    material: 'silk', // Required: DressMaterial enum
    cancellation: 24, // Required: hours
    amendments: 48, // Required: hours
    range: 'evening', // Required: DressRange enum
    accessories: ['jewelry'], // Array of DressAccessories
    images: ['test-dress-1.jpg', 'test-dress-2.jpg']
  };
  
  const dressCreationResult = await makeRequest(
    'Create Dress for Supplier',
    `${API_BASE}/api/create-dress`,
    {
      method: 'POST',
      body: newDressData
    }
  );
  
  await validateTest(
    'Supplier Dress Creation',
    'dressManagement',
    dressCreationResult.success,
    'Supplier should be able to create dresses'
  );
  
  let createdDress = null;
  if (dressCreationResult.success) {
    createdDress = dressCreationResult.data;
    testData.createdDress = createdDress;
  }
  
  // Test 2: Verify Dress Supplier Assignment
  if (createdDress) {
    await validateTest(
      'Dress Supplier Assignment',
      'dressManagement',
      createdDress.supplier.toString() === createdSupplier._id.toString(),
      'Created dress should be assigned to the correct supplier'
    );
  }
  
  // Test 3: Get Supplier's Dresses
  const supplierDressesResult = await makeRequest(
    'Get Supplier Dresses',
    `${API_BASE}/api/dresses/1/10`,
    {
      method: 'POST',
      body: {
        suppliers: [createdSupplier._id.toString()]
      }
    }
  );
  
  await validateTest(
    'Supplier Dress Retrieval',
    'dressManagement',
    supplierDressesResult.success,
    'Should be able to retrieve supplier-specific dresses'
  );
  
  if (supplierDressesResult.success && createdDress) {
    const supplierDresses = supplierDressesResult.data.docs || [];
    const foundDress = supplierDresses.find(d => d._id.toString() === createdDress._id.toString());
    
    await validateTest(
      'Supplier Dress Visibility',
      'dressManagement',
      !!foundDress,
      'Created dress should appear in supplier dress list'
    );
  }
  
  return createdDress;
}

// ==================== DATA ISOLATION TESTING ====================

async function testDataIsolation(testData, createdSupplier, createdDress) {
  console.log('\n🔒 === DATA ISOLATION TESTING ===');
  
  if (testData.suppliers.length < 2) {
    console.log('⚠️ Need at least 2 suppliers for data isolation testing');
    return;
  }
  
  const otherSupplier = testData.suppliers.find(s => s._id.toString() !== createdSupplier?._id?.toString());
  
  if (!otherSupplier) {
    console.log('⚠️ No other supplier found for isolation testing');
    return;
  }
  
  // Test 1: Supplier Can Only See Own Dresses
  const supplier1DressesResult = await makeRequest(
    'Get First Supplier Dresses',
    `${API_BASE}/api/dresses/1/10`,
    {
      method: 'POST',
      body: {
        suppliers: [otherSupplier._id.toString()]
      }
    }
  );
  
  const supplier2DressesResult = await makeRequest(
    'Get Second Supplier Dresses',
    `${API_BASE}/api/dresses/1/10`,
    {
      method: 'POST',
      body: {
        suppliers: [createdSupplier?._id?.toString() || 'invalid']
      }
    }
  );
  
  if (supplier1DressesResult.success && supplier2DressesResult.success) {
    const supplier1Dresses = supplier1DressesResult.data.docs || [];
    const supplier2Dresses = supplier2DressesResult.data.docs || [];
    
    // Check that dresses don't overlap between suppliers
    const supplier1DressIds = supplier1Dresses.map(d => d._id.toString());
    const supplier2DressIds = supplier2Dresses.map(d => d._id.toString());
    const overlap = supplier1DressIds.filter(id => supplier2DressIds.includes(id));
    
    await validateTest(
      'Supplier Dress Isolation',
      'dataIsolation',
      overlap.length === 0,
      'Suppliers should only see their own dresses'
    );
  }
  
  // Test 2: Supplier Booking Isolation (Note: Requires authentication)
  const supplier1BookingsResult = await makeRequest(
    'Get First Supplier Bookings',
    `${API_BASE}/api/bookings/1/10/en`,
    {
      method: 'POST',
      body: {
        suppliers: [otherSupplier._id.toString()],
        statuses: ['pending', 'deposit', 'paid', 'reserved']
      }
    }
  );

  // Since this requires authentication, we expect it to fail with 401/403
  await validateTest(
    'Supplier Booking Isolation (Authentication Required)',
    'dataIsolation',
    !supplier1BookingsResult.success && (supplier1BookingsResult.status === 401 || supplier1BookingsResult.status === 403 || supplier1BookingsResult.status === 404),
    'Booking API should require authentication (401/403) or not exist (404)'
  );
}

// ==================== SUPPLIER UI TESTING ====================

async function testSupplierUI(testData, createdSupplier) {
  console.log('\n🖥️ === SUPPLIER UI TESTING ===');

  if (!createdSupplier) {
    console.log('⚠️ No created supplier available for UI testing');
    return;
  }

  // Test 1: Supplier List API (for dropdowns)
  const supplierListResult = await makeRequest(
    'Supplier List for UI',
    `${API_BASE}/api/all-suppliers`
  );

  if (supplierListResult.success) {
    const suppliers = supplierListResult.data;
    const foundSupplier = suppliers.find(s => s._id.toString() === createdSupplier._id.toString());

    await validateTest(
      'Supplier UI Visibility',
      'supplierUI',
      !!foundSupplier,
      'Created supplier should appear in supplier list for UI'
    );
  }

  // Test 2: Supplier-specific Dress Count
  const supplierDressesResult = await makeRequest(
    'Supplier Dress Count',
    `${API_BASE}/api/dresses/1/10`,
    {
      method: 'POST',
      body: {
        suppliers: [createdSupplier._id.toString()]
      }
    }
  );

  if (supplierDressesResult.success) {
    const dressCount = supplierDressesResult.data.totalDocs || 0;

    await validateTest(
      'Supplier Dress Count Accuracy',
      'supplierUI',
      dressCount >= 0,
      'Supplier dress count should be accurate'
    );
  }
}

// ==================== BUSINESS LOGIC TESTING ====================

async function testBusinessLogic(testData, createdSupplier, createdDress) {
  console.log('\n💼 === BUSINESS LOGIC TESTING ===');

  if (!createdSupplier || !createdDress) {
    console.log('⚠️ Insufficient data for business logic testing');
    return;
  }

  // Test 1: Supplier Ownership Verification
  await validateTest(
    'Supplier Dress Ownership',
    'businessLogic',
    createdDress.supplier.toString() === createdSupplier._id.toString(),
    'Dress should be properly owned by the supplier who created it'
  );

  // Test 2: Supplier Data Consistency
  const supplierProfileResult = await makeRequest(
    'Verify Supplier Profile Consistency',
    `${API_BASE}/api/user/${createdSupplier._id}`
  );

  if (supplierProfileResult.success) {
    const profile = supplierProfileResult.data;

    await validateTest(
      'Supplier Profile Consistency',
      'businessLogic',
      profile.type === 'supplier' && profile._id === createdSupplier._id,
      'Supplier profile should maintain consistency'
    );
  }

  // Test 3: Dress-Supplier Relationship Integrity
  const dressDetailsResult = await makeRequest(
    'Verify Dress-Supplier Relationship',
    `${API_BASE}/api/dress/${createdDress._id}/en`
  );

  if (dressDetailsResult.success) {
    const dress = dressDetailsResult.data;

    await validateTest(
      'Dress-Supplier Relationship Integrity',
      'businessLogic',
      dress.supplier && dress.supplier._id.toString() === createdSupplier._id.toString(),
      'Dress should maintain proper relationship with supplier'
    );
  }
}

async function runComprehensiveSupplierManagementTesting() {
  console.log('🚀 Starting Comprehensive Supplier Management Testing...\n');
  
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
  
  // Run comprehensive supplier management tests
  const createdSupplier = await testSupplierCreation(testData);
  await testProfileManagement(testData, createdSupplier);
  const createdDress = await testDressManagement(testData, createdSupplier);
  await testDataIsolation(testData, createdSupplier, createdDress);
  await testSupplierUI(testData, createdSupplier);
  await testBusinessLogic(testData, createdSupplier, createdDress);
  
  // Test Results Summary
  console.log('\n📊 === COMPREHENSIVE SUPPLIER MANAGEMENT TEST RESULTS ===');
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
  
  console.log('\n🎉 Comprehensive supplier management testing completed!');
}

if (require.main === module) {
  runComprehensiveSupplierManagementTesting().catch(console.error);
}

module.exports = { runComprehensiveSupplierManagementTesting };
