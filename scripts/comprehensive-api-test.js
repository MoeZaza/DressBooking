#!/usr/bin/env node

/**
 * Comprehensive API Testing Script
 * Tests all major API endpoints and identifies issues
 */

const fetch = require('node-fetch');
const { MongoClient } = require('mongodb');

const API_BASE = 'http://localhost:4002';
const MONGODB_URI = 'mongodb+srv://user:Mybookmodr100@cluster0.ey9u2ce.mongodb.net/bookdress?retryWrites=true&w=majority&appName=Cluster0';

let testResults = {
  passed: 0,
  failed: 0,
  issues: []
};

async function testEndpoint(name, url, options = {}) {
  try {
    console.log(`\n🔍 Testing ${name}:`);
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
    
    if (response.ok) {
      try {
        const jsonData = JSON.parse(data);
        if (Array.isArray(jsonData)) {
          console.log(`   ✅ Success: Array with ${jsonData.length} items`);
          testResults.passed++;
          return { success: true, data: jsonData };
        } else if (jsonData && typeof jsonData === 'object') {
          if (jsonData.docs && Array.isArray(jsonData.docs)) {
            console.log(`   ✅ Success: Paginated result with ${jsonData.docs.length} items`);
            console.log(`   📊 Total: ${jsonData.totalDocs || 'unknown'}, Pages: ${jsonData.totalPages || 'unknown'}`);
            testResults.passed++;
            return { success: true, data: jsonData };
          } else {
            console.log(`   ✅ Success: Object with keys: ${Object.keys(jsonData).join(', ')}`);
            testResults.passed++;
            return { success: true, data: jsonData };
          }
        } else {
          console.log(`   ✅ Success: ${typeof jsonData} - ${jsonData}`);
          testResults.passed++;
          return { success: true, data: jsonData };
        }
      } catch (e) {
        console.log(`   ✅ Success: Non-JSON response (${data.length} chars)`);
        testResults.passed++;
        return { success: true, data: data };
      }
    } else {
      console.log(`   ❌ Error: ${data}`);
      testResults.failed++;
      testResults.issues.push({
        endpoint: name,
        url: url,
        status: response.status,
        error: data
      });
      return { success: false, error: data };
    }
    
  } catch (error) {
    console.log(`   💥 Request failed: ${error.message}`);
    testResults.failed++;
    testResults.issues.push({
      endpoint: name,
      url: url,
      error: error.message
    });
    return { success: false, error: error.message };
  }
}

