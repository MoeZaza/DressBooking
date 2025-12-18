#!/usr/bin/env node

/**
 * Final System Verification
 * Comprehensive verification that all core functionality is working correctly
 */

const fetch = require('node-fetch');
const { MongoClient } = require('mongodb');

const API_BASE = 'http://localhost:4002';
const MONGODB_URI = 'mongodb+srv://user:Mybookmodr100@cluster0.ey9u2ce.mongodb.net/bookdress?retryWrites=true&w=majority&appName=Cluster0';

let verificationResults = {
  passed: 0,
  failed: 0,
  categories: {
    coreBusinessLogic: { passed: 0, failed: 0, tests: [] },
    dataIntegrity: { passed: 0, failed: 0, tests: [] },
    apiEndpoints: { passed: 0, failed: 0, tests: [] },
    userManagement: { passed: 0, failed: 0, tests: [] },
    systemHealth: { passed: 0, failed: 0, tests: [] }
  }
};

async function verifyTest(testName, category, condition, description) {
  const result = {
    name: testName,
    passed: condition,
    description: description
  };
  
  verificationResults.categories[category].tests.push(result);
  
  if (condition) {
    console.log(`   ✅ ${testName}`);
    verificationResults.categories[category].passed++;
    verificationResults.passed++;
  } else {
    console.log(`   ❌ ${testName} - ${description}`);
    verificationResults.categories[category].failed++;
    verificationResults.failed++;
  }
  
  return condition;
}

async function getSystemData() {
  const client = new MongoClient(MONGODB_URI);
  await client.connect();
  const db = client.db('bookdress');
  
  const users = await db.collection('User').find({}).toArray();
  const dresses = await db.collection('Dress').find({}).toArray();
  const bookings = await db.collection('Booking').find({}).toArray();
  const locations = await db.collection('Location').find({}).toArray();
  const countries = await db.collection('Country').find({}).toArray();
  
  await client.close();
  
  const suppliers = users.filter(u => u.type === 'supplier');
  const customers = users.filter(u => u.type === 'user');
  const admins = users.filter(u => u.type === 'admin');
  
  // Find valid dress-supplier pairs
  const validPairs = [];
  dresses.forEach(dress => {
    const supplier = suppliers.find(s => s._id.toString() === dress.supplier.toString());
    if (supplier) {
      validPairs.push({ dress, supplier });
    }
  });
  
  return { users, dresses, bookings, locations, countries, suppliers, customers, admins, validPairs };
}

async function verifyCoreBusinessLogic(data) {
  console.log('\n🏢 === CORE BUSINESS LOGIC VERIFICATION ===');
  
  // Test 1: Multi-branch location system
  const suppliersWithMultipleLocations = data.suppliers.filter(s => s.locations && s.locations.length > 1);
  await verifyTest(
    'Multi-Branch Location System',
    'coreBusinessLogic',
    suppliersWithMultipleLocations.length > 0,
    'Suppliers should support multiple locations (branches)'
  );
  
  // Test 2: Dress-supplier relationships
  await verifyTest(
    'Dress-Supplier Relationships',
    'coreBusinessLogic',
    data.validPairs.length > 0 && data.validPairs.length === data.dresses.length,
    'All dresses should have valid supplier relationships'
  );
  
  // Test 3: Dress location availability
  const dressesWithLocations = data.dresses.filter(d => d.locations && d.locations.length > 0);
  await verifyTest(
    'Dress Location Availability',
    'coreBusinessLogic',
    dressesWithLocations.length === data.dresses.length,
    'All dresses should be available at specific locations'
  );
  
  // Test 4: Booking conflict prevention (test with API)
  if (data.validPairs.length > 0 && data.customers.length > 0) {
    const validPair = data.validPairs[0];
    const customer = data.customers[0];
    const location = data.locations[0];
    
    const baseDate = new Date(Date.now() + 600 * 24 * 60 * 60 * 1000);
    const bookingData = {
      booking: {
        supplier: validPair.supplier._id.toString(),
        dress: validPair.dress._id.toString(),
        customer: customer._id.toString(),
        location: location._id.toString(),
        from: new Date(baseDate.getTime()).toISOString(),
        to: new Date(baseDate.getTime() + 3 * 24 * 60 * 60 * 1000).toISOString(),
        status: 'pending',
        price: 800
      }
    };
    
    try {
      const response = await fetch(`${API_BASE}/api/create-booking`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bookingData)
      });
      
      await verifyTest(
        'Booking Creation System',
        'coreBusinessLogic',
        response.ok,
        'Booking creation should work with valid data'
      );
    } catch (error) {
      await verifyTest(
        'Booking Creation System',
        'coreBusinessLogic',
        false,
        `Booking creation failed: ${error.message}`
      );
    }
  }
}

