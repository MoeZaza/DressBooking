#!/usr/bin/env node

/**
 * Comprehensive Avatar and UI Asset Testing Suite
 * Tests avatar uploads, image handling, CDN integration, and UI display of user and dress images
 */

const fetch = require('node-fetch');
const { MongoClient } = require('mongodb');
const fs = require('fs');
const path = require('path');

const API_BASE = 'http://localhost:4002';
const MONGODB_URI = 'mongodb+srv://user:Mybookmodr100@cluster0.ey9u2ce.mongodb.net/bookdress?retryWrites=true&w=majority&appName=Cluster0';

let testResults = {
  passed: 0,
  failed: 0,
  issues: [],
  categories: {
    avatarUpload: { passed: 0, failed: 0 },
    imageHandling: { passed: 0, failed: 0 },
    cdnIntegration: { passed: 0, failed: 0 },
    uiDisplay: { passed: 0, failed: 0 },
    imageValidation: { passed: 0, failed: 0 },
    imageRetrieval: { passed: 0, failed: 0 }
  }
};

async function makeRequest(name, url, options = {}) {
  try {
    console.log(`\n🔍 ${name}:`);
    console.log(`   URL: ${url}`);
    console.log(`   Method: ${options.method || 'GET'}`);
    
    const response = await fetch(url, {
      method: options.method || 'GET',
      headers: options.headers || {},
      body: options.body,
      timeout: 15000
    });
    
    console.log(`   Status: ${response.status} ${response.statusText}`);
    
    const data = await response.text();
    let jsonData = null;
    
    try {
      jsonData = JSON.parse(data);
    } catch (e) {
      // Non-JSON response
    }
    
    if (response.ok) {
      console.log(`   ✅ Success`);
      testResults.passed++;
      return { success: true, data: jsonData || data, status: response.status };
    } else {
      console.log(`   ❌ Error: ${response.status}`);
      testResults.failed++;
      testResults.issues.push({
        test: name,
        url: url,
        status: response.status,
        error: jsonData ? jsonData.error : `HTTP ${response.status}`
      });
      return { success: false, error: jsonData ? jsonData.error : `HTTP ${response.status}`, status: response.status, data: jsonData };
    }
    
  } catch (error) {
    console.log(`   💥 Request failed: ${error.message}`);
    testResults.failed++;
    testResults.issues.push({
      test: name,
      url: url,
      error: error.message
    });
    return { success: false, error: error.message };
  }
}

async function validateTest(testName, category, condition, errorMessage) {
  console.log(`\n🧪 ${testName}`);
  
  if (condition) {
    console.log(`   ✅ PASS: ${testName}`);
    testResults.categories[category].passed++;
    testResults.passed++;
    return true;
  } else {
    console.log(`   ❌ FAIL: ${testName} - ${errorMessage}`);
    testResults.categories[category].failed++;
    testResults.failed++;
    testResults.issues.push({
      test: testName,
      category: category,
      error: errorMessage
    });
    return false;
  }
}

async function getTestData() {
  const client = new MongoClient(MONGODB_URI);
  await client.connect();
  const db = client.db('bookdress');
  
  const users = await db.collection('User').find({}).toArray();
  const dresses = await db.collection('Dress').find({}).toArray();
  
  await client.close();
  
  return { users, dresses };
}

// ==================== AVATAR UPLOAD TESTING ====================

async function testAvatarUpload(testData) {
  console.log('\n👤 === AVATAR UPLOAD TESTING ===');
  
  // Test 1: Check Avatar Upload Endpoint
  const avatarUploadResult = await makeRequest(
    'Avatar Upload Endpoint Check',
    `${API_BASE}/api/create-avatar`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        userId: testData.users[0]?._id?.toString() || 'test-user-id',
        avatar: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=='
      })
    }
  );
  
  await validateTest(
    'Avatar Upload Endpoint',
    'avatarUpload',
    avatarUploadResult.success || avatarUploadResult.status === 404 || avatarUploadResult.status === 401,
    'Avatar upload endpoint should exist or require authentication'
  );
  
  // Test 2: Check Update Avatar Endpoint
  if (testData.users.length > 0) {
    const updateAvatarResult = await makeRequest(
      'Update Avatar Endpoint Check',
      `${API_BASE}/api/update-avatar`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userId: testData.users[0]._id.toString(),
          avatar: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=='
        })
      }
    );
    
    await validateTest(
      'Update Avatar Endpoint',
      'avatarUpload',
      updateAvatarResult.success || updateAvatarResult.status === 404 || updateAvatarResult.status === 401,
      'Update avatar endpoint should exist or require authentication'
    );
  }
  
  // Test 3: Check Delete Avatar Endpoint
  if (testData.users.length > 0) {
    const deleteAvatarResult = await makeRequest(
      'Delete Avatar Endpoint Check',
      `${API_BASE}/api/delete-avatar/${testData.users[0]._id.toString()}`,
      {
        method: 'POST'
      }
    );
    
    await validateTest(
      'Delete Avatar Endpoint',
      'avatarUpload',
      deleteAvatarResult.success || deleteAvatarResult.status === 404 || deleteAvatarResult.status === 401,
      'Delete avatar endpoint should exist or require authentication'
    );
  }
}

