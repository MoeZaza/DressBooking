#!/usr/bin/env node

/**
 * Debug Booking Query Issue
 * Tests different query structures to find the root cause of the casting error
 */

const { MongoClient } = require('mongodb');

const MONGODB_URI = 'mongodb+srv://user:Mybookmodr100@cluster0.ey9u2ce.mongodb.net/bookdress?retryWrites=true&w=majority&appName=Cluster0';

async function debugBookingQuery() {
  console.log('🔍 Debugging Booking Query Issue...\n');
  
  const client = new MongoClient(MONGODB_URI);
  await client.connect();
  const db = client.db('bookdress');
  
  // Get a sample dress and dates for testing
  const dresses = await db.collection('Dress').find({}).limit(1).toArray();
  if (dresses.length === 0) {
    console.log('❌ No dresses found for testing');
    await client.close();
    return;
  }
  
  const testDress = dresses[0];
  const startDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  const endDate = new Date(Date.now() + 10 * 24 * 60 * 60 * 1000);
  
  console.log(`📋 Test Parameters:`);
  console.log(`   Dress ID: ${testDress._id}`);
  console.log(`   Start Date: ${startDate.toISOString()}`);
  console.log(`   End Date: ${endDate.toISOString()}`);
  
  // Test 1: Simple status query with $in
  console.log('\n🧪 Test 1: Simple status query with $in');
  try {
    const result1 = await db.collection('Booking').find({
      status: { $in: ['pending', 'deposit', 'paid', 'reserved'] }
    }).limit(5).toArray();
    console.log(`   ✅ Success: Found ${result1.length} bookings`);
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}`);
  }
  
  // Test 2: Status query with $or
  console.log('\n🧪 Test 2: Status query with $or');
  try {
    const result2 = await db.collection('Booking').find({
      $or: [
        { status: 'pending' },
        { status: 'deposit' },
        { status: 'paid' },
        { status: 'reserved' }
      ]
    }).limit(5).toArray();
    console.log(`   ✅ Success: Found ${result2.length} bookings`);
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}`);
  }
  
  // Test 3: Date range query
  console.log('\n🧪 Test 3: Date range query');
  try {
    const result3 = await db.collection('Booking').find({
      from: { $lte: startDate },
      to: { $gte: startDate }
    }).limit(5).toArray();
    console.log(`   ✅ Success: Found ${result3.length} bookings`);
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}`);
  }
  
  // Test 4: Combined query with $in (the problematic one)
  console.log('\n🧪 Test 4: Combined query with $in (problematic)');
  try {
    const result4 = await db.collection('Booking').find({
      dress: testDress._id,
      status: { $in: ['pending', 'deposit', 'paid', 'reserved'] },
      $or: [
        { from: { $lte: startDate }, to: { $gte: startDate } },
        { from: { $lte: endDate }, to: { $gte: endDate } },
        { from: { $gte: startDate }, to: { $lte: endDate } }
      ]
    }).toArray();
    console.log(`   ✅ Success: Found ${result4.length} conflicts`);
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}`);
  }
  
  // Test 5: Combined query with $or for status (alternative)
  console.log('\n🧪 Test 5: Combined query with $or for status (alternative)');
  try {
    const result5 = await db.collection('Booking').find({
      dress: testDress._id,
      $and: [
        {
          $or: [
            { status: 'pending' },
            { status: 'deposit' },
            { status: 'paid' },
            { status: 'reserved' }
          ]
        },
        {
          $or: [
            { from: { $lte: startDate }, to: { $gte: startDate } },
            { from: { $lte: endDate }, to: { $gte: endDate } },
            { from: { $gte: startDate }, to: { $lte: endDate } }
          ]
        }
      ]
    }).toArray();
    console.log(`   ✅ Success: Found ${result5.length} conflicts`);
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}`);
  }
  
  // Test 6: Check booking schema structure
  console.log('\n🧪 Test 6: Check booking schema structure');
  try {
    const sampleBooking = await db.collection('Booking').findOne({});
    if (sampleBooking) {
      console.log(`   ✅ Sample booking structure:`);
      console.log(`      Status: ${sampleBooking.status} (${typeof sampleBooking.status})`);
      console.log(`      From: ${sampleBooking.from} (${typeof sampleBooking.from})`);
      console.log(`      To: ${sampleBooking.to} (${typeof sampleBooking.to})`);
      console.log(`      Dress: ${sampleBooking.dress} (${typeof sampleBooking.dress})`);
    } else {
      console.log(`   ❌ No bookings found`);
    }
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}`);
  }
  
  // Test 7: Check if there are any bookings with invalid status values
  console.log('\n🧪 Test 7: Check for invalid status values');
  try {
    const allBookings = await db.collection('Booking').find({}).toArray();
    const statusCounts = {};
    const invalidStatuses = [];
    
    allBookings.forEach(booking => {
      const status = booking.status;
      statusCounts[status] = (statusCounts[status] || 0) + 1;
      
      if (!['void', 'pending', 'deposit', 'paid', 'reserved', 'cancelled'].includes(status)) {
        invalidStatuses.push({ id: booking._id, status: status });
      }
    });
    
    console.log(`   ✅ Status distribution:`);
    Object.entries(statusCounts).forEach(([status, count]) => {
      console.log(`      ${status}: ${count}`);
    });
    
    if (invalidStatuses.length > 0) {
      console.log(`   ⚠️  Invalid statuses found: ${invalidStatuses.length}`);
      invalidStatuses.slice(0, 3).forEach(booking => {
        console.log(`      Booking ${booking.id}: "${booking.status}"`);
      });
    } else {
      console.log(`   ✅ All statuses are valid`);
    }
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}`);
  }
  
  await client.close();
  console.log('\n🎉 Debug completed!');
}

if (require.main === module) {
  debugBookingQuery().catch(console.error);
}

module.exports = { debugBookingQuery };
