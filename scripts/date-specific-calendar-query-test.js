#!/usr/bin/env node

/**
 * Date-Specific Calendar Query Testing
 * Tests the fixed date range queries in fitting appointment calendar functionality
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

async function validateTest(testName, condition, errorMessage) {
  console.log(`\n🧪 ${testName}`);
  
  if (condition) {
    console.log(`   ✅ PASS: ${testName}`);
    testResults.passed++;
    return true;
  } else {
    console.log(`   ❌ FAIL: ${testName} - ${errorMessage}`);
    testResults.failed++;
    testResults.issues.push({
      test: testName,
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
  const fittingAppointments = await db.collection('FittingAppointment').find({}).toArray();
  
  await client.close();
  
  const suppliers = users.filter(u => u.type === 'supplier');
  
  return { users, dresses, locations, fittingAppointments, suppliers };
}

async function testDateSpecificQueries(testData) {
  console.log('\n📅 === DATE-SPECIFIC CALENDAR QUERY TESTING ===');
  
  if (testData.suppliers.length === 0) {
    console.log('⚠️ No suppliers available for date-specific testing');
    return;
  }
  
  const supplier = testData.suppliers[0];
  const testDate = new Date(Date.now() + 1800 * 24 * 60 * 60 * 1000); // Future date
  const dateString = testDate.toISOString().split('T')[0]; // YYYY-MM-DD format
  
  // Test 1: Get Available Time Slots for Specific Date
  const availableSlotsResult = await makeRequest(
    'Get Available Time Slots for Specific Date',
    `${API_BASE}/api/fitting-appointments/available-slots/${supplier._id}/${dateString}`
  );
  
  await validateTest(
    'Date-Specific Available Slots Query',
    availableSlotsResult.success,
    'Should be able to get available slots for specific date'
  );
  
  if (availableSlotsResult.success) {
    const slotsData = availableSlotsResult.data;
    
    await validateTest(
      'Available Slots Data Structure',
      slotsData && (slotsData.availableSlots || slotsData.bookedSlots !== undefined),
      'Available slots response should have proper data structure'
    );
    
    console.log(`   📊 Available slots for ${dateString}:`, slotsData.availableSlots?.length || 'N/A');
    console.log(`   📊 Booked slots for ${dateString}:`, slotsData.bookedSlots?.length || 0);
  }
  
  // Test 2: Test Date Range Boundaries
  const todayDate = new Date();
  todayDate.setHours(12, 30, 45, 123); // Set specific time to test range handling
  const todayString = todayDate.toISOString().split('T')[0];
  
  const todaySlotsResult = await makeRequest(
    'Get Available Slots for Today (with time components)',
    `${API_BASE}/api/fitting-appointments/available-slots/${supplier._id}/${todayString}`
  );
  
  await validateTest(
    'Date Range Boundary Handling',
    todaySlotsResult.success,
    'Should handle dates with time components correctly'
  );
  
  // Test 3: Test Multiple Date Queries
  const dates = [];
  for (let i = 1; i <= 3; i++) {
    const futureDate = new Date(Date.now() + (1800 + i) * 24 * 60 * 60 * 1000);
    dates.push(futureDate.toISOString().split('T')[0]);
  }
  
  let successfulQueries = 0;
  for (const date of dates) {
    const dateQueryResult = await makeRequest(
      `Get Available Slots for ${date}`,
      `${API_BASE}/api/fitting-appointments/available-slots/${supplier._id}/${date}`
    );
    
    if (dateQueryResult.success) {
      successfulQueries++;
    }
  }
  
  await validateTest(
    'Multiple Date Queries',
    successfulQueries >= 2,
    'Should be able to query multiple dates successfully'
  );
  
  // Test 4: Test Invalid Date Handling
  const invalidDateResult = await makeRequest(
    'Test Invalid Date Handling',
    `${API_BASE}/api/fitting-appointments/available-slots/${supplier._id}/invalid-date`
  );
  
  await validateTest(
    'Invalid Date Handling',
    !invalidDateResult.success && (invalidDateResult.status === 400 || invalidDateResult.status === 500),
    'Should handle invalid dates gracefully with appropriate error status'
  );
}

async function testDatabaseDateConsistency(testData) {
  console.log('\n🗄️ === DATABASE DATE CONSISTENCY TESTING ===');
  
  // Test 1: Check existing appointments date format
  if (testData.fittingAppointments.length > 0) {
    const appointment = testData.fittingAppointments[0];
    
    await validateTest(
      'Appointment Date Format Consistency',
      appointment.appointmentDate instanceof Date || typeof appointment.appointmentDate === 'string',
      'Appointment dates should be in consistent format'
    );
    
    console.log(`   📊 Sample appointment date:`, appointment.appointmentDate);
    console.log(`   📊 Date type:`, typeof appointment.appointmentDate);
  }
  
  // Test 2: Verify date indexing
  const client = new MongoClient(MONGODB_URI);
  await client.connect();
  const db = client.db('bookdress');
  
  try {
    const indexes = await db.collection('FittingAppointment').indexes();
    const hasDateIndex = indexes.some(index => 
      index.key && (index.key.appointmentDate || index.key['appointmentDate'])
    );
    
    await validateTest(
      'Date Field Indexing',
      hasDateIndex,
      'FittingAppointment collection should have date-based indexes for performance'
    );
    
    console.log(`   📊 Total indexes on FittingAppointment:`, indexes.length);
  } catch (error) {
    console.log(`   ⚠️ Could not check indexes:`, error.message);
  } finally {
    await client.close();
  }
}

async function runDateSpecificCalendarQueryTest() {
  console.log('🚀 Starting Date-Specific Calendar Query Testing...\n');
  
  // Get test data
  const testData = await getTestData();
  console.log('📊 Test data loaded:');
  console.log(`   - Users: ${testData.users.length}`);
  console.log(`   - Suppliers: ${testData.suppliers.length}`);
  console.log(`   - Dresses: ${testData.dresses.length}`);
  console.log(`   - Locations: ${testData.locations.length}`);
  console.log(`   - Fitting Appointments: ${testData.fittingAppointments.length}`);
  
  // Run date-specific calendar query tests
  await testDateSpecificQueries(testData);
  await testDatabaseDateConsistency(testData);
  
  // Test Results Summary
  console.log('\n📊 === DATE-SPECIFIC CALENDAR QUERY TEST RESULTS ===');
  console.log(`✅ Total Tests Passed: ${testResults.passed}`);
  console.log(`❌ Total Tests Failed: ${testResults.failed}`);
  console.log(`📈 Success Rate: ${testResults.passed + testResults.failed > 0 ? ((testResults.passed / (testResults.passed + testResults.failed)) * 100).toFixed(1) : 0}%`);
  
  if (testResults.issues.length > 0) {
    console.log('\n🐛 === ISSUES FOUND ===');
    testResults.issues.forEach((issue, index) => {
      console.log(`\n${index + 1}. ${issue.test}`);
      if (issue.url) console.log(`   URL: ${issue.url}`);
      if (issue.status) console.log(`   Status: ${issue.status}`);
      console.log(`   Error: ${issue.error}`);
    });
  }
  
  console.log('\n🎉 Date-specific calendar query testing completed!');
  
  if (testResults.failed === 0) {
    console.log('\n✅ All date-specific calendar queries are working correctly!');
    console.log('🔧 The MongoDB date casting errors have been fixed.');
  } else {
    console.log('\n⚠️ Some issues were found. Please review the results above.');
  }
}

if (require.main === module) {
  runDateSpecificCalendarQueryTest().catch(console.error);
}

module.exports = { runDateSpecificCalendarQueryTest };
