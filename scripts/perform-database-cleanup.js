#!/usr/bin/env node

/**
 * Perform Database Cleanup
 * Actually removes unused collections based on the analysis
 */

const { MongoClient } = require('mongodb');

const MONGODB_URI = 'mongodb+srv://user:Mybookmodr100@cluster0.ey9u2ce.mongodb.net/bookdress?retryWrites=true&w=majority&appName=Cluster0';

// Collections that are safe to remove (empty and not expected)
const SAFE_TO_REMOVE = [
  'InventoryItem',
  'DressMaintenance', 
  'Review',
  'Payment',
  'CustomerInsight',
  'PushToken',
  'BankDetails',
  'MonthlyAnalytics'
];

// Collections that need review (have data but might be obsolete)
const REVIEW_COLLECTIONS = [
  'LocationValue', // 10 documents - might be localization data
  'NotificationCounter', // 3 documents - might be notification system
  'AccessorySettings' // 2 documents - might be supplier settings
];

async function performDatabaseCleanup() {
  console.log('🧹 Performing Database Cleanup...\n');
  
  const client = new MongoClient(MONGODB_URI);
  await client.connect();
  const db = client.db('bookdress');
  
  try {
    console.log('📊 Pre-cleanup Analysis:');
    const collections = await db.listCollections().toArray();
    console.log(`   Total collections: ${collections.length}`);
    
    // Show what we're about to remove
    console.log('\n🗑️  Collections to be removed:');
    for (const collectionName of SAFE_TO_REMOVE) {
      const exists = collections.some(col => col.name === collectionName);
      if (exists) {
        const count = await db.collection(collectionName).countDocuments();
        console.log(`   - ${collectionName}: ${count} documents`);
      } else {
        console.log(`   - ${collectionName}: (not found)`);
      }
    }
    
    console.log('\n⚠️  Collections to review (not removing):');
    for (const collectionName of REVIEW_COLLECTIONS) {
      const exists = collections.some(col => col.name === collectionName);
      if (exists) {
        const count = await db.collection(collectionName).countDocuments();
        console.log(`   - ${collectionName}: ${count} documents`);
        
        // Show sample data to help with decision
        const sample = await db.collection(collectionName).findOne({});
        if (sample) {
          console.log(`     Sample keys: ${Object.keys(sample).join(', ')}`);
        }
      }
    }
    
    // Perform the cleanup
    console.log('\n🚀 Starting cleanup process...');
    let removedCount = 0;
    
    for (const collectionName of SAFE_TO_REMOVE) {
      try {
        const exists = collections.some(col => col.name === collectionName);
        if (exists) {
          const count = await db.collection(collectionName).countDocuments();
          console.log(`   Removing ${collectionName} (${count} documents)...`);
          await db.collection(collectionName).drop();
          console.log(`   ✅ Removed ${collectionName}`);
          removedCount++;
        } else {
          console.log(`   ⏭️  Skipping ${collectionName} (not found)`);
        }
      } catch (error) {
        console.log(`   ❌ Failed to remove ${collectionName}: ${error.message}`);
      }
    }
    
    // Post-cleanup analysis
    console.log('\n📊 Post-cleanup Analysis:');
    const newCollections = await db.listCollections().toArray();
    console.log(`   Total collections: ${newCollections.length} (was ${collections.length})`);
    console.log(`   Collections removed: ${removedCount}`);
    
    console.log('\n📋 Remaining Collections:');
    for (const collection of newCollections) {
      const count = await db.collection(collection.name).countDocuments();
      console.log(`   - ${collection.name}: ${count} documents`);
    }
    
    // Recommendations for manual review
    console.log('\n💡 Manual Review Recommendations:');
    
    console.log('\n1. LocationValue Collection:');
    console.log('   - Contains localization data for locations');
    console.log('   - Recommendation: Keep if using multi-language support');
    console.log('   - Action: Review if location names need translation');
    
    console.log('\n2. NotificationCounter Collection:');
    console.log('   - Contains notification counters for users');
    console.log('   - Recommendation: Keep if notification system is active');
    console.log('   - Action: Check if notification features are being used');
    
    console.log('\n3. AccessorySettings Collection:');
    console.log('   - Contains pricing settings for accessories by supplier');
    console.log('   - Recommendation: Keep if accessory pricing is a feature');
    console.log('   - Action: Check if suppliers can set accessory prices');
    
    // Database optimization suggestions
    console.log('\n🔧 Database Optimization Suggestions:');
    
    // Check for indexes
    console.log('\n📈 Index Analysis:');
    const coreCollections = ['User', 'Dress', 'Booking', 'FittingAppointment'];
    
    for (const collectionName of coreCollections) {
      try {
        const indexes = await db.collection(collectionName).indexes();
        console.log(`   ${collectionName}: ${indexes.length} indexes`);
        
        // Check for common missing indexes
        const hasCreatedAtIndex = indexes.some(idx => 
          idx.key && idx.key.createdAt
        );
        const hasStatusIndex = indexes.some(idx => 
          idx.key && (idx.key.status || idx.key.type)
        );
        
        if (!hasCreatedAtIndex) {
          console.log(`     ⚠️  Consider adding createdAt index for ${collectionName}`);
        }
        if (!hasStatusIndex && ['Booking', 'FittingAppointment'].includes(collectionName)) {
          console.log(`     ⚠️  Consider adding status index for ${collectionName}`);
        }
      } catch (error) {
        console.log(`   ❌ Could not analyze indexes for ${collectionName}`);
      }
    }
    
    console.log('\n✅ Database cleanup completed successfully!');
    
  } catch (error) {
    console.error('❌ Error during cleanup:', error);
  } finally {
    await client.close();
  }
  
  console.log('\n🎉 Cleanup process finished!');
}

if (require.main === module) {
  performDatabaseCleanup().catch(console.error);
}

module.exports = { performDatabaseCleanup };
