#!/usr/bin/env node

/**
 * Debug Dress Search Issue
 * Investigates the 500 error in dress search with type filtering
 */

const fetch = require('node-fetch');

const API_BASE = 'http://localhost:4002';

async function debugDressSearch() {
  console.log('🔍 Debugging Dress Search Issue...\n');
  
  // Test 1: Basic dress search (no filters)
  console.log('Test 1: Basic dress search (no filters)');
  try {
    const response1 = await fetch(`${API_BASE}/api/frontend-dresses/1/10`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({})
    });
    
    console.log(`Status: ${response1.status}`);
    if (response1.ok) {
      const data1 = await response1.json();
      console.log(`✅ Success: Found ${data1.docs ? data1.docs.length : 'unknown'} dresses`);
    } else {
      const error1 = await response1.text();
      console.log(`❌ Error: ${error1}`);
    }
  } catch (error) {
    console.log(`💥 Request failed: ${error.message}`);
  }
  
  // Test 2: Dress search with valid dress type
  console.log('\nTest 2: Dress search with valid dress type (evening)');
  try {
    const response2 = await fetch(`${API_BASE}/api/frontend-dresses/1/10`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        suppliers: [],
        location: null,
        dressType: ['evening'],
        includeAlreadyBookedDresses: true,
        includeComingSoonDresses: true
      })
    });
    
    console.log(`Status: ${response2.status}`);
    if (response2.ok) {
      const data2 = await response2.json();
      console.log(`✅ Success: Found ${data2.docs ? data2.docs.length : 'unknown'} evening dresses`);
    } else {
      const error2 = await response2.text();
      console.log(`❌ Error: ${error2}`);
    }
  } catch (error) {
    console.log(`💥 Request failed: ${error.message}`);
  }
  
  // Test 3: Dress search with different dress type
  console.log('\nTest 3: Dress search with different dress type (wedding)');
  try {
    const response3 = await fetch(`${API_BASE}/api/frontend-dresses/1/10`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        suppliers: [],
        location: null,
        dressType: ['wedding'],
        includeAlreadyBookedDresses: true,
        includeComingSoonDresses: true
      })
    });
    
    console.log(`Status: ${response3.status}`);
    if (response3.ok) {
      const data3 = await response3.json();
      console.log(`✅ Success: Found ${data3.docs ? data3.docs.length : 'unknown'} wedding dresses`);
    } else {
      const error3 = await response3.text();
      console.log(`❌ Error: ${error3}`);
    }
  } catch (error) {
    console.log(`💥 Request failed: ${error.message}`);
  }
  
  // Test 4: Check what dress types exist in the database
  console.log('\nTest 4: Check available dress types');
  try {
    const response4 = await fetch(`${API_BASE}/api/frontend-dresses/1/100`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({})
    });
    
    if (response4.ok) {
      const data4 = await response4.json();
      const dresses = data4.docs || [];
      const dressTypes = [...new Set(dresses.map(dress => dress.type))];
      console.log(`Available dress types: ${dressTypes.join(', ')}`);
      
      // Count by type
      const typeCounts = {};
      dresses.forEach(dress => {
        typeCounts[dress.type] = (typeCounts[dress.type] || 0) + 1;
      });
      
      console.log('Dress type counts:');
      Object.entries(typeCounts).forEach(([type, count]) => {
        console.log(`  - ${type}: ${count}`);
      });
    } else {
      console.log(`❌ Could not fetch dress types`);
    }
  } catch (error) {
    console.log(`💥 Request failed: ${error.message}`);
  }
  
  console.log('\n🎉 Debug completed!');
}

if (require.main === module) {
  debugDressSearch().catch(console.error);
}

module.exports = { debugDressSearch };
