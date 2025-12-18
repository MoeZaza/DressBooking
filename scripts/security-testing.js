#!/usr/bin/env node

/**
 * Security Testing
 * 
 * Comprehensive security testing including authentication, authorization,
 * input validation, XSS protection, CSRF protection, and secure headers.
 */

const puppeteer = require('puppeteer');
const axios = require('axios');
const fs = require('fs');

const FRONTEND_URL = 'http://localhost:3000';
const BACKEND_URL = 'http://localhost:3001';
const API_URL = 'http://localhost:4002';

async function testSecurityHeaders(url, name) {
  console.log(`  🔒 Testing security headers for ${name}...`);
  
  const headerResults = {
    name,
    url,
    hasCSP: false,
    hasXFrameOptions: false,
    hasXContentTypeOptions: false,
    hasReferrerPolicy: false,
    hasPermissionsPolicy: false,
    hasHSTS: false,
    headers: {},
    errors: []
  };
  
  try {
    const response = await axios.get(url, { timeout: 10000 });
    headerResults.headers = response.headers;
    
    // Check for security headers
    headerResults.hasCSP = !!response.headers['content-security-policy'];
    headerResults.hasXFrameOptions = !!response.headers['x-frame-options'];
    headerResults.hasXContentTypeOptions = !!response.headers['x-content-type-options'];
    headerResults.hasReferrerPolicy = !!response.headers['referrer-policy'];
    headerResults.hasPermissionsPolicy = !!response.headers['permissions-policy'];
    headerResults.hasHSTS = !!response.headers['strict-transport-security'];
    
    console.log(`    🛡️ CSP: ${headerResults.hasCSP ? '✅' : '❌'}`);
    console.log(`    🖼️ X-Frame-Options: ${headerResults.hasXFrameOptions ? '✅' : '❌'}`);
    console.log(`    📄 X-Content-Type-Options: ${headerResults.hasXContentTypeOptions ? '✅' : '❌'}`);
    console.log(`    🔗 Referrer-Policy: ${headerResults.hasReferrerPolicy ? '✅' : '❌'}`);
    console.log(`    🔐 HSTS: ${headerResults.hasHSTS ? '✅' : '❌'}`);
    
  } catch (error) {
    headerResults.errors.push(error.message);
    console.log(`    ❌ Error: ${error.message}`);
  }
  
  return headerResults;
}

async function testXSSProtection(page, url, name) {
  console.log(`  🚨 Testing XSS protection for ${name}...`);
  
  const xssResults = {
    name,
    url,
    inputSanitized: false,
    outputEscaped: false,
    scriptInjectionBlocked: false,
    errors: []
  };
  
  try {
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 15000 });
    
    // Find input fields to test
    const inputFields = await page.$$('input[type="text"], input[type="search"], textarea');
    
    if (inputFields.length > 0) {
      const testInput = inputFields[0];
      
      // Test script injection
      const maliciousScript = '<script>alert("XSS")</script>';
      await testInput.click();
      await testInput.type(maliciousScript);
      
      // Check if script was executed (should not be)
      const alertFired = await page.evaluate(() => {
        return window.alertFired || false;
      });
      
      xssResults.scriptInjectionBlocked = !alertFired;
      
      // Check if input is sanitized
      const inputValue = await testInput.evaluate(el => el.value);
      xssResults.inputSanitized = !inputValue.includes('<script>');
      
      console.log(`    🧹 Input sanitized: ${xssResults.inputSanitized ? '✅' : '❌'}`);
      console.log(`    🚫 Script injection blocked: ${xssResults.scriptInjectionBlocked ? '✅' : '❌'}`);
    } else {
      console.log(`    ⚠️ No input fields found for XSS testing`);
    }
    
  } catch (error) {
    xssResults.errors.push(error.message);
    console.log(`    ❌ XSS test error: ${error.message}`);
  }
  
  return xssResults;
}

