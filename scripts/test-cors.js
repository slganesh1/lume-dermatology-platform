#!/usr/bin/env node

/**
 * Test script to check if CORS is configured correctly for the fine-tuning API
 * 
 * This script can be run from any computer to check if the fine-tuning API
 * is accessible from external systems.
 * 
 * Usage:
 * 1. node test-cors.js https://your-server-url.com
 */

const serverUrl = process.argv[2] || 'http://localhost:5000';

console.log(`Testing CORS configuration for: ${serverUrl}`);
console.log('---------------------------------------------');

async function testCors() {
  try {
    console.log('1. Testing basic CORS endpoint...');
    const response = await fetch(`${serverUrl}/api/fine-tuning/cors/test`);
    
    if (!response.ok) {
      throw new Error(`Failed with status: ${response.status}`);
    }
    
    const data = await response.json();
    console.log('✓ CORS is working!');
    console.log('Response:', JSON.stringify(data, null, 2));
    
    console.log('\n2. Testing admin page access...');
    const adminResponse = await fetch(`${serverUrl}/api/fine-tuning/admin-page`);
    
    if (!adminResponse.ok) {
      console.log(`✗ Admin page returned status: ${adminResponse.status}`);
    } else {
      console.log('✓ Admin page is accessible!');
    }
    
    console.log('\n3. All tests completed!');
    console.log('\nIf all tests passed, your CORS configuration is correct.');
    console.log('You can now access the fine-tuning admin page from:');
    console.log(`${serverUrl}/api/fine-tuning/admin-page`);
    console.log('\nOr try the CORS test page:');
    console.log(`${serverUrl}/api/fine-tuning/cors/test-page`);
    
  } catch (error) {
    console.error('❌ Error testing CORS:', error.message);
    console.log('\nPossible reasons:');
    console.log('1. The server is not running or not accessible');
    console.log('2. CORS is not properly configured');
    console.log('3. Network issues or firewall blocking the connection');
    console.log('\nTry accessing the CORS test page directly in a browser:');
    console.log(`${serverUrl}/api/fine-tuning/cors/test-page`);
  }
}

testCors();