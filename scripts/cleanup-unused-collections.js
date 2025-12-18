#!/usr/bin/env node

/**
 * Clean Up Unused Collections
 * Identifies and removes unused or obsolete collections from the database
 */

const { MongoClient } = require('mongodb');

const MONGODB_URI = 'mongodb+srv://user:Mybookmodr100@cluster0.ey9u2ce.mongodb.net/bookdress?retryWrites=true&w=majority&appName=Cluster0';

// Define the collections that should exist based on the application models
const EXPECTED_COLLECTIONS = [
  // Core business entities
  'User',
  'Dress',
  'Booking',
  'Location',
  'Country',
  'FittingAppointment',
  
  // Financial entities
  'Revenue',
  'Expense',
  
  // System entities
  'Token',
  'Notification',
  'PushNotification',
  
  // Additional entities (if they exist)
  'WeddingPackage',
  'Maintenance',
  'Contract',
  'Image',
  'File'
];

async function cleanupUnusedCollections() {
  console.log('🧹 Starting Database Collection Cleanup...\n');
  
  const client = new MongoClient(MONGODB_URI);
  await client.connect();
  const db = client.db('bookdress');
  
  try {
    // Get all existing collections
    const collections = await db.listCollections().toArray();
    const existingCollectionNames = collections.map(col => col.name);
    
    console.log('📊 Database Analysis:');
    console.log(`   Total collections found: ${existingCollectionNames.length}`);
    
    console.log('\n📋 Existing Collections:');
    for (const collection of collections) {
      const count = await db.collection(collection.name).countDocuments();
      console.log(`   - ${collection.name}: ${count} documents`);
    }
    
    // Identify expected vs unexpected collections
    const expectedFound = [];
    const unexpectedFound = [];
    const expectedMissing = [];
    
    existingCollectionNames.forEach(name => {
      if (EXPECTED_COLLECTIONS.includes(name)) {
        expectedFound.push(name);
      } else {
        unexpectedFound.push(name);
      }
    });
    
    EXPECTED_COLLECTIONS.forEach(name => {
      if (!existingCollectionNames.includes(name)) {
        expectedMissing.push(name);
      }
    });
    
    console.log('\n✅ Expected Collections Found:');
    expectedFound.forEach(name => {
      console.log(`   ✅ ${name}`);
    });
    
    console.log('\n❓ Expected Collections Missing:');
    if (expectedMissing.length === 0) {
      console.log('   (None - all expected collections exist)');
    } else {
      expectedMissing.forEach(name => {
        console.log(`   ❓ ${name}`);
      });
    }
    
    console.log('\n⚠️  Unexpected Collections Found:');
    if (unexpectedFound.length === 0) {
      console.log('   (None - database is clean)');
    } else {
      for (const name of unexpectedFound) {
        const count = await db.collection(name).countDocuments();
        console.log(`   ⚠️  ${name}: ${count} documents`);

        // Show sample documents to help identify the collection's purpose
        const sampleDocs = await db.collection(name).find({}).limit(2).toArray();
        if (sampleDocs.length > 0) {
          console.log(`      Sample document keys: ${Object.keys(sampleDocs[0]).join(', ')}`);
        }
      }
    }
    
    // Analyze collection usage and relationships
    console.log('\n🔍 Collection Usage Analysis:');
    
    // Check for empty collections
    const emptyCollections = [];
    for (const name of existingCollectionNames) {
      const count = await db.collection(name).countDocuments();
      if (count === 0) {
        emptyCollections.push(name);
      }
    }
    
    if (emptyCollections.length > 0) {
      console.log('\n📭 Empty Collections (candidates for removal):');
      emptyCollections.forEach(name => {
        console.log(`   📭 ${name} (0 documents)`);
      });
    }
    
    // Check for collections with very few documents that might be test data
    console.log('\n🧪 Collections with minimal data (potential test collections):');
    for (const name of existingCollectionNames) {
      const count = await db.collection(name).countDocuments();
      if (count > 0 && count <= 5 && !EXPECTED_COLLECTIONS.includes(name)) {
        console.log(`   🧪 ${name}: ${count} documents`);
      }
    }
    
    // Recommendations
    console.log('\n💡 Cleanup Recommendations:');
    
    if (emptyCollections.length > 0) {
      console.log('\n1. Empty Collections:');
      emptyCollections.forEach(name => {
        if (EXPECTED_COLLECTIONS.includes(name)) {
          console.log(`   ✅ Keep ${name} (expected collection, may be populated later)`);
        } else {
          console.log(`   🗑️  Consider removing ${name} (empty and unexpected)`);
        }
      });
    }
    
    if (unexpectedFound.length > 0) {
      console.log('\n2. Unexpected Collections:');
      for (const name of unexpectedFound) {
        const count = await db.collection(name).countDocuments();
        if (count === 0) {
          console.log(`   🗑️  Safe to remove ${name} (empty)`);
        } else if (count <= 10) {
          console.log(`   ⚠️  Review ${name} (${count} documents - might be test data)`);
        } else {
          console.log(`   ⚠️  Investigate ${name} (${count} documents - might be important)`);
        }
      }
    }
    
    // Interactive cleanup (commented out for safety)
    console.log('\n🔒 Cleanup Actions:');
    console.log('   For safety, this script only analyzes collections.');
    console.log('   To actually remove collections, uncomment the cleanup section below.');
    
    /*
    // UNCOMMENT THIS SECTION TO ACTUALLY PERFORM CLEANUP
    console.log('\n🗑️  Performing Cleanup...');
    
    // Remove empty unexpected collections
    for (const name of unexpectedFound) {
      const count = await db.collection(name).countDocuments();
      if (count === 0) {
        console.log(`   Removing empty collection: ${name}`);
        await db.collection(name).drop();
      }
    }
    
    console.log('✅ Cleanup completed!');
    */
    
  } catch (error) {
    console.error('❌ Error during cleanup:', error);
  } finally {
    await client.close();
  }
  
  console.log('\n🎉 Collection analysis completed!');
}

if (require.main === module) {
  cleanupUnusedCollections().catch(console.error);
}

module.exports = { cleanupUnusedCollections };