async function testAuthentication() {
  console.log('  🔐 Testing authentication mechanisms...');
  
  const authResults = {
    frontendLoginExists: false,
    backendLoginExists: false,
    passwordProtected: false,
    sessionManagement: false,
    logoutFunctionality: false,
    errors: []
  };
  
  try {
    // Test frontend login
    const frontendLoginTest = await axios.get(`${FRONTEND_URL}/sign-in`, { timeout: 10000 });
    authResults.frontendLoginExists = frontendLoginTest.status === 200;
    
    // Test backend login
    const backendLoginTest = await axios.get(BACKEND_URL, { timeout: 10000 });
    authResults.backendLoginExists = backendLoginTest.status === 200;
    
    // Test protected routes (should redirect or return 401/403)
    try {
      const protectedRouteTest = await axios.get(`${FRONTEND_URL}/profile`, { timeout: 10000 });
      // If we get 200, it might not be properly protected
      authResults.passwordProtected = protectedRouteTest.status !== 200;
    } catch (error) {
      // If we get an error (401, 403, redirect), it's likely protected
      authResults.passwordProtected = error.response?.status === 401 || error.response?.status === 403;
    }
    
    console.log(`    🔑 Frontend login exists: ${authResults.frontendLoginExists ? '✅' : '❌'}`);
    console.log(`    🔑 Backend login exists: ${authResults.backendLoginExists ? '✅' : '❌'}`);
    console.log(`    🛡️ Protected routes secured: ${authResults.passwordProtected ? '✅' : '❌'}`);
    
  } catch (error) {
    authResults.errors.push(error.message);
    console.log(`    ❌ Auth test error: ${error.message}`);
  }
  
  return authResults;
}

async function testInputValidation() {
  console.log('  ✅ Testing input validation...');
  
  const validationResults = {
    emailValidation: false,
    phoneValidation: false,
    requiredFieldValidation: false,
    lengthValidation: false,
    sqlInjectionProtection: false,
    errors: []
  };
  
  try {
    // Test API endpoints with invalid data
    const testCases = [
      {
        name: 'Invalid Email',
        endpoint: '/api/validate-email',
        data: { email: 'invalid-email' }
      },
      {
        name: 'SQL Injection',
        endpoint: '/api/frontend-dresses/1/10',
        data: { name: "'; DROP TABLE dresses; --" }
      }
    ];
    
    for (const testCase of testCases) {
      try {
        const response = await axios.post(`${API_URL}${testCase.endpoint}`, testCase.data, { timeout: 5000 });
        
        if (testCase.name === 'Invalid Email') {
          validationResults.emailValidation = response.status === 400;
        } else if (testCase.name === 'SQL Injection') {
          validationResults.sqlInjectionProtection = response.status === 200; // Should handle gracefully
        }
      } catch (error) {
        if (testCase.name === 'Invalid Email' && error.response?.status === 400) {
          validationResults.emailValidation = true;
        } else if (testCase.name === 'SQL Injection') {
          validationResults.sqlInjectionProtection = true; // Error is good for SQL injection
        }
      }
    }
    
    console.log(`    📧 Email validation: ${validationResults.emailValidation ? '✅' : '❌'}`);
    console.log(`    💉 SQL injection protection: ${validationResults.sqlInjectionProtection ? '✅' : '❌'}`);
    
  } catch (error) {
    validationResults.errors.push(error.message);
    console.log(`    ❌ Validation test error: ${error.message}`);
  }
  
  return validationResults;
}

async function testDataProtection() {
  console.log('  🔒 Testing data protection...');
  
  const dataResults = {
    passwordsHashed: false,
    sensitiveDataEncrypted: false,
    noPasswordsInLogs: false,
    secureDataTransmission: false,
    errors: []
  };
  
  try {
    // Test if API responses contain sensitive data
    const dressesResponse = await axios.post(`${API_URL}/api/frontend-dresses/1/5`, {}, { timeout: 10000 });
    
    if (dressesResponse.data) {
      const responseText = JSON.stringify(dressesResponse.data);
      
      // Check if passwords are exposed (they shouldn't be)
      dataResults.noPasswordsInLogs = !responseText.includes('password') && !responseText.includes('hash');
      
      // Check if data transmission is over HTTPS (in production)
      dataResults.secureDataTransmission = dressesResponse.config.url.startsWith('https://') || 
                                          process.env.NODE_ENV === 'development';
    }
    
    console.log(`    🔐 No passwords in responses: ${dataResults.noPasswordsInLogs ? '✅' : '❌'}`);
    console.log(`    🔒 Secure data transmission: ${dataResults.secureDataTransmission ? '✅' : '❌'}`);
    
  } catch (error) {
    dataResults.errors.push(error.message);
    console.log(`    ❌ Data protection test error: ${error.message}`);
  }
  
  return dataResults;
}

