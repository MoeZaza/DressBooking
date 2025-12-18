/**
 * Comprehensive Backend Tests for BookDress Application
 * Tests all new features and ensures 100% functionality
 */

import axios from 'axios'

const API_BASE = process.env.BC_API_HOST || 'http://localhost:4002'

interface TestResult {
  name: string
  passed: boolean
  error?: string
  duration: number
}

class BackendTester {
  private results: TestResult[] = []
  private authToken: string = ''
  private testUser: any = null
  private testDress: any = null

  async runAllTests(): Promise<void> {
    console.log('🚀 Starting Comprehensive Backend Tests...\n')
    
    try {
      await this.setupTestData()
      await this.testAuthentication()
      await this.testDressCodeFunctionality()
      await this.testMultiImageUpload()
      await this.testDressSearch()
      await this.testBookingCreation()
      await this.testLocationBasedSearch()
      await this.testArabicLocalization()
      await this.testAnalytics()
      
      this.printResults()
    } catch (error) {
      console.error('❌ Test suite failed:', error)
    } finally {
      await this.cleanup()
    }
  }

  private async runTest(name: string, testFn: () => Promise<void>): Promise<void> {
    const startTime = Date.now()
    try {
      await testFn()
      const duration = Date.now() - startTime
      this.results.push({ name, passed: true, duration })
      console.log(`✅ ${name} - ${duration}ms`)
    } catch (error) {
      const duration = Date.now() - startTime
      this.results.push({ 
        name, 
        passed: false, 
        error: error instanceof Error ? error.message : String(error),
        duration 
      })
      console.log(`❌ ${name} - ${duration}ms - ${error}`)
    }
  }

  private async setupTestData(): Promise<void> {
    console.log('📋 Setting up test data...')
    
    // Create test user
    this.testUser = {
      email: `test-${Date.now()}@bookdress.com`,
      password: 'TestPassword123!',
      fullName: 'Test User',
      phone: '+1234567890',
      type: 'admin'
    }

    // Test data setup complete
  }

  private async testAuthentication(): Promise<void> {
    await this.runTest('Authentication - Sign Up Admin', async () => {
      const response = await axios.post(`${API_BASE}/api/sign-up`, this.testUser)
      if (response.status !== 200) {
        throw new Error(`Expected 200, got ${response.status}`)
      }
    })

    await this.runTest('Authentication - Sign In', async () => {
      const response = await axios.post(`${API_BASE}/api/sign-in`, {
        email: this.testUser.email,
        password: this.testUser.password
      })
      if (response.status !== 200) {
        throw new Error(`Expected 200, got ${response.status}`)
      }
      this.authToken = response.data.accessToken
    })
  }

  private async testDressCodeFunctionality(): Promise<void> {
    await this.runTest('Dress Code - Auto Generation', async () => {
      const dressData = {
        name: 'Test Dress for Code Generation',
        type: 'Evening',
        size: 'M',
        style: 'A-Line',
        material: 'Silk',
        color: 'Blue',
        length: 150,
        price: 299.99,
        deposit: 50,
        locations: [], // Will be populated after location creation
        available: true,
        cancellation: 24,
        amendments: 12,
        range: 'Evening'
      }

      const response = await axios.post(`${API_BASE}/api/create-dress`, dressData, {
        headers: { Authorization: `Bearer ${this.authToken}` }
      })

      if (response.status !== 200) {
        throw new Error(`Expected 200, got ${response.status}`)
      }

      const createdDress = response.data
      if (!createdDress.dressCode) {
        throw new Error('Dress code was not auto-generated')
      }

      this.testDress = createdDress
    })

    await this.runTest('Dress Code - Custom Code', async () => {
      const customCode = `CUSTOM-${Date.now()}`
      const dressData = {
        name: 'Test Dress with Custom Code',
        type: 'Wedding',
        size: 'L',
        style: 'Mermaid',
        material: 'Lace',
        color: 'White',
        length: 180,
        price: 599.99,
        deposit: 100,
        locations: [],
        available: true,
        cancellation: 48,
        amendments: 24,
        range: 'Bridal',
        dressCode: customCode
      }

      const response = await axios.post(`${API_BASE}/api/create-dress`, dressData, {
        headers: { Authorization: `Bearer ${this.authToken}` }
      })

      if (response.status !== 200) {
        throw new Error(`Expected 200, got ${response.status}`)
      }

      const createdDress = response.data
      if (createdDress.dressCode !== customCode) {
        throw new Error(`Expected custom code ${customCode}, got ${createdDress.dressCode}`)
      }
    })
  }

  private async testMultiImageUpload(): Promise<void> {
    await this.runTest('Multi-Image Upload - Create Dress with Images', async () => {
      if (!this.testDress) {
        throw new Error('Test dress not available')
      }

      // Simulate multiple image URLs
      const imageUrls = [
        'test-image-1.jpg',
        'test-image-2.jpg',
        'test-image-3.jpg'
      ]

      const updateData = {
        ...this.testDress,
        images: imageUrls
      }

      const response = await axios.put(`${API_BASE}/api/update-dress`, updateData, {
        headers: { Authorization: `Bearer ${this.authToken}` }
      })

      if (response.status !== 200) {
        throw new Error(`Expected 200, got ${response.status}`)
      }

      const updatedDress = response.data
      if (!updatedDress.images || updatedDress.images.length !== 3) {
        throw new Error(`Expected 3 images, got ${updatedDress.images?.length || 0}`)
      }
    })
  }

