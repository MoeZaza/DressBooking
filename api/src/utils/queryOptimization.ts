/**
 * Database Query Optimization Utilities
 * 
 * Provides optimized query patterns and field selections for better performance
 */

// Optimized field selections to reduce data transfer
export const optimizedFields = {
  // Dress queries - only essential fields
  dress: 'name dressCode type size color price deposit material length available supplier locations images createdAt',
  
  // Supplier queries - minimal fields
  supplier: 'fullName email phone avatar businessType verified',
  
  // Location queries - essential fields only
  location: 'name country city address available supplier',
  
  // User/Customer queries - safe fields
  user: 'fullName email phone avatar verified language',
  
  // Booking queries - complete but organized
  booking: 'customer dress supplier location from to price deposit status paymentStatus notes createdAt'
}

// Lean query options for better performance
export const leanOptions = {
  // Use lean() for read-only queries (60% faster)
  lean: true,
  
  // Transform MongoDB _id to id for consistency
  transform: (doc: any, ret: any) => {
    if (ret._id) {
      ret.id = ret._id.toString()
      delete ret._id
    }
    delete ret.__v
    return ret
  }
}

// Populate options for relationships
export const populateOptions = {
  supplier: {
    path: 'supplier',
    select: optimizedFields.supplier,
    options: leanOptions
  },
  
  locations: {
    path: 'locations',
    select: optimizedFields.location,
    options: leanOptions
  },
  
  customer: {
    path: 'customer',
    select: optimizedFields.user,
    options: leanOptions
  },
  
  dress: {
    path: 'dress',
    select: optimizedFields.dress,
    options: leanOptions
  }
}

// Aggregation pipeline optimizations
export const aggregationOptimizations = {
  // Add indexes hint for better query performance
  addIndexHint: (pipeline: any[], indexName: string) => {
    return [{ $hint: indexName }, ...pipeline]
  },
  
  // Add pagination stage with proper sorting
  addPagination: (pipeline: any[], page: number, limit: number, sortField = 'createdAt') => {
    const skip = (page - 1) * limit
    return [
      ...pipeline,
      { $sort: { [sortField]: -1 } },
      { $skip: skip },
      { $limit: limit }
    ]
  },
  
  // Add field selection stage
  addFieldSelection: (pipeline: any[], fields: string) => {
    const fieldObj = fields.split(' ').reduce((acc, field) => {
      acc[field] = 1
      return acc
    }, {} as any)
    
    return [...pipeline, { $project: fieldObj }]
  }
}

// Query performance utilities
export const queryPerformance = {
  // Measure query execution time
  async measureQuery<T>(queryFn: () => Promise<T>, queryName: string): Promise<T> {
    const startTime = Date.now()
    try {
      const result = await queryFn()
      const duration = Date.now() - startTime
      
      console.log(`📊 Query Performance: ${queryName} - ${duration}ms`)
      
      // Log slow queries (> 1 second)
      if (duration > 1000) {
        console.warn(`⚠️ Slow Query: ${queryName} took ${duration}ms`)
      }
      
      return result
    } catch (error) {
      const duration = Date.now() - startTime
      console.error(`❌ Query Error: ${queryName} failed after ${duration}ms`, error)
      throw error
    }
  },
  
  // Create optimized pagination info
  createPaginationInfo: (page: number, limit: number, total: number) => ({
    page,
    limit,
    total,
    pages: Math.ceil(total / limit),
    hasNext: page * limit < total,
    hasPrev: page > 1
  })
}

// Database index recommendations
export const recommendedIndexes = {
  dresses: [
    { supplier: 1, available: 1 },
    { type: 1, available: 1 },
    { price: 1 },
    { createdAt: -1 },
    { 'locations': 1 }
  ],
  
  bookings: [
    { customer: 1, status: 1 },
    { supplier: 1, from: 1 },
    { dress: 1 },
    { createdAt: -1 }
  ],
  
  locations: [
    { supplier: 1, available: 1 },
    { country: 1 },
    { name: 1 }
  ],
  
  users: [
    { email: 1 },
    { type: 1, verified: 1 },
    { createdAt: -1 }
  ]
}

export default {
  optimizedFields,
  leanOptions,
  populateOptions,
  aggregationOptimizations,
  queryPerformance,
  recommendedIndexes
}
