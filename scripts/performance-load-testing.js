#!/usr/bin/env node

/**
 * Comprehensive Performance and Load Testing
 * Tests API response times, database query optimization, concurrent user scenarios, and system scalability
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
    responseTime: { passed: 0, failed: 0 },
    databasePerformance: { passed: 0, failed: 0 },
    concurrentUsers: { passed: 0, failed: 0 },
    loadTesting: { passed: 0, failed: 0 },
    scalability: { passed: 0, failed: 0 },
    optimization: { passed: 0, failed: 0 }
  },
  performanceMetrics: {
    apiResponseTimes: [],
    databaseQueryTimes: [],
    concurrentRequestResults: [],
    memoryUsage: [],
    errorRates: []
  }
};

async function makeTimedRequest(name, url, options = {}) {
  const startTime = Date.now();
  
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
      timeout: 30000 // Increased timeout for load testing
    });
    
    const endTime = Date.now();
    const responseTime = endTime - startTime;
    
    console.log(`   Status: ${response.status} ${response.statusText}`);
    console.log(`   Response Time: ${responseTime}ms`);
    
    const data = await response.text();
    let jsonData = null;
    
    try {
      jsonData = JSON.parse(data);
    } catch (e) {
      // Non-JSON response
    }
    
    // Record performance metrics
    testResults.performanceMetrics.apiResponseTimes.push({
      endpoint: name,
      url: url,
      method: options.method || 'GET',
      responseTime: responseTime,
      status: response.status,
      success: response.ok
    });
    
    if (response.ok) {
      console.log(`   ✅ Success`);
      testResults.passed++;
      return { success: true, data: jsonData || data, status: response.status, responseTime };
    } else {
      console.log(`   ❌ Error: ${response.status}`);
      testResults.failed++;
      testResults.issues.push({
        test: name,
        url: url,
        status: response.status,
        responseTime: responseTime,
        error: jsonData ? jsonData.error : `HTTP ${response.status}`
      });
      return { success: false, error: jsonData ? jsonData.error : `HTTP ${response.status}`, status: response.status, responseTime };
    }
    
  } catch (error) {
    const endTime = Date.now();
    const responseTime = endTime - startTime;
    
    console.log(`   💥 Request failed: ${error.message}`);
    console.log(`   Response Time: ${responseTime}ms (failed)`);
    
    testResults.failed++;
    testResults.issues.push({
      test: name,
      url: url,
      responseTime: responseTime,
      error: error.message
    });
    
    testResults.performanceMetrics.apiResponseTimes.push({
      endpoint: name,
      url: url,
      method: options.method || 'GET',
      responseTime: responseTime,
      status: 'ERROR',
      success: false,
      error: error.message
    });
    
    return { success: false, error: error.message, responseTime };
  }
}

async function validatePerformanceTest(testName, category, condition, errorMessage, metric = null) {
  console.log(`\n🧪 ${testName}`);
  
  if (condition) {
    console.log(`   ✅ PASS: ${testName}`);
    if (metric) console.log(`   📊 Metric: ${metric}`);
    testResults.categories[category].passed++;
    testResults.passed++;
    return true;
  } else {
    console.log(`   ❌ FAIL: ${testName} - ${errorMessage}`);
    if (metric) console.log(`   📊 Metric: ${metric}`);
    testResults.categories[category].failed++;
    testResults.failed++;
    testResults.issues.push({
      test: testName,
      category: category,
      error: errorMessage,
      metric: metric
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
  
  return { users, dresses, locations, bookings, suppliers };
}

// ==================== API RESPONSE TIME TESTING ====================

async function testApiResponseTimes(testData) {
  console.log('\n⚡ === API RESPONSE TIME TESTING ===');
  
  const endpoints = [
    { name: 'Get All Suppliers', url: `${API_BASE}/api/all-suppliers`, method: 'GET' },
    { name: 'Get Locations', url: `${API_BASE}/api/locations/1/10/en`, method: 'GET' },
    { name: 'Get Frontend Dresses', url: `${API_BASE}/api/frontend-dresses/1/20`, method: 'POST', body: { suppliers: testData.suppliers.map(s => s._id.toString()) } },
    { name: 'Get Dress Details', url: `${API_BASE}/api/dress/${testData.dresses[0]?._id}/en`, method: 'GET' },
    { name: 'Search Dresses', url: `${API_BASE}/api/dresses/1/10`, method: 'POST', body: { keyword: 'dress', suppliers: testData.suppliers.map(s => s._id.toString()) } }
  ];
  
  const responseTimes = [];
  
  for (const endpoint of endpoints) {
    if (endpoint.name === 'Get Dress Details' && !testData.dresses[0]) continue;
    
    const result = await makeTimedRequest(endpoint.name, endpoint.url, {
      method: endpoint.method,
      body: endpoint.body
    });
    
    if (result.responseTime) {
      responseTimes.push(result.responseTime);
    }
  }
  
  if (responseTimes.length > 0) {
    const avgResponseTime = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;
    const maxResponseTime = Math.max(...responseTimes);
    const minResponseTime = Math.min(...responseTimes);
    
    await validatePerformanceTest(
      'Average API Response Time',
      'responseTime',
      avgResponseTime < 2000, // Less than 2 seconds
      'Average API response time should be under 2 seconds',
      `${avgResponseTime.toFixed(0)}ms`
    );
    
    await validatePerformanceTest(
      'Maximum API Response Time',
      'responseTime',
      maxResponseTime < 5000, // Less than 5 seconds
      'Maximum API response time should be under 5 seconds',
      `${maxResponseTime}ms`
    );
    
    console.log(`   📊 Response Time Stats:`);
    console.log(`      - Average: ${avgResponseTime.toFixed(0)}ms`);
    console.log(`      - Minimum: ${minResponseTime}ms`);
    console.log(`      - Maximum: ${maxResponseTime}ms`);
  }
}

// ==================== DATABASE PERFORMANCE TESTING ====================

async function testDatabasePerformance(testData) {
  console.log('\n🗄️ === DATABASE PERFORMANCE TESTING ===');
  
  const client = new MongoClient(MONGODB_URI);
  await client.connect();
  const db = client.db('bookdress');
  
  try {
    // Test 1: Collection sizes and indexes
    const collections = ['User', 'Dress', 'Booking', 'Location', 'Notification'];
    const collectionStats = {};
    
    for (const collectionName of collections) {
      const startTime = Date.now();
      const collection = db.collection(collectionName);
      const count = await collection.countDocuments();
      const indexes = await collection.indexes();
      const endTime = Date.now();
      
      collectionStats[collectionName] = {
        count: count,
        indexes: indexes.length,
        queryTime: endTime - startTime
      };
      
      console.log(`   📊 ${collectionName}: ${count} documents, ${indexes.length} indexes, ${endTime - startTime}ms`);
    }
    
    // Test 2: Complex query performance
    const startTime = Date.now();
    const complexQuery = await db.collection('Dress').find({
      available: true,
      price: { $gte: 500, $lte: 2000 }
    }).limit(20).toArray();
    const complexQueryTime = Date.now() - startTime;
    
    await validatePerformanceTest(
      'Complex Database Query Performance',
      'databasePerformance',
      complexQueryTime < 1000, // Less than 1 second
      'Complex database queries should complete under 1 second',
      `${complexQueryTime}ms`
    );
    
    // Test 3: Aggregation performance
    const aggStartTime = Date.now();
    const aggregation = await db.collection('Booking').aggregate([
      { $match: { status: { $in: ['confirmed', 'completed'] } } },
      { $group: { _id: '$supplier', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]).toArray();
    const aggQueryTime = Date.now() - aggStartTime;
    
    await validatePerformanceTest(
      'Database Aggregation Performance',
      'databasePerformance',
      aggQueryTime < 1500, // Less than 1.5 seconds
      'Database aggregations should complete under 1.5 seconds',
      `${aggQueryTime}ms`
    );
    
    console.log(`   📊 Database Performance Stats:`);
    console.log(`      - Complex Query: ${complexQueryTime}ms`);
    console.log(`      - Aggregation: ${aggQueryTime}ms`);
    console.log(`      - Total Documents: ${Object.values(collectionStats).reduce((sum, stat) => sum + stat.count, 0)}`);
    
  } finally {
    await client.close();
  }
}

// ==================== CONCURRENT USER TESTING ====================

async function testConcurrentUsers(testData) {
  console.log('\n👥 === CONCURRENT USER TESTING ===');
  
  const concurrentRequests = 10;
  const testUrl = `${API_BASE}/api/all-suppliers`;
  
  console.log(`   🚀 Testing ${concurrentRequests} concurrent requests to ${testUrl}`);
  
  const promises = [];
  const startTime = Date.now();
  
  for (let i = 0; i < concurrentRequests; i++) {
    promises.push(
      makeTimedRequest(`Concurrent Request ${i + 1}`, testUrl)
        .then(result => ({ ...result, requestId: i + 1 }))
        .catch(error => ({ success: false, error: error.message, requestId: i + 1 }))
    );
  }
  
  const results = await Promise.all(promises);
  const endTime = Date.now();
  const totalTime = endTime - startTime;
  
  const successfulRequests = results.filter(r => r.success).length;
  const failedRequests = results.filter(r => !r.success).length;
  const successRate = (successfulRequests / concurrentRequests) * 100;
  
  await validatePerformanceTest(
    'Concurrent Request Success Rate',
    'concurrentUsers',
    successRate >= 90, // At least 90% success rate
    'Concurrent requests should have at least 90% success rate',
    `${successRate.toFixed(1)}%`
  );
  
  await validatePerformanceTest(
    'Concurrent Request Total Time',
    'concurrentUsers',
    totalTime < 10000, // Less than 10 seconds for all requests
    'All concurrent requests should complete within 10 seconds',
    `${totalTime}ms`
  );
  
  console.log(`   📊 Concurrent Request Stats:`);
  console.log(`      - Total Requests: ${concurrentRequests}`);
  console.log(`      - Successful: ${successfulRequests}`);
  console.log(`      - Failed: ${failedRequests}`);
  console.log(`      - Success Rate: ${successRate.toFixed(1)}%`);
  console.log(`      - Total Time: ${totalTime}ms`);
  console.log(`      - Average Time per Request: ${(totalTime / concurrentRequests).toFixed(0)}ms`);
  
  testResults.performanceMetrics.concurrentRequestResults = results;
}

// ==================== LOAD TESTING ====================

async function testSystemLoad(testData) {
  console.log('\n🏋️ === SYSTEM LOAD TESTING ===');
  
  const loadTestEndpoints = [
    { name: 'Suppliers Load Test', url: `${API_BASE}/api/all-suppliers`, requests: 20 },
    { name: 'Dresses Load Test', url: `${API_BASE}/api/frontend-dresses/1/10`, method: 'POST', body: { suppliers: testData.suppliers.slice(0, 3).map(s => s._id.toString()) }, requests: 15 }
  ];
  
  for (const test of loadTestEndpoints) {
    console.log(`\n   🎯 Running ${test.name} with ${test.requests} requests`);
    
    const promises = [];
    const startTime = Date.now();
    
    for (let i = 0; i < test.requests; i++) {
      promises.push(
        makeTimedRequest(`${test.name} ${i + 1}`, test.url, {
          method: test.method || 'GET',
          body: test.body
        }).catch(error => ({ success: false, error: error.message }))
      );
      
      // Add small delay between requests to simulate real usage
      if (i < test.requests - 1) {
        await new Promise(resolve => setTimeout(resolve, 50));
      }
    }
    
    const results = await Promise.all(promises);
    const endTime = Date.now();
    const totalTime = endTime - startTime;
    
    const successfulRequests = results.filter(r => r.success).length;
    const avgResponseTime = results
      .filter(r => r.responseTime)
      .reduce((sum, r) => sum + r.responseTime, 0) / results.filter(r => r.responseTime).length;
    
    const successRate = (successfulRequests / test.requests) * 100;
    
    await validatePerformanceTest(
      `${test.name} Success Rate`,
      'loadTesting',
      successRate >= 85, // At least 85% success rate under load
      'Load test should maintain at least 85% success rate',
      `${successRate.toFixed(1)}%`
    );
    
    console.log(`      📊 ${test.name} Results:`);
    console.log(`         - Success Rate: ${successRate.toFixed(1)}%`);
    console.log(`         - Average Response Time: ${avgResponseTime ? avgResponseTime.toFixed(0) : 'N/A'}ms`);
    console.log(`         - Total Time: ${totalTime}ms`);
  }
}

async function runPerformanceLoadTesting() {
  console.log('🚀 Starting Comprehensive Performance and Load Testing...\n');
  
  // Get test data
  const testData = await getTestData();
  console.log('📊 Test data loaded:');
  console.log(`   - Users: ${testData.users.length}`);
  console.log(`   - Suppliers: ${testData.suppliers.length}`);
  console.log(`   - Dresses: ${testData.dresses.length}`);
  console.log(`   - Locations: ${testData.locations.length}`);
  console.log(`   - Bookings: ${testData.bookings.length}`);
  
  // Run comprehensive performance and load tests
  await testApiResponseTimes(testData);
  await testDatabasePerformance(testData);
  await testConcurrentUsers(testData);
  await testSystemLoad(testData);
  
  // Test Results Summary
  console.log('\n📊 === COMPREHENSIVE PERFORMANCE AND LOAD TEST RESULTS ===');
  console.log(`✅ Total Tests Passed: ${testResults.passed}`);
  console.log(`❌ Total Tests Failed: ${testResults.failed}`);
  console.log(`📈 Success Rate: ${testResults.passed + testResults.failed > 0 ? ((testResults.passed / (testResults.passed + testResults.failed)) * 100).toFixed(1) : 0}%`);
  
  console.log('\n📋 Results by Category:');
  Object.entries(testResults.categories).forEach(([category, results]) => {
    const total = results.passed + results.failed;
    const successRate = total > 0 ? ((results.passed / total) * 100).toFixed(1) : 0;
    console.log(`   ${category.toUpperCase()}: ${results.passed}/${total} (${successRate}%)`);
  });
  
  // Performance Metrics Summary
  console.log('\n📈 === PERFORMANCE METRICS SUMMARY ===');
  const apiTimes = testResults.performanceMetrics.apiResponseTimes.filter(t => t.success);
  if (apiTimes.length > 0) {
    const avgApiTime = apiTimes.reduce((sum, t) => sum + t.responseTime, 0) / apiTimes.length;
    const maxApiTime = Math.max(...apiTimes.map(t => t.responseTime));
    console.log(`📊 API Performance:`);
    console.log(`   - Average Response Time: ${avgApiTime.toFixed(0)}ms`);
    console.log(`   - Maximum Response Time: ${maxApiTime}ms`);
    console.log(`   - Total API Calls: ${apiTimes.length}`);
  }
  
  if (testResults.issues.length > 0) {
    console.log('\n🐛 === PERFORMANCE ISSUES FOUND ===');
    testResults.issues.forEach((issue, index) => {
      console.log(`\n${index + 1}. ${issue.test}`);
      if (issue.url) console.log(`   URL: ${issue.url}`);
      if (issue.status) console.log(`   Status: ${issue.status}`);
      if (issue.responseTime) console.log(`   Response Time: ${issue.responseTime}ms`);
      if (issue.metric) console.log(`   Metric: ${issue.metric}`);
      console.log(`   Error: ${issue.error}`);
    });
  }
  
  console.log('\n🎉 Comprehensive performance and load testing completed!');
}

if (require.main === module) {
  runPerformanceLoadTesting().catch(console.error);
}

module.exports = { runPerformanceLoadTesting };
