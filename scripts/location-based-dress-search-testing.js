#!/usr/bin/env node

/**
 * Comprehensive Location-Based Dress Search Testing
 * Tests frontend location-based dress filtering and ensures proper results display
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
    locationFiltering: { passed: 0, failed: 0 },
    dressDisplay: { passed: 0, failed: 0 },
    searchAccuracy: { passed: 0, failed: 0 },
    dataIntegrity: { passed: 0, failed: 0 },
    frontendIntegration: { passed: 0, failed: 0 }
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
  
  return { users, dresses, locations, suppliers };
}

// ==================== LOCATION FILTERING TESTING ====================

async function testLocationFiltering(testData) {
  console.log('\n📍 === LOCATION FILTERING TESTING ===');
  
  if (testData.locations.length === 0) {
    console.log('⚠️ No locations available for filtering testing');
    return;
  }
  
  // Test 1: Search dresses by specific location
  const location = testData.locations[0];
  
  const locationSearchResult = await makeRequest(
    'Search Dresses by Location',
    `${API_BASE}/api/frontend-dresses/1/10`,
    {
      method: 'POST',
      body: {
        location: location._id.toString()
      }
    }
  );
  
  await validateTest(
    'Location-Based Dress Search',
    'locationFiltering',
    locationSearchResult.success,
    'Should be able to search dresses by location'
  );
  
  if (locationSearchResult.success) {
    const dresses = locationSearchResult.data.docs || [];
    
    await validateTest(
      'Location Search Returns Results',
      'locationFiltering',
      Array.isArray(dresses),
      'Location search should return array of dresses'
    );
    
    // Test 2: Verify all returned dresses have the specified location
    if (dresses.length > 0) {
      const allDressesHaveLocation = dresses.every(dress => {
        if (dress.locations && Array.isArray(dress.locations)) {
          return dress.locations.some(loc => 
            (typeof loc === 'string' ? loc : loc._id).toString() === location._id.toString()
          );
        }
        return false;
      });
      
      await validateTest(
        'Dress Location Accuracy',
        'searchAccuracy',
        allDressesHaveLocation,
        'All returned dresses should have the specified location'
      );
      
      console.log(`   📊 Found ${dresses.length} dresses at location: ${location.name}`);
    } else {
      console.log(`   ℹ️ No dresses found at location: ${location.name}`);
    }
  }
  
  // Test 3: Test multiple locations
  if (testData.locations.length > 1) {
    const location2 = testData.locations[1];
    
    const location2SearchResult = await makeRequest(
      'Search Dresses by Different Location',
      `${API_BASE}/api/frontend-dresses/1/10`,
      {
        method: 'POST',
        body: {
          location: location2._id.toString()
        }
      }
    );
    
    await validateTest(
      'Multiple Location Search Support',
      'locationFiltering',
      location2SearchResult.success,
      'Should support searching by different locations'
    );
    
    if (location2SearchResult.success) {
      const dresses2 = location2SearchResult.data.docs || [];
      console.log(`   📊 Found ${dresses2.length} dresses at location: ${location2.name}`);
    }
  }
}

// ==================== DRESS DISPLAY TESTING ====================

async function testDressDisplay(testData) {
  console.log('\n👗 === DRESS DISPLAY TESTING ===');
  
  if (testData.locations.length === 0) {
    console.log('⚠️ No locations available for display testing');
    return;
  }
  
  const location = testData.locations[0];
  
  // Test 1: Verify dress data completeness
  const dressDisplayResult = await makeRequest(
    'Get Dress Display Data',
    `${API_BASE}/api/frontend-dresses/1/10`,
    {
      method: 'POST',
      body: {
        location: location._id.toString()
      }
    }
  );
  
  if (dressDisplayResult.success) {
    const dresses = dressDisplayResult.data.docs || [];
    
    if (dresses.length > 0) {
      const firstDress = dresses[0];
      
      await validateTest(
        'Dress Essential Fields Present',
        'dressDisplay',
        firstDress._id && firstDress.name && firstDress.price && firstDress.supplier,
        'Dresses should have essential fields for display'
      );
      
      await validateTest(
        'Dress Location Data Present',
        'dressDisplay',
        firstDress.locations && Array.isArray(firstDress.locations),
        'Dresses should have location data for filtering'
      );
      
      await validateTest(
        'Dress Supplier Data Present',
        'dressDisplay',
        firstDress.supplier && (typeof firstDress.supplier === 'object' ? firstDress.supplier._id : firstDress.supplier),
        'Dresses should have supplier data for display'
      );
    }
  }
}

// ==================== DATA INTEGRITY TESTING ====================

async function testDataIntegrity(testData) {
  console.log('\n🔍 === DATA INTEGRITY TESTING ===');
  
  // Test 1: Verify dress-location relationships in database
  const dressesWithLocations = testData.dresses.filter(dress => 
    dress.locations && Array.isArray(dress.locations) && dress.locations.length > 0
  );
  
  await validateTest(
    'Dresses Have Location Assignments',
    'dataIntegrity',
    dressesWithLocations.length > 0,
    'Some dresses should have location assignments'
  );
  
  // Test 2: Verify location references are valid
  const validLocationRefs = dressesWithLocations.every(dress => 
    dress.locations.every(locId => 
      testData.locations.some(loc => loc._id.toString() === locId.toString())
    )
  );
  
  await validateTest(
    'Valid Location References',
    'dataIntegrity',
    validLocationRefs,
    'All dress location references should be valid'
  );
  
  console.log(`   📊 Database Stats:`);
  console.log(`      - Total Dresses: ${testData.dresses.length}`);
  console.log(`      - Dresses with Locations: ${dressesWithLocations.length}`);
  console.log(`      - Total Locations: ${testData.locations.length}`);
}

// ==================== FRONTEND INTEGRATION TESTING ====================

async function testFrontendIntegration(testData) {
  console.log('\n🌐 === FRONTEND INTEGRATION TESTING ===');
  
  if (testData.locations.length === 0 || testData.suppliers.length === 0) {
    console.log('⚠️ Insufficient data for frontend integration testing');
    return;
  }
  
  const location = testData.locations[0];
  const supplier = testData.suppliers[0];
  
  // Test 1: Combined location and supplier filtering
  const combinedFilterResult = await makeRequest(
    'Combined Location and Supplier Filter',
    `${API_BASE}/api/frontend-dresses/1/10`,
    {
      method: 'POST',
      body: {
        location: location._id.toString(),
        suppliers: [supplier._id.toString()]
      }
    }
  );
  
  await validateTest(
    'Combined Filtering Support',
    'frontendIntegration',
    combinedFilterResult.success,
    'Should support combined location and supplier filtering'
  );
  
  // Test 2: Pagination with location filtering
  const paginationResult = await makeRequest(
    'Location Filter with Pagination',
    `${API_BASE}/api/frontend-dresses/2/5`,
    {
      method: 'POST',
      body: {
        location: location._id.toString()
      }
    }
  );
  
  await validateTest(
    'Pagination with Location Filter',
    'frontendIntegration',
    paginationResult.success,
    'Location filtering should work with pagination'
  );
  
  // Test 3: Empty location filter (should return all dresses)
  const noLocationResult = await makeRequest(
    'No Location Filter (All Dresses)',
    `${API_BASE}/api/frontend-dresses/1/10`,
    {
      method: 'POST',
      body: {}
    }
  );
  
  await validateTest(
    'No Location Filter Fallback',
    'frontendIntegration',
    noLocationResult.success,
    'Should return all dresses when no location filter is specified'
  );
}

async function runLocationBasedDressSearchTesting() {
  console.log('🚀 Starting Comprehensive Location-Based Dress Search Testing...\n');
  
  // Get test data
  const testData = await getTestData();
  console.log('📊 Test data loaded:');
  console.log(`   - Users: ${testData.users.length}`);
  console.log(`   - Suppliers: ${testData.suppliers.length}`);
  console.log(`   - Dresses: ${testData.dresses.length}`);
  console.log(`   - Locations: ${testData.locations.length}`);
  
  // Run comprehensive location-based dress search tests
  await testLocationFiltering(testData);
  await testDressDisplay(testData);
  await testDataIntegrity(testData);
  await testFrontendIntegration(testData);
  
  // Test Results Summary
  console.log('\n📊 === COMPREHENSIVE LOCATION-BASED DRESS SEARCH TEST RESULTS ===');
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
  
  console.log('\n🎉 Comprehensive location-based dress search testing completed!');
}

if (require.main === module) {
  runLocationBasedDressSearchTesting().catch(console.error);
}

module.exports = { runLocationBasedDressSearchTesting };
