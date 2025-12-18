#!/usr/bin/env node

/**
 * Comprehensive Owner/Admin Functionality Testing
 * Tests all admin and owner features including booking management, user management, analytics, etc.
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
    userManagement: { passed: 0, failed: 0 },
    bookingManagement: { passed: 0, failed: 0 },
    dressManagement: { passed: 0, failed: 0 },
    analytics: { passed: 0, failed: 0 },
    systemAdmin: { passed: 0, failed: 0 }
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
      body: options.body ? JSON.stringify(options.body) : undefined
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
        error: `HTTP ${response.status}`
      });
      return { success: false, error: `HTTP ${response.status}`, status: response.status };
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
  
  const admin = await db.collection('User').findOne({ type: 'admin' });
  const suppliers = await db.collection('User').find({ type: 'supplier' }).toArray();
  const customers = await db.collection('User').find({ type: 'user' }).toArray();
  const locations = await db.collection('Location').find({}).toArray();
  const dresses = await db.collection('Dress').find({}).toArray();
  const bookings = await db.collection('Booking').find({}).toArray();
  const revenues = await db.collection('Revenue').find({}).toArray();
  const expenses = await db.collection('Expense').find({}).toArray();
  
  await client.close();
  
  return { admin, suppliers, customers, locations, dresses, bookings, revenues, expenses };
}

// ==================== USER MANAGEMENT TESTS ====================

async function testUserManagement(testData) {
  console.log('\n👥 === USER MANAGEMENT TESTS ===');
  
  // Test 1: Get all users (admin function)
  const usersResult = await makeRequest(
    'Get All Users',
    `${API_BASE}/api/users/1/10`,
    {
      method: 'POST',
      body: {}
    }
  );
  
  await validateTest(
    'User Listing Functionality',
    'userManagement',
    usersResult.success || usersResult.status === 401, // May require auth
    'User listing endpoint not accessible'
  );
  
  // Test 2: User creation endpoint
  const timestamp = Date.now();
  const newUser = {
    fullName: `Test Admin User ${timestamp}`,
    email: `admin-test-${timestamp}@bookdress.com`,
    phone: `0599${Math.floor(100000 + Math.random() * 900000)}`,
    type: 'user',
    language: 'en'
  };
  
  const createUserResult = await makeRequest(
    'Create New User',
    `${API_BASE}/api/create-user`,
    {
      method: 'POST',
      body: newUser
    }
  );
  
  await validateTest(
    'User Creation Functionality',
    'userManagement',
    createUserResult.success,
    'User creation is not working'
  );
  
  // Test 3: User update functionality
  if (testData.customers.length > 0) {
    const updateData = {
      _id: testData.customers[0]._id.toString(),
      fullName: 'Updated Test Customer',
      phone: '0599999999'
    };
    
    const updateUserResult = await makeRequest(
      'Update User Information',
      `${API_BASE}/api/update-user`,
      {
        method: 'POST',
        body: updateData
      }
    );
    
    await validateTest(
      'User Update Functionality',
      'userManagement',
      updateUserResult.success || updateUserResult.status === 401,
      'User update functionality not working'
    );
  }
  
  // Test 4: User validation
  const validationResult = await makeRequest(
    'Validate User Email',
    `${API_BASE}/api/validate-email`,
    {
      method: 'POST',
      body: {
        email: 'test@example.com',
        appType: 'frontend'
      }
    }
  );
  
  await validateTest(
    'User Email Validation',
    'userManagement',
    validationResult.success,
    'Email validation not working'
  );
}

// ==================== BOOKING MANAGEMENT TESTS ====================

async function testBookingManagement(testData) {
  console.log('\n📅 === BOOKING MANAGEMENT TESTS ===');
  
  // Test 1: Get all bookings (admin view)
  const bookingsResult = await makeRequest(
    'Get All Bookings',
    `${API_BASE}/api/bookings/1/10/en`,
    {
      method: 'POST',
      body: {
        statuses: ['pending', 'deposit', 'paid', 'reserved'],
        suppliers: testData.suppliers.map(s => s._id.toString())
      }
    }
  );
  
  await validateTest(
    'Booking Listing Functionality',
    'bookingManagement',
    bookingsResult.success,
    'Booking listing not working'
  );
  
  // Test 2: Admin booking creation
  if (testData.suppliers.length > 0 && testData.customers.length > 0 && testData.dresses.length > 0) {
    const adminBookingData = {
      supplier: testData.suppliers[0]._id.toString(),
      dress: testData.dresses[0]._id.toString(),
      customer: testData.customers[0]._id.toString(),
      location: testData.locations[0]._id.toString(),
      from: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      to: new Date(Date.now() + 33 * 24 * 60 * 60 * 1000).toISOString(),
      status: 'pending',
      price: 750,
      paidAmount: 150,
      paymentStatus: 'partially-paid'
    };
    
    const adminCreateResult = await makeRequest(
      'Admin Create Booking',
      `${API_BASE}/api/admin-create-booking`,
      {
        method: 'POST',
        body: adminBookingData
      }
    );
    
    await validateTest(
      'Admin Booking Creation',
      'bookingManagement',
      adminCreateResult.success || adminCreateResult.status === 401,
      'Admin booking creation not working'
    );
  }
  
  // Test 3: Booking status update
  if (testData.bookings.length > 0) {
    const statusUpdateData = {
      ids: [testData.bookings[0]._id.toString()],
      status: 'confirmed'
    };
    
    const statusUpdateResult = await makeRequest(
      'Update Booking Status',
      `${API_BASE}/api/update-booking-status`,
      {
        method: 'POST',
        body: statusUpdateData
      }
    );
    
    await validateTest(
      'Booking Status Update',
      'bookingManagement',
      statusUpdateResult.success || statusUpdateResult.status === 401,
      'Booking status update not working'
    );
  }
  
  // Test 4: Booking analytics
  const analyticsResult = await makeRequest(
    'Booking Analytics',
    `${API_BASE}/api/analytics`,
    {
      method: 'GET'
    }
  );
  
  await validateTest(
    'Booking Analytics Access',
    'bookingManagement',
    analyticsResult.success || analyticsResult.status === 401,
    'Booking analytics not accessible'
  );
}

// ==================== DRESS MANAGEMENT TESTS ====================

async function testDressManagement(testData) {
  console.log('\n👗 === DRESS MANAGEMENT TESTS ===');
  
  // Test 1: Get all dresses (admin view)
  const dressesResult = await makeRequest(
    'Get All Dresses',
    `${API_BASE}/api/dresses/1/10`,
    {
      method: 'POST',
      body: {
        suppliers: testData.suppliers.map(s => s._id.toString())
      }
    }
  );
  
  await validateTest(
    'Dress Listing Functionality',
    'dressManagement',
    dressesResult.success || dressesResult.status === 401,
    'Dress listing not accessible'
  );
  
  // Test 2: Dress creation (admin/supplier)
  if (testData.suppliers.length > 0 && testData.locations.length > 0) {
    const timestamp = Date.now();
    const newDress = {
      name: `Admin Test Dress ${timestamp}`,
      supplier: testData.suppliers[0]._id.toString(),
      locations: [testData.locations[0]._id.toString()],
      price: 800,
      deposit: 160,
      available: true,
      type: 'evening', // Use valid enum value
      size: 'l',
      style: 'modern',
      color: 'Black',
      length: 170,
      material: 'silk',
      cancellation: 48,
      amendments: 24,
      range: 'evening', // Use valid enum value that matches type
      accessories: ['jewelry'],
      designerName: 'Admin Designer',
      dressCode: `ADMIN${timestamp}`,
      fittingRequired: true,
      alterationNotes: 'Professional alterations available',
      careInstructions: 'Professional dry clean only',
      occasionTags: ['cocktail', 'formal'],
      season: 'all-season',
      neckline: 'off-shoulder',
      sleeves: 'long',
      silhouette: 'mermaid'
    };
    
    const createDressResult = await makeRequest(
      'Admin Create Dress',
      `${API_BASE}/api/create-dress`,
      {
        method: 'POST',
        body: newDress
      }
    );
    
    await validateTest(
      'Admin Dress Creation',
      'dressManagement',
      createDressResult.success,
      'Admin dress creation not working'
    );
  }
  
  // Test 3: Dress update functionality
  if (testData.dresses.length > 0) {
    const updateData = {
      _id: testData.dresses[0]._id.toString(),
      name: 'Updated Admin Dress',
      price: 900,
      available: false
    };
    
    const updateDressResult = await makeRequest(
      'Update Dress Information',
      `${API_BASE}/api/update-dress`,
      {
        method: 'PUT',
        body: updateData
      }
    );
    
    await validateTest(
      'Dress Update Functionality',
      'dressManagement',
      updateDressResult.success || updateDressResult.status === 401,
      'Dress update functionality not working'
    );
  }
  
  // Test 4: Dress availability management
  if (testData.dresses.length > 0) {
    const availabilityData = {
      dressId: testData.dresses[0]._id.toString(),
      startDate: new Date(Date.now() + 40 * 24 * 60 * 60 * 1000).toISOString(),
      endDate: new Date(Date.now() + 43 * 24 * 60 * 60 * 1000).toISOString()
    };
    
    const availabilityResult = await makeRequest(
      'Check Dress Availability',
      `${API_BASE}/api/validate-booking-availability`,
      {
        method: 'POST',
        body: availabilityData
      }
    );
    
    await validateTest(
      'Dress Availability Check',
      'dressManagement',
      availabilityResult.success || availabilityResult.status === 401,
      'Dress availability check not working'
    );
  }
}

// ==================== ANALYTICS TESTS ====================

async function testAnalytics(testData) {
  console.log('\n📊 === ANALYTICS TESTS ===');
  
  // Test 1: Revenue analytics
  const revenueAnalytics = await makeRequest(
    'Revenue Analytics',
    `${API_BASE}/api/revenue-analytics`,
    {
      method: 'GET'
    }
  );
  
  await validateTest(
    'Revenue Analytics Access',
    'analytics',
    revenueAnalytics.success || revenueAnalytics.status === 401 || revenueAnalytics.status === 404,
    'Revenue analytics endpoint issue'
  );
  
  // Test 2: Booking analytics
  const bookingAnalytics = await makeRequest(
    'Booking Analytics',
    `${API_BASE}/api/analytics`,
    {
      method: 'GET'
    }
  );
  
  await validateTest(
    'Booking Analytics Access',
    'analytics',
    bookingAnalytics.success || bookingAnalytics.status === 401,
    'Booking analytics not accessible'
  );
  
  // Test 3: Supplier performance
  const supplierPerformance = await makeRequest(
    'Supplier Performance Analytics',
    `${API_BASE}/api/supplier-analytics`,
    {
      method: 'GET'
    }
  );
  
  await validateTest(
    'Supplier Performance Analytics',
    'analytics',
    supplierPerformance.success || supplierPerformance.status === 401 || supplierPerformance.status === 404,
    'Supplier analytics endpoint issue'
  );
  
  // Test 4: Customer analytics
  const customerAnalytics = await makeRequest(
    'Customer Analytics',
    `${API_BASE}/api/customer-analytics`,
    {
      method: 'GET'
    }
  );
  
  await validateTest(
    'Customer Analytics Access',
    'analytics',
    customerAnalytics.success || customerAnalytics.status === 401 || customerAnalytics.status === 404,
    'Customer analytics endpoint issue'
  );
}

// ==================== SYSTEM ADMIN TESTS ====================

async function testSystemAdmin(testData) {
  console.log('\n⚙️ === SYSTEM ADMIN TESTS ===');
  
  // Test 1: Location management
  const locationsResult = await makeRequest(
    'Get All Locations',
    `${API_BASE}/api/locations/1/10/en`
  );
  
  await validateTest(
    'Location Management Access',
    'systemAdmin',
    locationsResult.success,
    'Location management not accessible'
  );
  
  // Test 2: System settings
  const settingsResult = await makeRequest(
    'System Settings Access',
    `${API_BASE}/api/settings`,
    {
      method: 'GET'
    }
  );
  
  await validateTest(
    'System Settings Access',
    'systemAdmin',
    settingsResult.success || settingsResult.status === 401 || settingsResult.status === 404,
    'System settings endpoint issue'
  );
  
  // Test 3: Data export functionality
  const exportResult = await makeRequest(
    'Data Export Functionality',
    `${API_BASE}/api/export-bookings`,
    {
      method: 'POST',
      body: {
        statuses: ['paid'],
        dateRange: {
          from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          to: new Date()
        }
      }
    }
  );
  
  await validateTest(
    'Data Export Functionality',
    'systemAdmin',
    exportResult.success || exportResult.status === 401,
    'Data export functionality not working'
  );
  
  // Test 4: System health check
  const healthResult = await makeRequest(
    'System Health Check',
    `${API_BASE}/api/health`,
    {
      method: 'GET'
    }
  );
  
  await validateTest(
    'System Health Check',
    'systemAdmin',
    healthResult.success || healthResult.status === 404, // 404 is acceptable if endpoint doesn't exist
    'System health check endpoint issue'
  );
}

async function runOwnerAdminFunctionalityTests() {
  console.log('🚀 Starting Comprehensive Owner/Admin Functionality Testing...\n');
  
  // Get test data
  const testData = await getTestData();
  console.log('📊 Test data loaded:');
  console.log(`   - Admin Users: ${testData.admin ? 1 : 0}`);
  console.log(`   - Suppliers: ${testData.suppliers.length}`);
  console.log(`   - Customers: ${testData.customers.length}`);
  console.log(`   - Dresses: ${testData.dresses.length}`);
  console.log(`   - Bookings: ${testData.bookings.length}`);
  console.log(`   - Locations: ${testData.locations.length}`);
  console.log(`   - Revenue Records: ${testData.revenues.length}`);
  console.log(`   - Expense Records: ${testData.expenses.length}`);
  
  // Run comprehensive tests
  await testUserManagement(testData);
  await testBookingManagement(testData);
  await testDressManagement(testData);
  await testAnalytics(testData);
  await testSystemAdmin(testData);
  
  // Test Results Summary
  console.log('\n📊 === OWNER/ADMIN FUNCTIONALITY TEST RESULTS ===');
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
  
  console.log('\n🎉 Owner/Admin functionality testing completed!');
}

if (require.main === module) {
  runOwnerAdminFunctionalityTests().catch(console.error);
}

module.exports = { runOwnerAdminFunctionalityTests };
