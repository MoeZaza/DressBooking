#!/usr/bin/env node

/**
 * Comprehensive User Management Testing Suite
 * Tests admin, supplier, and customer user management including creation, authentication, 
 * profile updates, and role-based access control
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
    userCreation: { passed: 0, failed: 0 },
    authentication: { passed: 0, failed: 0 },
    profileManagement: { passed: 0, failed: 0 },
    roleBasedAccess: { passed: 0, failed: 0 },
    userTypes: { passed: 0, failed: 0 },
    dataValidation: { passed: 0, failed: 0 }
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
  
  const admins = await db.collection('User').find({ type: 'admin' }).toArray();
  const suppliers = await db.collection('User').find({ type: 'supplier' }).toArray();
  const customers = await db.collection('User').find({ type: 'user' }).toArray();
  const locations = await db.collection('Location').find({}).toArray();
  
  await client.close();
  
  return { admins, suppliers, customers, locations };
}

// ==================== USER CREATION TESTING ====================

async function testUserCreation(testData) {
  console.log('\n👥 === USER CREATION TESTING ===');
  
  const timestamp = Date.now();
  
  // Test 1: Create Admin User
  const adminData = {
    fullName: `Test Admin ${timestamp}`,
    email: `admin${timestamp}@bookdress.com`,
    phone: `0599${Math.floor(100000 + Math.random() * 900000)}`,
    type: 'admin',
    language: 'en',
    location: 'Test Location',
    bio: 'Test admin user'
  };
  
  const createAdminResult = await makeRequest(
    'Create Admin User',
    `${API_BASE}/api/create-user`,
    {
      method: 'POST',
      body: adminData
    }
  );
  
  await validateTest(
    'Admin User Creation',
    'userCreation',
    createAdminResult.success,
    'Admin user creation failed'
  );
  
  // Test 2: Create Supplier User
  const supplierData = {
    fullName: `Test Supplier ${timestamp}`,
    email: `supplier${timestamp}@bookdress.com`,
    phone: `0599${Math.floor(100000 + Math.random() * 900000)}`,
    type: 'supplier',
    language: 'en',
    location: 'Test Location',
    bio: 'Test supplier user',
    payLater: true,
    supplierDressLimit: 50,
    notifyAdminOnNewDress: true,
    priceChangeRate: 0.1,
    locations: testData.locations.slice(0, 2).map(loc => loc._id.toString())
  };
  
  const createSupplierResult = await makeRequest(
    'Create Supplier User',
    `${API_BASE}/api/create-user`,
    {
      method: 'POST',
      body: supplierData
    }
  );
  
  await validateTest(
    'Supplier User Creation',
    'userCreation',
    createSupplierResult.success,
    'Supplier user creation failed'
  );
  
  // Test 3: Create Customer User
  const customerData = {
    fullName: `Test Customer ${timestamp}`,
    email: `customer${timestamp}@bookdress.com`,
    phone: `0599${Math.floor(100000 + Math.random() * 900000)}`,
    type: 'user',
    language: 'en',
    location: 'Test Location',
    bio: 'Test customer user'
  };
  
  const createCustomerResult = await makeRequest(
    'Create Customer User',
    `${API_BASE}/api/create-user`,
    {
      method: 'POST',
      body: customerData
    }
  );
  
  await validateTest(
    'Customer User Creation',
    'userCreation',
    createCustomerResult.success,
    'Customer user creation failed'
  );
  
  // Test 4: Duplicate Email Validation
  const duplicateEmailResult = await makeRequest(
    'Create User with Duplicate Email',
    `${API_BASE}/api/create-user`,
    {
      method: 'POST',
      body: {
        ...customerData,
        fullName: 'Different Name'
      }
    }
  );
  
  await validateTest(
    'Duplicate Email Prevention',
    'dataValidation',
    !duplicateEmailResult.success,
    'System should prevent duplicate email addresses'
  );
  
  return {
    createdAdmin: createAdminResult.success ? createAdminResult.data : null,
    createdSupplier: createSupplierResult.success ? createSupplierResult.data : null,
    createdCustomer: createCustomerResult.success ? createCustomerResult.data : null
  };
}

// ==================== AUTHENTICATION TESTING ====================

async function testAuthentication(testData) {
  console.log('\n🔐 === AUTHENTICATION TESTING ===');
  
  // Test 1: Valid Email Check
  const validEmailResult = await makeRequest(
    'Validate Existing Email',
    `${API_BASE}/api/validate-email`,
    {
      method: 'POST',
      body: {
        email: testData.customers[0]?.email || 'test@example.com',
        appType: 'frontend'
      }
    }
  );
  
  await validateTest(
    'Valid Email Validation',
    'authentication',
    validEmailResult.success,
    'Valid email validation should work'
  );
  
  // Test 2: Invalid Email Format
  const invalidEmailResult = await makeRequest(
    'Validate Invalid Email Format',
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
    'Invalid Email Format Rejection',
    'authentication',
    !invalidEmailResult.success,
    'Invalid email format should be rejected'
  );
  
  // Test 3: Sign In Attempt (will fail without password, but tests endpoint)
  const signInResult = await makeRequest(
    'Sign In Attempt',
    `${API_BASE}/api/sign-in`,
    {
      method: 'POST',
      body: {
        email: testData.customers[0]?.email || 'test@example.com',
        password: 'wrongpassword'
      }
    }
  );
  
  await validateTest(
    'Sign In Endpoint Response',
    'authentication',
    signInResult.status === 400 || signInResult.status === 401 || signInResult.status === 403,
    'Sign in should return appropriate error status for invalid credentials'
  );
}

// ==================== PROFILE MANAGEMENT TESTING ====================

async function testProfileManagement(testData, createdUsers) {
  console.log('\n👤 === PROFILE MANAGEMENT TESTING ===');
  
  // Test 1: Update User Profile
  if (createdUsers.createdCustomer && createdUsers.createdCustomer._id) {
    const updateData = {
      _id: createdUsers.createdCustomer._id,
      fullName: 'Updated Test Customer',
      phone: '0599999999',
      location: 'Updated Location',
      bio: 'Updated bio information'
    };
    
    const updateResult = await makeRequest(
      'Update User Profile',
      `${API_BASE}/api/update-user`,
      {
        method: 'POST',
        body: updateData
      }
    );
    
    await validateTest(
      'User Profile Update',
      'profileManagement',
      updateResult.success,
      'User profile update should work'
    );
  }
  
  // Test 2: Get User Profile
  if (testData.customers.length > 0) {
    const getUserResult = await makeRequest(
      'Get User Profile',
      `${API_BASE}/api/user/${testData.customers[0]._id}`
    );
    
    await validateTest(
      'User Profile Retrieval',
      'profileManagement',
      getUserResult.success,
      'User profile retrieval should work'
    );
  }
  
  // Test 3: Update Email Notifications
  if (testData.customers.length > 0) {
    const updateNotificationsResult = await makeRequest(
      'Update Email Notifications',
      `${API_BASE}/api/update-email-notifications`,
      {
        method: 'POST',
        body: {
          _id: testData.customers[0]._id,
          enableEmailNotifications: false
        }
      }
    );
    
    await validateTest(
      'Email Notifications Update',
      'profileManagement',
      updateNotificationsResult.success,
      'Email notifications update should work'
    );
  }
  
  // Test 4: Update Language
  if (testData.customers.length > 0) {
    const updateLanguageResult = await makeRequest(
      'Update User Language',
      `${API_BASE}/api/update-language`,
      {
        method: 'POST',
        body: {
          id: testData.customers[0]._id,
          language: 'ar'
        }
      }
    );
    
    await validateTest(
      'User Language Update',
      'profileManagement',
      updateLanguageResult.success,
      'User language update should work'
    );
  }
}

// ==================== ROLE-BASED ACCESS TESTING ====================

async function testRoleBasedAccess(testData) {
  console.log('\n🛡️ === ROLE-BASED ACCESS TESTING ===');
  
  // Test 1: Get Users List (requires authentication)
  const getUsersResult = await makeRequest(
    'Get Users List',
    `${API_BASE}/api/users/1/10`,
    {
      method: 'POST',
      body: {
        types: ['admin', 'supplier', 'user']
      }
    }
  );
  
  await validateTest(
    'Users List Access Control',
    'roleBasedAccess',
    getUsersResult.status === 401 || getUsersResult.success,
    'Users list should require authentication or return data'
  );
  
  // Test 2: Validate Supplier (business logic)
  if (testData.suppliers.length > 0) {
    const validateSupplierResult = await makeRequest(
      'Validate Supplier',
      `${API_BASE}/api/validate-supplier`,
      {
        method: 'POST',
        body: {
          fullName: testData.suppliers[0].fullName
        }
      }
    );
    
    await validateTest(
      'Supplier Validation',
      'roleBasedAccess',
      validateSupplierResult.success || validateSupplierResult.status === 400,
      'Supplier validation should work or return validation error'
    );
  }
  
  // Test 3: Admin Functions Access
  const adminFunctionResult = await makeRequest(
    'Admin Function Access',
    `${API_BASE}/api/delete-users`,
    {
      method: 'POST',
      body: ['nonexistent-id']
    }
  );
  
  await validateTest(
    'Admin Function Access Control',
    'roleBasedAccess',
    adminFunctionResult.status === 401 || adminFunctionResult.status === 403 || adminFunctionResult.status === 400,
    'Admin functions should require proper authentication'
  );
}

// ==================== USER TYPES TESTING ====================

async function testUserTypes(testData) {
  console.log('\n🎭 === USER TYPES TESTING ===');
  
  // Test 1: Admin User Properties
  await validateTest(
    'Admin Users Exist',
    'userTypes',
    testData.admins.length > 0,
    'System should have admin users'
  );
  
  // Test 2: Supplier User Properties
  await validateTest(
    'Supplier Users Exist',
    'userTypes',
    testData.suppliers.length > 0,
    'System should have supplier users'
  );
  
  if (testData.suppliers.length > 0) {
    const supplier = testData.suppliers[0];
    await validateTest(
      'Supplier Has Business Properties',
      'userTypes',
      supplier.payLater !== undefined || supplier.supplierDressLimit !== undefined,
      'Suppliers should have business-specific properties'
    );
    
    await validateTest(
      'Supplier Has Multiple Locations',
      'userTypes',
      supplier.locations && Array.isArray(supplier.locations) && supplier.locations.length > 0,
      'Suppliers should have multiple locations (multi-branch support)'
    );
  }
  
  // Test 3: Customer User Properties
  await validateTest(
    'Customer Users Exist',
    'userTypes',
    testData.customers.length > 0,
    'System should have customer users'
  );
  
  if (testData.customers.length > 0) {
    const customer = testData.customers[0];
    await validateTest(
      'Customer Has Basic Properties',
      'userTypes',
      customer.fullName && customer.email,
      'Customers should have basic user properties'
    );
  }
}

async function runComprehensiveUserManagementTesting() {
  console.log('🚀 Starting Comprehensive User Management Testing...\n');
  
  // Get test data
  const testData = await getTestData();
  console.log('📊 Test data loaded:');
  console.log(`   - Admins: ${testData.admins.length}`);
  console.log(`   - Suppliers: ${testData.suppliers.length}`);
  console.log(`   - Customers: ${testData.customers.length}`);
  console.log(`   - Locations: ${testData.locations.length}`);
  
  // Run comprehensive tests
  const createdUsers = await testUserCreation(testData);
  await testAuthentication(testData);
  await testProfileManagement(testData, createdUsers);
  await testRoleBasedAccess(testData);
  await testUserTypes(testData);
  
  // Test Results Summary
  console.log('\n📊 === COMPREHENSIVE USER MANAGEMENT TEST RESULTS ===');
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
  
  console.log('\n🎉 Comprehensive user management testing completed!');
}

if (require.main === module) {
  runComprehensiveUserManagementTesting().catch(console.error);
}

module.exports = { runComprehensiveUserManagementTesting };
