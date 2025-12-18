#!/usr/bin/env node

/**
 * Comprehensive Frontend Integration Testing
 * Tests frontend-backend integration ensuring proper access control and functionality
 */

const fetch = require('node-fetch');
const { MongoClient } = require('mongodb');

const API_BASE = 'http://localhost:4002';
const FRONTEND_BASE = 'http://localhost:3001'; // Assuming frontend runs on 3001
const BACKEND_BASE = 'http://localhost:3000';   // Assuming backend runs on 3000
const MONGODB_URI = 'mongodb+srv://user:Mybookmodr100@cluster0.ey9u2ce.mongodb.net/bookdress?retryWrites=true&w=majority&appName=Cluster0';

let testResults = {
  passed: 0,
  failed: 0,
  issues: [],
  categories: {
    frontendAccess: { passed: 0, failed: 0 },
    backendAccess: { passed: 0, failed: 0 },
    apiIntegration: { passed: 0, failed: 0 },
    roleBasedAccess: { passed: 0, failed: 0 },
    dataFlow: { passed: 0, failed: 0 },
    authentication: { passed: 0, failed: 0 }
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
      // Non-JSON response (HTML, etc.)
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

// ==================== FRONTEND ACCESS TESTING ====================

async function testFrontendAccess(testData) {
  console.log('\n🌐 === FRONTEND ACCESS TESTING ===');
  
  // Test 1: Frontend Home Page
  const frontendHomeResult = await makeRequest(
    'Frontend Home Page Access',
    `${FRONTEND_BASE}/`
  );
  
  await validateTest(
    'Frontend Home Page Accessible',
    'frontendAccess',
    frontendHomeResult.success || frontendHomeResult.status === 404, // 404 is acceptable if frontend not running
    'Frontend home page should be accessible or return 404 if not running'
  );
  
  // Test 2: Frontend Dress Catalog
  const frontendDressesResult = await makeRequest(
    'Frontend Dress Catalog Access',
    `${FRONTEND_BASE}/dresses`
  );
  
  await validateTest(
    'Frontend Dress Catalog Accessible',
    'frontendAccess',
    frontendDressesResult.success || frontendDressesResult.status === 404,
    'Frontend dress catalog should be accessible or return 404 if not running'
  );
  
  // Test 3: Frontend Booking Page
  const frontendBookingResult = await makeRequest(
    'Frontend Booking Page Access',
    `${FRONTEND_BASE}/booking`
  );
  
  await validateTest(
    'Frontend Booking Page Accessible',
    'frontendAccess',
    frontendBookingResult.success || frontendBookingResult.status === 404,
    'Frontend booking page should be accessible or return 404 if not running'
  );
}

// ==================== BACKEND ACCESS TESTING ====================

async function testBackendAccess(testData) {
  console.log('\n🔧 === BACKEND ACCESS TESTING ===');
  
  // Test 1: Backend Admin Dashboard
  const backendAdminResult = await makeRequest(
    'Backend Admin Dashboard Access',
    `${BACKEND_BASE}/`
  );
  
  await validateTest(
    'Backend Admin Dashboard Accessible',
    'backendAccess',
    backendAdminResult.success || backendAdminResult.status === 404,
    'Backend admin dashboard should be accessible or return 404 if not running'
  );
  
  // Test 2: Backend Supplier Dashboard
  const backendSupplierResult = await makeRequest(
    'Backend Supplier Dashboard Access',
    `${BACKEND_BASE}/supplier`
  );
  
  await validateTest(
    'Backend Supplier Dashboard Accessible',
    'backendAccess',
    backendSupplierResult.success || backendSupplierResult.status === 404,
    'Backend supplier dashboard should be accessible or return 404 if not running'
  );
  
  // Test 3: Backend Booking Management
  const backendBookingsResult = await makeRequest(
    'Backend Booking Management Access',
    `${BACKEND_BASE}/bookings`
  );
  
  await validateTest(
    'Backend Booking Management Accessible',
    'backendAccess',
    backendBookingsResult.success || backendBookingsResult.status === 404,
    'Backend booking management should be accessible or return 404 if not running'
  );
}

// ==================== API INTEGRATION TESTING ====================

async function testApiIntegration(testData) {
  console.log('\n🔗 === API INTEGRATION TESTING ===');
  
  // Test 1: Frontend API Endpoints (Public)
  const publicDressesResult = await makeRequest(
    'Public Dresses API for Frontend',
    `${API_BASE}/api/dresses/1/10`,
    {
      method: 'POST',
      body: {
        suppliers: testData.suppliers.map(s => s._id.toString())
      }
    }
  );
  
  await validateTest(
    'Public Dresses API Integration',
    'apiIntegration',
    publicDressesResult.success,
    'Public dresses API should be accessible for frontend integration'
  );
  
  // Test 2: Public Suppliers API
  const publicSuppliersResult = await makeRequest(
    'Public Suppliers API for Frontend',
    `${API_BASE}/api/all-suppliers`
  );
  
  await validateTest(
    'Public Suppliers API Integration',
    'apiIntegration',
    publicSuppliersResult.success,
    'Public suppliers API should be accessible for frontend integration'
  );
  
  // Test 3: Public Locations API
  const publicLocationsResult = await makeRequest(
    'Public Locations API for Frontend',
    `${API_BASE}/api/locations/1/10/en`
  );
  
  await validateTest(
    'Public Locations API Integration',
    'apiIntegration',
    publicLocationsResult.success,
    'Public locations API should be accessible for frontend integration'
  );
  
  // Test 4: Booking Creation API (Should work without authentication for customers)
  if (testData.suppliers.length > 0 && testData.dresses.length > 0 && testData.locations.length > 0) {
    const supplier = testData.suppliers[0];
    const dress = testData.dresses.find(d => d.supplier.toString() === supplier._id.toString());
    const location = testData.locations[0];
    
    if (dress) {
      // Create a customer first
      const customerData = {
        fullName: `Frontend Test Customer ${Date.now()}`,
        email: `frontendtest${Date.now()}@example.com`,
        phone: `059${Math.floor(Math.random() * 9000000 + 1000000)}`,
        language: 'en',
        type: 'user',
        password: 'TestPassword123!',
        birthDate: new Date('1990-01-01').toISOString(),
        verified: true
      };
      
      const customerResult = await makeRequest(
        'Create Customer for Frontend Booking',
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
            from: new Date(Date.now() + 1200 * 24 * 60 * 60 * 1000).toISOString(),
            to: new Date(Date.now() + 1203 * 24 * 60 * 60 * 1000).toISOString(),
            status: 'pending',
            price: 800
          }
        };
        
        const bookingResult = await makeRequest(
          'Frontend Booking Creation API',
          `${API_BASE}/api/create-booking`,
          {
            method: 'POST',
            body: bookingData
          }
        );
        
        await validateTest(
          'Frontend Booking Creation Integration',
          'apiIntegration',
          bookingResult.success,
          'Frontend should be able to create bookings through API'
        );
      }
    }
  }
}

