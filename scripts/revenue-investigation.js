#!/usr/bin/env node

/**
 * Revenue Investigation Script
 * Investigates revenue calculation discrepancies and data integrity issues
 */

const { MongoClient } = require('mongodb');

const MONGODB_URI = 'mongodb+srv://user:Mybookmodr100@cluster0.ey9u2ce.mongodb.net/bookdress?retryWrites=true&w=majority&appName=Cluster0';

async function investigateRevenue() {
  console.log('🔍 Starting Revenue Investigation...\n');
  
  const client = new MongoClient(MONGODB_URI);
  await client.connect();
  const db = client.db('bookdress');
  
  // Get all data
  const bookings = await db.collection('Booking').find({}).toArray();
  const revenues = await db.collection('Revenue').find({}).toArray();
  const suppliers = await db.collection('User').find({ type: 'supplier' }).toArray();
  const customers = await db.collection('User').find({ type: 'user' }).toArray();
  
  console.log('📊 Data Overview:');
  console.log(`   - Bookings: ${bookings.length}`);
  console.log(`   - Revenue Records: ${revenues.length}`);
  console.log(`   - Suppliers: ${suppliers.length}`);
  console.log(`   - Customers: ${customers.length}`);
  
  // Investigate revenue discrepancy
  console.log('\n💰 Revenue Analysis:');
  
  const paidBookings = bookings.filter(booking => 
    booking.status === 'paid' || booking.status === 'deposit'
  );
  
  console.log(`   - Paid/Deposit Bookings: ${paidBookings.length}`);
  
  let totalBookingRevenue = 0;
  paidBookings.forEach(booking => {
    const amount = booking.paidAmount || booking.price || 0;
    totalBookingRevenue += amount;
    console.log(`     Booking ${booking._id}: ${booking.status} - $${amount}`);
  });
  
  console.log(`   - Total Booking Revenue: $${totalBookingRevenue}`);
  
  let totalRevenueRecords = 0;
  console.log('\n📋 Revenue Records Analysis:');
  revenues.forEach((revenue, index) => {
    const amount = revenue.amount || 0;
    totalRevenueRecords += amount;
    console.log(`     ${index + 1}. Revenue ${revenue._id}: $${amount} (Booking: ${revenue.booking || 'NULL'})`);
  });
  
  console.log(`   - Total Revenue Records: $${totalRevenueRecords}`);
  console.log(`   - Discrepancy: $${Math.abs(totalBookingRevenue - totalRevenueRecords)}`);
  
  // Check revenue-booking references
  console.log('\n🔗 Revenue-Booking Reference Check:');
  let validReferences = 0;
  let invalidReferences = 0;
  
  revenues.forEach(revenue => {
    if (revenue.booking) {
      const bookingExists = bookings.some(booking => 
        booking._id.toString() === revenue.booking.toString()
      );
      if (bookingExists) {
        validReferences++;
      } else {
        invalidReferences++;
        console.log(`     ❌ Invalid reference: Revenue ${revenue._id} -> Booking ${revenue.booking}`);
      }
    } else {
      invalidReferences++;
      console.log(`     ❌ Missing booking reference: Revenue ${revenue._id}`);
    }
  });
  
  console.log(`   - Valid References: ${validReferences}`);
  console.log(`   - Invalid References: ${invalidReferences}`);
  
  // Check supplier profiles
  console.log('\n👥 Supplier Profile Check:');
  suppliers.forEach(supplier => {
    const issues = [];
    if (!supplier.fullName) issues.push('Missing fullName');
    if (!supplier.email) issues.push('Missing email');
    if (!supplier.phone) issues.push('Missing phone');
    
    if (issues.length > 0) {
      console.log(`     ❌ Supplier ${supplier._id}: ${issues.join(', ')}`);
    } else {
      console.log(`     ✅ Supplier ${supplier._id}: Complete profile`);
    }
  });
  
  // Check customer profiles
  console.log('\n👤 Customer Profile Check:');
  customers.forEach(customer => {
    const issues = [];
    if (!customer.fullName) issues.push('Missing fullName');
    if (!customer.phone) issues.push('Missing phone');
    
    if (issues.length > 0) {
      console.log(`     ❌ Customer ${customer._id}: ${issues.join(', ')}`);
    } else {
      console.log(`     ✅ Customer ${customer._id}: Complete profile`);
    }
  });
  
  await client.close();
  console.log('\n🎉 Revenue investigation completed!');
}

if (require.main === module) {
  investigateRevenue().catch(console.error);
}

module.exports = { investigateRevenue };
