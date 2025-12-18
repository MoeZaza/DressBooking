#!/usr/bin/env node

/**
 * Comprehensive Page-by-Page Testing Suite
 * Tests every page and feature in both frontend and backend applications
 */

const fetch = require('node-fetch');
const { MongoClient } = require('mongodb');

const API_BASE = 'http://localhost:4002';
const FRONTEND_BASE = 'http://localhost:3000';
const BACKEND_BASE = 'http://localhost:3001';
const MONGODB_URI = 'mongodb+srv://user:Mybookmodr100@cluster0.ey9u2ce.mongodb.net/bookdress?retryWrites=true&w=majority&appName=Cluster0';

let testResults = {
  passed: 0,
  failed: 0,
  issues: [],
  categories: {
    frontendPages: { passed: 0, failed: 0 },
    backendPages: { passed: 0, failed: 0 },
    apiEndpoints: { passed: 0, failed: 0 },
    userFlows: { passed: 0, failed: 0 },
    dataIntegrity: { passed: 0, failed: 0 }
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
      timeout: 10000 // 10 second timeout
    });
    
    console.log(`   Status: ${response.status} ${response.statusText}`);
    
    const data = await response.text();
    let jsonData = null;
    
    try {
      jsonData = JSON.parse(data);
    } catch (e) {
      // Non-JSON response (HTML pages)
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

// ==================== FRONTEND PAGES TESTING ====================

async function testFrontendPages() {
  console.log('\n🌐 === FRONTEND PAGES TESTING ===');
  
  // Test 1: Home Page
  const homeResult = await makeRequest('Frontend Home Page', FRONTEND_BASE);
  await validateTest(
    'Home Page Accessibility',
    'frontendPages',
    homeResult.success,
    'Home page is not accessible'
  );
  
  // Test 2: Search/Browse Page
  const searchResult = await makeRequest('Dress Search Page', `${FRONTEND_BASE}/search`);
  await validateTest(
    'Dress Search Page Accessibility',
    'frontendPages',
    searchResult.success,
    'Dress search page is not accessible'
  );
  
  // Test 3: Dress Details Page (using a sample dress ID)
  const dressDetailResult = await makeRequest('Dress Details Page', `${FRONTEND_BASE}/dress/sample-id`);
  await validateTest(
    'Dress Details Page Structure',
    'frontendPages',
    dressDetailResult.success || dressDetailResult.status === 404, // 404 acceptable for invalid ID
    'Dress details page has structural issues'
  );
  
  // Test 4: Booking/Checkout Page
  const checkoutResult = await makeRequest('Booking Checkout Page', `${FRONTEND_BASE}/checkout`);
  await validateTest(
    'Booking Checkout Page Accessibility',
    'frontendPages',
    checkoutResult.success,
    'Booking checkout page is not accessible'
  );
  
  // Test 5: User Authentication Pages
  const signInResult = await makeRequest('Sign In Page', `${FRONTEND_BASE}/sign-in`);
  await validateTest(
    'Sign In Page Accessibility',
    'frontendPages',
    signInResult.success,
    'Sign in page is not accessible'
  );
  
  const signUpResult = await makeRequest('Sign Up Page', `${FRONTEND_BASE}/sign-up`);
  await validateTest(
    'Sign Up Page Accessibility',
    'frontendPages',
    signUpResult.success,
    'Sign up page is not accessible'
  );
  
  // Test 6: User Profile/Account Page
  const profileResult = await makeRequest('User Profile Page', `${FRONTEND_BASE}/profile`);
  await validateTest(
    'User Profile Page Structure',
    'frontendPages',
    profileResult.success || profileResult.status === 401, // 401 acceptable for unauthenticated
    'User profile page has structural issues'
  );
  
  // Test 7: Booking History Page
  const historyResult = await makeRequest('Booking History Page', `${FRONTEND_BASE}/bookings`);
  await validateTest(
    'Booking History Page Structure',
    'frontendPages',
    historyResult.success || historyResult.status === 401, // 401 acceptable for unauthenticated
    'Booking history page has structural issues'
  );
  
  // Test 8: Contact/Support Page
  const contactResult = await makeRequest('Contact Page', `${FRONTEND_BASE}/contact`);
  await validateTest(
    'Contact Page Accessibility',
    'frontendPages',
    contactResult.success || contactResult.status === 404, // 404 acceptable if not implemented
    'Contact page accessibility issues'
  );
}

// ==================== BACKEND PAGES TESTING ====================

async function testBackendPages() {
  console.log('\n🏢 === BACKEND PAGES TESTING ===');
  
  // Test 1: Backend Home/Dashboard
  const dashboardResult = await makeRequest('Backend Dashboard', BACKEND_BASE);
  await validateTest(
    'Backend Dashboard Accessibility',
    'backendPages',
    dashboardResult.success,
    'Backend dashboard is not accessible'
  );
  
  // Test 2: Admin Sign In Page
  const adminSignInResult = await makeRequest('Admin Sign In Page', `${BACKEND_BASE}/sign-in`);
  await validateTest(
    'Admin Sign In Page Accessibility',
    'backendPages',
    adminSignInResult.success,
    'Admin sign in page is not accessible'
  );
  
  // Test 3: User Management Page
  const userMgmtResult = await makeRequest('User Management Page', `${BACKEND_BASE}/users`);
  await validateTest(
    'User Management Page Structure',
    'backendPages',
    userMgmtResult.success || userMgmtResult.status === 401, // 401 acceptable for unauthenticated
    'User management page has structural issues'
  );
  
  // Test 4: Dress Management Page
  const dressMgmtResult = await makeRequest('Dress Management Page', `${BACKEND_BASE}/dresses`);
  await validateTest(
    'Dress Management Page Structure',
    'backendPages',
    dressMgmtResult.success || dressMgmtResult.status === 401, // 401 acceptable for unauthenticated
    'Dress management page has structural issues'
  );
  
  // Test 5: Booking Management Page
  const bookingMgmtResult = await makeRequest('Booking Management Page', `${BACKEND_BASE}/bookings`);
  await validateTest(
    'Booking Management Page Structure',
    'backendPages',
    bookingMgmtResult.success || bookingMgmtResult.status === 401, // 401 acceptable for unauthenticated
    'Booking management page has structural issues'
  );
  
  // Test 6: Analytics/Reports Page
  const analyticsResult = await makeRequest('Analytics Page', `${BACKEND_BASE}/analytics`);
  await validateTest(
    'Analytics Page Structure',
    'backendPages',
    analyticsResult.success || analyticsResult.status === 401, // 401 acceptable for unauthenticated
    'Analytics page has structural issues'
  );
  
  // Test 7: Settings Page
  const settingsResult = await makeRequest('Settings Page', `${BACKEND_BASE}/settings`);
  await validateTest(
    'Settings Page Structure',
    'backendPages',
    settingsResult.success || settingsResult.status === 401 || settingsResult.status === 404, // Acceptable responses
    'Settings page accessibility issues'
  );
  
  // Test 8: Location Management Page
  const locationMgmtResult = await makeRequest('Location Management Page', `${BACKEND_BASE}/locations`);
  await validateTest(
    'Location Management Page Structure',
    'backendPages',
    locationMgmtResult.success || locationMgmtResult.status === 401, // 401 acceptable for unauthenticated
    'Location management page has structural issues'
  );
}

// ==================== API ENDPOINTS TESTING ====================

async function testAPIEndpoints() {
  console.log('\n🔌 === API ENDPOINTS TESTING ===');
  
  // Test 1: Health Check
  const healthResult = await makeRequest('API Health Check', `${API_BASE}/api/health`);
  await validateTest(
    'API Health Check',
    'apiEndpoints',
    healthResult.success,
    'API health check is failing'
  );
  
  // Test 2: Core Data Endpoints
  const suppliersResult = await makeRequest('Get All Suppliers', `${API_BASE}/api/all-suppliers`);
  await validateTest(
    'Suppliers Endpoint',
    'apiEndpoints',
    suppliersResult.success,
    'Suppliers endpoint is not working'
  );
  
  const locationsResult = await makeRequest('Get All Locations', `${API_BASE}/api/locations/1/10/en`);
  await validateTest(
    'Locations Endpoint',
    'apiEndpoints',
    locationsResult.success,
    'Locations endpoint is not working'
  );
  
  // Test 3: Dress Search Functionality
  const dressSearchResult = await makeRequest(
    'Dress Search API',
    `${API_BASE}/api/frontend-dresses/1/10`,
    {
      method: 'POST',
      body: {}
    }
  );
  await validateTest(
    'Dress Search API',
    'apiEndpoints',
    dressSearchResult.success,
    'Dress search API is not working'
  );
  
  // Test 4: Email Validation
  const emailValidationResult = await makeRequest(
    'Email Validation API',
    `${API_BASE}/api/validate-email`,
    {
      method: 'POST',
      body: { email: 'test@example.com', appType: 'frontend' }
    }
  );
  await validateTest(
    'Email Validation API',
    'apiEndpoints',
    emailValidationResult.success,
    'Email validation API is not working'
  );
  
  // Test 5: Analytics API
  const analyticsAPIResult = await makeRequest('Analytics API', `${API_BASE}/api/analytics`);
  await validateTest(
    'Analytics API',
    'apiEndpoints',
    analyticsAPIResult.success || analyticsAPIResult.status === 401, // 401 acceptable for unauthenticated
    'Analytics API has issues'
  );
}

// ==================== USER FLOWS TESTING ====================

async function testUserFlows(testData) {
  console.log('\n👤 === USER FLOWS TESTING ===');
  
  // Test 1: Dress Discovery Flow
  const discoveryResult = await makeRequest(
    'Dress Discovery Flow',
    `${API_BASE}/api/frontend-dresses/1/5`,
    {
      method: 'POST',
      body: {
        suppliers: [],
        location: null,
        dressType: [],
        includeAlreadyBookedDresses: true,
        includeComingSoonDresses: true
      }
    }
  );
  
  await validateTest(
    'Dress Discovery Flow',
    'userFlows',
    discoveryResult.success && discoveryResult.data && discoveryResult.data.docs,
    'Dress discovery flow is not working properly'
  );
  
  // Test 2: User Registration Flow
  const timestamp = Date.now();
  const registrationResult = await makeRequest(
    'User Registration Flow',
    `${API_BASE}/api/create-user`,
    {
      method: 'POST',
      body: {
        fullName: `Flow Test User ${timestamp}`,
        email: `flowtest${timestamp}@example.com`,
        phone: `0599${Math.floor(100000 + Math.random() * 900000)}`,
        type: 'user',
        language: 'en'
      }
    }
  );
  
  await validateTest(
    'User Registration Flow',
    'userFlows',
    registrationResult.success,
    'User registration flow is not working'
  );
  
  // Test 3: Booking Creation Flow (if we have test data)
  if (testData.suppliers.length > 0 && testData.dresses.length > 0 && testData.customers.length > 0) {
    const bookingFlowResult = await makeRequest(
      'Booking Creation Flow',
      `${API_BASE}/api/create-booking`,
      {
        method: 'POST',
        body: {
          booking: {
            supplier: testData.suppliers[0]._id.toString(),
            dress: testData.dresses[0]._id.toString(),
            customer: testData.customers[0]._id.toString(),
            location: testData.locations[0]._id.toString(),
            from: new Date(Date.now() + 50 * 24 * 60 * 60 * 1000).toISOString(),
            to: new Date(Date.now() + 53 * 24 * 60 * 60 * 1000).toISOString(),
            status: 'pending',
            price: 600,
            deposit: 120
          }
        }
      }
    );
    
    await validateTest(
      'Booking Creation Flow',
      'userFlows',
      bookingFlowResult.success,
      'Booking creation flow is not working'
    );
  }
  
  // Test 4: Search and Filter Flow
  const filterFlowResult = await makeRequest(
    'Search and Filter Flow',
    `${API_BASE}/api/frontend-dresses/1/10`,
    {
      method: 'POST',
      body: {
        suppliers: testData.suppliers.length > 0 ? [testData.suppliers[0]._id.toString()] : [],
        location: null,
        dressType: ['evening'],
        includeAlreadyBookedDresses: true,
        includeComingSoonDresses: true
      }
    }
  );
  
  await validateTest(
    'Search and Filter Flow',
    'userFlows',
    filterFlowResult.success,
    'Search and filter flow is not working'
  );
}

// ==================== DATA INTEGRITY TESTING ====================

async function testDataIntegrity(testData) {
  console.log('\n🔍 === DATA INTEGRITY TESTING ===');
  
  // Test 1: Supplier-Dress Relationships
  const validDressSupplierRelations = testData.dresses.filter(dress => 
    testData.suppliers.some(supplier => supplier._id.toString() === dress.supplier.toString())
  );
  
  await validateTest(
    'Supplier-Dress Relationship Integrity',
    'dataIntegrity',
    validDressSupplierRelations.length === testData.dresses.length,
    `${testData.dresses.length - validDressSupplierRelations.length} dresses have invalid supplier references`
  );
  
  // Test 2: Booking-Customer Relationships
  const validBookingCustomerRelations = testData.bookings.filter(booking => 
    testData.customers.some(customer => customer._id.toString() === booking.customer.toString())
  );
  
  await validateTest(
    'Booking-Customer Relationship Integrity',
    'dataIntegrity',
    validBookingCustomerRelations.length === testData.bookings.length,
    `${testData.bookings.length - validBookingCustomerRelations.length} bookings have invalid customer references`
  );
  
  // Test 3: Revenue-Booking Consistency
  const paidBookings = testData.bookings.filter(booking => 
    booking.status === 'paid' || booking.status === 'deposit'
  );
  
  const totalBookingRevenue = paidBookings.reduce((sum, booking) => 
    sum + (booking.paidAmount || booking.price || 0), 0
  );
  
  const totalRevenueRecords = testData.revenues.reduce((sum, revenue) => 
    sum + (revenue.amount || 0), 0
  );
  
  await validateTest(
    'Revenue-Booking Consistency',
    'dataIntegrity',
    Math.abs(totalBookingRevenue - totalRevenueRecords) < 50, // Allow small discrepancy
    `Revenue mismatch: Bookings=${totalBookingRevenue}, Records=${totalRevenueRecords}`
  );
  
  // Test 4: User Profile Completeness
  const completeSuppliers = testData.suppliers.filter(supplier => 
    supplier.fullName && supplier.email && supplier.phone
  );
  
  const completeCustomers = testData.customers.filter(customer => 
    customer.fullName && customer.phone // Email is optional for customers
  );
  
  await validateTest(
    'User Profile Completeness',
    'dataIntegrity',
    completeSuppliers.length === testData.suppliers.length && completeCustomers.length === testData.customers.length,
    `Incomplete profiles: ${testData.suppliers.length - completeSuppliers.length} suppliers, ${testData.customers.length - completeCustomers.length} customers`
  );
}

async function getTestData() {
  const client = new MongoClient(MONGODB_URI);
  await client.connect();
  const db = client.db('bookdress');
  
  const suppliers = await db.collection('User').find({ type: 'supplier' }).toArray();
  const customers = await db.collection('User').find({ type: 'user' }).toArray();
  const locations = await db.collection('Location').find({}).toArray();
  const dresses = await db.collection('Dress').find({}).toArray();
  const bookings = await db.collection('Booking').find({}).toArray();
  const revenues = await db.collection('Revenue').find({}).toArray();
  
  await client.close();
  
  return { suppliers, customers, locations, dresses, bookings, revenues };
}

async function runComprehensivePageTesting() {
  console.log('🚀 Starting Comprehensive Page-by-Page Testing Suite...\n');
  
  // Get test data
  const testData = await getTestData();
  console.log('📊 Test data loaded:');
  console.log(`   - Suppliers: ${testData.suppliers.length}`);
  console.log(`   - Customers: ${testData.customers.length}`);
  console.log(`   - Dresses: ${testData.dresses.length}`);
  console.log(`   - Bookings: ${testData.bookings.length}`);
  console.log(`   - Locations: ${testData.locations.length}`);
  console.log(`   - Revenue Records: ${testData.revenues.length}`);
  
  // Run comprehensive tests
  await testFrontendPages();
  await testBackendPages();
  await testAPIEndpoints();
  await testUserFlows(testData);
  await testDataIntegrity(testData);
  
  // Test Results Summary
  console.log('\n📊 === COMPREHENSIVE PAGE TESTING RESULTS ===');
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
  
  console.log('\n🎉 Comprehensive page testing completed!');
}

if (require.main === module) {
  runComprehensivePageTesting().catch(console.error);
}

module.exports = { runComprehensivePageTesting };
