#!/usr/bin/env node

/**
 * Standalone script to add mock data to MongoDB Atlas
 * - Creates Sofia Jenin supplier based on existing user info
 * - Updates all dresses to use this supplier
 * - Adds mock bookings to the Booking collection
 */

const { MongoClient, ObjectId } = require('mongodb');
const bcrypt = require('bcryptjs');

// MongoDB Atlas connection string
const MONGODB_URI = 'mongodb+srv://user:Mybookmodr100@cluster0.ey9u2ce.mongodb.net/bookdress?retryWrites=true&w=majority&appName=Cluster0';

// Database and collection names (using PascalCase as per project convention)
const DB_NAME = 'bookdress';
const COLLECTIONS = {
  USER: 'User',
  DRESS: 'Dress',
  BOOKING: 'Booking',
  LOCATION: 'Location',
  COUNTRY: 'Country'
};

// User types and booking statuses
const USER_TYPES = {
  ADMIN: 'admin',
  SUPPLIER: 'supplier',
  USER: 'user'
};

const BOOKING_STATUSES = {
  VOID: 'void',
  PENDING: 'pending',
  DEPOSIT: 'deposit',
  PAID: 'paid',
  RESERVED: 'reserved',
  CANCELLED: 'cancelled'
};

async function connectToDatabase() {
  console.log('🔌 Connecting to MongoDB Atlas...');
  const client = new MongoClient(MONGODB_URI, {
    serverSelectionTimeoutMS: 30000,
    socketTimeoutMS: 45000,
    connectTimeoutMS: 30000,
    maxPoolSize: 10,
    retryWrites: true,
    retryReads: true
  });
  
  await client.connect();
  console.log('✅ Connected to MongoDB Atlas successfully');
  return client;
}

async function findSofiaJeninUser(db) {
  console.log('🔍 Looking for Sofia Jenin user...');
  
  // Try different variations of the name
  const searchPatterns = [
    { fullName: /sofia.*jenin/i },
    { fullName: /jenin.*sofia/i },
    { email: /sofia.*jenin/i },
    { email: /jenin.*sofia/i },
    { fullName: 'Sofia Jenin' },
    { fullName: 'sofia jenin' }
  ];
  
  for (const pattern of searchPatterns) {
    const user = await db.collection(COLLECTIONS.USER).findOne(pattern);
    if (user) {
      console.log(`✅ Found Sofia Jenin user: ${user.fullName} (${user.email})`);
      return user;
    }
  }
  
  console.log('⚠️ Sofia Jenin user not found, will create a mock user');
  return null;
}

async function createSofiaJeninSupplier(db, existingUser) {
  console.log('👤 Creating Sofia Jenin supplier...');
  
  // Check if supplier already exists
  const existingSupplier = await db.collection(COLLECTIONS.USER).findOne({
    email: 'sofia.jenin@bookdress.ps',
    type: USER_TYPES.SUPPLIER
  });
  
  if (existingSupplier) {
    console.log('✅ Sofia Jenin supplier already exists');
    return existingSupplier;
  }
  
  // Create password hash
  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash('sofia123', salt);
  
  // Use existing user info or create mock data
  const supplierData = {
    email: existingUser?.email || 'sofia.jenin@bookdress.ps',
    fullName: existingUser?.fullName || 'Sofia Jenin',
    password: passwordHash,
    phone: existingUser?.phone || '0599987654',
    language: existingUser?.language || 'ar',
    type: USER_TYPES.SUPPLIER,
    active: true,
    verified: true,
    verifiedAt: new Date(),
    blacklisted: false,
    enableEmailNotifications: true,
    enableSmsNotifications: true,
    location: existingUser?.location || 'Jenin City, Palestine',
    bio: existingUser?.bio || 'Sofia Jenin - Premium dress rental specialist in Jenin City, offering elegant wedding and evening gowns for special occasions.',
    payLater: true,
    supplierDressLimit: 50,
    notifyAdminOnNewDress: true,
    priceChangeRate: 0.1,
    createdAt: new Date(),
    updatedAt: new Date()
  };
  
  const result = await db.collection(COLLECTIONS.USER).insertOne(supplierData);
  console.log(`✅ Created Sofia Jenin supplier with ID: ${result.insertedId}`);
  
  return { ...supplierData, _id: result.insertedId };
}

async function updateDressesToUseSofiaSupplier(db, supplierId) {
  console.log('👗 Updating all dresses to use Sofia Jenin as supplier...');
  
  const result = await db.collection(COLLECTIONS.DRESS).updateMany(
    {}, // Update all dresses
    {
      $set: {
        supplier: new ObjectId(supplierId),
        updatedAt: new Date()
      }
    }
  );
  
  console.log(`✅ Updated ${result.modifiedCount} dresses to use Sofia Jenin supplier`);
  return result.modifiedCount;
}