async function signInUser(email, password, userType = 'admin') {
  try {
    console.log(`🔐 Signing in ${userType}: ${email}...`);
    
    const response = await fetch(`${API_BASE}/api/sign-in/${userType}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: email,
        password: password,
        stayConnected: false
      })
    });
    
    console.log(`   Status: ${response.status} ${response.statusText}`);
    
    if (response.ok || response.status === 204) {
      // Extract token from Set-Cookie header
      const cookies = response.headers.get('set-cookie');
      if (cookies) {
        const tokenMatch = cookies.match(/bc-x-access-token-backend=([^;]+)/);
        if (tokenMatch) {
          console.log(`   ✅ Signed in successfully`);
          return tokenMatch[1];
        }
      }
      
      // Check if token is in response body
      try {
        const data = await response.json();
        if (data.accessToken) {
          console.log(`   ✅ Signed in successfully`);
          return data.accessToken;
        }
      } catch (e) {
        // Response might be empty for 204
        console.log(`   ✅ Signed in successfully (no token in response)`);
        return 'no-token-but-success';
      }
    }
    
    const error = await response.text();
    console.log(`   ❌ Sign in failed: ${error}`);
    return null;
  } catch (error) {
    console.log(`   💥 Sign in error: ${error.message}`);
    return null;
  }
}

async function getTestData() {
  const client = new MongoClient(MONGODB_URI);
  await client.connect();
  const db = client.db('bookdress');
  
  // Get test data
  const admin = await db.collection('User').findOne({ type: 'admin' });
  const supplier = await db.collection('User').findOne({ type: 'supplier' });
  const customer = await db.collection('User').findOne({ type: 'user' });
  const location = await db.collection('Location').findOne({});
  const dress = await db.collection('Dress').findOne({});
  
  await client.close();
  
  return { admin, supplier, customer, location, dress };
}

async function runComprehensiveTests() {
  console.log('🚀 Starting Comprehensive API Testing...\n');
  
  // Get test data
  const testData = await getTestData();
  console.log('📊 Test data loaded:');
  console.log(`   - Admin: ${testData.admin?.fullName || 'Not found'}`);
  console.log(`   - Supplier: ${testData.supplier?.fullName || 'Not found'}`);
  console.log(`   - Customer: ${testData.customer?.fullName || 'Not found'}`);
  console.log(`   - Location: ${testData.location?._id || 'Not found'}`);
  console.log(`   - Dress: ${testData.dress?.name || 'Not found'}`);
  
  // Authentication Tests
  console.log('\n🔐 === AUTHENTICATION TESTS ===');
  
  let adminToken = null;
  let supplierToken = null;
  let customerToken = null;
  
  if (testData.admin) {
    adminToken = await signInUser(testData.admin.email, 'admin123', 'admin');
  }
  
  if (testData.supplier) {
    supplierToken = await signInUser(testData.supplier.email, 'supplier123', 'supplier');
  }
  
  if (testData.customer) {
    customerToken = await signInUser(testData.customer.email, 'customer123', 'user');
  }
  
  // Public Endpoints Tests
  console.log('\n🌐 === PUBLIC ENDPOINTS TESTS ===');
  
  await testEndpoint(
    'All Suppliers (Public)',
    `${API_BASE}/api/all-suppliers`
  );
  
  await testEndpoint(
    'Frontend Dresses (Empty Body)',
    `${API_BASE}/api/frontend-dresses/1/10`,
    {
      method: 'POST',
      body: {}
    }
  );
  
  // Debug the supplier ID
  console.log('🔍 Debug supplier ID:', testData.supplier ? testData.supplier._id.toString() : 'No supplier');

  await testEndpoint(
    'Frontend Dresses (With Filters)',
    `${API_BASE}/api/frontend-dresses/1/10`,
    {
      method: 'POST',
      body: {
        suppliers: testData.supplier ? [testData.supplier._id.toString()] : [],
        location: testData.location ? testData.location._id.toString() : null,
        dressType: [],
        includeAlreadyBookedDresses: true,
        includeComingSoonDresses: true
      }
    }
  );
  
  if (testData.location) {
    await testEndpoint(
      'Frontend Suppliers (With Location)',
      `${API_BASE}/api/frontend-suppliers`,
      {
        method: 'POST',
        body: {
          location: testData.location._id.toString(),
          dressType: [],
          size: []
        }
      }
    );
  }
  
  await testEndpoint(
    'Locations with Position',
    `${API_BASE}/api/locations-with-position/en`
  );
  
  if (testData.dress) {
    await testEndpoint(
      'Get Dress Details',
      `${API_BASE}/api/dress/${testData.dress._id}/en`
    );
  }
  
  // Admin Endpoints Tests
  console.log('\n👑 === ADMIN ENDPOINTS TESTS ===');
  
  if (adminToken && adminToken !== 'no-token-but-success') {
    const authHeaders = {
      'Authorization': `Bearer ${adminToken}`,
      'Cookie': `bc-x-access-token-backend=${adminToken}`
    };
    
    await testEndpoint(
      'Admin Suppliers List',
      `${API_BASE}/api/suppliers/1/10`,
      {
        headers: authHeaders
      }
    );
    
    await testEndpoint(
      'Admin Users List',
      `${API_BASE}/api/users/1/10`,
      {
        headers: authHeaders
      }
    );
    
    await testEndpoint(
      'Admin Locations List',
      `${API_BASE}/api/locations/1/10/en`,
      {
        headers: authHeaders
      }
    );
    
    if (testData.supplier) {
      await testEndpoint(
        'Admin Bookings List',
        `${API_BASE}/api/bookings/1/10/en`,
        {
          method: 'POST',
          headers: authHeaders,
          body: {
            suppliers: [testData.supplier._id.toString()],
            statuses: ['pending', 'paid', 'deposit', 'reserved', 'cancelled'],
            filter: {}
          }
        }
      );
    }
  } else {
    console.log('⚠️ Skipping admin tests - no valid admin token');
  }
  
  // Supplier Endpoints Tests
  console.log('\n🏪 === SUPPLIER ENDPOINTS TESTS ===');
  
  if (supplierToken && supplierToken !== 'no-token-but-success') {
    const authHeaders = {
      'Authorization': `Bearer ${supplierToken}`,
      'Cookie': `bc-x-access-token-backend=${supplierToken}`
    };
    
    await testEndpoint(
      'Supplier Dresses List',
      `${API_BASE}/api/dresses/1/10`,
      {
        method: 'POST',
        headers: authHeaders,
        body: {
          keyword: ''
        }
      }
    );
    
    if (testData.supplier) {
      await testEndpoint(
        'Supplier Bookings List',
        `${API_BASE}/api/bookings/1/10/en`,
        {
          method: 'POST',
          headers: authHeaders,
          body: {
            suppliers: [testData.supplier._id.toString()],
            statuses: ['pending', 'paid', 'deposit', 'reserved', 'cancelled'],
            filter: {}
          }
        }
      );
    }
  } else {
    console.log('⚠️ Skipping supplier tests - no valid supplier token');
  }
  
  // Test Results Summary
  console.log('\n📊 === TEST RESULTS SUMMARY ===');
  console.log(`✅ Passed: ${testResults.passed}`);
  console.log(`❌ Failed: ${testResults.failed}`);
  console.log(`📈 Success Rate: ${((testResults.passed / (testResults.passed + testResults.failed)) * 100).toFixed(1)}%`);
  
  if (testResults.issues.length > 0) {
    console.log('\n🐛 === ISSUES FOUND ===');
    testResults.issues.forEach((issue, index) => {
      console.log(`\n${index + 1}. ${issue.endpoint}`);
      console.log(`   URL: ${issue.url}`);
      console.log(`   Status: ${issue.status || 'N/A'}`);
      console.log(`   Error: ${issue.error}`);
    });
  }
  
  console.log('\n🎉 Comprehensive API testing completed!');
}

if (require.main === module) {
  runComprehensiveTests().catch(console.error);
}

module.exports = { runComprehensiveTests };