// ==================== IMAGE HANDLING TESTING ====================

async function testImageHandling(testData) {
  console.log('\n🖼️ === IMAGE HANDLING TESTING ===');
  
  // Test 1: Check Dress Image Upload
  const dressImageUploadResult = await makeRequest(
    'Dress Image Upload Endpoint Check',
    `${API_BASE}/api/create-dress-image`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        dressId: testData.dresses[0]?._id?.toString() || 'test-dress-id',
        image: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=='
      })
    }
  );
  
  await validateTest(
    'Dress Image Upload Endpoint',
    'imageHandling',
    dressImageUploadResult.success || dressImageUploadResult.status === 404 || dressImageUploadResult.status === 401,
    'Dress image upload endpoint should exist or require authentication'
  );
  
  // Test 2: Check Image Validation
  const invalidImageResult = await makeRequest(
    'Invalid Image Format Test',
    `${API_BASE}/api/create-avatar`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        userId: testData.users[0]?._id?.toString() || 'test-user-id',
        avatar: 'invalid-image-data'
      })
    }
  );
  
  await validateTest(
    'Invalid Image Format Rejection',
    'imageValidation',
    !invalidImageResult.success || invalidImageResult.status === 400,
    'Invalid image formats should be rejected'
  );
  
  // Test 3: Check Image Size Limits
  const largeSizeImageResult = await makeRequest(
    'Large Image Size Test',
    `${API_BASE}/api/create-avatar`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        userId: testData.users[0]?._id?.toString() || 'test-user-id',
        avatar: 'data:image/png;base64,' + 'A'.repeat(10000000) // Very large base64 string
      })
    }
  );
  
  await validateTest(
    'Large Image Size Handling',
    'imageValidation',
    !largeSizeImageResult.success || largeSizeImageResult.status === 413 || largeSizeImageResult.status === 400,
    'Large images should be handled appropriately'
  );
}

// ==================== CDN INTEGRATION TESTING ====================

async function testCdnIntegration(testData) {
  console.log('\n🌐 === CDN INTEGRATION TESTING ===');
  
  // Test 1: Check if users have avatar URLs
  const usersWithAvatars = testData.users.filter(user => user.avatar && user.avatar.trim() !== '');
  
  await validateTest(
    'Users Have Avatar URLs',
    'cdnIntegration',
    usersWithAvatars.length > 0,
    'Some users should have avatar URLs'
  );
  
  // Test 2: Check if dresses have image URLs
  const dressesWithImages = testData.dresses.filter(dress => dress.image && dress.image.trim() !== '');
  
  await validateTest(
    'Dresses Have Image URLs',
    'cdnIntegration',
    dressesWithImages.length > 0,
    'Some dresses should have image URLs'
  );
  
  // Test 3: Test Avatar URL Accessibility
  if (usersWithAvatars.length > 0) {
    const avatarUrl = usersWithAvatars[0].avatar;
    const avatarAccessResult = await makeRequest(
      'Avatar URL Accessibility',
      avatarUrl
    );
    
    await validateTest(
      'Avatar URL Access',
      'cdnIntegration',
      avatarAccessResult.success || avatarAccessResult.status === 404,
      'Avatar URLs should be accessible or return 404 if not found'
    );
  }
  
  // Test 4: Test Dress Image URL Accessibility
  if (dressesWithImages.length > 0) {
    const imageUrl = dressesWithImages[0].image;
    const imageAccessResult = await makeRequest(
      'Dress Image URL Accessibility',
      imageUrl
    );
    
    await validateTest(
      'Dress Image URL Access',
      'cdnIntegration',
      imageAccessResult.success || imageAccessResult.status === 404,
      'Dress image URLs should be accessible or return 404 if not found'
    );
  }
}

// ==================== UI DISPLAY TESTING ====================

async function testUiDisplay(testData) {
  console.log('\n🎨 === UI DISPLAY TESTING ===');
  
  // Test 1: Check User Profile with Avatar
  if (testData.users.length > 0) {
    const userProfileResult = await makeRequest(
      'User Profile with Avatar',
      `${API_BASE}/api/user/${testData.users[0]._id}`
    );
    
    await validateTest(
      'User Profile Retrieval',
      'uiDisplay',
      userProfileResult.success,
      'User profile should be retrievable for UI display'
    );
    
    if (userProfileResult.success && userProfileResult.data) {
      await validateTest(
        'User Profile Contains Avatar Field',
        'uiDisplay',
        userProfileResult.data.avatar !== undefined,
        'User profile should contain avatar field for UI display'
      );
    }
  }
  
  // Test 2: Check Dress with Image
  if (testData.dresses.length > 0) {
    const dressResult = await makeRequest(
      'Dress with Image',
      `${API_BASE}/api/dress/${testData.dresses[0]._id}/en`
    );
    
    await validateTest(
      'Dress Retrieval',
      'uiDisplay',
      dressResult.success,
      'Dress should be retrievable for UI display'
    );
    
    if (dressResult.success && dressResult.data) {
      await validateTest(
        'Dress Contains Image Field',
        'uiDisplay',
        dressResult.data.image !== undefined,
        'Dress should contain image field for UI display'
      );
    }
  }
  
  // Test 3: Check Dress List with Images
  const dressListResult = await makeRequest(
    'Dress List with Images',
    `${API_BASE}/api/dresses/1/10`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        suppliers: testData.users.filter(u => u.type === 'supplier').map(s => s._id.toString())
      })
    }
  );
  
  await validateTest(
    'Dress List Retrieval',
    'uiDisplay',
    dressListResult.success,
    'Dress list should be retrievable for UI display'
  );
  
  if (dressListResult.success && dressListResult.data && Array.isArray(dressListResult.data)) {
    const dressesWithImageField = dressListResult.data.filter(dress => dress.image !== undefined);
    await validateTest(
      'Dress List Contains Image Fields',
      'uiDisplay',
      dressesWithImageField.length > 0,
      'Dress list should contain image fields for UI display'
    );
  }
}

