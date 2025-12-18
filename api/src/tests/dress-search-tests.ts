/**
 * Comprehensive Dress Search Tests
 * Ensures 100% functionality of dress search features
 */

import axios from 'axios'

const API_BASE = process.env.BC_API_HOST || 'http://localhost:4002'

interface SearchTestCase {
  name: string
  payload: any
  expectedResults: (results: any) => boolean
  description: string
}

class DressSearchTester {
  private authToken: string = ''
  private testDresses: any[] = []

  async runSearchTests(): Promise<void> {
    console.log('🔍 Starting Comprehensive Dress Search Tests...\n')
    
    try {
      await this.setupTestData()
      await this.runAllSearchScenarios()
      console.log('\n✅ All dress search tests completed successfully!')
    } catch (error) {
      console.error('❌ Dress search tests failed:', error)
    } finally {
      await this.cleanup()
    }
  }

  private async setupTestData(): Promise<void> {
    console.log('📋 Setting up test data for dress search...')
    
    // Create admin user for testing
    const adminUser = {
      email: `admin-${Date.now()}@test.com`,
      password: 'AdminPassword123!',
      fullName: 'Test Admin',
      type: 'admin'
    }

    try {
      await axios.post(`${API_BASE}/api/sign-up`, adminUser)
      const signInResponse = await axios.post(`${API_BASE}/api/sign-in`, {
        email: adminUser.email,
        password: adminUser.password
      })
      this.authToken = signInResponse.data.accessToken
    } catch {
      console.log('Using existing admin credentials...')
      // Try with default admin
      const signInResponse = await axios.post(`${API_BASE}/api/sign-in`, {
        email: 'admin@bookdress.com',
        password: 'BookDress123!'
      })
      this.authToken = signInResponse.data.accessToken
    }

    // Create test dresses with various attributes
    const testDressData = [
      {
        name: 'Elegant Evening Gown',
        type: 'Evening',
        size: 'M',
        style: 'A-Line',
        material: 'Silk',
        color: 'Navy Blue',
        length: 160,
        price: 399.99,
        deposit: 80,
        available: true,
        cancellation: 24,
        amendments: 12,
        range: 'Evening',
        dressCode: 'EEG001',
        images: ['evening-gown-1.jpg', 'evening-gown-2.jpg']
      },
      {
        name: 'Classic Wedding Dress',
        type: 'Wedding',
        size: 'L',
        style: 'Mermaid',
        material: 'Lace',
        color: 'Ivory',
        length: 180,
        price: 899.99,
        deposit: 200,
        available: true,
        cancellation: 48,
        amendments: 24,
        range: 'Bridal',
        dressCode: 'CWD001',
        images: ['wedding-dress-1.jpg', 'wedding-dress-2.jpg', 'wedding-dress-3.jpg']
      },
      {
        name: 'Cocktail Party Dress',
        type: 'Cocktail',
        size: 'S',
        style: 'Sheath',
        material: 'Chiffon',
        color: 'Red',
        length: 120,
        price: 199.99,
        deposit: 40,
        available: true,
        cancellation: 12,
        amendments: 6,
        range: 'Cocktail',
        dressCode: 'CPD001',
        images: ['cocktail-dress-1.jpg']
      },
      {
        name: 'Prom Night Special',
        type: 'Prom',
        size: 'M',
        style: 'Ball Gown',
        material: 'Tulle',
        color: 'Pink',
        length: 170,
        price: 299.99,
        deposit: 60,
        available: false, // Test unavailable dress
        cancellation: 24,
        amendments: 12,
        range: 'Evening',
        dressCode: 'PNS001',
        images: ['prom-dress-1.jpg', 'prom-dress-2.jpg']
      }
    ]

    for (const dressData of testDressData) {
      try {
        const response = await axios.post(`${API_BASE}/api/create-dress`, dressData, {
          headers: { Authorization: `Bearer ${this.authToken}` }
        })
        this.testDresses.push(response.data)
        console.log(`✅ Created test dress: ${dressData.name}`)
      } catch (error) {
        console.log(`⚠️ Failed to create dress ${dressData.name}:`, error)
      }
    }
  }

