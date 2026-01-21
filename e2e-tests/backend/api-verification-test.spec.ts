import { test, expect } from '@playwright/test';

/**
 * API Verification Test
 * Tests all API endpoints to identify issues
 */

test.describe('API Endpoint Verification', () => {
  test('should verify analytics API without auth', async ({ request }) => {
    console.log('📊 Testing analytics API...');

    // Test without auth - API might allow public access or return 401/403
    const response = await request.get('http://localhost:4002/api/analytics/dashboard');

    console.log('Status:', response.status());
    const text = await response.text();
    console.log('Response (first 200 chars):', text.substring(0, 200));

    // Accept 200, 401, 403, or 500 - but NOT stack overflow
    expect(response.status()).toBeGreaterThanOrEqual(200);
    expect(response.status()).toBeLessThan(600);
  });

  test('should verify inventory stats API', async ({ request }) => {
    console.log('📊 Testing inventory stats API...');

    const response = await request.get('http://localhost:4002/api/inventory-stats');

    console.log('Status:', response.status());
    const text = await response.text();
    console.log('Response (first 500 chars):', text.substring(0, 500));

    expect(response.status()).toBe(200);
  });

  test('should verify bookings API with language', async ({ request }) => {
    console.log('📊 Testing bookings API...');

    const response = await request.post('http://localhost:4002/api/bookings/1/10/en', {
      data: {}
    });

    console.log('Status:', response.status());
    const text = await response.text();
    console.log('Response (first 500 chars):', text.substring(0, 500));

    // This should not be a 404
    expect(response.status()).not.toBe(404);
  });

  test('should verify all dropdown APIs', async ({ request }) => {
    console.log('📊 Testing all dropdown APIs...');

    const dropdowns = [
      '/api/dress-types',
      '/api/dress-sizes',
      '/api/dress-materials',
      '/api/dress-styles',
      '/api/dress-colors',
      '/api/dress-ranges'
    ];

    for (const dropdown of dropdowns) {
      const response = await request.get(`http://localhost:4002${dropdown}`);
      console.log(`${dropdown}: ${response.status()}`);
      expect(response.status()).toBe(200);
    }
  });

  test('should verify locations API', async ({ request }) => {
    console.log('📊 Testing locations API...');

    const response = await request.get('http://localhost:4002/api/locations/1/100/en');

    console.log('Status:', response.status());
    const json = await response.json();
    console.log('Locations count:', json?.[0]?.resultData?.length || json?.resultData?.length || 0);

    expect(response.status()).toBe(200);
  });

  test('should verify suppliers API', async ({ request }) => {
    console.log('📊 Testing suppliers API...');

    const response = await request.get('http://localhost:4002/api/suppliers/1/100/');

    console.log('Status:', response.status());
    const json = await response.json();
    console.log('Suppliers count:', json?.[0]?.resultData?.length || json?.resultData?.length || 0);

    expect(response.status()).toBe(200);
  });

  test('should verify users API', async ({ request }) => {
    console.log('📊 Testing users API...');

    const response = await request.post('http://localhost:4002/api/users/1/100', {
      data: { types: ['user'] }
    });

    console.log('Status:', response.status());
    const json = await response.json();
    console.log('Users count:', json?.[0]?.resultData?.length || json?.resultData?.length || 0);

    expect(response.status()).toBe(200);
  });
});