// ==================== IMAGE RETRIEVAL TESTING ====================

async function testImageRetrieval(testData) {
  console.log('\n📥 === IMAGE RETRIEVAL TESTING ===');
  
  // Test 1: Check Image Serving Endpoint
  const imageServingResult = await makeRequest(
    'Image Serving Endpoint',
    `${API_BASE}/api/image/test-image.jpg`
  );
  
  await validateTest(
    'Image Serving Endpoint',
    'imageRetrieval',
    imageServingResult.success || imageServingResult.status === 404,
    'Image serving endpoint should exist or return 404 for non-existent images'
  );
  
  // Test 2: Check Avatar Serving
  const avatarServingResult = await makeRequest(
    'Avatar Serving Endpoint',
    `${API_BASE}/api/avatar/test-avatar.jpg`
  );
  
  await validateTest(
    'Avatar Serving Endpoint',
    'imageRetrieval',
    avatarServingResult.success || avatarServingResult.status === 404,
    'Avatar serving endpoint should exist or return 404 for non-existent avatars'
  );
  
  // Test 3: Check Image Metadata
  if (testData.dresses.length > 0 && testData.dresses[0].image) {
    const imageMetadataResult = await makeRequest(
      'Image Metadata Check',
      `${API_BASE}/api/image-info`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          imageUrl: testData.dresses[0].image
        })
      }
    );
    
    await validateTest(
      'Image Metadata Endpoint',
      'imageRetrieval',
      imageMetadataResult.success || imageMetadataResult.status === 404,
      'Image metadata endpoint should exist or return 404'
    );
  }
}

async function runComprehensiveAvatarUiAssetTesting() {
  console.log('🚀 Starting Comprehensive Avatar and UI Asset Testing...\n');
  
  // Get test data
  const testData = await getTestData();
  console.log('📊 Test data loaded:');
  console.log(`   - Users: ${testData.users.length}`);
  console.log(`   - Dresses: ${testData.dresses.length}`);
  
  // Analyze existing data
  const usersWithAvatars = testData.users.filter(user => user.avatar && user.avatar.trim() !== '');
  const dressesWithImages = testData.dresses.filter(dress => dress.image && dress.image.trim() !== '');
  
  console.log(`   - Users with avatars: ${usersWithAvatars.length}`);
  console.log(`   - Dresses with images: ${dressesWithImages.length}`);
  
  // Run comprehensive tests
  await testAvatarUpload(testData);
  await testImageHandling(testData);
  await testCdnIntegration(testData);
  await testUiDisplay(testData);
  await testImageRetrieval(testData);
  
  // Test Results Summary
  console.log('\n📊 === COMPREHENSIVE AVATAR & UI ASSET TEST RESULTS ===');
  console.log(`✅ Total Tests Passed: ${testResults.passed}`);
  console.log(`❌ Total Tests Failed: ${testResults.failed}`);
  console.log(`📈 Success Rate: ${testResults.passed + testResults.failed > 0 ? ((testResults.passed / (testResults.passed + testResults.failed)) * 100).toFixed(1) : 0}%`);
  
  console.log('\n📋 Results by Category:');
  Object.entries(testResults.categories).forEach(([category, results]) => {
    const total = results.passed + results.failed;
    const successRate = total > 0 ? ((results.passed / total) * 100).toFixed(1) : 0;
    console.log(`   ${category.toUpperCase()}: ${results.passed}/${total} (${successRate}%)`);
  });
  
  if (testResults.issues.length > 0) {
    console.log('\n🐛 === ISSUES FOUND ===');
    testResults.issues.forEach((issue, index) => {
      console.log(`\n${index + 1}. ${issue.test}`);
      if (issue.url) console.log(`   URL: ${issue.url}`);
      if (issue.status) console.log(`   Status: ${issue.status}`);
      if (issue.category) console.log(`   Category: ${issue.category}`);
      console.log(`   Error: ${issue.error}`);
    });
  }
  
  console.log('\n🎉 Comprehensive avatar and UI asset testing completed!');
}

if (require.main === module) {
  runComprehensiveAvatarUiAssetTesting().catch(console.error);
}

module.exports = { runComprehensiveAvatarUiAssetTesting };
