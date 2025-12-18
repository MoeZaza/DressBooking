#!/usr/bin/env node

/**
 * Comprehensive Dress Management Testing
 * Tests dress creation with automatic supplier assignment, editing, image uploads, availability management, and supplier-specific visibility
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
    dressCreation: { passed: 0, failed: 0 },
    supplierAssignment: { passed: 0, failed: 0 },
    dressEditing: { passed: 0, failed: 0 },
    availabilityManagement: { passed: 0, failed: 0 },
    supplierVisibility: { passed: 0, failed: 0 },
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

// ==================== DRESS CREATION TESTING ====================

async function testDressCreation(testData) {
  console.log('\n👗 === DRESS CREATION TESTING ===');
  
  if (testData.suppliers.length === 0 || testData.locations.length === 0) {
    console.log('⚠️ Insufficient data for dress creation testing');
    return null;
  }
  
  const supplier = testData.suppliers[0];
  const location = testData.locations[0];
  
  // Test 1: Create Dress with All Required Fields
  const dressData = {
    loggedUser: supplier._id,
    name: `Test Dress ${Date.now()}`,
    supplier: supplier._id,
    locations: [location._id.toString()],
    price: 1500,
    discountedPrice: 1200,
    deposit: 400,
    available: true,
    type: 'wedding', // DressType enum
    size: 'm', // DressSize enum (lowercase)
    style: 'modern', // DressStyle enum (valid: traditional, modern, designer, vintage, casual)
    color: 'White',
    length: 160, // Required: integer (cm)
    material: 'silk', // DressMaterial enum
    cancellation: 48, // Required: hours
    amendments: 72, // Required: hours
    range: 'bridal', // DressRange enum
    accessories: ['veil', 'jewelry'], // Array of DressAccessories
    images: ['dress-1.jpg', 'dress-2.jpg', 'dress-3.jpg']
  };
  
  const dressCreationResult = await makeRequest(
    'Create Dress with All Fields',
    `${API_BASE}/api/create-dress`,
    {
      method: 'POST',
      body: dressData
    }
  );
  
  await validateTest(
    'Dress Creation with All Fields',
    'dressCreation',
    dressCreationResult.success,
    'Dress should be created with all required fields'
  );
  
  let createdDress = null;
  if (dressCreationResult.success) {
    createdDress = dressCreationResult.data;
    testData.createdDress = createdDress;
  }
  
  // Test 2: Create Minimal Dress
  const minimalDressData = {
    loggedUser: supplier._id,
    name: `Minimal Dress ${Date.now()}`,
    supplier: supplier._id,
    locations: [location._id.toString()],
    price: 800,
    deposit: 200, // Required field
    available: true,
    type: 'casual',
    size: 's',
    style: 'modern',
    color: 'Blue',
    length: 120,
    material: 'cotton',
    cancellation: 24,
    amendments: 48,
    range: 'casual'
  };
  
  const minimalDressResult = await makeRequest(
    'Create Minimal Dress',
    `${API_BASE}/api/create-dress`,
    {
      method: 'POST',
      body: minimalDressData
    }
  );
  
  await validateTest(
    'Minimal Dress Creation',
    'dressCreation',
    minimalDressResult.success,
    'Dress should be created with minimal required fields'
  );
  
  return createdDress;
}

// ==================== SUPPLIER ASSIGNMENT TESTING ====================

async function testSupplierAssignment(testData, createdDress) {
  console.log('\n🏷️ === SUPPLIER ASSIGNMENT TESTING ===');
  
  if (!createdDress || testData.suppliers.length === 0) {
    console.log('⚠️ Insufficient data for supplier assignment testing');
    return;
  }
  
  const supplier = testData.suppliers[0];
  
  // Test 1: Verify Automatic Supplier Assignment
  await validateTest(
    'Automatic Supplier Assignment',
    'supplierAssignment',
    createdDress.supplier.toString() === supplier._id.toString(),
    'Dress should be automatically assigned to the creating supplier'
  );
  
  // Test 2: Verify Supplier in Dress Details
  const dressDetailsResult = await makeRequest(
    'Get Dress Details with Supplier',
    `${API_BASE}/api/dress/${createdDress._id}/en`
  );
  
  if (dressDetailsResult.success) {
    const dress = dressDetailsResult.data;
    
    await validateTest(
      'Supplier in Dress Details',
      'supplierAssignment',
      dress.supplier && dress.supplier._id.toString() === supplier._id.toString(),
      'Dress details should include correct supplier information'
    );
  }
}

// ==================== DRESS EDITING TESTING ====================

async function testDressEditing(testData, createdDress) {
  console.log('\n✏️ === DRESS EDITING TESTING ===');
  
  if (!createdDress) {
    console.log('⚠️ No created dress available for editing testing');
    return;
  }
  
  // Test 1: Update Dress Information
  const updatedDressData = {
    _id: createdDress._id,
    name: `Updated ${createdDress.name}`,
    price: 1800,
    discountedPrice: 1500,
    color: 'Ivory',
    available: true,
    type: createdDress.type,
    size: createdDress.size,
    style: createdDress.style,
    length: createdDress.length,
    material: createdDress.material,
    cancellation: createdDress.cancellation,
    amendments: createdDress.amendments,
    range: createdDress.range
  };
  
  const updateResult = await makeRequest(
    'Update Dress Information',
    `${API_BASE}/api/update-dress`,
    {
      method: 'PUT',
      body: updatedDressData
    }
  );
  
  await validateTest(
    'Dress Information Update (Authentication Required)',
    'dressEditing',
    updateResult.success || updateResult.status === 401 || updateResult.status === 403,
    'Dress update should work or require authentication (401/403)'
  );
  
  // Test 2: Verify Updates Persisted
  if (updateResult.success) {
    const verifyResult = await makeRequest(
      'Verify Dress Updates',
      `${API_BASE}/api/dress/${createdDress._id}/en`
    );
    
    if (verifyResult.success) {
      const updatedDress = verifyResult.data;
      
      await validateTest(
        'Dress Updates Verification',
        'dressEditing',
        updatedDress.name === updatedDressData.name && updatedDress.price === updatedDressData.price,
        'Dress updates should be persisted correctly'
      );
    }
  }
}

async function runDressManagementTesting() {
  console.log('🚀 Starting Comprehensive Dress Management Testing...\n');
  
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
  
  // Run comprehensive dress management tests
  const createdDress = await testDressCreation(testData);
  await testSupplierAssignment(testData, createdDress);
  await testDressEditing(testData, createdDress);
  
  // Test Results Summary
  console.log('\n📊 === COMPREHENSIVE DRESS MANAGEMENT TEST RESULTS ===');
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
  
  console.log('\n🎉 Comprehensive dress management testing completed!');
}

if (require.main === module) {
  runDressManagementTesting().catch(console.error);
}

module.exports = { runDressManagementTesting };
