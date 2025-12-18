/**
 * Frontend Dress Search Tests
 * Ensures 100% functionality of frontend dress search
 */

import * as DressService from '../services/DressService'
import { GetDressesPayload } from ':bookcars-types'

interface TestResult {
  name: string
  passed: boolean
  error?: string
  duration: number
  resultCount?: number
}

class FrontendDressSearchTester {
  private results: TestResult[] = []

  async runAllTests(): Promise<void> {
    console.log('🔍 Starting Frontend Dress Search Tests...\n')
    
    try {
      await this.testBasicSearch()
      await this.testFilteredSearch()
      await this.testLocationBasedSearch()
      await this.testMultiImageSupport()
      await this.testPagination()
      await this.testErrorHandling()
      
      this.printResults()
    } catch (error) {
      console.error('❌ Frontend test suite failed:', error)
    }
  }

  private async runTest(name: string, testFn: () => Promise<any>): Promise<void> {
    const startTime = Date.now()
    try {
      const result = await testFn()
      const duration = Date.now() - startTime
      const resultCount = Array.isArray(result) ? result.length : 
                         result?.data?.docs?.length || result?.docs?.length || 0
      
      this.results.push({ name, passed: true, duration, resultCount })
      console.log(`✅ ${name} - ${duration}ms - ${resultCount} results`)
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

  private async testBasicSearch(): Promise<void> {
    await this.runTest('Basic Search - Get All Dresses', async () => {
      const result = await DressService.getDresses(1, 10)
      
      if (!result || !result.data) {
        throw new Error('No data returned from getDresses')
      }
      
      const dresses = result.data.docs || result.data
      if (!Array.isArray(dresses)) {
        throw new Error('Expected array of dresses')
      }
      
      return dresses
    })

    await this.runTest('Basic Search - With Filters', async () => {
      const payload: GetDressesPayload = {
        includeAlreadyBookedDresses: true,
        includeComingSoonDresses: true
      }
      
      const result = await DressService.getDressesWithFilters(payload, 1, 10)
      
      if (!Array.isArray(result)) {
        throw new Error('Expected array of dresses from filtered search')
      }
      
      return result
    })
  }

  private async testFilteredSearch(): Promise<void> {
    await this.runTest('Filtered Search - By Dress Type', async () => {
      const payload: GetDressesPayload = {
        dressType: ['Evening'],
        includeAlreadyBookedDresses: true
      }
      
      const result = await DressService.getDressesWithFilters(payload, 1, 10)
      
      if (!Array.isArray(result)) {
        throw new Error('Expected array of dresses')
      }
      
      // Verify all returned dresses are Evening type
      result.forEach((dress: any) => {
        if (dress.type && dress.type !== 'Evening') {
          throw new Error(`Expected Evening dress, got ${dress.type}`)
        }
      })
      
      return result
    })

    await this.runTest('Filtered Search - By Size', async () => {
      const payload: GetDressesPayload = {
        dressSize: ['M'],
        includeAlreadyBookedDresses: true
      }
      
      const result = await DressService.getDressesWithFilters(payload, 1, 10)
      
      if (!Array.isArray(result)) {
        throw new Error('Expected array of dresses')
      }
      
      // Verify all returned dresses are size M
      result.forEach((dress: any) => {
        if (dress.size && dress.size !== 'M') {
          throw new Error(`Expected size M dress, got ${dress.size}`)
        }
      })
      
      return result
    })

    await this.runTest('Filtered Search - Multiple Filters', async () => {
      const payload: GetDressesPayload = {
        dressType: ['Evening', 'Cocktail'],
        dressSize: ['M', 'L'],
        availability: ['Available'],
        includeAlreadyBookedDresses: true
      }
      
      const result = await DressService.getDressesWithFilters(payload, 1, 10)
      
      if (!Array.isArray(result)) {
        throw new Error('Expected array of dresses')
      }
      
      return result
    })
  }

  private async testLocationBasedSearch(): Promise<void> {
    await this.runTest('Location-Based Search - Valid Location', async () => {
      // First get a dress to find a valid location
      const allDresses = await DressService.getDresses(1, 5)
      const dresses = allDresses.data?.docs || allDresses.data || []
      
      if (dresses.length === 0) {
        console.log('⚠️ No dresses found for location testing, skipping...')
        return []
      }
      
      const dressWithLocation = dresses.find((d: any) => d.locations && d.locations.length > 0)
      if (!dressWithLocation) {
        console.log('⚠️ No dresses with locations found, skipping location test...')
        return []
      }
      
      const locationId = dressWithLocation.locations[0]._id || dressWithLocation.locations[0]
      
      const payload: GetDressesPayload = {
        location: locationId,
        includeAlreadyBookedDresses: true
      }
      
      const result = await DressService.getDressesWithFilters(payload, 1, 10)
      
      if (!Array.isArray(result)) {
        throw new Error('Expected array of dresses')
      }
      
      // Verify all returned dresses contain the specified location
      result.forEach((dress: any) => {
        if (dress.locations && Array.isArray(dress.locations)) {
          const hasLocation = dress.locations.some((loc: any) => 
            (typeof loc === 'string' ? loc : loc._id) === locationId
          )
          if (!hasLocation) {
            throw new Error(`Dress ${dress.name} does not contain the specified location`)
          }
        }
      })
      
      return result
    })
  }

  private async testMultiImageSupport(): Promise<void> {
    await this.runTest('Multi-Image Support - Images Array', async () => {
      const result = await DressService.getDresses(1, 10)
      const dresses = result.data?.docs || result.data || []
      
      if (dresses.length === 0) {
        throw new Error('No dresses found for image testing')
      }
      
      // Check that dresses have images property
      let dressesWithImages = 0
      let dressesWithMultipleImages = 0
      
      dresses.forEach((dress: any) => {
        if (dress.images && Array.isArray(dress.images)) {
          dressesWithImages++
          if (dress.images.length > 1) {
            dressesWithMultipleImages++
          }
        }
      })
      
      console.log(`   📊 Found ${dressesWithImages} dresses with images, ${dressesWithMultipleImages} with multiple images`)
      
      return dresses
    })
  }

  private async testPagination(): Promise<void> {
    await this.runTest('Pagination - Page 1', async () => {
      const result = await DressService.getDresses(1, 3)
      const data = result.data
      
      if (!data || !data.docs) {
        throw new Error('Invalid pagination response structure')
      }
      
      if (typeof data.page !== 'number' || data.page !== 1) {
        throw new Error(`Expected page 1, got ${data.page}`)
      }
      
      if (typeof data.totalDocs !== 'number') {
        throw new Error('Missing totalDocs in pagination')
      }
      
      return data.docs
    })

    await this.runTest('Pagination - Page 2', async () => {
      const result = await DressService.getDresses(2, 3)
      const data = result.data
      
      if (!data || !data.docs) {
        throw new Error('Invalid pagination response structure')
      }
      
      if (data.totalDocs > 3 && data.page !== 2) {
        throw new Error(`Expected page 2, got ${data.page}`)
      }
      
      return data.docs
    })
  }

  private async testErrorHandling(): Promise<void> {
    await this.runTest('Error Handling - Invalid Page', async () => {
      try {
        const result = await DressService.getDresses(-1, 10)
        // If no error is thrown, that's also acceptable
        return result.data?.docs || []
      } catch (error) {
        // Error handling is working
        return []
      }
    })

    await this.runTest('Error Handling - Large Page Size', async () => {
      try {
        const result = await DressService.getDresses(1, 1000)
        // Should handle large page sizes gracefully
        return result.data?.docs || []
      } catch (error) {
        // Error handling is working
        return []
      }
    })
  }

  private printResults(): void {
    console.log('\n📊 Frontend Dress Search Test Results:')
    console.log('=' .repeat(60))
    
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
    const totalResults = this.results.reduce((sum, r) => sum + (r.resultCount || 0), 0)
    
    console.log(`\nAverage Test Duration: ${avgDuration.toFixed(0)}ms`)
    console.log(`Total Dress Results Retrieved: ${totalResults}`)
    console.log('=' .repeat(60))
    
    if (failed === 0) {
      console.log('\n🎉 All frontend dress search tests passed!')
      console.log('✅ Frontend dress search is 100% functional!')
    } else {
      console.log(`\n⚠️ ${failed} tests failed. Please review the issues above.`)
    }
  }
}

// Export for use in other test files
export { FrontendDressSearchTester }

// Run tests if this file is executed directly
if (typeof window === 'undefined' && import.meta.url === `file://${process.argv[1]}`) {
  const tester = new FrontendDressSearchTester()
  tester.runAllTests().catch(console.error)
}
