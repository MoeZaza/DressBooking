#!/usr/bin/env node

// Debug the security configuration
const path = require('path');

// Add the API src directory to the module path
process.env.NODE_PATH = path.join(__dirname, '../api/src');
require('module')._initPaths();

async function debugSecurityConfig() {
  try {
    console.log('🔍 Debugging Security Configuration...\n');
    
    // Import the security config
    const getSecurityConfig = require('../api/src/config/security.config.ts').default;
    const securityConfig = getSecurityConfig();
    
    console.log('📊 Security Configuration:');
    console.log('CSP Report Only:', securityConfig.csp.reportOnly);
    console.log('CSP Use Nonces:', securityConfig.csp.useNonces);
    console.log('CSP Report URI:', securityConfig.csp.reportUri);
    
    console.log('\n📋 CSP Directives:');
    for (const [directive, sources] of Object.entries(securityConfig.csp.directives)) {
      console.log(`  ${directive}: ${sources.join(' ')}`);
    }
    
    console.log('\n🛡️ Security Headers:');
    console.log('Frame Options:', securityConfig.headers.frameOptions);
    console.log('Content Type Options:', securityConfig.headers.contentTypeOptions);
    console.log('Referrer Policy:', securityConfig.headers.referrerPolicy);
    console.log('HSTS Max Age:', securityConfig.headers.hsts.maxAge);
    
  } catch (error) {
    console.error('❌ Error debugging security config:', error.message);
    console.error('Stack:', error.stack);
  }
}

debugSecurityConfig();
