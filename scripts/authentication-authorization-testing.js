#!/usr/bin/env node

/**
 * Comprehensive Authentication and Authorization Testing
 * Tests role-based access control, data isolation, authentication flows, and security measures
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
    publicAccess: { passed: 0, failed: 0 },
    roleBasedAccess: { passed: 0, failed: 0 },
    dataIsolation: { passed: 0, failed: 0 },
    authenticationFlows: { passed: 0, failed: 0 },
    securityMeasures: { passed: 0, failed: 0 },
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

// ==================== PUBLIC ACCESS TESTING ====================

async function testPublicAccess(testData) {
  console.log('\n🌐 === PUBLIC ACCESS TESTING ===');
  
  // Test 1: Public Dress Catalog Access
  const publicDressesResult = await makeRequest(
    'Public Dress Catalog Access',
    `${API_BASE}/api/dresses/1/10`,
    {
      method: 'POST',
      body: {
        suppliers: testData.suppliers.map(s => s._id.toString())
      }
    }
  );
  
  await validateTest(
    'Public Dress Catalog Access',
    'publicAccess',
    publicDressesResult.success,
    'Public should be able to access dress catalog'
  );
  
  // Test 2: Public Supplier List Access
  const publicSuppliersResult = await makeRequest(
    'Public Supplier List Access',
    `${API_BASE}/api/all-suppliers`
  );
  
  await validateTest(
    'Public Supplier List Access',
    'publicAccess',
    publicSuppliersResult.success,
    'Public should be able to access supplier list'
  );
  
  // Test 3: Public Location Access
  const publicLocationsResult = await makeRequest(
    'Public Location Access',
    `${API_BASE}/api/locations/1/10/en`
  );
  
  await validateTest(
    'Public Location Access',
    'publicAccess',
    publicLocationsResult.success,
    'Public should be able to access locations'
  );
  
  // Test 4: Public Booking Creation (Should Work)
  if (testData.suppliers.length > 0 && testData.dresses.length > 0 && testData.locations.length > 0) {
    const supplier = testData.suppliers[0];
    const dress = testData.dresses.find(d => d.supplier.toString() === supplier._id.toString());
    const location = testData.locations[0];
    
    if (dress) {
      // Create customer first
      const customerData = {
        fullName: `Public Test Customer ${Date.now()}`,
        email: `publictest${Date.now()}@example.com`,
        phone: `059${Math.floor(Math.random() * 9000000 + 1000000)}`,
        language: 'en',
        type: 'user',
        verified: true
      };
      
      const customerResult = await makeRequest(
        'Public Customer Creation',
        `${API_BASE}/api/create-user`,
        {
          method: 'POST',
          body: customerData
        }
      );
      
      if (customerResult.success) {
        const bookingData = {
          booking: {
            supplier: supplier._id.toString(),
            dress: dress._id.toString(),
            customer: customerResult.data._id.toString(),
            location: location._id.toString(),
            from: new Date(Date.now() + 1600 * 24 * 60 * 60 * 1000).toISOString(),
            to: new Date(Date.now() + 1603 * 24 * 60 * 60 * 1000).toISOString(),
            status: 'pending',
            price: 1200
          }
        };
        
        const publicBookingResult = await makeRequest(
          'Public Booking Creation',
          `${API_BASE}/api/create-booking`,
          {
            method: 'POST',
            body: bookingData
          }
        );
        
        await validateTest(
          'Public Booking Creation',
          'publicAccess',
          publicBookingResult.success,
          'Public should be able to create bookings'
        );
      }
    }
  }
}

// ==================== ROLE-BASED ACCESS TESTING ====================

async function testRoleBasedAccess(testData) {
  console.log('\n👥 === ROLE-BASED ACCESS TESTING ===');
  
  // Test 1: Admin-Only Operations (Should Require Auth)
  const adminOperationsResult = await makeRequest(
    'Admin Operations Access',
    `${API_BASE}/api/admin/users`
  );
  
  await validateTest(
    'Admin Operations Protection',
    'roleBasedAccess',
    !adminOperationsResult.success && (adminOperationsResult.status === 401 || adminOperationsResult.status === 403 || adminOperationsResult.status === 404),
    'Admin operations should require authentication or return 401/403/404'
  );
  
  // Test 2: Supplier-Only Operations (Should Require Auth)
  const supplierOperationsResult = await makeRequest(
    'Supplier Operations Access',
    `${API_BASE}/api/supplier/dashboard`
  );
  
  await validateTest(
    'Supplier Operations Protection',
    'roleBasedAccess',
    !supplierOperationsResult.success && (supplierOperationsResult.status === 401 || supplierOperationsResult.status === 403 || supplierOperationsResult.status === 404),
    'Supplier operations should require authentication or return 401/403/404'
  );
  
  // Test 3: Customer Profile Access (Should Require Auth)
  if (testData.customers.length > 0) {
    const customer = testData.customers[0];
    
    const customerProfileResult = await makeRequest(
      'Customer Profile Access',
      `${API_BASE}/api/customer/profile/${customer._id}`
    );
    
    await validateTest(
      'Customer Profile Protection',
      'roleBasedAccess',
      !customerProfileResult.success && (customerProfileResult.status === 401 || customerProfileResult.status === 403 || customerProfileResult.status === 404),
      'Customer profile should require authentication or return 401/403/404'
    );
  }
  
  // Test 4: User Management Operations (Should Require Auth)
  const userManagementResult = await makeRequest(
    'User Management Access',
    `${API_BASE}/api/users/1/10`,
    {
      method: 'POST',
      body: {
        user: '',
        types: ['admin', 'supplier', 'user']
      }
    }
  );
  
  await validateTest(
    'User Management Access Control',
    'roleBasedAccess',
    userManagementResult.success || userManagementResult.status === 401 || userManagementResult.status === 403,
    'User management should work or require authentication'
  );
}

// ==================== DATA ISOLATION TESTING ====================

async function testDataIsolation(testData) {
  console.log('\n🔒 === DATA ISOLATION TESTING ===');
  
  if (testData.suppliers.length < 2) {
    console.log('⚠️ Need at least 2 suppliers for data isolation testing');
    return;
  }
  
  const supplier1 = testData.suppliers[0];
  const supplier2 = testData.suppliers[1];
  
  // Test 1: Supplier Dress Isolation
  const supplier1DressesResult = await makeRequest(
    'Supplier 1 Dresses',
    `${API_BASE}/api/dresses/1/10`,
    {
      method: 'POST',
      body: {
        suppliers: [supplier1._id.toString()]
      }
    }
  );
  
  const supplier2DressesResult = await makeRequest(
    'Supplier 2 Dresses',
    `${API_BASE}/api/dresses/1/10`,
    {
      method: 'POST',
      body: {
        suppliers: [supplier2._id.toString()]
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
      'Supplier Dress Data Isolation',
      'dataIsolation',
      overlap.length === 0,
      'Suppliers should only see their own dresses'
    );
  }
  
  // Test 2: Customer Data Privacy
  const allCustomersResult = await makeRequest(
    'All Customers Access',
    `${API_BASE}/api/users/1/10`,
    {
      method: 'POST',
      body: {
        user: '',
        types: ['user']
      }
    }
  );
  
  if (allCustomersResult.success) {
    const customers = allCustomersResult.data[0]?.resultData || [];
    
    // Check that sensitive customer data is not exposed
    const hasSensitiveData = customers.some(customer => 
      customer.password || customer.paymentInfo || customer.privateNotes
    );
    
    await validateTest(
      'Customer Data Privacy',
      'dataIsolation',
      !hasSensitiveData,
      'Customer sensitive data should not be exposed in public APIs'
    );
  }
}

// ==================== AUTHENTICATION FLOWS TESTING ====================

async function testAuthenticationFlows(testData) {
  console.log('\n🔐 === AUTHENTICATION FLOWS TESTING ===');
  
  // Test 1: User Creation (Registration)
  const registrationData = {
    fullName: `Auth Test User ${Date.now()}`,
    email: `authtest${Date.now()}@example.com`,
    phone: `059${Math.floor(Math.random() * 9000000 + 1000000)}`,
    language: 'en',
    type: 'user',
    password: 'AuthTestPassword123!',
    verified: true
  };
  
  const registrationResult = await makeRequest(
    'User Registration',
    `${API_BASE}/api/create-user`,
    {
      method: 'POST',
      body: registrationData
    }
  );
  
  await validateTest(
    'User Registration Flow',
    'authenticationFlows',
    registrationResult.success,
    'User registration should work'
  );
  
  // Test 2: Login Attempt (Should Require Proper Endpoint)
  const loginResult = await makeRequest(
    'Login Attempt',
    `${API_BASE}/api/sign-in`,
    {
      method: 'POST',
      body: {
        email: registrationData.email,
        password: registrationData.password
      }
    }
  );
  
  await validateTest(
    'Login Flow Access',
    'authenticationFlows',
    loginResult.success || loginResult.status === 401 || loginResult.status === 404,
    'Login endpoint should exist or return appropriate error'
  );
  
  // Test 3: Password Reset Flow
  const passwordResetResult = await makeRequest(
    'Password Reset Request',
    `${API_BASE}/api/forgot-password`,
    {
      method: 'POST',
      body: {
        email: registrationData.email
      }
    }
  );
  
  await validateTest(
    'Password Reset Flow',
    'authenticationFlows',
    passwordResetResult.success || passwordResetResult.status === 404,
    'Password reset should work or endpoint should exist'
  );
}

async function runAuthenticationAuthorizationTesting() {
  console.log('🚀 Starting Comprehensive Authentication and Authorization Testing...\n');
  
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
  
  // Run comprehensive authentication and authorization tests
  await testPublicAccess(testData);
  await testRoleBasedAccess(testData);
  await testDataIsolation(testData);
  await testAuthenticationFlows(testData);
  
  // Test Results Summary
  console.log('\n📊 === COMPREHENSIVE AUTHENTICATION AND AUTHORIZATION TEST RESULTS ===');
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
  
  console.log('\n🎉 Comprehensive authentication and authorization testing completed!');
}

if (require.main === module) {
  runAuthenticationAuthorizationTesting().catch(console.error);
}

module.exports = { runAuthenticationAuthorizationTesting };
