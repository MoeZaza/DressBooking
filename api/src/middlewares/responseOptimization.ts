import { Request, Response, NextFunction } from 'express'

// Extend Request interface to include startTime
declare module 'express-serve-static-core' {
  interface Request {
    startTime?: number
  }
}

export const responseOptimizationMiddleware = (req: Request, res: Response, next: NextFunction) => {
  // Optimize JSON responses for better performance
  const originalJson = res.json

  res.json = function(obj: any) {
    if (obj && typeof obj === 'object') {
      // Remove null and undefined values to reduce payload size
      const cleanObj = removeNullValues(obj)
      
      // Add response metadata for debugging
      if (Array.isArray(cleanObj)) {
        res.set('X-Total-Count', cleanObj.length.toString())
      }
      
      // Add response time header
      if (req.startTime) {
        const responseTime = Date.now() - req.startTime
        res.set('X-Response-Time', `${responseTime}ms`)
      }
      
      return originalJson.call(this, cleanObj)
    }
    
    return originalJson.call(this, obj)
  }

  // Track request start time
  req.startTime = Date.now()
  
  next()
}

function removeNullValues(obj: any): any {
  if (obj === null || obj === undefined) {
    return obj
  }
  
  if (Array.isArray(obj)) {
    return obj.map(removeNullValues).filter(item => item !== null && item !== undefined)
  }
  
  if (typeof obj === 'object') {
    const cleaned: any = {}
    for (const [key, value] of Object.entries(obj)) {
      if (value !== null && value !== undefined) {
        cleaned[key] = removeNullValues(value)
      }
    }
    return cleaned
  }
  
  return obj
}