#!/usr/bin/env node

/**
 * Debug 400 Error in Booking Creation
 * Tests to understand what's causing the 400 error
 */

const fetch = require('node-fetch');
const { MongoClient } = require('mongodb');

const API_BASE = 'http://localhost:4002';
const MONGODB_URI = 'mongodb+srv://user:Mybookmodr100@cluster0.ey9u2ce.mongodb.net/bookdress?retryWrites=true&w=majority&appName=Cluster0';

async function debug400Error() {
  console.log('🔍 Debugging 400 Error in Booking Creation...\n');
  
  // Get test data
  const client = new MongoClient(MONGODB_URI);
  await client.connect();
  const db = client.db('bookdress');
  
  const suppliers = await db.collection('User').find({ type: 'supplier' }).limit(1).toArray();
  const customers = await db.collection('User').find({ type: 'user' }).limit(1).toArray();
  const locations = await db.collection('Location').find({}).limit(1).toArray();
  const dresses = await db.collection('Dress').find({}).limit(1).toArray();
  
  await client.close();
  
  if (suppliers.length === 0 || customers.length === 0 || locations.length === 0 || dresses.length === 0) {
    console.log('❌ Insufficient test data');
    return;
  }
  
  console.log('📊 Test data:');
  console.log(`   Supplier: ${suppliers[0].fullName} (${suppliers[0]._id})`);
  console.log(`   Customer: ${customers[0].fullName} (${customers[0]._id})`);
  console.log(`   Location: ${locations[0].name} (${locations[0]._id})`);
  console.log(`   Dress: ${dresses[0].name} (${dresses[0]._id})`);
  
  // Test the exact same format as the comprehensive test
  const testDress = dresses[0];
  const testSupplier = suppliers[0];
  const testCustomer = customers[0];
  const testLocation = locations[0];
  
  const baseDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days from now
  const initialBooking = {
    booking: {
      supplier: testSupplier._id.toString(),
      dress: testDress._id.toString(),
      customer: testCustomer._id.toString(),
      location: testLocation._id.toString(),
      from: new Date(baseDate.getTime()).toISOString(),
      to: new Date(baseDate.getTime() + 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days
      status: 'pending',
      price: 800,
      deposit: 160
    }
  };
  
  console.log('\n🧪 Test: Create booking with comprehensive test format');
  console.log('Booking data:', JSON.stringify(initialBooking, null, 2));
  
  try {
    const response = await fetch(`${API_BASE}/api/create-booking`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(initialBooking)
    });
    
    console.log(`Status: ${response.status}`);
    const text = await response.text();
    console.log(`Response: ${text}`);
    
    if (response.ok) {
      console.log(`✅ Success`);
      try {
        const jsonData = JSON.parse(text);
        console.log('Created booking ID:', jsonData._id);
      } catch (e) {
        console.log('Response is not JSON');
      }
    } else {
      console.log(`❌ Error: ${response.status}`);
      try {
        const jsonData = JSON.parse(text);
        console.log('Error details:', JSON.stringify(jsonData, null, 2));
      } catch (e) {
        console.log('Error response is not JSON');
      }
    }
  } catch (error) {
    console.log(`💥 Request failed: ${error.message}`);
  }
  
  // Test with the format that worked before
  const workingBooking = {
    supplier: testSupplier._id.toString(),
    dress: testDress._id.toString(),
    customer: testCustomer._id.toString(),
    location: testLocation._id.toString(),
    from: new Date(baseDate.getTime() + 10 * 24 * 60 * 60 * 1000).toISOString(),
    to: new Date(baseDate.getTime() + 13 * 24 * 60 * 60 * 1000).toISOString(),
    status: 'pending',
    price: 800,
    deposit: 160
  };
  
  console.log('\n🧪 Test: Create booking with working format');
  console.log('Booking data:', JSON.stringify({ booking: workingBooking }, null, 2));
  
  try {
    const response = await fetch(`${API_BASE}/api/create-booking`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ booking: workingBooking })
    });
    
    console.log(`Status: ${response.status}`);
    const text = await response.text();
    console.log(`Response: ${text}`);
    
    if (response.ok) {
      console.log(`✅ Success`);
      try {
        const jsonData = JSON.parse(text);
        console.log('Created booking ID:', jsonData._id);
      } catch (e) {
        console.log('Response is not JSON');
      }
    } else {
      console.log(`❌ Error: ${response.status}`);
      try {
        const jsonData = JSON.parse(text);
        console.log('Error details:', JSON.stringify(jsonData, null, 2));
      } catch (e) {
        console.log('Error response is not JSON');
      }
    }
  } catch (error) {
    console.log(`💥 Request failed: ${error.message}`);
  }
  
  console.log('\n🎉 Debug completed!');
}

if (require.main === module) {
  debug400Error().catch(console.error);
}

module.exports = { debug400Error };
