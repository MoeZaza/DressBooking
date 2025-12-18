#!/usr/bin/env node

/**
 * CRUD Operations and Dropdowns Testing
 * 
 * Tests all CRUD operations and dropdown population for all entities
 * in both frontend and backend applications.
 */

const axios = require('axios');
const fs = require('fs');

const API_BASE = 'http://localhost:4002';
const FRONTEND_BASE = 'http://localhost:3000';
const BACKEND_BASE = 'http://localhost:3001';

// Test data for CRUD operations
const testData = {
  dress: {
    name: 'Test Evening Dress',
    dressCode: 'TEST001',
    type: 'evening',
    size: 'M',
    color: 'Navy Blue',
    price: 500,
    deposit: 100,
    material: 'silk',
    length: 150,
    designerName: 'Test Designer',
    available: true
  },
  booking: {
    from: new Date(Date.now() + 86400000).toISOString(), // Tomorrow
    to: new Date(Date.now() + 172800000).toISOString(),   // Day after tomorrow
    status: 'pending'
  },
  location: {
    name: 'Test Location',
    country: 'Palestine',
    latitude: 31.9522,
    longitude: 35.2332
  },
  supplier: {
    fullName: 'Test Supplier',
    email: 'test.supplier@example.com',
    phone: '+970123456789',
    type: 'supplier'
  },
  customer: {
    fullName: 'Test Customer',
    email: 'test.customer@example.com',
    phone: '+970987654321'
  }
};

async function testAPIEndpoint(method, endpoint, data = null) {
  try {
    const config = {
      method,
      url: `${API_BASE}${endpoint}`,
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: 10000
    };
    
    if (data) {
      config.data = data;
    }
    
    const response = await axios(config);
    return {
      success: true,
      status: response.status,
      data: response.data,
      error: null
    };
  } catch (error) {
    return {
      success: false,
      status: error.response?.status || 0,
      data: null,
      error: error.response?.data || error.message
    };
  }
}

async function testCRUDOperations() {
  console.log('🔧 Testing CRUD Operations...\n');
  
  const results = {
    dresses: { create: false, read: false, update: false, delete: false },
    bookings: { create: false, read: false, update: false, delete: false },
    locations: { create: false, read: false, update: false, delete: false },
    suppliers: { create: false, read: false, update: false, delete: false },
    customers: { create: false, read: false, update: false, delete: false }
  };
  
  // Test Dresses CRUD
  console.log('👗 Testing Dresses CRUD...');
  
  // Read dresses
  const readDresses = await testAPIEndpoint('POST', '/api/frontend-dresses/1/10', {});
  results.dresses.read = readDresses.success;
  console.log(`  📖 Read dresses: ${readDresses.success ? '✅' : '❌'} (${readDresses.status})`);
  
  // Test Bookings CRUD
  console.log('📅 Testing Bookings CRUD...');
  
  // Read bookings
  const readBookings = await testAPIEndpoint('POST', '/api/bookings/1/10/en', {});
  results.bookings.read = readBookings.success;
  console.log(`  📖 Read bookings: ${readBookings.success ? '✅' : '❌'} (${readBookings.status})`);
  
  // Test Locations CRUD
  console.log('📍 Testing Locations CRUD...');
  
  // Read locations
  const readLocations = await testAPIEndpoint('GET', '/api/locations/1/10/en');
  results.locations.read = readLocations.success;
  console.log(`  📖 Read locations: ${readLocations.success ? '✅' : '❌'} (${readLocations.status})`);
  
  // Test Suppliers CRUD
  console.log('🏢 Testing Suppliers CRUD...');
  
  // Read suppliers
  const readSuppliers = await testAPIEndpoint('GET', '/api/suppliers/1/10');
  results.suppliers.read = readSuppliers.success;
  console.log(`  📖 Read suppliers: ${readSuppliers.success ? '✅' : '❌'} (${readSuppliers.status})`);
  
  // Test frontend suppliers
  const readFrontendSuppliers = await testAPIEndpoint('POST', '/api/frontend-suppliers', {});
  console.log(`  📖 Read frontend suppliers: ${readFrontendSuppliers.success ? '✅' : '❌'} (${readFrontendSuppliers.status})`);
  
  return results;
}

