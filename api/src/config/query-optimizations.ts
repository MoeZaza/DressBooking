
// Database Query Optimizations
// Add these optimizations to your controllers:

// 1. Use lean() for read-only queries to improve performance
// Example: Model.find().lean()

// 2. Use select() to limit fields returned
// Example: Model.find().select('name price color')

// 3. Use pagination with proper indexing
// Example: Model.find().skip(skip).limit(limit)

// 4. Use aggregation pipelines for complex queries
// Example: Model.aggregate([...])

// 5. Add database indexes for frequently queried fields
// Example: schema.index({ name: 1, available: 1 })

export const optimizedDressQuery = {
  // Optimized dress query with limited fields
  fields: 'name dressCode type size color price deposit material length designerName available supplier locations images',
  
  // Lean query for better performance
  lean: true,
  
  // Populate only necessary supplier fields
  populateSupplier: 'fullName email phone',
  
  // Populate only necessary location fields
  populateLocations: 'name country'
}

export const optimizedLocationQuery = {
  fields: 'name country latitude longitude',
  lean: true
}

export const optimizedSupplierQuery = {
  fields: 'fullName email phone type locations',
  lean: true,
  populateLocations: 'name country'
}
