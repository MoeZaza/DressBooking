#!/usr/bin/env node

/**
 * Comprehensive Data Seeder for BookDress Application
 * Creates realistic test data for all collections
 */

const { MongoClient, ObjectId } = require('mongodb');
const bcrypt = require('bcryptjs');

// MongoDB Atlas connection string
const MONGODB_URI = 'mongodb+srv://user:Mybookmodr100@cluster0.ey9u2ce.mongodb.net/bookdress?retryWrites=true&w=majority&appName=Cluster0';
const DB_NAME = 'bookdress';

// Collection names (PascalCase)
const COLLECTIONS = {
  USER: 'User',
  DRESS: 'Dress',
  BOOKING: 'Booking',
  LOCATION: 'Location',
  LOCATION_VALUE: 'LocationValue',
  COUNTRY: 'Country',
  NOTIFICATION: 'Notification',
  ACCESSORY_SETTINGS: 'AccessorySettings',
  BANK_DETAILS: 'BankDetails',
  REVENUE: 'Revenue',
  EXPENSE: 'Expense',
  FITTING_APPOINTMENT: 'FittingAppointment',
  DRESS_MAINTENANCE: 'DressMaintenance',
  PAYMENT: 'Payment',
  REVIEW: 'Review',
  WEDDING_PACKAGE: 'WeddingPackage',
  INVENTORY_ITEM: 'InventoryItem',
  CUSTOMER_INSIGHT: 'CustomerInsight',
  MONTHLY_ANALYTICS: 'MonthlyAnalytics'
};

// Enums and constants
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

const DRESS_TYPES = {
  TRADITIONAL: 'traditional',
  MODERN: 'modern',
  DESIGNER: 'designer',
  VINTAGE: 'vintage',
  CASUAL: 'casual',
  WEDDING: 'wedding',
  EVENING: 'evening',
  COCKTAIL: 'cocktail',
  PROM: 'prom',
  OTHER: 'other'
};

const DRESS_SIZES = {
  XS: 'xs',
  S: 's',
  M: 'm',
  L: 'l',
  XL: 'xl',
  XXL: 'xxl'
};