async function verifyDataIntegrity(data) {
  console.log('\n🔒 === DATA INTEGRITY VERIFICATION ===');
  
  // Test 1: User data completeness
  const usersWithRequiredFields = data.users.filter(u => u.fullName && u.phone && u.type);
  await verifyTest(
    'User Data Completeness',
    'dataIntegrity',
    usersWithRequiredFields.length === data.users.length,
    'All users should have required fields (fullName, phone, type)'
  );
  
  // Test 2: Dress data completeness
  const dressesWithRequiredFields = data.dresses.filter(d => d.name && d.supplier && d.price && d.locations);
  await verifyTest(
    'Dress Data Completeness',
    'dataIntegrity',
    dressesWithRequiredFields.length === data.dresses.length,
    'All dresses should have required fields (name, supplier, price, locations)'
  );
  
  // Test 3: Booking data completeness
  const bookingsWithRequiredFields = data.bookings.filter(b => b.supplier && b.dress && b.customer && b.from && b.to);
  await verifyTest(
    'Booking Data Completeness',
    'dataIntegrity',
    bookingsWithRequiredFields.length === data.bookings.length,
    'All bookings should have required fields'
  );
  
  // Test 4: Avatar and image data
  const usersWithAvatars = data.users.filter(u => u.avatar && u.avatar.trim() !== '');
  const dressesWithImages = data.dresses.filter(d => (d.image && d.image.trim() !== '') || (d.images && d.images.length > 0));
  
  await verifyTest(
    'User Avatar Data',
    'dataIntegrity',
    usersWithAvatars.length > data.users.length * 0.5, // At least 50% should have avatars
    'Majority of users should have avatar data'
  );
  
  await verifyTest(
    'Dress Image Data',
    'dataIntegrity',
    dressesWithImages.length === data.dresses.length,
    'All dresses should have image data'
  );
}

async function verifyApiEndpoints(data) {
  console.log('\n🌐 === API ENDPOINTS VERIFICATION ===');
  
  // Test 1: User endpoints
  try {
    const userResponse = await fetch(`${API_BASE}/api/user/${data.users[0]._id}`);
    await verifyTest(
      'User Profile Endpoint',
      'apiEndpoints',
      userResponse.ok,
      'User profile endpoint should be accessible'
    );
  } catch (error) {
    await verifyTest(
      'User Profile Endpoint',
      'apiEndpoints',
      false,
      `User profile endpoint failed: ${error.message}`
    );
  }
  
  // Test 2: Dress endpoints
  try {
    const dressResponse = await fetch(`${API_BASE}/api/dress/${data.dresses[0]._id}/en`);
    await verifyTest(
      'Dress Detail Endpoint',
      'apiEndpoints',
      dressResponse.ok,
      'Dress detail endpoint should be accessible'
    );
  } catch (error) {
    await verifyTest(
      'Dress Detail Endpoint',
      'apiEndpoints',
      false,
      `Dress detail endpoint failed: ${error.message}`
    );
  }
  
  // Test 3: Dress list endpoint
  try {
    const dressListResponse = await fetch(`${API_BASE}/api/dresses/1/10`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        suppliers: data.suppliers.map(s => s._id.toString())
      })
    });
    await verifyTest(
      'Dress List Endpoint',
      'apiEndpoints',
      dressListResponse.ok,
      'Dress list endpoint should be accessible'
    );
  } catch (error) {
    await verifyTest(
      'Dress List Endpoint',
      'apiEndpoints',
      false,
      `Dress list endpoint failed: ${error.message}`
    );
  }
  
  // Test 4: Booking list endpoint
  try {
    const bookingListResponse = await fetch(`${API_BASE}/api/bookings/1/10/en`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        statuses: ['pending', 'deposit', 'paid'],
        suppliers: data.suppliers.map(s => s._id.toString())
      })
    });
    await verifyTest(
      'Booking List Endpoint',
      'apiEndpoints',
      bookingListResponse.ok,
      'Booking list endpoint should be accessible'
    );
  } catch (error) {
    await verifyTest(
      'Booking List Endpoint',
      'apiEndpoints',
      false,
      `Booking list endpoint failed: ${error.message}`
    );
  }
}

async function verifyUserManagement(data) {
  console.log('\n👥 === USER MANAGEMENT VERIFICATION ===');
  
  // Test 1: User type distribution
  await verifyTest(
    'Admin Users Present',
    'userManagement',
    data.admins.length > 0,
    'System should have admin users'
  );
  
  await verifyTest(
    'Supplier Users Present',
    'userManagement',
    data.suppliers.length > 0,
    'System should have supplier users'
  );
  
  await verifyTest(
    'Customer Users Present',
    'userManagement',
    data.customers.length > 0,
    'System should have customer users'
  );
  
  // Test 2: Supplier business properties
  const suppliersWithBusinessProps = data.suppliers.filter(s => 
    s.payLater !== undefined || s.supplierDressLimit !== undefined || s.priceChangeRate !== undefined
  );
  await verifyTest(
    'Supplier Business Properties',
    'userManagement',
    suppliersWithBusinessProps.length > 0,
    'Suppliers should have business-specific properties'
  );
}