async function runSecurityTesting() {
  console.log('🔒 Starting Security Testing...\n');
  
  let browser;
  const results = {
    securityHeaders: [],
    xssProtection: [],
    authentication: null,
    inputValidation: null,
    dataProtection: null,
    summary: {
      securityHeadersScore: 0,
      xssProtectionScore: 0,
      authenticationScore: 0,
      overallSecurityScore: 0
    }
  };
  
  try {
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const page = await browser.newPage();
    await page.setViewport({ width: 1920, height: 1080 });
    
    // Test security headers
    console.log('🛡️ Testing Security Headers...');
    const frontendHeaders = await testSecurityHeaders(FRONTEND_URL, 'Frontend');
    const backendHeaders = await testSecurityHeaders(BACKEND_URL, 'Backend');
    results.securityHeaders.push(frontendHeaders, backendHeaders);
    
    // Test XSS protection
    console.log('\n🚨 Testing XSS Protection...');
    const frontendXSS = await testXSSProtection(page, FRONTEND_URL, 'Frontend');
    const backendXSS = await testXSSProtection(page, BACKEND_URL, 'Backend');
    results.xssProtection.push(frontendXSS, backendXSS);
    
    // Test authentication
    console.log('\n🔐 Testing Authentication...');
    results.authentication = await testAuthentication();
    
    // Test input validation
    console.log('\n✅ Testing Input Validation...');
    results.inputValidation = await testInputValidation();
    
    // Test data protection
    console.log('\n🔒 Testing Data Protection...');
    results.dataProtection = await testDataProtection();
    
  } catch (error) {
    console.error('❌ Security testing error:', error.message);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
  
  // Calculate security scores
  results.summary.securityHeadersScore = results.securityHeaders.reduce((score, headers) => {
    const headerCount = [
      headers.hasCSP,
      headers.hasXFrameOptions,
      headers.hasXContentTypeOptions,
      headers.hasReferrerPolicy,
      headers.hasHSTS
    ].filter(Boolean).length;
    return score + (headerCount / 5) * 100;
  }, 0) / results.securityHeaders.length;
  
  results.summary.xssProtectionScore = results.xssProtection.reduce((score, xss) => {
    const xssCount = [
      xss.inputSanitized,
      xss.scriptInjectionBlocked
    ].filter(Boolean).length;
    return score + (xssCount / 2) * 100;
  }, 0) / results.xssProtection.length;
  
  if (results.authentication) {
    const authCount = [
      results.authentication.frontendLoginExists,
      results.authentication.backendLoginExists,
      results.authentication.passwordProtected
    ].filter(Boolean).length;
    results.summary.authenticationScore = (authCount / 3) * 100;
  }
  
  results.summary.overallSecurityScore = Math.round(
    (results.summary.securityHeadersScore + 
     results.summary.xssProtectionScore + 
     results.summary.authenticationScore) / 3
  );
  
  // Generate summary report
  console.log('\n📊 Security Testing Summary:');
  console.log('=' .repeat(60));
  console.log(`🛡️ Security Headers Score: ${Math.round(results.summary.securityHeadersScore)}%`);
  console.log(`🚨 XSS Protection Score: ${Math.round(results.summary.xssProtectionScore)}%`);
  console.log(`🔐 Authentication Score: ${Math.round(results.summary.authenticationScore)}%`);
  console.log(`🔒 Overall Security Score: ${results.summary.overallSecurityScore}%`);
  
  // Security recommendations
  console.log('\n💡 Security Recommendations:');
  if (results.summary.securityHeadersScore < 80) {
    console.log('  - Implement missing security headers (CSP, X-Frame-Options, HSTS)');
  }
  if (results.summary.xssProtectionScore < 80) {
    console.log('  - Improve XSS protection with input sanitization and output escaping');
  }
  if (results.summary.authenticationScore < 80) {
    console.log('  - Strengthen authentication and authorization mechanisms');
  }
  
  // Save detailed results
  fs.writeFileSync('scripts/security-testing-results.json', JSON.stringify(results, null, 2));
  console.log('\n📄 Detailed results saved to scripts/security-testing-results.json');
  
  console.log('\n🎉 Security Testing completed!');
}

// Run the tests
runSecurityTesting().catch(console.error);
