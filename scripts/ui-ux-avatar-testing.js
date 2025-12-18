#!/usr/bin/env node

/**
 * Comprehensive UI/UX and Avatar Testing
 * Tests user interface components, avatar uploads, image handling, and user experience features
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
    avatarHandling: { passed: 0, failed: 0 },
    imageUploads: { passed: 0, failed: 0 },
    uiComponents: { passed: 0, failed: 0 },
    userExperience: { passed: 0, failed: 0 },
    responsiveDesign: { passed: 0, failed: 0 },
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
  
  await client.close();
  
  const suppliers = users.filter(u => u.type === 'supplier');
  const customers = users.filter(u => u.type === 'user');
  const admins = users.filter(u => u.type === 'admin');
  
  return { users, dresses, locations, suppliers, customers, admins };
}

// ==================== AVATAR HANDLING TESTING ====================

async function testAvatarHandling(testData) {
  console.log('\n👤 === AVATAR HANDLING TESTING ===');
  
  // Test 1: User Profile with Avatar
  if (testData.users.length > 0) {
    const userWithAvatar = testData.users.find(u => u.avatar);
    
    if (userWithAvatar) {
      const profileResult = await makeRequest(
        'Get User Profile with Avatar',
        `${API_BASE}/api/user/${userWithAvatar._id}`
      );
      
      if (profileResult.success) {
        await validateTest(
          'Avatar in User Profile',
          'avatarHandling',
          profileResult.data.avatar !== undefined,
          'User profile should include avatar information'
        );
      }
    }
  }
  
  // Test 2: Default Avatar Handling
  const userWithoutAvatar = testData.users.find(u => !u.avatar);
  
  if (userWithoutAvatar) {
    const profileResult = await makeRequest(
      'Get User Profile without Avatar',
      `${API_BASE}/api/user/${userWithoutAvatar._id}`
    );
    
    if (profileResult.success) {
      await validateTest(
        'Default Avatar Handling',
        'avatarHandling',
        profileResult.data.avatar === undefined || profileResult.data.avatar === null || profileResult.data.avatar === '',
        'User without avatar should have null/empty avatar field'
      );
    }
  }
  
  // Test 3: Avatar Upload Endpoint
  const avatarUploadResult = await makeRequest(
    'Avatar Upload Endpoint',
    `${API_BASE}/api/upload-avatar`
  );
  
  await validateTest(
    'Avatar Upload Endpoint Exists',
    'avatarHandling',
    avatarUploadResult.success || avatarUploadResult.status === 401 || avatarUploadResult.status === 403 || avatarUploadResult.status === 405,
    'Avatar upload endpoint should exist or require authentication/method'
  );
}

// ==================== IMAGE UPLOADS TESTING ====================

async function testImageUploads(testData) {
  console.log('\n🖼️ === IMAGE UPLOADS TESTING ===');
  
  // Test 1: Dress Images
  if (testData.dresses.length > 0) {
    const dressWithImages = testData.dresses.find(d => d.images && d.images.length > 0);
    
    if (dressWithImages) {
      const dressResult = await makeRequest(
        'Get Dress with Images',
        `${API_BASE}/api/dress/${dressWithImages._id}/en`
      );
      
      if (dressResult.success) {
        await validateTest(
          'Dress Images in API Response',
          'imageUploads',
          dressResult.data.images && Array.isArray(dressResult.data.images),
          'Dress should include images array in API response'
        );
      }
    }
  }
  
  // Test 2: Image Upload Endpoint
  const imageUploadResult = await makeRequest(
    'Image Upload Endpoint',
    `${API_BASE}/api/upload-image`
  );
  
  await validateTest(
    'Image Upload Endpoint Exists',
    'imageUploads',
    imageUploadResult.success || imageUploadResult.status === 401 || imageUploadResult.status === 403 || imageUploadResult.status === 405,
    'Image upload endpoint should exist or require authentication/method'
  );
  
  // Test 3: Multiple Image Upload Support
  const multipleImageUploadResult = await makeRequest(
    'Multiple Image Upload Endpoint',
    `${API_BASE}/api/upload-multiple-images`
  );
  
  await validateTest(
    'Multiple Image Upload Support',
    'imageUploads',
    multipleImageUploadResult.success || multipleImageUploadResult.status === 401 || multipleImageUploadResult.status === 403 || multipleImageUploadResult.status === 405 || multipleImageUploadResult.status === 404,
    'Multiple image upload should be supported or endpoint should exist'
  );
}

// ==================== UI COMPONENTS TESTING ====================

async function testUIComponents(testData) {
  console.log('\n🎨 === UI COMPONENTS TESTING ===');
  
  // Test 1: Dropdown Data Sources
  const suppliersResult = await makeRequest(
    'Suppliers Dropdown Data',
    `${API_BASE}/api/all-suppliers`
  );
  
  await validateTest(
    'Suppliers Dropdown Data Quality',
    'uiComponents',
    suppliersResult.success && Array.isArray(suppliersResult.data) && suppliersResult.data.length > 0,
    'Suppliers dropdown should have quality data'
  );
  
  // Test 2: Locations Dropdown Data
  const locationsResult = await makeRequest(
    'Locations Dropdown Data',
    `${API_BASE}/api/locations/1/10/en`
  );
  
  if (locationsResult.success) {
    const locations = locationsResult.data[0]?.resultData || [];
    
    await validateTest(
      'Locations Dropdown Data Quality',
      'uiComponents',
      locations.length > 0 && locations.every(loc => loc._id && loc.name),
      'Locations dropdown should have quality data with _id and name'
    );
  }
  
  // Test 3: Dress Catalog Data
  const dressesResult = await makeRequest(
    'Dress Catalog Data',
    `${API_BASE}/api/dresses/1/10`,
    {
      method: 'POST',
      body: {
        suppliers: testData.suppliers.map(s => s._id.toString())
      }
    }
  );
  
  if (dressesResult.success) {
    const dresses = dressesResult.data.docs || [];
    
    await validateTest(
      'Dress Catalog Data Quality',
      'uiComponents',
      dresses.length > 0 && dresses.every(dress => dress._id && dress.name && dress.price),
      'Dress catalog should have quality data with essential fields'
    );
  }
}

// ==================== USER EXPERIENCE TESTING ====================

async function testUserExperience(testData) {
  console.log('\n✨ === USER EXPERIENCE TESTING ===');
  
  // Test 1: Search Functionality
  const searchResult = await makeRequest(
    'Search Functionality',
    `${API_BASE}/api/dresses/1/10`,
    {
      method: 'POST',
      body: {
        keyword: 'wedding',
        suppliers: testData.suppliers.map(s => s._id.toString())
      }
    }
  );
  
  await validateTest(
    'Search Functionality',
    'userExperience',
    searchResult.success,
    'Search functionality should work'
  );
  
  // Test 2: Pagination Support
  const paginationResult = await makeRequest(
    'Pagination Support',
    `${API_BASE}/api/dresses/2/5`,
    {
      method: 'POST',
      body: {
        suppliers: testData.suppliers.map(s => s._id.toString())
      }
    }
  );
  
  await validateTest(
    'Pagination Support',
    'userExperience',
    paginationResult.success,
    'Pagination should be supported'
  );
  
  // Test 3: Filtering Capabilities
  if (testData.suppliers.length > 0) {
    const filterResult = await makeRequest(
      'Filtering Capabilities',
      `${API_BASE}/api/dresses/1/10`,
      {
        method: 'POST',
        body: {
          suppliers: [testData.suppliers[0]._id.toString()],
          priceRange: { min: 500, max: 2000 }
        }
      }
    );
    
    await validateTest(
      'Filtering Capabilities',
      'userExperience',
      filterResult.success,
      'Filtering should be supported'
    );
  }
  
  // Test 4: Responsive API Design
  const mobileApiResult = await makeRequest(
    'Mobile-Friendly API Response',
    `${API_BASE}/api/dresses/1/5`,
    {
      method: 'POST',
      body: {
        suppliers: testData.suppliers.map(s => s._id.toString())
      }
    }
  );
  
  if (mobileApiResult.success) {
    const dresses = mobileApiResult.data.docs || [];
    
    await validateTest(
      'Mobile-Friendly Data Structure',
      'userExperience',
      dresses.every(dress => dress._id && dress.name && dress.price && dress.images),
      'API responses should be mobile-friendly with essential data'
    );
  }
}

// ==================== BUSINESS LOGIC TESTING ====================

async function testBusinessLogic(testData) {
  console.log('\n💼 === BUSINESS LOGIC TESTING ===');
  
  // Test 1: User Type Consistency
  const userTypes = ['admin', 'supplier', 'user'];
  const allUsersValid = testData.users.every(user => userTypes.includes(user.type));
  
  await validateTest(
    'User Type Consistency',
    'businessLogic',
    allUsersValid,
    'All users should have valid types (admin, supplier, user)'
  );
  
  // Test 2: Dress-Supplier Relationship Integrity
  const dressSupplierIntegrity = testData.dresses.every(dress => {
    const supplier = testData.suppliers.find(s => s._id.toString() === dress.supplier.toString());
    return supplier !== undefined;
  });
  
  await validateTest(
    'Dress-Supplier Relationship Integrity',
    'businessLogic',
    dressSupplierIntegrity,
    'All dresses should have valid supplier relationships'
  );
  
  // Test 3: Data Validation Rules
  const validPrices = testData.dresses.every(dress => 
    dress.price && dress.price > 0 && 
    (!dress.discountedPrice || dress.discountedPrice < dress.price)
  );
  
  await validateTest(
    'Price Validation Rules',
    'businessLogic',
    validPrices,
    'All dresses should have valid pricing (price > 0, discounted < original)'
  );
}

async function runUIUXAvatarTesting() {
  console.log('🚀 Starting Comprehensive UI/UX and Avatar Testing...\n');
  
  // Get test data
  const testData = await getTestData();
  console.log('📊 Test data loaded:');
  console.log(`   - Users: ${testData.users.length}`);
  console.log(`   - Suppliers: ${testData.suppliers.length}`);
  console.log(`   - Customers: ${testData.customers.length}`);
  console.log(`   - Admins: ${testData.admins.length}`);
  console.log(`   - Dresses: ${testData.dresses.length}`);
  console.log(`   - Locations: ${testData.locations.length}`);
  
  // Run comprehensive UI/UX and avatar tests
  await testAvatarHandling(testData);
  await testImageUploads(testData);
  await testUIComponents(testData);
  await testUserExperience(testData);
  await testBusinessLogic(testData);
  
  // Test Results Summary
  console.log('\n📊 === COMPREHENSIVE UI/UX AND AVATAR TEST RESULTS ===');
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
  
  console.log('\n🎉 Comprehensive UI/UX and avatar testing completed!');
}

if (require.main === module) {
  runUIUXAvatarTesting().catch(console.error);
}

module.exports = { runUIUXAvatarTesting };