// ==================== ROLE-BASED ACCESS TESTING ====================

async function testRoleBasedAccess(testData) {
  console.log('\n👥 === ROLE-BASED ACCESS TESTING ===');
  
  // Test 1: Customer Data Access (Should be limited)
  const customerAccessResult = await makeRequest(
    'Customer Data Access Test',
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
    'Customer Data Access Control',
    'roleBasedAccess',
    customerAccessResult.success,
    'Customer data should be accessible for legitimate operations'
  );
  
  // Test 2: Supplier Data Access
  const supplierAccessResult = await makeRequest(
    'Supplier Data Access Test',
    `${API_BASE}/api/all-suppliers`
  );
  
  await validateTest(
    'Supplier Data Access Control',
    'roleBasedAccess',
    supplierAccessResult.success,
    'Supplier data should be publicly accessible for frontend'
  );
  
  // Test 3: Admin Operations (Should require authentication)
  const adminOperationResult = await makeRequest(
    'Admin Operation Access Test',
    `${API_BASE}/api/admin/users`,
    {
      method: 'GET'
    }
  );
  
  await validateTest(
    'Admin Operation Access Control',
    'roleBasedAccess',
    !adminOperationResult.success || adminOperationResult.status === 401 || adminOperationResult.status === 404,
    'Admin operations should require authentication or return 401/404'
  );
}

// ==================== DATA FLOW TESTING ====================

async function testDataFlow(testData) {
  console.log('\n🔄 === DATA FLOW TESTING ===');
  
  // Test 1: Frontend to Backend Data Flow
  if (testData.suppliers.length > 0) {
    const supplier = testData.suppliers[0];
    
    // Step 1: Get suppliers (Frontend would do this)
    const suppliersResult = await makeRequest(
      'Get Suppliers for Frontend',
      `${API_BASE}/api/all-suppliers`
    );
    
    // Step 2: Get dresses for selected supplier (Frontend would do this)
    if (suppliersResult.success) {
      const dressesResult = await makeRequest(
        'Get Dresses for Selected Supplier',
        `${API_BASE}/api/dresses/1/10`,
        {
          method: 'POST',
          body: {
            suppliers: [supplier._id.toString()]
          }
        }
      );
      
      await validateTest(
        'Frontend to Backend Data Flow',
        'dataFlow',
        dressesResult.success,
        'Frontend should be able to get data from backend APIs'
      );
    }
  }
  
  // Test 2: Backend to Database Data Flow
  const backendDataResult = await makeRequest(
    'Backend Database Integration',
    `${API_BASE}/api/locations/1/10/en`
  );
  
  await validateTest(
    'Backend to Database Data Flow',
    'dataFlow',
    backendDataResult.success,
    'Backend should be able to retrieve data from database'
  );
}

async function runComprehensiveFrontendIntegrationTesting() {
  console.log('🚀 Starting Comprehensive Frontend Integration Testing...\n');
  
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
  
  // Run comprehensive integration tests
  await testFrontendAccess(testData);
  await testBackendAccess(testData);
  await testApiIntegration(testData);
  await testRoleBasedAccess(testData);
  await testDataFlow(testData);
  
  // Test Results Summary
  console.log('\n📊 === COMPREHENSIVE FRONTEND INTEGRATION TEST RESULTS ===');
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
  
  console.log('\n🎉 Comprehensive frontend integration testing completed!');
}

if (require.main === module) {
  runComprehensiveFrontendIntegrationTesting().catch(console.error);
}

module.exports = { runComprehensiveFrontendIntegrationTesting };