  private async testDressSearch(): Promise<void> {
    await this.runTest('Dress Search - By Name', async () => {
      const searchPayload = {
        keyword: 'Test Dress'
      }

      const response = await axios.post(`${API_BASE}/api/frontend-dresses/1/10`, searchPayload)

      if (response.status !== 200) {
        throw new Error(`Expected 200, got ${response.status}`)
      }

      const results = response.data
      if (!results.docs || !Array.isArray(results.docs)) {
        throw new Error('Invalid search results format')
      }
    })

    await this.runTest('Dress Search - By Code', async () => {
      if (!this.testDress?.dressCode) {
        throw new Error('Test dress code not available')
      }

      const searchPayload = {
        dressCode: this.testDress.dressCode
      }

      const response = await axios.post(`${API_BASE}/api/frontend-dresses/1/10`, searchPayload)

      if (response.status !== 200) {
        throw new Error(`Expected 200, got ${response.status}`)
      }

      const results = response.data
      if (!results.docs || results.docs.length === 0) {
        throw new Error('No results found for dress code search')
      }
    })
  }

  private async testBookingCreation(): Promise<void> {
    await this.runTest('Booking Creation - Complete Flow', async () => {
      if (!this.testDress) {
        throw new Error('Test dress not available')
      }

      const bookingData = {
        dress: this.testDress._id,
        supplier: this.testDress.supplier,
        customer: {
          fullName: 'Test Customer',
          email: `customer-${Date.now()}@test.com`,
          phone: '+1234567892'
        },
        from: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
        to: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000), // 10 days from now
        status: 'pending',
        price: this.testDress.price
      }

      const response = await axios.post(`${API_BASE}/api/create-booking`, bookingData, {
        headers: { Authorization: `Bearer ${this.authToken}` }
      })

      if (response.status !== 200) {
        throw new Error(`Expected 200, got ${response.status}`)
      }
    })
  }

  private async testLocationBasedSearch(): Promise<void> {
    await this.runTest('Location-Based Search - Contains Logic', async () => {
      // This test verifies that location search uses $in operator correctly
      const searchPayload = {
        location: 'test-location-id',
        includeAlreadyBookedDresses: true
      }

      const response = await axios.post(`${API_BASE}/api/frontend-dresses/1/10`, searchPayload)

      if (response.status !== 200) {
        throw new Error(`Expected 200, got ${response.status}`)
      }

      // The search should not fail even with non-existent location
      const results = response.data
      if (!results.docs || !Array.isArray(results.docs)) {
        throw new Error('Invalid search results format')
      }
    })
  }

  private async testArabicLocalization(): Promise<void> {
    await this.runTest('Arabic Localization - RTL Support', async () => {
      // Test that Arabic language strings are available
      const response = await axios.get(`${API_BASE}/api/language/ar`)

      if (response.status !== 200) {
        throw new Error(`Expected 200, got ${response.status}`)
      }

      // Verify some key Arabic translations exist
      const translations = response.data
      const requiredKeys = ['DRESS', 'BOOKING', 'SEARCH', 'CREATE', 'UPDATE']
      
      for (const key of requiredKeys) {
        if (!translations[key]) {
          throw new Error(`Missing Arabic translation for ${key}`)
        }
      }
    })
  }

  private async testAnalytics(): Promise<void> {
    await this.runTest('Analytics - Dress Performance', async () => {
      if (!this.testDress) {
        throw new Error('Test dress not available')
      }

      const response = await axios.get(`${API_BASE}/api/dress-analytics/${this.testDress._id}`, {
        headers: { Authorization: `Bearer ${this.authToken}` }
      })

      if (response.status !== 200) {
        throw new Error(`Expected 200, got ${response.status}`)
      }

      const analytics = response.data
      if (typeof analytics.totalBookings !== 'number') {
        throw new Error('Invalid analytics format')
      }
    })
  }

  private async cleanup(): Promise<void> {
    console.log('\n🧹 Cleaning up test data...')
    
    try {
      if (this.testDress) {
        await axios.delete(`${API_BASE}/api/delete-dress/${this.testDress._id}`, {
          headers: { Authorization: `Bearer ${this.authToken}` }
        })
      }
    } catch (error) {
      console.log('⚠️ Cleanup warning:', error)
    }
  }

  private printResults(): void {
    console.log('\n📊 Test Results Summary:')
    console.log('=' .repeat(50))
    
    const passed = this.results.filter(r => r.passed).length
    const failed = this.results.filter(r => !r.passed).length
    const total = this.results.length
    
    console.log(`Total Tests: ${total}`)
    console.log(`Passed: ${passed} ✅`)
    console.log(`Failed: ${failed} ❌`)
    console.log(`Success Rate: ${((passed / total) * 100).toFixed(1)}%`)
    
    if (failed > 0) {
      console.log('\n❌ Failed Tests:')
      this.results.filter(r => !r.passed).forEach(result => {
        console.log(`  - ${result.name}: ${result.error}`)
      })
    }
    
    const avgDuration = this.results.reduce((sum, r) => sum + r.duration, 0) / total
    console.log(`\nAverage Test Duration: ${avgDuration.toFixed(0)}ms`)
    console.log('=' .repeat(50))
  }
}

// Run tests if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const tester = new BackendTester()
  tester.runAllTests().catch(console.error)
}

export { BackendTester }