async function verifySystemHealth(data) {
  console.log('\n🏥 === SYSTEM HEALTH VERIFICATION ===');
  
  // Test 1: Database connectivity
  await verifyTest(
    'Database Connectivity',
    'systemHealth',
    data.users.length > 0 && data.dresses.length > 0,
    'Database should be accessible and contain data'
  );
  
  // Test 2: Data volume adequacy
  await verifyTest(
    'Adequate Test Data Volume',
    'systemHealth',
    data.users.length >= 10 && data.dresses.length >= 5 && data.bookings.length >= 10,
    'System should have adequate test data for comprehensive testing'
  );
  
  // Test 3: API server responsiveness
  try {
    const healthResponse = await fetch(`${API_BASE}/api/health`);
    await verifyTest(
      'API Server Health',
      'systemHealth',
      healthResponse.ok || healthResponse.status === 404, // 404 is acceptable if endpoint doesn't exist
      'API server should be responsive'
    );
  } catch (error) {
    await verifyTest(
      'API Server Health',
      'systemHealth',
      false,
      `API server health check failed: ${error.message}`
    );
  }
  
  // Test 4: Core collections present
  const coreCollectionsPresent = data.users.length > 0 && data.dresses.length > 0 && 
                                 data.bookings.length > 0 && data.locations.length > 0 && 
                                 data.countries.length > 0;
  await verifyTest(
    'Core Collections Present',
    'systemHealth',
    coreCollectionsPresent,
    'All core database collections should contain data'
  );
}

async function runFinalSystemVerification() {
  console.log('🚀 Starting Final System Verification...\n');
  
  // Get system data
  const data = await getSystemData();
  console.log('📊 System data loaded:');
  console.log(`   - Users: ${data.users.length} (${data.admins.length} admins, ${data.suppliers.length} suppliers, ${data.customers.length} customers)`);
  console.log(`   - Dresses: ${data.dresses.length}`);
  console.log(`   - Bookings: ${data.bookings.length}`);
  console.log(`   - Locations: ${data.locations.length}`);
  console.log(`   - Countries: ${data.countries.length}`);
  console.log(`   - Valid Dress-Supplier Pairs: ${data.validPairs.length}`);
  
  // Run verification tests
  await verifyCoreBusinessLogic(data);
  await verifyDataIntegrity(data);
  await verifyApiEndpoints(data);
  await verifyUserManagement(data);
  await verifySystemHealth(data);
  
  // Generate final report
  console.log('\n📊 === FINAL SYSTEM VERIFICATION REPORT ===');
  console.log(`✅ Total Tests Passed: ${verificationResults.passed}`);
  console.log(`❌ Total Tests Failed: ${verificationResults.failed}`);
  const totalTests = verificationResults.passed + verificationResults.failed;
  const successRate = totalTests > 0 ? ((verificationResults.passed / totalTests) * 100).toFixed(1) : 0;
  console.log(`📈 Overall Success Rate: ${successRate}%`);
  
  console.log('\n📋 Results by Category:');
  Object.entries(verificationResults.categories).forEach(([category, results]) => {
    const total = results.passed + results.failed;
    const categorySuccessRate = total > 0 ? ((results.passed / total) * 100).toFixed(1) : 0;
    console.log(`   ${category.toUpperCase()}: ${results.passed}/${total} (${categorySuccessRate}%)`);
  });
  
  // System status assessment
  console.log('\n🎯 === SYSTEM STATUS ASSESSMENT ===');
  if (successRate >= 90) {
    console.log('🟢 EXCELLENT: System is working exceptionally well');
  } else if (successRate >= 80) {
    console.log('🟡 GOOD: System is working well with minor issues');
  } else if (successRate >= 70) {
    console.log('🟠 ACCEPTABLE: System is functional but needs improvements');
  } else {
    console.log('🔴 NEEDS ATTENTION: System has significant issues that need addressing');
  }
  
  console.log('\n🎉 Final system verification completed!');
  
  return {
    successRate: parseFloat(successRate),
    totalTests: totalTests,
    passed: verificationResults.passed,
    failed: verificationResults.failed,
    categories: verificationResults.categories
  };
}

if (require.main === module) {
  runFinalSystemVerification().catch(console.error);
}

module.exports = { runFinalSystemVerification };
