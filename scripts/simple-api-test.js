#!/usr/bin/env node

const axios = require('axios');

async function testAPI() {
  try {
    console.log('Testing basic API call...');
    const response = await axios.post('http://localhost:4002/api/frontend-dresses/1/5', {});
    console.log('Success! Status:', response.status);
    console.log('Data structure:', {
      totalDocs: response.data.totalDocs,
      docs: response.data.docs?.length,
      hasNextPage: response.data.hasNextPage
    });
    
    if (response.data.docs && response.data.docs.length > 0) {
      console.log('Sample dress:', {
        name: response.data.docs[0].name,
        type: response.data.docs[0].type,
        available: response.data.docs[0].available
      });
    }
    
    console.log('\nTesting keyword search...');
    const keywordResponse = await axios.post('http://localhost:4002/api/frontend-dresses/1/5?s=dress', {});
    console.log('Keyword search success! Status:', keywordResponse.status);
    console.log('Found:', keywordResponse.data.docs?.length, 'dresses');
    
  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
  }
}

testAPI();
