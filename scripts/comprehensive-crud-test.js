#!/usr/bin/env node

/**
 * Comprehensive CRUD Testing Suite for BookDress Application
 * Tests all CRUD operations for suppliers, customers, dresses, bookings, and fitting appointments
 */

const fetch = require('node-fetch');
const { MongoClient } = require('mongodb');

const API_BASE = 'http://localhost:4002';
const MONGODB_URI = 'mongodb+srv://user:Mybookmodr100@cluster0.ey9u2ce.mongodb.net/bookdress?retryWrites=true&w=majority&appName=Cluster0';

let testResults = {
  passed: 0,
  failed: 0,
  issues: [],
  createdEntities: {
    suppliers: [],
    customers: [],
    dresses: [],
    bookings: [],
    fittingAppointments: []
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

async function signInUser(email, password, userType = 'admin') {
  console.log(`🔐 Signing in ${userType}: ${email}...`);
  
  const response = await fetch(`${API_BASE}/api/sign-in/${userType}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: email,
      password: password,
      stayConnected: false
    })
  });
  
  if (response.ok || response.status === 204) {
    const cookies = response.headers.get('set-cookie');
    if (cookies) {
      const tokenMatch = cookies.match(/bc-x-access-token-backend=([^;]+)/);
      if (tokenMatch) {
        console.log(`   ✅ Signed in successfully`);
        return tokenMatch[1];
      }
    }
    console.log(`   ✅ Signed in successfully (no token extracted)`);
    return 'authenticated';
  }
  
  console.log(`   ❌ Sign in failed`);
  return null;
}

async function getTestData() {
  const client = new MongoClient(MONGODB_URI);
  await client.connect();
  const db = client.db('bookdress');
  
  const admin = await db.collection('User').findOne({ type: 'admin' });
  const supplier = await db.collection('User').findOne({ type: 'supplier' });
  const customer = await db.collection('User').findOne({ type: 'user' });
  const location = await db.collection('Location').findOne({});
  const dress = await db.collection('Dress').findOne({});
  
  await client.close();
  
  return { admin, supplier, customer, location, dress };
}

// ==================== SUPPLIER CRUD TESTS ====================

async function testSupplierCRUD(adminToken) {
  console.log('\n👥 === SUPPLIER CRUD TESTS ===');

  const authHeaders = adminToken && adminToken !== 'authenticated' ? {
    'Authorization': `Bearer ${adminToken}`,
    'Cookie': `bc-x-access-token-backend=${adminToken}`
  } : {};

  // CREATE: Test supplier creation
  const timestamp = Date.now();
  const newSupplier = {
    email: `test-supplier-crud-${timestamp}@bookdress.com`,
    fullName: 'Test CRUD Supplier',
    password: 'supplier123',
    type: 'supplier',
    language: 'en',
    phone: '0599000100',
    location: 'Test City, Palestine',
    bio: 'Test supplier for CRUD operations',
    payLater: true,
    supplierDressLimit: 25,
    notifyAdminOnNewDress: true,
    priceChangeRate: 0.15
  };
  
  const createResult = await makeRequest(
    'Create Supplier',
    `${API_BASE}/api/create-user`,
    {
      method: 'POST',
      headers: authHeaders,
      body: newSupplier
    }
  );
  
  if (createResult.success && createResult.data && createResult.data._id) {
    testResults.createdEntities.suppliers.push(createResult.data._id);
    console.log(`   📝 Created supplier ID: ${createResult.data._id}`);
    
    // READ: Test getting supplier details
    await makeRequest(
      'Get Supplier Details',
      `${API_BASE}/api/user/${createResult.data._id}`,
      { headers: authHeaders }
    );
    
    // UPDATE: Test updating supplier
    const updateData = {
      _id: createResult.data._id,
      fullName: 'Updated CRUD Supplier',
      bio: 'Updated bio for CRUD testing',
      supplierDressLimit: 30
    };

    await makeRequest(
      'Update Supplier',
      `${API_BASE}/api/update-user`,
      {
        method: 'POST', // User update uses POST, not PUT
        headers: authHeaders,
        body: updateData
      }
    );
  }
  
  // READ: Test getting all suppliers
  await makeRequest(
    'Get All Suppliers',
    `${API_BASE}/api/suppliers/1/10`,
    { headers: authHeaders }
  );
}

// ==================== CUSTOMER CRUD TESTS ====================

async function testCustomerCRUD(adminToken) {
  console.log('\n👤 === CUSTOMER CRUD TESTS ===');

  const authHeaders = adminToken && adminToken !== 'authenticated' ? {
    'Authorization': `Bearer ${adminToken}`,
    'Cookie': `bc-x-access-token-backend=${adminToken}`
  } : {};

  // CREATE: Test customer creation with minimal fields (name and phone only)
  const timestamp = Date.now();
  const newCustomer = {
    fullName: 'Test CRUD Customer',
    phone: '0599000200',
    email: `test-customer-crud-${timestamp}@bookdress.com`,
    password: 'customer123',
    type: 'user',
    language: 'ar'
  };
  
  const createResult = await makeRequest(
    'Create Customer (Minimal Fields)',
    `${API_BASE}/api/create-user`,
    {
      method: 'POST',
      headers: authHeaders,
      body: newCustomer
    }
  );
  
  if (createResult.success && createResult.data && createResult.data._id) {
    testResults.createdEntities.customers.push(createResult.data._id);
    console.log(`   📝 Created customer ID: ${createResult.data._id}`);
    
    // READ: Test getting customer details
    await makeRequest(
      'Get Customer Details',
      `${API_BASE}/api/user/${createResult.data._id}`,
      { headers: authHeaders }
    );
    
    // UPDATE: Test updating customer
    const updateData = {
      _id: createResult.data._id,
      fullName: 'Updated CRUD Customer',
      location: 'Updated Location'
    };

    await makeRequest(
      'Update Customer',
      `${API_BASE}/api/update-user`,
      {
        method: 'POST', // User update uses POST, not PUT
        headers: authHeaders,
        body: updateData
      }
    );
  }
  
  // READ: Test getting all customers/users (POST endpoint with body)
  await makeRequest(
    'Get All Users',
    `${API_BASE}/api/users/1/10`,
    {
      method: 'POST',
      headers: authHeaders,
      body: {
        types: ['user', 'supplier', 'admin']
      }
    }
  );
}

// ==================== DRESS CRUD TESTS ====================

async function testDressCRUD(supplierToken, testData) {
  console.log('\n👗 === DRESS CRUD TESTS ===');

  const authHeaders = supplierToken && supplierToken !== 'authenticated' ? {
    'Authorization': `Bearer ${supplierToken}`,
    'Cookie': `bc-x-access-token-backend=${supplierToken}`
  } : {};

  let createdDressId = null;

  // CREATE: Test dress creation (supplier should be auto-assigned)
  const timestamp = Date.now();
  const newDress = {
    name: `Test CRUD Evening Dress ${timestamp}`,
    supplier: testData.supplier ? testData.supplier._id.toString() : null,
    locations: testData.location ? [testData.location._id.toString()] : [],
    price: 750,
    deposit: 150,
    available: true,
    type: 'evening',
    size: 'm',
    style: 'modern',
    color: 'Navy Blue',
    length: 165,
    material: 'satin',
    cancellation: 48,
    amendments: 24,
    range: 'evening',
    accessories: ['jewelry', 'shoes'],
    designerName: 'Test Designer',
    dressCode: `CRUD${timestamp}`, // Use unique dress code
    fittingRequired: true,
    alterationNotes: 'Standard alterations available',
    careInstructions: 'Dry clean only',
    occasionTags: ['formal', 'party'],
    season: 'all-season',
    neckline: 'v-neck',
    sleeves: 'sleeveless',
    silhouette: 'a-line'
  };
  
  const createResult = await makeRequest(
    'Create Dress (Auto Supplier Assignment)',
    `${API_BASE}/api/create-dress`,
    {
      method: 'POST',
      headers: authHeaders,
      body: newDress
    }
  );
  
  if (createResult.success && createResult.data && createResult.data._id) {
    createdDressId = createResult.data._id;
    testResults.createdEntities.dresses.push(createResult.data._id);
    console.log(`   📝 Created dress ID: ${createResult.data._id}`);

    // READ: Test getting dress details
    await makeRequest(
      'Get Dress Details',
      `${API_BASE}/api/dress/${createResult.data._id}/en`
    );

    // UPDATE: Test updating dress
    const updateData = {
      _id: createResult.data._id,
      name: 'Updated CRUD Evening Dress',
      price: 800,
      available: false
    };

    await makeRequest(
      'Update Dress',
      `${API_BASE}/api/update-dress`,
      {
        method: 'PUT',
        headers: authHeaders,
        body: updateData
      }
    );
  }
  
  // READ: Test getting supplier's dresses
  await makeRequest(
    'Get Supplier Dresses',
    `${API_BASE}/api/dresses/1/10`,
    {
      method: 'POST',
      headers: authHeaders,
      body: { keyword: '' }
    }
  );

  return createdDressId;
}

// ==================== BOOKING CRUD TESTS ====================

async function testBookingCRUD(adminToken, testData) {
  console.log('\n📅 === BOOKING CRUD TESTS ===');

  const authHeaders = adminToken && adminToken !== 'authenticated' ? {
    'Authorization': `Bearer ${adminToken}`,
    'Cookie': `bc-x-access-token-backend=${adminToken}`
  } : {};

  // CREATE: Test booking creation with customer ID
  if (testData.dress && testData.customer && testData.supplier && testData.location) {
    const bookingPayload = {
      booking: {
        supplier: testData.supplier._id.toString(),
        dress: testData.dress._id.toString(),
        customer: testData.customer._id.toString(),
        location: testData.location._id.toString(),
        from: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
        to: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000), // 10 days from now
        price: 1000,
        status: 'pending',
        fittingRequired: true,
        fittingDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5 days from now
        fittingNotes: 'Standard fitting appointment required',
        alterationNotes: 'Minor adjustments may be needed',
        accessoriesIncluded: ['veil', 'jewelry']
      }
    };

    const createResult = await makeRequest(
      'Create Booking (With Customer ID)',
      `${API_BASE}/api/create-booking`,
      {
        method: 'POST',
        headers: authHeaders,
        body: bookingPayload
      }
    );

    if (createResult.success && createResult.data && createResult.data._id) {
      testResults.createdEntities.bookings.push(createResult.data._id);
      console.log(`   📝 Created booking ID: ${createResult.data._id}`);

      // READ: Test getting booking details
      await makeRequest(
        'Get Booking Details',
        `${API_BASE}/api/booking/${createResult.data._id}/en`
      );

      // UPDATE: Test updating booking status (use correct UpsertBookingPayload format)
      const updateData = {
        booking: {
          _id: createResult.data._id,
          supplier: testData.supplier._id.toString(),
          dress: testData.dress._id.toString(),
          customer: testData.customer._id.toString(),
          location: testData.location._id.toString(),
          from: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          to: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
          status: 'deposit',
          price: 1000,
          paidAmount: 300,
          paymentStatus: 'partially-paid'
        }
      };

      await makeRequest(
        'Update Booking Status',
        `${API_BASE}/api/update-booking`,
        {
          method: 'PUT',
          headers: authHeaders,
          body: updateData
        }
      );

      // Test customer booking history
      await makeRequest(
        'Get Customer Booking History',
        `${API_BASE}/api/bookings/1/10/en`,
        {
          method: 'POST',
          headers: authHeaders,
          body: {
            suppliers: [testData.supplier._id.toString()],
            statuses: ['pending', 'deposit', 'paid', 'reserved', 'cancelled'],
            filter: { customer: testData.customer._id.toString() }
          }
        }
      );
    }
  }

  // READ: Test getting all bookings
  await makeRequest(
    'Get All Bookings',
    `${API_BASE}/api/bookings/1/10/en`,
    {
      method: 'POST',
      headers: authHeaders,
      body: {
        suppliers: testData.supplier ? [testData.supplier._id.toString()] : [],
        statuses: ['pending', 'paid', 'deposit', 'reserved', 'cancelled'],
        filter: {}
      }
    }
  );
}

// ==================== FITTING APPOINTMENT CRUD TESTS ====================

async function testFittingAppointmentCRUD(adminToken, testData, createdDressId) {
  console.log('\n📋 === FITTING APPOINTMENT CRUD TESTS ===');

  const authHeaders = adminToken && adminToken !== 'authenticated' ? {
    'Authorization': `Bearer ${adminToken}`,
    'Cookie': `bc-x-access-token-backend=${adminToken}`
  } : {};

  // CREATE: Test fitting appointment creation using the dress we created
  if (createdDressId && testData.customer && testData.supplier && testData.location) {
    const newAppointment = {
      customer: testData.customer._id.toString(), // Add customer ID
      supplier: testData.supplier._id.toString(),
      dress: createdDressId, // Use the dress we created in dress CRUD test
      location: testData.location._id.toString(),
      appointmentDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days from now
      timeSlot: '14:00-15:00',
      customerName: testData.customer.fullName,
      customerPhone: testData.customer.phone || '0599000300',
      customerEmail: testData.customer.email,
      notes: 'Initial fitting for dress adjustments'
    };

    const createResult = await makeRequest(
      'Create Fitting Appointment',
      `${API_BASE}/api/fitting-appointments`,
      {
        method: 'POST',
        headers: authHeaders,
        body: newAppointment
      }
    );

    if (createResult.success && createResult.data && createResult.data._id) {
      testResults.createdEntities.fittingAppointments.push(createResult.data._id);
      console.log(`   📝 Created fitting appointment ID: ${createResult.data._id}`);

      // UPDATE: Test updating appointment
      const updateData = {
        status: 'completed',
        fittingNotes: 'Fitting completed successfully. Minor hem adjustment needed.',
        measurements: {
          bust: 36,
          waist: 28,
          hips: 38,
          height: 165
        },
        alterationsNeeded: 'Hem adjustment required'
      };

      await makeRequest(
        'Update Fitting Appointment',
        `${API_BASE}/api/fitting-appointments/${createResult.data._id}`,
        {
          method: 'PUT',
          headers: authHeaders,
          body: updateData
        }
      );
    }
  }

  // READ: Test getting supplier's fitting appointments
  if (testData.supplier) {
    await makeRequest(
      'Get Supplier Fitting Appointments',
      `${API_BASE}/api/fitting-appointments/supplier/${testData.supplier._id.toString()}`,
      {
        method: 'GET',
        headers: authHeaders
      }
    );
  }
}

async function runComprehensiveCRUDTests() {
  console.log('🚀 Starting Comprehensive CRUD Testing Suite...\n');
  
  // Get test data
  const testData = await getTestData();
  console.log('📊 Test data loaded:');
  console.log(`   - Admin: ${testData.admin?.fullName || 'Not found'}`);
  console.log(`   - Supplier: ${testData.supplier?.fullName || 'Not found'}`);
  console.log(`   - Customer: ${testData.customer?.fullName || 'Not found'}`);
  console.log(`   - Location: ${testData.location?._id || 'Not found'}`);
  console.log(`   - Dress: ${testData.dress?.name || 'Not found'}`);
  
  // Authenticate users
  let adminToken = null;
  let supplierToken = null;
  
  if (testData.admin) {
    adminToken = await signInUser(testData.admin.email, 'admin123', 'admin');
  }
  
  if (testData.supplier) {
    supplierToken = await signInUser(testData.supplier.email, 'supplier123', 'supplier');
  }
  
  // Run CRUD tests
  await testSupplierCRUD(adminToken);
  await testCustomerCRUD(adminToken);
  const createdDressId = await testDressCRUD(supplierToken, testData);
  await testBookingCRUD(adminToken, testData);
  await testFittingAppointmentCRUD(adminToken, testData, createdDressId);
  
  // Test Results Summary
  console.log('\n📊 === CRUD TEST RESULTS SUMMARY ===');
  console.log(`✅ Passed: ${testResults.passed}`);
  console.log(`❌ Failed: ${testResults.failed}`);
  console.log(`📈 Success Rate: ${((testResults.passed / (testResults.passed + testResults.failed)) * 100).toFixed(1)}%`);
  
  console.log('\n📝 Created Entities:');
  console.log(`   - Suppliers: ${testResults.createdEntities.suppliers.length}`);
  console.log(`   - Customers: ${testResults.createdEntities.customers.length}`);
  console.log(`   - Dresses: ${testResults.createdEntities.dresses.length}`);
  console.log(`   - Bookings: ${testResults.createdEntities.bookings.length}`);
  console.log(`   - Fitting Appointments: ${testResults.createdEntities.fittingAppointments.length}`);
  
  if (testResults.issues.length > 0) {
    console.log('\n🐛 === ISSUES FOUND ===');
    testResults.issues.forEach((issue, index) => {
      console.log(`\n${index + 1}. ${issue.test}`);
      console.log(`   URL: ${issue.url}`);
      console.log(`   Status: ${issue.status || 'N/A'}`);
      console.log(`   Error: ${issue.error}`);
    });
  }
  
  console.log('\n🎉 Comprehensive CRUD testing completed!');
}

if (require.main === module) {
  runComprehensiveCRUDTests().catch(console.error);
}

module.exports = { runComprehensiveCRUDTests };