const DRESS_MATERIALS = {
  SILK: 'silk',
  COTTON: 'cotton',
  LACE: 'lace',
  CHIFFON: 'chiffon',
  SATIN: 'satin',
  TULLE: 'tulle',
  VELVET: 'velvet',
  ORGANZA: 'organza'
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

async function clearDatabase(db) {
  console.log('🧹 Clearing existing data...');
  
  const collections = await db.listCollections().toArray();
  let clearedCount = 0;
  
  for (const collection of collections) {
    const collectionName = collection.name;
    if (Object.values(COLLECTIONS).includes(collectionName)) {
      const result = await db.collection(collectionName).deleteMany({});
      console.log(`   - Cleared ${collectionName}: ${result.deletedCount} documents`);
      clearedCount += result.deletedCount;
    }
  }
  
  console.log(`✅ Cleared ${clearedCount} total documents`);
}

async function createCountries(db) {
  console.log('🌍 Creating countries...');
  
  const countries = [
    {
      _id: new ObjectId(),
      code: 'PS',
      name: 'Palestine',
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      _id: new ObjectId(),
      code: 'JO',
      name: 'Jordan',
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      _id: new ObjectId(),
      code: 'LB',
      name: 'Lebanon',
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ];
  
  await db.collection(COLLECTIONS.COUNTRY).insertMany(countries);
  console.log(`✅ Created ${countries.length} countries`);
  return countries;
}

async function createLocationValues(db, locations) {
  console.log('📍 Creating location values...');
  
  const locationValues = [];

  for (const location of locations) {
    // Create English values only (Arabic causes MongoDB text index issues)
    const englishValue = {
      _id: new ObjectId(),
      language: 'en',
      value: location.nameEn,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    locationValues.push(englishValue);

    // Store the value ID in the location for reference
    location.values = [englishValue._id];
  }
  
  await db.collection(COLLECTIONS.LOCATION_VALUE).insertMany(locationValues);
  console.log(`✅ Created ${locationValues.length} location values`);
  return locationValues;
}

async function createLocations(db, countries) {
  console.log('🏙️ Creating locations...');
  
  const palestine = countries.find(c => c.code === 'PS');
  const jordan = countries.find(c => c.code === 'JO');
  const lebanon = countries.find(c => c.code === 'LB');
  
  const locationsData = [
    { nameEn: 'Jenin', nameAr: 'جنين', country: palestine._id, lat: 32.4617, lng: 35.3031 },
    { nameEn: 'Ramallah', nameAr: 'رام الله', country: palestine._id, lat: 31.9073, lng: 35.2044 },
    { nameEn: 'Nablus', nameAr: 'نابلس', country: palestine._id, lat: 32.2211, lng: 35.2544 },
    { nameEn: 'Amman', nameAr: 'عمان', country: jordan._id, lat: 31.9539, lng: 35.9106 },
    { nameEn: 'Beirut', nameAr: 'بيروت', country: lebanon._id, lat: 33.8938, lng: 35.5018 }
  ];
  
  const locations = locationsData.map(loc => ({
    _id: new ObjectId(),
    country: loc.country,
    latitude: loc.lat,
    longitude: loc.lng,
    nameEn: loc.nameEn,
    nameAr: loc.nameAr,
    values: [], // Will be populated after creating location values
    image: 'default-location.jpg',
    createdAt: new Date(),
    updatedAt: new Date()
  }));
  
  await db.collection(COLLECTIONS.LOCATION).insertMany(locations);

  // Create location values (values are assigned to locations during creation)
  await createLocationValues(db, locations);

  // Update locations with their values
  for (const location of locations) {
    await db.collection(COLLECTIONS.LOCATION).updateOne(
      { _id: location._id },
      { $set: { values: location.values } }
    );
  }

  console.log(`✅ Created ${locations.length} locations`);
  return locations;
}

async function createUsers(db) {
  console.log('👥 Creating users...');
  
  const salt = await bcrypt.genSalt(10);
  
  // Admin users
  const adminUsers = [
    {
      _id: new ObjectId(),
      email: 'admin@bookdress.com',
      fullName: 'BookDress Admin',
      password: await bcrypt.hash('admin123', salt),
      type: USER_TYPES.ADMIN,
      language: 'en',
      active: true,
      verified: true,
      verifiedAt: new Date(),
      blacklisted: false,
      enableEmailNotifications: true,
      enableSmsNotifications: true,
      avatar: 'admin-avatar.png',
      bio: 'System Administrator for BookDress platform',
      location: 'Jenin, Palestine',
      phone: '0599123456',
      birthDate: new Date('1985-01-15'),
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ];
  
  // Supplier users
  const supplierUsers = [
    {
      _id: new ObjectId(),
      email: 'sofia@sofiaboutique.ps',
      fullName: 'Sofia Boutique',
      password: await bcrypt.hash('supplier123', salt),
      type: USER_TYPES.SUPPLIER,
      language: 'ar',
      active: true,
      verified: true,
      verifiedAt: new Date(),
      blacklisted: false,
      enableEmailNotifications: true,
      enableSmsNotifications: true,
      avatar: 'sofia-boutique-avatar.png',
      bio: 'Premium dress rental boutique specializing in wedding and evening gowns',
      location: 'Jenin City, Palestine',
      phone: '0599987654',
      payLater: true,
      supplierDressLimit: 100,
      notifyAdminOnNewDress: true,
      priceChangeRate: 0.1,
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      _id: new ObjectId(),
      email: 'layla@laylaboutique.ps',
      fullName: 'Layla Boutique',
      password: await bcrypt.hash('supplier123', salt),
      type: USER_TYPES.SUPPLIER,
      language: 'ar',
      active: true,
      verified: true,
      verifiedAt: new Date(),
      blacklisted: false,
      enableEmailNotifications: true,
      enableSmsNotifications: true,
      avatar: 'layla-boutique-avatar.png',
      bio: 'Modern and traditional dress rental boutique in Ramallah',
      location: 'Ramallah, Palestine',
      phone: '0599876543',
      payLater: true,
      supplierDressLimit: 75,
      notifyAdminOnNewDress: true,
      priceChangeRate: 0.12,
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ];
  
  // Customer users
  const customerUsers = [];
  const customerNames = [
    { fullName: 'Fatima Al-Zahra', email: 'fatima.zahra@example.com' },
    { fullName: 'Aisha Mohammed', email: 'aisha.mohammed@example.com' },
    { fullName: 'Maryam Hassan', email: 'maryam.hassan@example.com' },
    { fullName: 'Zeinab Ali', email: 'zeinab.ali@example.com' },
    { fullName: 'Nour Ahmad', email: 'nour.ahmad@example.com' },
    { fullName: 'Layla Khalil', email: 'layla.khalil@example.com' },
    { fullName: 'Rania Mansour', email: 'rania.mansour@example.com' },
    { fullName: 'Dina Saleh', email: 'dina.saleh@example.com' }
  ];
  
  for (const customer of customerNames) {
    customerUsers.push({
      _id: new ObjectId(),
      email: customer.email,
      fullName: customer.fullName,
      password: await bcrypt.hash('customer123', salt),
      type: USER_TYPES.USER,
      language: 'ar',
      active: true,
      verified: true,
      verifiedAt: new Date(),
      blacklisted: false,
      enableEmailNotifications: true,
      enableSmsNotifications: true,
      avatar: 'default-customer-avatar.png',
      location: 'Palestine',
      phone: `059${Math.floor(Math.random() * 9000000) + 1000000}`,
      birthDate: new Date(1990 + Math.floor(Math.random() * 15), Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1),
      createdAt: new Date(),
      updatedAt: new Date()
    });
  }
  
  const allUsers = [...adminUsers, ...supplierUsers, ...customerUsers];
  await db.collection(COLLECTIONS.USER).insertMany(allUsers);
  
  console.log(`✅ Created ${allUsers.length} users (${adminUsers.length} admins, ${supplierUsers.length} suppliers, ${customerUsers.length} customers)`);
  return { adminUsers, supplierUsers, customerUsers, allUsers };
}

async function createDresses(db, suppliers, locations) {
  console.log('👗 Creating dresses...');

  // First, update suppliers with multiple locations (multi-branch support)
  console.log('📍 Updating suppliers with multiple locations...');
  for (let i = 0; i < suppliers.length; i++) {
    const supplier = suppliers[i];
    // Assign multiple locations to each supplier
    const supplierLocations = i === 0
      ? locations.slice(0, 3) // First supplier gets first 3 locations
      : locations.slice(2, 5); // Second supplier gets locations 2-4 (with overlap)

    // Update supplier with locations array
    await db.collection('User').updateOne(
      { _id: supplier._id },
      { $set: { locations: supplierLocations.map(loc => loc._id) } }
    );

    // Update the supplier object in memory for consistency
    supplier.locations = supplierLocations.map(loc => loc._id);

    console.log(`   ✅ Updated ${supplier.fullName} with ${supplierLocations.length} locations`);
  }

  const dresses = [];
  const dressTemplates = [
    {
      name: 'Elegant White Wedding Gown',
      type: DRESS_TYPES.WEDDING,
      size: DRESS_SIZES.M,
      color: 'White',
      material: DRESS_MATERIALS.SILK,
      price: 1500,
      deposit: 300,
      length: 180,
      designerName: 'Vera Wang',
      style: 'traditional',
      neckline: 'sweetheart',
      sleeves: 'sleeveless',
      silhouette: 'a-line',
      occasionTags: ['wedding', 'bridal'],
      season: 'all-season'
    },
    {
      name: 'Royal Blue Evening Dress',
      type: DRESS_TYPES.EVENING,
      size: DRESS_SIZES.L,
      color: 'Royal Blue',
      material: DRESS_MATERIALS.CHIFFON,
      price: 800,
      deposit: 160,
      length: 160,
      designerName: 'Elie Saab',
      style: 'modern',
      neckline: 'v-neck',
      sleeves: 'long',
      silhouette: 'mermaid',
      occasionTags: ['evening', 'formal'],
      season: 'winter'
    },
    {
      name: 'Vintage Lace Cocktail Dress',
      type: DRESS_TYPES.COCKTAIL,
      size: DRESS_SIZES.S,
      color: 'Champagne',
      material: DRESS_MATERIALS.LACE,
      price: 600,
      deposit: 120,
      length: 120,
      designerName: 'Oscar de la Renta',
      style: 'vintage',
      neckline: 'boat',
      sleeves: 'three-quarter',
      silhouette: 'fit-and-flare',
      occasionTags: ['cocktail', 'party'],
      season: 'spring'
    },
    {
      name: 'Modern Black Prom Dress',
      type: DRESS_TYPES.PROM,
      size: DRESS_SIZES.M,
      color: 'Black',
      material: DRESS_MATERIALS.SATIN,
      price: 700,
      deposit: 140,
      length: 170,
      designerName: 'Jovani',
      style: 'modern',
      neckline: 'off-shoulder',
      sleeves: 'sleeveless',
      silhouette: 'ball-gown',
      occasionTags: ['prom', 'formal'],
      season: 'spring'
    },
    {
      name: 'Traditional Palestinian Thobe',
      type: DRESS_TYPES.TRADITIONAL,
      size: DRESS_SIZES.L,
      color: 'Red',
      material: DRESS_MATERIALS.COTTON,
      price: 400,
      deposit: 80,
      length: 150,
      designerName: 'Local Artisan',
      style: 'traditional',
      neckline: 'round',
      sleeves: 'long',
      silhouette: 'straight',
      occasionTags: ['cultural', 'traditional'],
      season: 'all-season'
    },
    {
      name: 'Designer Emerald Gown',
      type: DRESS_TYPES.DESIGNER,
      size: DRESS_SIZES.XL,
      color: 'Emerald Green',
      material: DRESS_MATERIALS.VELVET,
      price: 1200,
      deposit: 240,
      length: 175,
      designerName: 'Zuhair Murad',
      style: 'designer',
      neckline: 'halter',
      sleeves: 'sleeveless',
      silhouette: 'column',
      occasionTags: ['gala', 'red-carpet'],
      season: 'winter'
    }
  ];

  for (let i = 0; i < dressTemplates.length; i++) {
    const template = dressTemplates[i];
    const supplier = suppliers[i % suppliers.length];

    // Use supplier's locations for dress availability (multi-branch support)
    const supplierLocations = supplier.locations || [locations[i % locations.length]._id];
    // Randomly assign dress to 1-3 of the supplier's locations
    const numLocations = Math.floor(Math.random() * Math.min(3, supplierLocations.length)) + 1;
    const dressLocations = supplierLocations.slice(0, numLocations);

    const dress = {
      _id: new ObjectId(),
      name: template.name,
      supplier: supplier._id,
      locations: dressLocations,
      price: template.price,
      discountedPrice: Math.random() > 0.7 ? template.price * 0.9 : undefined,
      deposit: template.deposit,
      available: true,
      fullyBooked: false,
      comingSoon: false,
      type: template.type,
      size: template.size,
      style: template.style,
      customizable: Math.random() > 0.5,
      images: [`dress-${i + 1}-1.jpg`, `dress-${i + 1}-2.jpg`],
      color: template.color,
      length: template.length,
      material: template.material,
      cancellation: Math.floor(Math.random() * 48) + 24, // 24-72 hours
      amendments: Math.floor(Math.random() * 24) + 12, // 12-36 hours
      range: template.type,
      accessories: ['jewelry', 'shoes'],
      rating: Math.random() * 2 + 3, // 3-5 stars
      rentals: Math.floor(Math.random() * 50),
      designerName: template.designerName,
      dressCode: `DC${String(i + 1).padStart(4, '0')}`,
      fittingRequired: Math.random() > 0.3,
      alterationNotes: 'Standard alterations available',
      careInstructions: 'Dry clean only',
      occasionTags: template.occasionTags,
      season: template.season,
      neckline: template.neckline,
      sleeves: template.sleeves,
      silhouette: template.silhouette,
      images: [`dress_${i + 1}_main.jpg`, `dress_${i + 1}_detail.jpg`], // Add sample image filenames
      image: `dress_${i + 1}_main.jpg`, // Primary image for backward compatibility
      bookingCount: Math.floor(Math.random() * 20),
      totalRevenue: template.price * Math.floor(Math.random() * 10),
      createdAt: new Date(),
      updatedAt: new Date()
    };

    dresses.push(dress);
  }

  await db.collection(COLLECTIONS.DRESS).insertMany(dresses);
  console.log(`✅ Created ${dresses.length} dresses`);
  return dresses;
}

async function createBookings(db, dresses, suppliers, customers, locations) {
  console.log('📅 Creating bookings...');

  const bookings = [];
  const statuses = Object.values(BOOKING_STATUSES);

  // Create 20 bookings
  for (let i = 0; i < 20; i++) {
    const dress = dresses[Math.floor(Math.random() * dresses.length)];
    const customer = customers[Math.floor(Math.random() * customers.length)];
    const location = locations[Math.floor(Math.random() * locations.length)];
    const status = statuses[Math.floor(Math.random() * statuses.length)];

    // Find supplier for this dress
    const supplier = suppliers.find(s => s._id.equals(dress.supplier));

    // Generate random dates
    const now = new Date();
    const daysOffset = Math.floor(Math.random() * 120) - 60; // -60 to +60 days
    const fromDate = new Date(now.getTime() + daysOffset * 24 * 60 * 60 * 1000);
    const toDate = new Date(fromDate.getTime() + (Math.floor(Math.random() * 3) + 1) * 24 * 60 * 60 * 1000);

    const price = dress.price + Math.floor(Math.random() * 200) - 100; // ±100 variation
    const paidAmount = status === BOOKING_STATUSES.PAID ? price :
                      status === BOOKING_STATUSES.DEPOSIT ? Math.floor(price * 0.3) : 0;

    const booking = {
      _id: new ObjectId(),
      supplier: supplier._id,
      dress: dress._id,
      customer: customer._id,
      location: location._id,
      from: fromDate,
      to: toDate,
      status: status,
      cancellation: Math.random() > 0.8,
      amendments: Math.random() > 0.9,
      cancelRequest: false,
      price: price,
      paidAmount: paidAmount,
      remainingAmount: price - paidAmount,
      paymentStatus: status === BOOKING_STATUSES.PAID ? 'fully-paid' :
                    status === BOOKING_STATUSES.DEPOSIT ? 'partially-paid' : 'pending',
      isDeposit: status === BOOKING_STATUSES.DEPOSIT,
      fittingRequired: Math.random() > 0.6,
      fittingDate: Math.random() > 0.5 ? new Date(fromDate.getTime() - 24 * 60 * 60 * 1000) : undefined,
      fittingNotes: Math.random() > 0.7 ? 'Standard fitting appointment scheduled' : undefined,
      alterationNotes: Math.random() > 0.8 ? 'Minor hem adjustment needed' : undefined,
      accessoriesIncluded: Math.random() > 0.5 ? ['veil', 'jewelry'] : [],
      createdAt: new Date(),
      updatedAt: new Date()
    };

    bookings.push(booking);
  }

  await db.collection(COLLECTIONS.BOOKING).insertMany(bookings);
  console.log(`✅ Created ${bookings.length} bookings`);
  return bookings;
}

async function createAccessorySettings(db, suppliers) {
  console.log('💍 Creating accessory settings...');

  const accessorySettings = [];

  for (const supplier of suppliers) {
    const settings = {
      _id: new ObjectId(),
      supplier: supplier._id,
      veilPrice: Math.floor(Math.random() * 100) + 50, // 50-150
      jewelryPrice: Math.floor(Math.random() * 80) + 30, // 30-110
      shoesPrice: Math.floor(Math.random() * 60) + 40, // 40-100
      headpiecePrice: Math.floor(Math.random() * 70) + 25, // 25-95
      currency: 'ILS',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    accessorySettings.push(settings);
  }

  await db.collection(COLLECTIONS.ACCESSORY_SETTINGS).insertMany(accessorySettings);
  console.log(`✅ Created ${accessorySettings.length} accessory settings`);
  return accessorySettings;
}

async function createNotifications(db, users) {
  console.log('🔔 Creating notifications...');

  const notifications = [];
  const notificationTypes = ['booking', 'payment', 'fitting', 'reminder', 'system', 'review', 'promotion'];
  const categories = ['info', 'success', 'warning', 'error'];
  const priorities = ['low', 'medium', 'high', 'urgent'];

  // Create 30 notifications
  for (let i = 0; i < 30; i++) {
    const user = users[Math.floor(Math.random() * users.length)];
    const type = notificationTypes[Math.floor(Math.random() * notificationTypes.length)];
    const category = categories[Math.floor(Math.random() * categories.length)];
    const priority = priorities[Math.floor(Math.random() * priorities.length)];

    const notification = {
      _id: new ObjectId(),
      user: user._id,
      title: `${type.charAt(0).toUpperCase() + type.slice(1)} Notification`,
      message: `This is a ${type} notification for ${user.fullName}`,
      type: type,
      category: category,
      priority: priority,
      isRead: Math.random() > 0.6,
      emailSent: Math.random() > 0.5,
      pushSent: Math.random() > 0.5,
      actionUrl: type === 'booking' ? '/bookings' : `/${type}`,
      actionText: 'View Details',
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      createdAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000), // Last 7 days
      updatedAt: new Date()
    };

    notifications.push(notification);
  }

  await db.collection(COLLECTIONS.NOTIFICATION).insertMany(notifications);
  console.log(`✅ Created ${notifications.length} notifications`);
  return notifications;
}

async function createRevenue(db, suppliers, bookings) {
  console.log('💰 Creating revenue records...');

  const revenues = [];

  for (const supplier of suppliers) {
    // Create monthly revenue records for the last 6 months
    for (let i = 0; i < 6; i++) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);

      const supplierBookings = bookings.filter(b =>
        b.supplier.equals(supplier._id) &&
        b.status === BOOKING_STATUSES.PAID
      );

      const monthlyRevenue = supplierBookings.reduce((sum, booking) => sum + booking.price, 0);

      const revenue = {
        _id: new ObjectId(),
        supplier: supplier._id,
        amount: monthlyRevenue + Math.floor(Math.random() * 1000), // Add some variation
        currency: 'ILS',
        month: date.getMonth() + 1,
        year: date.getFullYear(),
        bookingCount: supplierBookings.length + Math.floor(Math.random() * 5),
        createdAt: new Date(),
        updatedAt: new Date()
      };

      revenues.push(revenue);
    }
  }

  await db.collection(COLLECTIONS.REVENUE).insertMany(revenues);
  console.log(`✅ Created ${revenues.length} revenue records`);
  return revenues;
}

async function createExpenses(db, suppliers) {
  console.log('💸 Creating expense records...');

  const expenses = [];
  const categories = ['maintenance', 'cleaning', 'storage', 'marketing', 'utilities', 'rent', 'other'];

  for (const supplier of suppliers) {
    // Create 10 expenses per supplier
    for (let i = 0; i < 10; i++) {
      const category = categories[Math.floor(Math.random() * categories.length)];

      const expense = {
        _id: new ObjectId(),
        supplier: supplier._id,
        category: category,
        description: `${category.charAt(0).toUpperCase() + category.slice(1)} expense for ${supplier.fullName}`,
        amount: Math.floor(Math.random() * 500) + 50, // 50-550
        currency: 'ILS',
        date: new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000), // Last 90 days
        receiptUrl: Math.random() > 0.7 ? `receipt-${i + 1}.pdf` : undefined,
        notes: Math.random() > 0.6 ? 'Additional notes for this expense' : undefined,
        isRecurring: Math.random() > 0.8,
        recurringInterval: Math.random() > 0.8 ? 30 : undefined, // Monthly
        createdAt: new Date(),
        updatedAt: new Date()
      };

      expenses.push(expense);
    }
  }

  await db.collection(COLLECTIONS.EXPENSE).insertMany(expenses);
  console.log(`✅ Created ${expenses.length} expense records`);
  return expenses;
}

async function main() {
  let client;

  try {
    console.log('🚀 Starting comprehensive data seeding...\n');

    // Connect to database
    client = await connectToDatabase();
    const db = client.db(DB_NAME);

    // Clear existing data
    await clearDatabase(db);

    // Create data in order of dependencies
    console.log('\n📊 Creating core data...');
    const countries = await createCountries(db);
    const locations = await createLocations(db, countries);
    const { adminUsers, supplierUsers, customerUsers, allUsers } = await createUsers(db);

    console.log('\n🏪 Creating business data...');
    const dresses = await createDresses(db, supplierUsers, locations);
    const bookings = await createBookings(db, dresses, supplierUsers, customerUsers, locations);

    console.log('\n⚙️ Creating supporting data...');
    const accessorySettings = await createAccessorySettings(db, supplierUsers);
    const notifications = await createNotifications(db, allUsers);
    const revenues = await createRevenue(db, supplierUsers, bookings);
    const expenses = await createExpenses(db, supplierUsers);

    console.log('\n🎉 Data seeding completed successfully!');
    console.log('📊 Summary:');
    console.log(`   - Countries: ${countries.length}`);
    console.log(`   - Locations: ${locations.length}`);
    console.log(`   - Users: ${allUsers.length} (${adminUsers.length} admins, ${supplierUsers.length} suppliers, ${customerUsers.length} customers)`);
    console.log(`   - Dresses: ${dresses.length}`);
    console.log(`   - Bookings: ${bookings.length}`);
    console.log(`   - Accessory Settings: ${accessorySettings.length}`);
    console.log(`   - Notifications: ${notifications.length}`);
    console.log(`   - Revenue Records: ${revenues.length}`);
    console.log(`   - Expense Records: ${expenses.length}`);

  } catch (error) {
    console.error('❌ Error during data seeding:', error);
    process.exit(1);
  } finally {
    if (client) {
      await client.close();
      console.log('🔌 Database connection closed');
    }
  }
}

async function checkCollections() {
  let client;

  try {
    console.log('📊 Checking all collections...\n');

    client = await connectToDatabase();
    const db = client.db(DB_NAME);

    const collections = await db.listCollections().toArray();
    console.log('📊 All collections in database:');

    const collectionStats = [];
    for (const col of collections) {
      const count = await db.collection(col.name).countDocuments();
      collectionStats.push({ name: col.name, count });
      console.log(`   - ${col.name}: ${count} documents`);
    }

    // Check for empty collections
    const emptyCollections = collectionStats.filter(c => c.count === 0);
    console.log('\n🗑️ Empty collections (candidates for removal):');
    if (emptyCollections.length === 0) {
      console.log('   - None found');
    } else {
      emptyCollections.forEach(col => console.log(`   - ${col.name}`));
    }

    // Show collections with data
    const populatedCollections = collectionStats.filter(c => c.count > 0);
    console.log('\n✅ Collections with data:');
    populatedCollections.forEach(col => console.log(`   - ${col.name}: ${col.count} documents`));

  } catch (error) {
    console.error('❌ Error checking collections:', error);
  } finally {
    if (client) {
      await client.close();
    }
  }
}

async function cleanUnusedCollections() {
  let client;

  try {
    console.log('🧹 Cleaning unused collections...\n');

    client = await connectToDatabase();
    const db = client.db(DB_NAME);

    const collections = await db.listCollections().toArray();
    const emptyCollections = [];

    for (const col of collections) {
      const count = await db.collection(col.name).countDocuments();
      if (count === 0) {
        emptyCollections.push(col.name);
      }
    }

    if (emptyCollections.length === 0) {
      console.log('✅ No empty collections found');
      return;
    }

    console.log(`🗑️ Found ${emptyCollections.length} empty collections to remove:`);
    emptyCollections.forEach(name => console.log(`   - ${name}`));

    for (const collectionName of emptyCollections) {
      await db.collection(collectionName).drop();
      console.log(`✅ Dropped collection: ${collectionName}`);
    }

    console.log(`\n🎉 Cleanup completed! Removed ${emptyCollections.length} empty collections`);

  } catch (error) {
    console.error('❌ Error cleaning collections:', error);
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
    checkCollections();
  } else if (command === 'clean') {
    cleanUnusedCollections();
  } else {
    main();
  }
}

module.exports = { main, checkCollections, cleanUnusedCollections };
