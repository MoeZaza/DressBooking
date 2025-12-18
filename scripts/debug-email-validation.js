#!/usr/bin/env node

/**
 * Debug Email Validation Issue
 * Tests the email validation endpoint to understand the 400 error
 */

const fetch = require('node-fetch');

const API_BASE = 'http://localhost:4002';

async function debugEmailValidation() {
  console.log('🔍 Debugging Email Validation Issue...\n');
  
  // Test 1: Basic email validation
  console.log('Test 1: Basic email validation');
  try {
    const response1 = await fetch(`${API_BASE}/api/validate-email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'test@example.com'
      })
    });
    
    console.log(`Status: ${response1.status}`);
    const text1 = await response1.text();
    console.log(`Response: ${text1}`);
    
    if (response1.ok) {
      console.log(`✅ Success`);
    } else {
      console.log(`❌ Error: ${text1}`);
    }
  } catch (error) {
    console.log(`💥 Request failed: ${error.message}`);
  }
  
  // Test 2: Email validation with appType
  console.log('\nTest 2: Email validation with appType');
  try {
    const response2 = await fetch(`${API_BASE}/api/validate-email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'test@example.com',
        appType: 'frontend'
      })
    });
    
    console.log(`Status: ${response2.status}`);
    const text2 = await response2.text();
    console.log(`Response: ${text2}`);
    
    if (response2.ok) {
      console.log(`✅ Success`);
    } else {
      console.log(`❌ Error: ${text2}`);
    }
  } catch (error) {
    console.log(`💥 Request failed: ${error.message}`);
  }
  
  // Test 3: Email validation with different appType
  console.log('\nTest 3: Email validation with backend appType');
  try {
    const response3 = await fetch(`${API_BASE}/api/validate-email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'test@example.com',
        appType: 'backend'
      })
    });
    
    console.log(`Status: ${response3.status}`);
    const text3 = await response3.text();
    console.log(`Response: ${text3}`);
    
    if (response3.ok) {
      console.log(`✅ Success`);
    } else {
      console.log(`❌ Error: ${text3}`);
    }
  } catch (error) {
    console.log(`💥 Request failed: ${error.message}`);
  }
  
  // Test 4: Test with existing email
  console.log('\nTest 4: Test with existing email (should return 204)');
  try {
    const response4 = await fetch(`${API_BASE}/api/validate-email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@bookdress.com', // This should exist
        appType: 'frontend'
      })
    });
    
    console.log(`Status: ${response4.status}`);
    const text4 = await response4.text();
    console.log(`Response: ${text4}`);
    
    if (response4.status === 204) {
      console.log(`✅ Success: Email exists (expected 204)`);
    } else if (response4.status === 200) {
      console.log(`✅ Success: Email available (expected 200)`);
    } else {
      console.log(`❌ Error: ${text4}`);
    }
  } catch (error) {
    console.log(`💥 Request failed: ${error.message}`);
  }
  
  // Test 5: Test with invalid email format
  console.log('\nTest 5: Test with invalid email format');
  try {
    const response5 = await fetch(`${API_BASE}/api/validate-email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'invalid-email',
        appType: 'frontend'
      })
    });
    
    console.log(`Status: ${response5.status}`);
    const text5 = await response5.text();
    console.log(`Response: ${text5}`);
    
    if (response5.status === 400) {
      console.log(`✅ Success: Invalid email rejected (expected 400)`);
    } else {
      console.log(`❌ Unexpected: ${text5}`);
    }
  } catch (error) {
    console.log(`💥 Request failed: ${error.message}`);
  }
  
  // Test 6: Test with empty body
  console.log('\nTest 6: Test with empty body');
  try {
    const response6 = await fetch(`${API_BASE}/api/validate-email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({})
    });
    
    console.log(`Status: ${response6.status}`);
    const text6 = await response6.text();
    console.log(`Response: ${text6}`);
    
    if (response6.status === 400) {
      console.log(`✅ Success: Empty body rejected (expected 400)`);
    } else {
      console.log(`❌ Unexpected: ${text6}`);
    }
  } catch (error) {
    console.log(`💥 Request failed: ${error.message}`);
  }
  
  console.log('\n🎉 Debug completed!');
}

if (require.main === module) {
  debugEmailValidation().catch(console.error);
}

module.exports = { debugEmailValidation };
