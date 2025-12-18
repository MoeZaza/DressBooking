#!/usr/bin/env node

/**
 * Simple CRUD Test - Test basic functionality without complex queries
 */

const fetch = require('node-fetch');
const { MongoClient } = require('mongodb');

const API_BASE = 'http://localhost:4002';
const MONGODB_URI = 'mongodb+srv://user:Mybookmodr100@cluster0.ey9u2ce.mongodb.net/bookdress?retryWrites=true&w=majority&appName=Cluster0';

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
      return { success: true, data: jsonData || data, status: response.status };
    } else {
      console.log(`   ❌ Error: ${data}`);
      return { success: false, error: data, status: response.status };
    }
    
  } catch (error) {
    console.log(`   💥 Request failed: ${error.message}`);
    return { success: false, error: error.message };
  }
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

async function testSimpleCRUD() {
  console.log('🚀 Starting Simple CRUD Testing...\n');
  
  const testData = await getTestData();
  console.log('📊 Test data loaded:');
  console.log(`   - Admin: ${testData.admin?.fullName || 'Not found'}`);
  console.log(`   - Supplier: ${testData.supplier?.fullName || 'Not found'}`);
  console.log(`   - Customer: ${testData.customer?.fullName || 'Not found'}`);
  console.log(`   - Location: ${testData.location?._id || 'Not found'}`);
  console.log(`   - Dress: ${testData.dress?.name || 'Not found'}`);
  
  // Test 1: Create a simple user with unique email
  const timestamp = Date.now();
  const newUser = {
    email: `simple-test-${timestamp}@bookdress.com`,
    fullName: 'Simple Test User',
    password: 'test123',
    type: 'user',
    language: 'en',
    phone: '0599000999'
  };
  
  const userResult = await makeRequest(
    'Create Simple User',
    `${API_BASE}/api/create-user`,
    {
      method: 'POST',
      body: newUser
    }
  );
  
  // Test 2: Create a simple dress
  let dressResult = null;
  if (testData.supplier && testData.location) {
    const newDress = {
      name: `Simple Test Dress ${timestamp}`,
      supplier: testData.supplier._id.toString(),
      locations: [testData.location._id.toString()],
      price: 500,
      deposit: 100,
      available: true,
      type: 'evening',
      size: 'm',
      style: 'modern',
      color: 'Blue',
      length: 160,
      material: 'satin',
      cancellation: 24,
      amendments: 12,
      range: 'evening',
      accessories: ['jewelry'],
      designerName: 'Test Designer',
      dressCode: `TEST${timestamp}`,
      fittingRequired: false,
      alterationNotes: 'Standard alterations',
      careInstructions: 'Dry clean only',
      occasionTags: ['formal'],
      season: 'all-season',
      neckline: 'v-neck',
      sleeves: 'sleeveless',
      silhouette: 'a-line'
    };

    dressResult = await makeRequest(
      'Create Simple Dress',
      `${API_BASE}/api/create-dress`,
      {
        method: 'POST',
        body: newDress
      }
    );
    
    // Test 3: Create a simple booking
    if (userResult.success && dressResult.success && testData.customer) {
      const bookingPayload = {
        booking: {
          supplier: testData.supplier._id.toString(),
          dress: dressResult.data._id,
          customer: testData.customer._id.toString(),
          location: testData.location._id.toString(),
          from: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          to: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
          price: 500,
          status: 'pending'
        }
      };
      
      await makeRequest(
        'Create Simple Booking',
        `${API_BASE}/api/create-booking`,
        {
          method: 'POST',
          body: bookingPayload
        }
      );
    }
  }
  
  // Test 4: Create a simple fitting appointment using the dress we just created
  if (testData.supplier && dressResult.success && testData.customer && testData.location) {
    const appointmentData = {
      customer: testData.customer._id.toString(), // Add customer ID
      supplier: testData.supplier._id.toString(),
      dress: dressResult.data._id, // Use the dress we just created
      location: testData.location._id.toString(),
      appointmentDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
      timeSlot: '15:00-16:00',
      customerName: testData.customer.fullName,
      customerPhone: testData.customer.phone || '0599000888',
      customerEmail: testData.customer.email,
      notes: 'Simple test appointment'
    };

    await makeRequest(
      'Create Simple Fitting Appointment',
      `${API_BASE}/api/fitting-appointments`,
      {
        method: 'POST',
        body: appointmentData
      }
    );
  }
  
  console.log('\n🎉 Simple CRUD testing completed!');
}

if (require.main === module) {
  testSimpleCRUD().catch(console.error);
}

module.exports = { testSimpleCRUD };