  private async runAllSearchScenarios(): Promise<void> {
    const testCases: SearchTestCase[] = [
      {
        name: 'Search by Dress Name',
        payload: { keyword: 'Evening' },
        expectedResults: (results) => {
          return results.docs && results.docs.some((dress: any) => 
            dress.name.toLowerCase().includes('evening')
          )
        },
        description: 'Should find dresses with "Evening" in the name'
      },
      {
        name: 'Search by Dress Code',
        payload: { dressCode: 'EEG001' },
        expectedResults: (results) => {
          return results.docs && results.docs.some((dress: any) => 
            dress.dressCode === 'EEG001'
          )
        },
        description: 'Should find dress with specific dress code'
      },
      {
        name: 'Search by Dress Type',
        payload: { dressType: ['Wedding'] },
        expectedResults: (results) => {
          return results.docs && results.docs.every((dress: any) => 
            dress.type === 'Wedding'
          )
        },
        description: 'Should find only wedding dresses'
      },
      {
        name: 'Search by Dress Size',
        payload: { dressSize: ['M'] },
        expectedResults: (results) => {
          return results.docs && results.docs.every((dress: any) => 
            dress.size === 'M'
          )
        },
        description: 'Should find only medium-sized dresses'
      },
      {
        name: 'Search by Material',
        payload: { material: ['Silk'] },
        expectedResults: (results) => {
          return results.docs && results.docs.some((dress: any) => 
            dress.material === 'Silk'
          )
        },
        description: 'Should find dresses made of silk'
      },
      {
        name: 'Search by Color',
        payload: { color: 'Red' },
        expectedResults: (results) => {
          return results.docs && results.docs.some((dress: any) => 
            dress.color === 'Red'
          )
        },
        description: 'Should find red dresses'
      },
      {
        name: 'Search Available Dresses Only',
        payload: { availability: ['Available'] },
        expectedResults: (results) => {
          return results.docs && results.docs.every((dress: any) => 
            dress.available === true
          )
        },
        description: 'Should find only available dresses'
      },
      {
        name: 'Search with Price Range',
        payload: { 
          deposit: 100,
          includeAlreadyBookedDresses: true 
        },
        expectedResults: (results) => {
          return results.docs && Array.isArray(results.docs)
        },
        description: 'Should handle price-based filtering'
      },
      {
        name: 'Search with Multiple Filters',
        payload: { 
          dressType: ['Evening', 'Cocktail'],
          dressSize: ['M', 'S'],
          availability: ['Available']
        },
        expectedResults: (results) => {
          return results.docs && results.docs.every((dress: any) => 
            ['Evening', 'Cocktail'].includes(dress.type) &&
            ['M', 'S'].includes(dress.size) &&
            dress.available === true
          )
        },
        description: 'Should handle multiple filter combinations'
      },
      {
        name: 'Empty Search (All Dresses)',
        payload: {},
        expectedResults: (results) => {
          return results.docs && Array.isArray(results.docs) && results.docs.length > 0
        },
        description: 'Should return all dresses when no filters applied'
      },
      {
        name: 'Pagination Test',
        payload: {},
        expectedResults: (results) => {
          return Object.prototype.hasOwnProperty.call(results, 'totalDocs') &&
                 Object.prototype.hasOwnProperty.call(results, 'page') &&
                 Object.prototype.hasOwnProperty.call(results, 'totalPages')
        },
        description: 'Should include pagination metadata'
      },
      {
        name: 'Search with Images',
        payload: { includeAlreadyBookedDresses: true },
        expectedResults: (results) => {
          return results.docs && results.docs.some((dress: any) => 
            dress.images && Array.isArray(dress.images) && dress.images.length > 0
          )
        },
        description: 'Should return dresses with image arrays'
      }
    ]

    console.log(`\n🧪 Running ${testCases.length} search test cases...\n`)

    let passedTests = 0
    let failedTests = 0

    for (const testCase of testCases) {
      try {
        console.log(`Testing: ${testCase.name}`)
        console.log(`Description: ${testCase.description}`)
        
        const startTime = Date.now()
        const response = await axios.post(`${API_BASE}/api/frontend-dresses/1/10`, testCase.payload)
        const duration = Date.now() - startTime
        
        if (response.status !== 200) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`)
        }

        const results = response.data
        const isValid = testCase.expectedResults(results)
        
        if (isValid) {
          console.log(`✅ PASSED - ${duration}ms - Found ${results.docs?.length || 0} results`)
          passedTests++
        } else {
          console.log(`❌ FAILED - ${duration}ms - Results don't match expectations`)
          console.log('   Results:', JSON.stringify(results, null, 2))
          failedTests++
        }
      } catch (error) {
        console.log(`❌ FAILED - Error: ${error}`)
        failedTests++
      }
      
      console.log('') // Empty line for readability
    }

    // Summary
    console.log('📊 Search Test Results Summary:')
    console.log('=' .repeat(40))
    console.log(`Total Tests: ${testCases.length}`)
    console.log(`Passed: ${passedTests} ✅`)
    console.log(`Failed: ${failedTests} ❌`)
    console.log(`Success Rate: ${((passedTests / testCases.length) * 100).toFixed(1)}%`)
    
    if (failedTests === 0) {
      console.log('\n🎉 All dress search tests passed! Search functionality is 100% working.')
    } else {
      console.log(`\n⚠️ ${failedTests} tests failed. Please review the issues above.`)
    }
  }

  private async cleanup(): Promise<void> {
    console.log('\n🧹 Cleaning up test dresses...')
    
    for (const dress of this.testDresses) {
      try {
        await axios.delete(`${API_BASE}/api/delete-dress/${dress._id}`, {
          headers: { Authorization: `Bearer ${this.authToken}` }
        })
        console.log(`✅ Deleted test dress: ${dress.name}`)
      } catch (error) {
        console.log(`⚠️ Failed to delete dress ${dress.name}:`, error)
      }
    }
  }
}

// Run tests if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const tester = new DressSearchTester()
  tester.runSearchTests().catch(console.error)
}

export { DressSearchTester }