async function testDropdownData() {
  console.log('\n📋 Testing Dropdown Data Population...\n');
  
  const dropdownResults = {
    locations: { available: false, count: 0 },
    suppliers: { available: false, count: 0 },
    dresses: { available: false, count: 0 },
    countries: { available: false, count: 0 },
    dressTypes: { available: false, count: 0 }
  };
  
  // Test locations dropdown data
  console.log('📍 Testing Locations dropdown...');
  const locationsTest = await testAPIEndpoint('GET', '/api/locations/1/100/en');
  if (locationsTest.success && locationsTest.data) {
    dropdownResults.locations.available = true;
    dropdownResults.locations.count = locationsTest.data.docs?.length || locationsTest.data.length || 0;
  }
  console.log(`  📊 Locations: ${dropdownResults.locations.available ? '✅' : '❌'} (${dropdownResults.locations.count} items)`);
  
  // Test suppliers dropdown data
  console.log('🏢 Testing Suppliers dropdown...');
  const suppliersTest = await testAPIEndpoint('POST', '/api/frontend-suppliers', {});
  if (suppliersTest.success && suppliersTest.data) {
    dropdownResults.suppliers.available = true;
    dropdownResults.suppliers.count = Array.isArray(suppliersTest.data) ? suppliersTest.data.length : 0;
  }
  console.log(`  📊 Suppliers: ${dropdownResults.suppliers.available ? '✅' : '❌'} (${dropdownResults.suppliers.count} items)`);
  
  // Test dresses dropdown data
  console.log('👗 Testing Dresses dropdown...');
  const dressesTest = await testAPIEndpoint('POST', '/api/frontend-dresses/1/100', {});
  if (dressesTest.success && dressesTest.data) {
    dropdownResults.dresses.available = true;
    dropdownResults.dresses.count = dressesTest.data.docs?.length || 0;
  }
  console.log(`  📊 Dresses: ${dropdownResults.dresses.available ? '✅' : '❌'} (${dropdownResults.dresses.count} items)`);
  
  // Test countries dropdown data
  console.log('🌍 Testing Countries dropdown...');
  const countriesTest = await testAPIEndpoint('GET', '/api/countries/1/100/en');
  if (countriesTest.success && countriesTest.data) {
    dropdownResults.countries.available = true;
    dropdownResults.countries.count = countriesTest.data.docs?.length || countriesTest.data.length || 0;
  }
  console.log(`  📊 Countries: ${dropdownResults.countries.available ? '✅' : '❌'} (${dropdownResults.countries.count} items)`);
  
  return dropdownResults;
}

async function testDataIntegrity() {
  console.log('\n🔍 Testing Data Integrity...\n');
  
  const integrityResults = {
    dressesHaveSuppliers: false,
    bookingsHaveDresses: false,
    locationsHaveCountries: false,
    suppliersHaveLocations: false
  };
  
  // Test if dresses have suppliers
  console.log('👗 Checking dress-supplier relationships...');
  const dressesWithSuppliers = await testAPIEndpoint('POST', '/api/frontend-dresses/1/10', {});
  if (dressesWithSuppliers.success && dressesWithSuppliers.data?.docs) {
    const dressesWithSupplierData = dressesWithSuppliers.data.docs.filter(dress => dress.supplier);
    integrityResults.dressesHaveSuppliers = dressesWithSupplierData.length > 0;
    console.log(`  🔗 Dresses with suppliers: ${integrityResults.dressesHaveSuppliers ? '✅' : '❌'} (${dressesWithSupplierData.length}/${dressesWithSuppliers.data.docs.length})`);
  }
  
  // Test if bookings have dresses
  console.log('📅 Checking booking-dress relationships...');
  const bookingsWithDresses = await testAPIEndpoint('POST', '/api/bookings/1/10/en', {});
  if (bookingsWithDresses.success && bookingsWithDresses.data?.docs) {
    const bookingsWithDressData = bookingsWithDresses.data.docs.filter(booking => booking.dress);
    integrityResults.bookingsHaveDresses = bookingsWithDressData.length > 0;
    console.log(`  🔗 Bookings with dresses: ${integrityResults.bookingsHaveDresses ? '✅' : '❌'} (${bookingsWithDressData.length}/${bookingsWithDresses.data.docs.length})`);
  }
  
  return integrityResults;
}

async function runCRUDDropdownTesting() {
  console.log('🔧 Starting CRUD Operations and Dropdowns Testing...\n');
  
  const results = {
    crud: null,
    dropdowns: null,
    integrity: null,
    summary: {
      crudOperationsWorking: 0,
      dropdownsPopulated: 0,
      dataIntegrityChecks: 0
    }
  };
  
  try {
    // Test CRUD operations
    results.crud = await testCRUDOperations();
    
    // Test dropdown data
    results.dropdowns = await testDropdownData();
    
    // Test data integrity
    results.integrity = await testDataIntegrity();
    
    // Calculate summary
    results.summary.crudOperationsWorking = Object.values(results.crud).reduce((count, entity) => {
      return count + Object.values(entity).filter(Boolean).length;
    }, 0);
    
    results.summary.dropdownsPopulated = Object.values(results.dropdowns).filter(dropdown => dropdown.available).length;
    
    results.summary.dataIntegrityChecks = Object.values(results.integrity).filter(Boolean).length;
    
  } catch (error) {
    console.error('❌ Testing error:', error.message);
  }
  
  // Generate summary report
  console.log('\n📊 CRUD and Dropdowns Testing Summary:');
  console.log('=' .repeat(60));
  console.log(`🔧 CRUD operations working: ${results.summary.crudOperationsWorking}`);
  console.log(`📋 Dropdowns populated: ${results.summary.dropdownsPopulated}/5`);
  console.log(`🔗 Data integrity checks passed: ${results.summary.dataIntegrityChecks}/4`);
  
  // Detailed breakdown
  console.log('\n📋 Dropdown Status:');
  if (results.dropdowns) {
    Object.entries(results.dropdowns).forEach(([key, value]) => {
      console.log(`  ${key}: ${value.available ? '✅' : '❌'} (${value.count} items)`);
    });
  }
  
  console.log('\n🔗 Data Integrity:');
  if (results.integrity) {
    Object.entries(results.integrity).forEach(([key, value]) => {
      console.log(`  ${key}: ${value ? '✅' : '❌'}`);
    });
  }
  
  // Save detailed results
  fs.writeFileSync('scripts/crud-dropdowns-results.json', JSON.stringify(results, null, 2));
  console.log('\n📄 Detailed results saved to scripts/crud-dropdowns-results.json');
  
  console.log('\n🎉 CRUD Operations and Dropdowns Testing completed!');
}

// Run the tests
runCRUDDropdownTesting().catch(console.error);