async function getRandomData(db) {
  console.log('📊 Fetching random data for bookings...');
  
  // Get all dresses
  const dresses = await db.collection(COLLECTIONS.DRESS).find({}).toArray();
  
  // Get all regular users (customers)
  const customers = await db.collection(COLLECTIONS.USER).find({
    type: { $ne: USER_TYPES.SUPPLIER }
  }).toArray();
  
  // Get all locations
  const locations = await db.collection(COLLECTIONS.LOCATION).find({}).toArray();
  
  console.log(`📊 Found ${dresses.length} dresses, ${customers.length} customers, ${locations.length} locations`);
  
  return { dresses, customers, locations };
}

async function createMockBookings(db, supplierId, { dresses, customers, locations }) {
  console.log('📅 Creating mock bookings...');
  
  if (dresses.length === 0 || customers.length === 0 || locations.length === 0) {
    console.log('⚠️ Insufficient data to create bookings');
    return 0;
  }
  
  const bookings = [];
  const statuses = Object.values(BOOKING_STATUSES);
  const now = new Date();
  
  // Create 10-15 mock bookings
  const bookingCount = Math.floor(Math.random() * 6) + 10; // 10-15 bookings
  
  for (let i = 0; i < bookingCount; i++) {
    const dress = dresses[Math.floor(Math.random() * dresses.length)];
    const customer = customers[Math.floor(Math.random() * customers.length)];
    const location = locations[Math.floor(Math.random() * locations.length)];
    const status = statuses[Math.floor(Math.random() * statuses.length)];
    
    // Generate random dates (some past, some future)
    const daysOffset = Math.floor(Math.random() * 60) - 30; // -30 to +30 days
    const fromDate = new Date(now.getTime() + daysOffset * 24 * 60 * 60 * 1000);
    const toDate = new Date(fromDate.getTime() + (Math.floor(Math.random() * 3) + 1) * 24 * 60 * 60 * 1000); // 1-3 days rental
    
    const basePrice = dress.price || 500;
    const price = basePrice + Math.floor(Math.random() * 200) - 100; // ±100 variation
    const paidAmount = status === BOOKING_STATUSES.PAID ? price : 
                      status === BOOKING_STATUSES.DEPOSIT ? Math.floor(price * 0.3) : 0;
    
    const booking = {
      supplier: new ObjectId(supplierId),
      dress: new ObjectId(dress._id),
      customer: new ObjectId(customer._id),
      location: new ObjectId(location._id),
      from: fromDate,
      to: toDate,
      status: status,
      cancellation: Math.random() > 0.8, // 20% chance
      amendments: Math.random() > 0.9, // 10% chance
      cancelRequest: false,
      price: price,
      paidAmount: paidAmount,
      remainingAmount: price - paidAmount,
      paymentStatus: status === BOOKING_STATUSES.PAID ? 'fully-paid' : 
                    status === BOOKING_STATUSES.DEPOSIT ? 'partially-paid' : 'pending',
      isDeposit: status === BOOKING_STATUSES.DEPOSIT,
      fittingRequired: Math.random() > 0.6, // 40% chance
      fittingDate: Math.random() > 0.5 ? new Date(fromDate.getTime() - 24 * 60 * 60 * 1000) : undefined,
      fittingNotes: Math.random() > 0.7 ? 'Standard fitting required' : undefined,
      alterationNotes: Math.random() > 0.8 ? 'Minor hem adjustment needed' : undefined,
      accessoriesIncluded: Math.random() > 0.5 ? ['veil', 'jewelry'] : [],
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    bookings.push(booking);
  }
  
  const result = await db.collection(COLLECTIONS.BOOKING).insertMany(bookings);
  console.log(`✅ Created ${result.insertedCount} mock bookings`);
  
  return result.insertedCount;
}

async function main() {
  let client;
  
  try {
    console.log('🚀 Starting mock data creation script...\n');
    
    // Connect to database
    client = await connectToDatabase();
    const db = client.db(DB_NAME);
    
    // Find Sofia Jenin user
    const sofiaUser = await findSofiaJeninUser(db);
    
    // Create Sofia Jenin supplier
    const sofiaSupplier = await createSofiaJeninSupplier(db, sofiaUser);
    
    // Update all dresses to use Sofia supplier
    const updatedDresses = await updateDressesToUseSofiaSupplier(db, sofiaSupplier._id);
    
    // Get random data for bookings
    const randomData = await getRandomData(db);
    
    // Create mock bookings
    const createdBookings = await createMockBookings(db, sofiaSupplier._id, randomData);
    
    console.log('\n🎉 Mock data creation completed successfully!');
    console.log(`📊 Summary:`);
    console.log(`   - Sofia Jenin supplier: ✅ Created/Updated`);
    console.log(`   - Updated dresses: ${updatedDresses}`);
    console.log(`   - Created bookings: ${createdBookings}`);
    
  } catch (error) {
    console.error('❌ Error creating mock data:', error);
    process.exit(1);
  } finally {
    if (client) {
      await client.close();
      console.log('🔌 Database connection closed');
    }
  }
}

async function checkDatabase() {
  let client;

  try {
    console.log('🔍 Checking database collections and data...\n');

    client = await connectToDatabase();
    const db = client.db(DB_NAME);

    // List all collections
    const collections = await db.listCollections().toArray();
    console.log('📊 Collections in database:');
    collections.forEach(col => console.log(`   - ${col.name}`));

    // Check document counts
    const usersCount = await db.collection('users').countDocuments().catch(() => 0);
    const UserCount = await db.collection('User').countDocuments().catch(() => 0);
    const dressCount = await db.collection('Dress').countDocuments().catch(() => 0);
    const bookingCount = await db.collection('Booking').countDocuments().catch(() => 0);

    console.log('\n📈 Document counts:');
    console.log(`   - users collection: ${usersCount}`);
    console.log(`   - User collection: ${UserCount}`);
    console.log(`   - Dress collection: ${dressCount}`);
    console.log(`   - Booking collection: ${bookingCount}`);

    // Check for duplicate emails in User collection
    const duplicates = await db.collection('User').aggregate([
      { $group: { _id: '$email', count: { $sum: 1 }, docs: { $push: '$_id' } } },
      { $match: { count: { $gt: 1 } } }
    ]).toArray();

    console.log(`\n🔍 Duplicate emails in User collection: ${duplicates.length}`);
    duplicates.forEach(dup => console.log(`   - ${dup._id} (${dup.count} duplicates)`));

    // Check suppliers
    const suppliers = await db.collection('User').find({ type: 'supplier' }).toArray();
    console.log(`\n👥 Suppliers found: ${suppliers.length}`);
    suppliers.forEach(supplier => console.log(`   - ${supplier.fullName} (${supplier.email})`));

    // Check if dresses have valid supplier references
    const dressesWithInvalidSuppliers = await db.collection('Dress').aggregate([
      {
        $lookup: {
          from: 'User',
          localField: 'supplier',
          foreignField: '_id',
          as: 'supplierInfo'
        }
      },
      {
        $match: {
          supplierInfo: { $size: 0 }
        }
      }
    ]).toArray();

    console.log(`\n❌ Dresses with invalid supplier references: ${dressesWithInvalidSuppliers.length}`);

  } catch (error) {
    console.error('❌ Error checking database:', error);
  } finally {
    if (client) {
      await client.close();
    }
  }
}

async function cleanDatabase() {
  let client;

  try {
    console.log('🧹 Starting database cleanup...\n');

    client = await connectToDatabase();
    const db = client.db(DB_NAME);

    // 1. Delete users collection if it exists
    try {
      const usersCount = await db.collection('users').countDocuments();
      if (usersCount > 0) {
        await db.collection('users').drop();
        console.log(`✅ Deleted 'users' collection with ${usersCount} documents`);
      } else {
        console.log('ℹ️ No documents in users collection');
      }
    } catch (error) {
      console.log('ℹ️ users collection does not exist or is already empty');
    }

    // 2. Remove duplicate users with same email from User collection
    const duplicates = await db.collection('User').aggregate([
      { $group: { _id: '$email', count: { $sum: 1 }, docs: { $push: { id: '$_id', createdAt: '$createdAt' } } } },
      { $match: { count: { $gt: 1 } } }
    ]).toArray();

    let removedCount = 0;
    for (const duplicate of duplicates) {
      // Keep the oldest document, remove the rest
      const sortedDocs = duplicate.docs.sort((a, b) =>
        new Date(a.createdAt || 0) - new Date(b.createdAt || 0)
      );

      // Remove all but the first (oldest) document
      for (let i = 1; i < sortedDocs.length; i++) {
        await db.collection('User').deleteOne({ _id: sortedDocs[i].id });
        removedCount++;
      }

      console.log(`✅ Removed ${sortedDocs.length - 1} duplicate(s) for email: ${duplicate._id}`);
    }

    console.log(`\n🎉 Database cleanup completed!`);
    console.log(`   - Removed ${removedCount} duplicate users`);

  } catch (error) {
    console.error('❌ Error cleaning database:', error);
  } finally {
    if (client) {
      await client.close();
    }
  }
}

async function fixSuppliers() {
  let client;

  try {
    console.log('🔧 Fixing supplier data...\n');

    client = await connectToDatabase();
    const db = client.db(DB_NAME);

    // Add avatars to all suppliers (required by API endpoints)
    const result = await db.collection('User').updateMany(
      { type: 'supplier', avatar: { $in: [null, undefined] } },
      {
        $set: {
          avatar: 'default-supplier-avatar.png',
          updatedAt: new Date()
        }
      }
    );

    console.log(`✅ Updated ${result.modifiedCount} suppliers with default avatars`);

    // Verify suppliers now have avatars
    const suppliers = await db.collection('User').find({ type: 'supplier' }).toArray();
    console.log('\n👥 Updated suppliers:');
    suppliers.forEach(supplier => {
      console.log(`   - ${supplier.fullName}: avatar = ${supplier.avatar}`);
    });

  } catch (error) {
    console.error('❌ Error fixing suppliers:', error);
  } finally {
    if (client) {
      await client.close();
    }
  }
}

// Run the script
if (require.main === module) {
  const command = process.argv[2];

  if (command === 'check') {
    checkDatabase();
  } else if (command === 'clean') {
    cleanDatabase();
  } else if (command === 'fix') {
    fixSuppliers();
  } else {
    main();
  }
}

module.exports = { main, checkDatabase, cleanDatabase, fixSuppliers };
