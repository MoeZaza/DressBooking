#!/usr/bin/env node

/**
 * Debug Booking Creation Issue
 * Tests booking creation to understand the 500 error
 */

const fetch = require('node-fetch');
const { MongoClient } = require('mongodb');

const API_BASE = 'http://localhost:4002';
const MONGODB_URI = 'mongodb+srv://user:Mybookmodr100@cluster0.ey9u2ce.mongodb.net/bookdress?retryWrites=true&w=majority&appName=Cluster0';

async function debugBookingCreation() {
  console.log('🔍 Debugging Booking Creation Issue...\n');
  
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
  
  // Test 1: Simple booking creation
  const bookingData = {
    booking: {
      supplier: suppliers[0]._id.toString(),
      dress: dresses[0]._id.toString(),
      customer: customers[0]._id.toString(),
      location: locations[0]._id.toString(),
      from: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      to: new Date(Date.now() + 33 * 24 * 60 * 60 * 1000).toISOString(),
      status: 'pending',
      price: 800,
      deposit: 160
    }
  };
  
  console.log('\n🧪 Test 1: Simple booking creation');
  console.log('Booking data:', JSON.stringify(bookingData, null, 2));
  
  try {
    const response = await fetch(`${API_BASE}/api/create-booking`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(bookingData)
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
        console.log('Error details:', jsonData);
      } catch (e) {
        console.log('Error response is not JSON');
      }
    }
  } catch (error) {
    console.log(`💥 Request failed: ${error.message}`);
  }
  
  // Test 2: Check if the endpoint exists
  console.log('\n🧪 Test 2: Check endpoint availability');
  try {
    const response = await fetch(`${API_BASE}/api/create-booking`, {
      method: 'OPTIONS'
    });
    
    console.log(`OPTIONS Status: ${response.status}`);
    console.log('Headers:', Object.fromEntries(response.headers.entries()));
  } catch (error) {
    console.log(`💥 OPTIONS request failed: ${error.message}`);
  }
  
  // Test 3: Test a simple GET endpoint to verify server is working
  console.log('\n🧪 Test 3: Test simple GET endpoint');
  try {
    const response = await fetch(`${API_BASE}/api/all-suppliers`);
    console.log(`Suppliers endpoint status: ${response.status}`);
    
    if (response.ok) {
      const data = await response.json();
      console.log(`✅ Suppliers endpoint working, found ${data.length} suppliers`);
    }
  } catch (error) {
    console.log(`💥 Suppliers request failed: ${error.message}`);
  }
  
  console.log('\n🎉 Debug completed!');
}

if (require.main === module) {
  debugBookingCreation().catch(console.error);
}

module.exports = { debugBookingCreation };
