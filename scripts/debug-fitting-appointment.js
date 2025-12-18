#!/usr/bin/env node

/**
 * Debug Fitting Appointment Issues
 * Tests to understand the dress-supplier relationship issue
 */

const { MongoClient } = require('mongodb');

const MONGODB_URI = 'mongodb+srv://user:Mybookmodr100@cluster0.ey9u2ce.mongodb.net/bookdress?retryWrites=true&w=majority&appName=Cluster0';

async function debugFittingAppointment() {
  console.log('🔍 Debugging Fitting Appointment Issues...\n');
  
  // Get test data
  const client = new MongoClient(MONGODB_URI);
  await client.connect();
  const db = client.db('bookdress');
  
  const suppliers = await db.collection('User').find({ type: 'supplier' }).toArray();
  const customers = await db.collection('User').find({ type: 'user' }).limit(1).toArray();
  const locations = await db.collection('Location').find({}).limit(1).toArray();
  const dresses = await db.collection('Dress').find({}).toArray();
  
  await client.close();
  
  console.log('📊 Data Analysis:');
  console.log(`   Suppliers: ${suppliers.length}`);
  console.log(`   Customers: ${customers.length}`);
  console.log(`   Locations: ${locations.length}`);
  console.log(`   Dresses: ${dresses.length}`);
  
  console.log('\n👥 Suppliers:');
  suppliers.forEach((supplier, index) => {
    console.log(`   ${index + 1}. ${supplier.fullName} (${supplier._id})`);
  });
  
  console.log('\n👗 Dresses and their suppliers:');
  dresses.forEach((dress, index) => {
    const supplier = suppliers.find(s => s._id.toString() === dress.supplier.toString());
    console.log(`   ${index + 1}. ${dress.name} -> Supplier: ${supplier ? supplier.fullName : 'NOT FOUND'} (${dress.supplier})`);
  });
  
  // Find a dress-supplier pair that actually matches
  console.log('\n🔍 Finding valid dress-supplier pairs:');
  const validPairs = [];
  
  dresses.forEach(dress => {
    const supplier = suppliers.find(s => s._id.toString() === dress.supplier.toString());
    if (supplier) {
      validPairs.push({ dress, supplier });
      console.log(`   ✅ ${dress.name} belongs to ${supplier.fullName}`);
    } else {
      console.log(`   ❌ ${dress.name} has invalid supplier reference: ${dress.supplier}`);
    }
  });
  
  if (validPairs.length > 0) {
    console.log(`\n🎯 Recommended test data:`);
    const pair = validPairs[0];
    console.log(`   Dress: ${pair.dress.name} (${pair.dress._id})`);
    console.log(`   Supplier: ${pair.supplier.fullName} (${pair.supplier._id})`);
    console.log(`   Customer: ${customers[0].fullName} (${customers[0]._id})`);
    console.log(`   Location: ${locations[0].name} (${locations[0]._id})`);
  } else {
    console.log('\n❌ No valid dress-supplier pairs found!');
  }
  
  console.log('\n🎉 Debug completed!');
}

if (require.main === module) {
  debugFittingAppointment().catch(console.error);
}

module.exports = { debugFittingAppointment };
