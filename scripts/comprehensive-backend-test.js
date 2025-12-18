#!/usr/bin/env node

/**
 * Comprehensive Backend Testing Suite
 * Tests inventory management, revenue calculations, business logic, and data integrity
 */

const fetch = require('node-fetch');
const { MongoClient } = require('mongodb');

const API_BASE = 'http://localhost:4002';
const MONGODB_URI = 'mongodb+srv://user:Mybookmodr100@cluster0.ey9u2ce.mongodb.net/bookdress?retryWrites=true&w=majority&appName=Cluster0';

let testResults = {
  passed: 0,
  failed: 0,
  issues: [],
  businessLogicTests: {
    inventory: { passed: 0, failed: 0 },
    revenue: { passed: 0, failed: 0 },
    booking: { passed: 0, failed: 0 },
    supplier: { passed: 0, failed: 0 },
    customer: { passed: 0, failed: 0 }
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
      console.log(`   ❌ Error: ${data}`);
      testResults.failed++;
      testResults.issues.push({
        test: name,
        url: url,
        status: response.status,
        error: data
      });
      return { success: false, error: data, status: response.status };
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

async function validateBusinessLogic(testName, category, condition, errorMessage) {
  console.log(`\n🧪 Business Logic Test: ${testName}`);
  
  if (condition) {
    console.log(`   ✅ PASS: ${testName}`);
    testResults.businessLogicTests[category].passed++;
    return true;
  } else {
    console.log(`   ❌ FAIL: ${testName} - ${errorMessage}`);
    testResults.businessLogicTests[category].failed++;
    testResults.issues.push({
      test: `Business Logic: ${testName}`,
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

// ==================== INVENTORY MANAGEMENT TESTS ====================

async function testInventoryManagement(testData) {
  console.log('\n📦 === INVENTORY MANAGEMENT TESTS ===');
  
  // Test 1: Dress Availability Logic
  const availableDresses = testData.dresses.filter(dress => dress.available);
  const unavailableDresses = testData.dresses.filter(dress => !dress.available);
  
  await validateBusinessLogic(
    'Dress Availability Status',
    'inventory',
    availableDresses.length > 0,
    'No available dresses found in inventory'
  );
  
  // Test 2: Supplier-Dress Relationship
  const dressesWithValidSuppliers = testData.dresses.filter(dress => 
    dress.supplier && testData.suppliers.some(supplier => 
      supplier._id.toString() === dress.supplier.toString()
    )
  );
  
  await validateBusinessLogic(
    'Dress-Supplier Relationship Integrity',
    'inventory',
    dressesWithValidSuppliers.length === testData.dresses.length,
    `${testData.dresses.length - dressesWithValidSuppliers.length} dresses have invalid supplier references`
  );
  
  // Test 3: Location-Dress Relationship
  const dressesWithValidLocations = testData.dresses.filter(dress => 
    dress.locations && dress.locations.length > 0 && 
    dress.locations.every(locationId => 
      testData.locations.some(location => 
        location._id.toString() === locationId.toString()
      )
    )
  );
  
  await validateBusinessLogic(
    'Dress-Location Relationship Integrity',
    'inventory',
    dressesWithValidLocations.length === testData.dresses.length,
    `${testData.dresses.length - dressesWithValidLocations.length} dresses have invalid location references`
  );
  
  // Test 4: Dress Rental Counter Logic
  const dressesWithRentalCount = testData.dresses.filter(dress => 
    typeof dress.rentals === 'number' && dress.rentals >= 0
  );
  
  await validateBusinessLogic(
    'Dress Rental Counter Integrity',
    'inventory',
    dressesWithRentalCount.length === testData.dresses.length,
    `${testData.dresses.length - dressesWithRentalCount.length} dresses have invalid rental counters`
  );
  
  // Test 5: Price Validation
  const dressesWithValidPrices = testData.dresses.filter(dress => 
    dress.price && dress.price > 0 && 
    dress.deposit && dress.deposit >= 0 && 
    dress.deposit <= dress.price
  );
  
  await validateBusinessLogic(
    'Dress Price and Deposit Validation',
    'inventory',
    dressesWithValidPrices.length === testData.dresses.length,
    `${testData.dresses.length - dressesWithValidPrices.length} dresses have invalid pricing`
  );
}

// ==================== REVENUE CALCULATION TESTS ====================

async function testRevenueCalculations(testData) {
  console.log('\n💰 === REVENUE CALCULATION TESTS ===');
  
  // Test 1: Booking Revenue Consistency
  const paidBookings = testData.bookings.filter(booking => 
    booking.status === 'paid' || booking.status === 'deposit'
  );
  
  const totalBookingRevenue = paidBookings.reduce((sum, booking) => 
    sum + (booking.paidAmount || booking.price || 0), 0
  );
  
  const totalRevenueRecords = testData.revenues.reduce((sum, revenue) => 
    sum + (revenue.amount || 0), 0
  );
  
  await validateBusinessLogic(
    'Booking-Revenue Consistency',
    'revenue',
    Math.abs(totalBookingRevenue - totalRevenueRecords) < 100, // Allow small discrepancy
    `Booking revenue (${totalBookingRevenue}) doesn't match revenue records (${totalRevenueRecords})`
  );
  
  // Test 2: Revenue Record Integrity
  const revenuesWithValidBookings = testData.revenues.filter(revenue => 
    revenue.booking && testData.bookings.some(booking => 
      booking._id.toString() === revenue.booking.toString()
    )
  );
  
  await validateBusinessLogic(
    'Revenue-Booking Reference Integrity',
    'revenue',
    revenuesWithValidBookings.length === testData.revenues.length,
    `${testData.revenues.length - revenuesWithValidBookings.length} revenue records have invalid booking references`
  );
  
  // Test 3: Supplier Revenue Distribution
  const supplierRevenues = {};
  testData.revenues.forEach(revenue => {
    const supplierId = revenue.supplier?.toString();
    if (supplierId) {
      supplierRevenues[supplierId] = (supplierRevenues[supplierId] || 0) + (revenue.amount || 0);
    }
  });
  
  await validateBusinessLogic(
    'Supplier Revenue Distribution',
    'revenue',
    Object.keys(supplierRevenues).length > 0,
    'No supplier revenue distribution found'
  );
  
  // Test 4: Monthly Revenue Tracking
  const monthlyRevenues = {};
  testData.revenues.forEach(revenue => {
    if (revenue.createdAt) {
      const month = new Date(revenue.createdAt).toISOString().substring(0, 7); // YYYY-MM
      monthlyRevenues[month] = (monthlyRevenues[month] || 0) + (revenue.amount || 0);
    }
  });
  
  await validateBusinessLogic(
    'Monthly Revenue Tracking',
    'revenue',
    Object.keys(monthlyRevenues).length > 0,
    'No monthly revenue tracking found'
  );
}

// ==================== BOOKING BUSINESS LOGIC TESTS ====================

async function testBookingBusinessLogic(testData) {
  console.log('\n📅 === BOOKING BUSINESS LOGIC TESTS ===');
  
  // Test 1: Booking Status Consistency
  const validStatuses = ['void', 'pending', 'deposit', 'paid', 'reserved', 'cancelled'];
  const bookingsWithValidStatus = testData.bookings.filter(booking => 
    validStatuses.includes(booking.status)
  );
  
  await validateBusinessLogic(
    'Booking Status Validity',
    'booking',
    bookingsWithValidStatus.length === testData.bookings.length,
    `${testData.bookings.length - bookingsWithValidStatus.length} bookings have invalid status`
  );
  
  // Test 2: Booking Date Logic
  const bookingsWithValidDates = testData.bookings.filter(booking => 
    booking.from && booking.to && 
    new Date(booking.from) < new Date(booking.to)
  );
  
  await validateBusinessLogic(
    'Booking Date Logic (From < To)',
    'booking',
    bookingsWithValidDates.length === testData.bookings.length,
    `${testData.bookings.length - bookingsWithValidDates.length} bookings have invalid date ranges`
  );
  
  // Test 3: Customer-Booking Relationship
  const bookingsWithValidCustomers = testData.bookings.filter(booking => 
    booking.customer && testData.customers.some(customer => 
      customer._id.toString() === booking.customer.toString()
    )
  );
  
  await validateBusinessLogic(
    'Booking-Customer Relationship Integrity',
    'booking',
    bookingsWithValidCustomers.length === testData.bookings.length,
    `${testData.bookings.length - bookingsWithValidCustomers.length} bookings have invalid customer references`
  );
  
  // Test 4: Payment Amount Logic
  const bookingsWithValidPayments = testData.bookings.filter(booking => {
    if (booking.status === 'paid') {
      return booking.paidAmount >= booking.price;
    } else if (booking.status === 'deposit') {
      return booking.paidAmount > 0 && booking.paidAmount < booking.price;
    }
    return true; // Other statuses don't require payment validation
  });
  
  await validateBusinessLogic(
    'Payment Amount Logic',
    'booking',
    bookingsWithValidPayments.length === testData.bookings.length,
    `${testData.bookings.length - bookingsWithValidPayments.length} bookings have inconsistent payment amounts`
  );
}

// ==================== SUPPLIER BUSINESS LOGIC TESTS ====================

async function testSupplierBusinessLogic(testData) {
  console.log('\n👥 === SUPPLIER BUSINESS LOGIC TESTS ===');

  // Test 1: Supplier Dress Limit
  const supplierDressCount = {};
  testData.dresses.forEach(dress => {
    const supplierId = dress.supplier?.toString();
    if (supplierId) {
      supplierDressCount[supplierId] = (supplierDressCount[supplierId] || 0) + 1;
    }
  });

  const suppliersExceedingLimit = testData.suppliers.filter(supplier => {
    const dressCount = supplierDressCount[supplier._id.toString()] || 0;
    const limit = supplier.supplierDressLimit || 50; // Default limit
    return dressCount > limit;
  });

  await validateBusinessLogic(
    'Supplier Dress Limit Enforcement',
    'supplier',
    suppliersExceedingLimit.length === 0,
    `${suppliersExceedingLimit.length} suppliers exceed their dress limit`
  );

  // Test 2: Supplier Revenue Share
  const supplierBookings = {};
  testData.bookings.forEach(booking => {
    const supplierId = booking.supplier?.toString();
    if (supplierId) {
      supplierBookings[supplierId] = (supplierBookings[supplierId] || 0) + (booking.paidAmount || 0);
    }
  });

  await validateBusinessLogic(
    'Supplier Revenue Distribution',
    'supplier',
    Object.keys(supplierBookings).length > 0,
    'No supplier revenue distribution found'
  );

  // Test 3: Supplier Profile Completeness
  const suppliersWithCompleteProfiles = testData.suppliers.filter(supplier =>
    supplier.fullName && supplier.email && supplier.phone
  );

  await validateBusinessLogic(
    'Supplier Profile Completeness',
    'supplier',
    suppliersWithCompleteProfiles.length === testData.suppliers.length,
    `${testData.suppliers.length - suppliersWithCompleteProfiles.length} suppliers have incomplete profiles`
  );
}

// ==================== CUSTOMER BUSINESS LOGIC TESTS ====================

async function testCustomerBusinessLogic(testData) {
  console.log('\n👤 === CUSTOMER BUSINESS LOGIC TESTS ===');

  // Test 1: Customer Booking History
  const customerBookingCount = {};
  testData.bookings.forEach(booking => {
    const customerId = booking.customer?.toString();
    if (customerId) {
      customerBookingCount[customerId] = (customerBookingCount[customerId] || 0) + 1;
    }
  });

  await validateBusinessLogic(
    'Customer Booking History Tracking',
    'customer',
    Object.keys(customerBookingCount).length > 0,
    'No customer booking history found'
  );

  // Test 2: Customer Profile Requirements (name and phone only)
  const customersWithRequiredFields = testData.customers.filter(customer =>
    customer.fullName && customer.phone
  );

  await validateBusinessLogic(
    'Customer Required Fields (Name & Phone)',
    'customer',
    customersWithRequiredFields.length === testData.customers.length,
    `${testData.customers.length - customersWithRequiredFields.length} customers missing required fields`
  );

  // Test 3: Customer Transaction History
  const customersWithTransactions = testData.customers.filter(customer =>
    testData.bookings.some(booking =>
      booking.customer?.toString() === customer._id.toString() &&
      (booking.status === 'paid' || booking.status === 'deposit')
    )
  );

  await validateBusinessLogic(
    'Customer Transaction History',
    'customer',
    customersWithTransactions.length > 0,
    'No customers with transaction history found'
  );
}

// ==================== API ENDPOINT TESTS ====================

async function testAPIEndpoints(testData) {
  console.log('\n🌐 === API ENDPOINT TESTS ===');

  // Test critical API endpoints
  await makeRequest('Get All Suppliers', `${API_BASE}/api/all-suppliers`);
  await makeRequest('Get All Locations', `${API_BASE}/api/locations/1/10/en`);

  // Test frontend dress endpoints
  await makeRequest(
    'Frontend Dresses (No Filter)',
    `${API_BASE}/api/frontend-dresses/1/10`,
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

  if (testData.suppliers.length > 0) {
    await makeRequest(
      'Frontend Dresses (With Supplier Filter)',
      `${API_BASE}/api/frontend-dresses/1/10`,
      {
        method: 'POST',
        body: {
          suppliers: [testData.suppliers[0]._id.toString()],
          location: null,
          dressType: [],
          includeAlreadyBookedDresses: true,
          includeComingSoonDresses: true
        }
      }
    );
  }

  // Test dress details
  if (testData.dresses.length > 0) {
    await makeRequest(
      'Get Dress Details',
      `${API_BASE}/api/dress/${testData.dresses[0]._id}/en`
    );
  }

  // Test booking endpoints
  if (testData.bookings.length > 0) {
    await makeRequest(
      'Get Booking Details',
      `${API_BASE}/api/booking/${testData.bookings[0]._id}/en`
    );
  }
}

async function runComprehensiveBackendTests() {
  console.log('🚀 Starting Comprehensive Backend Testing Suite...\n');
  
  // Get test data
  const testData = await getTestData();
  console.log('📊 Test data loaded:');
  console.log(`   - Suppliers: ${testData.suppliers.length}`);
  console.log(`   - Customers: ${testData.customers.length}`);
  console.log(`   - Dresses: ${testData.dresses.length}`);
  console.log(`   - Bookings: ${testData.bookings.length}`);
  console.log(`   - Revenue Records: ${testData.revenues.length}`);
  console.log(`   - Expense Records: ${testData.expenses.length}`);
  
  // Run comprehensive tests
  await testInventoryManagement(testData);
  await testRevenueCalculations(testData);
  await testBookingBusinessLogic(testData);
  await testSupplierBusinessLogic(testData);
  await testCustomerBusinessLogic(testData);
  await testAPIEndpoints(testData);
  
  // Test Results Summary
  console.log('\n📊 === COMPREHENSIVE BACKEND TEST RESULTS ===');
  console.log(`✅ API Tests Passed: ${testResults.passed}`);
  console.log(`❌ API Tests Failed: ${testResults.failed}`);
  console.log(`📈 API Success Rate: ${testResults.passed + testResults.failed > 0 ? ((testResults.passed / (testResults.passed + testResults.failed)) * 100).toFixed(1) : 0}%`);
  
  console.log('\n🧪 Business Logic Test Results:');
  Object.entries(testResults.businessLogicTests).forEach(([category, results]) => {
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
  
  console.log('\n🎉 Comprehensive backend testing completed!');
}

if (require.main === module) {
  runComprehensiveBackendTests().catch(console.error);
}

module.exports = { runComprehensiveBackendTests };
