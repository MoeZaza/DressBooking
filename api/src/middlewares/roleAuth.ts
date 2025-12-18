import { Request, Response, NextFunction } from 'express'
import * as bookcarsTypes from ':bookcars-types'
import * as authHelper from '../common/authHelper'
import * as helper from '../common/helper'
import * as logger from '../common/logger'
import * as env from '../config/env.config'
import User from '../models/User'

// Extend Request interface to include user information
export interface AuthenticatedRequest extends Request {
  user?: {
    id: string
    type: bookcarsTypes.UserType
    email?: string
    fullName?: string
    supplier?: string
  }
  supplierFilter?: {
    supplier: string
  }
}

/**
 * Enhanced middleware to verify token and extract user information
 */
export const verifyTokenAndUser = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  // Skip authentication in development mode if disabled or if there are env issues
  try {
    if ((env.DISABLE_AUTH_IN_DEV && env.IS_DEVELOPMENT) ||
        (env.IS_DEVELOPMENT && (!env.JWT_SECRET || !env.COOKIE_SECRET))) {
      console.log('⚠️  Role authentication disabled in development mode')
      // Set a mock admin user for development (admin sees all data)
      req.user = {
        id: 'dev-admin-id',
        type: 'admin' as bookcarsTypes.UserType,
        email: 'dev@bookdress.local',
        fullName: 'Development Admin User'
      }
      return next()
    }
  } catch (envError) {
    // If there are issues reading env variables, default to bypassing auth in development
    console.log('⚠️  Environment variable error, bypassing role authentication in development:', envError)
    req.user = {
      id: 'dev-admin-id',
      type: 'admin' as bookcarsTypes.UserType,
      email: 'dev@bookdress.local',
      fullName: 'Development Admin User'
    }
    return next()
  }

  try {
    let token: string
    const isBackend = authHelper.isBackend(req)
    const isFrontend = authHelper.isFrontend(req)

    if (isBackend) {
      token = req.signedCookies[process.env.BACKEND_AUTH_COOKIE_NAME as string] as string
    } else if (isFrontend) {
      token = req.signedCookies[process.env.FRONTEND_AUTH_COOKIE_NAME as string] as string
    } else {
      token = req.headers[process.env.X_ACCESS_TOKEN as string] as string
    }

    if (!token) {
      res.status(403).send({ message: 'No token provided!' })
      return
    }

    const sessionData = await authHelper.decryptJWT(token)
    if (!sessionData || !helper.isValidObjectId(sessionData.id)) {
      res.status(401).send({ message: 'Invalid token!' })
      return
    }

    // Get full user information
    const user = await User.findById(sessionData.id).select('-password')
    if (!user || user.blacklisted) {
      res.status(401).send({ message: 'User not found or blacklisted!' })
      return
    }

    // Check user type based on application
    if (isBackend && ![bookcarsTypes.UserType.Admin, bookcarsTypes.UserType.Supplier].includes(user.type as bookcarsTypes.UserType)) {
      res.status(403).send({ message: 'Backend access denied!' })
      return
    }

    if (isFrontend && user.type !== bookcarsTypes.UserType.User) {
      res.status(403).send({ message: 'Frontend access denied!' })
      return
    }

    // Attach user info to request
    req.user = {
      id: (user._id as any).toString(),
      type: user.type as bookcarsTypes.UserType,
      email: user.email,
      fullName: user.fullName,
      supplier: user.supplier?.toString()
    }

    next()
  } catch (err) {
    logger.error('Token verification error:', err)
    res.status(401).send({ message: 'Unauthorized!' })
  }
}

/**
 * Middleware to require admin access
 */
export const requireAdmin = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  if (!req.user) {
    res.status(401).send({ message: 'Authentication required!' })
    return
  }

  if (req.user.type !== bookcarsTypes.UserType.Admin) {
    res.status(403).send({ message: 'Admin access required!' })
    return
  }

  next()
}

/**
 * Middleware to require admin or supplier access
 */
export const requireAdminOrSupplier = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  if (!req.user) {
    res.status(401).send({ message: 'Authentication required!' })
    return
  }

  if (![bookcarsTypes.UserType.Admin, bookcarsTypes.UserType.Supplier].includes(req.user.type)) {
    res.status(403).send({ message: 'Admin or Supplier access required!' })
    return
  }

  next()
}

/**
 * Middleware to require owner access (admin or resource owner)
 */
export const requireOwnerAccess = (resourceOwnerField: string = 'supplier') => {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      res.status(401).send({ message: 'Authentication required!' })
      return
    }

    // Admin has access to everything
    if (req.user.type === bookcarsTypes.UserType.Admin) {
      next()
      return
    }

    // For suppliers, check if they own the resource
    if (req.user.type === bookcarsTypes.UserType.Supplier) {
      const resourceId = req.params.id || req.body[resourceOwnerField] || req.query[resourceOwnerField]
      
      if (resourceId && resourceId === req.user.id) {
        next()
        return
      }

      // If checking supplier field specifically
      if (resourceOwnerField === 'supplier' && req.user.supplier === resourceId) {
        next()
        return
      }
    }

    res.status(403).send({ message: 'Owner access required!' })
  }
}

/**
 * Middleware for dress code management (owner-only)
 */
export const requireDressCodeAccess = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  if (!req.user) {
    res.status(401).send({ message: 'Authentication required!' })
    return
  }

  // Only admin and suppliers can manage dress codes
  if (![bookcarsTypes.UserType.Admin, bookcarsTypes.UserType.Supplier].includes(req.user.type)) {
    res.status(403).send({ message: 'Dress code management requires admin or supplier access!' })
    return
  }

  // For suppliers, they can only edit dress codes for their own dresses
  if (req.user.type === bookcarsTypes.UserType.Supplier) {
    const dressId = req.params.id || req.params.dressId
    if (dressId) {
      try {
        const Dress = (await import('../models/Dress')).default
        const dress = await Dress.findById(dressId).select('supplier')
        
        if (!dress || dress.supplier.toString() !== req.user.id) {
          res.status(403).send({ message: 'You can only edit dress codes for your own dresses!' })
          return
        }
      } catch (err) {
        logger.error('Error checking dress ownership:', err)
        res.status(500).send({ message: 'Error verifying dress ownership!' })
        return
      }
    }
  }

  next()
}

/**
 * Middleware for expense management (admin/owner only)
 */
export const requireExpenseAccess = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  if (!req.user) {
    res.status(401).send({ message: 'Authentication required!' })
    return
  }

  if (![bookcarsTypes.UserType.Admin, bookcarsTypes.UserType.Supplier].includes(req.user.type)) {
    res.status(403).send({ message: 'Expense management requires admin or supplier access!' })
    return
  }

  next()
}

/**
 * Middleware for accounting views (admin/owner only)
 */
export const requireAccountingAccess = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  if (!req.user) {
    res.status(401).send({ message: 'Authentication required!' })
    return
  }

  if (![bookcarsTypes.UserType.Admin, bookcarsTypes.UserType.Supplier].includes(req.user.type)) {
    res.status(403).send({ message: 'Accounting access requires admin or supplier permissions!' })
    return
  }

  next()
}

/**
 * Middleware for payment management (admin/owner only)
 */
export const requirePaymentAccess = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  if (!req.user) {
    res.status(401).send({ message: 'Authentication required!' })
    return
  }

  if (![bookcarsTypes.UserType.Admin, bookcarsTypes.UserType.Supplier].includes(req.user.type)) {
    res.status(403).send({ message: 'Payment management requires admin or supplier access!' })
    return
  }

  next()
}

/**
 * Middleware for booking management (admin/owner only)
 */
export const requireBookingAccess = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  if (!req.user) {
    res.status(401).send({ message: 'Authentication required!' })
    return
  }

  if (![bookcarsTypes.UserType.Admin, bookcarsTypes.UserType.Supplier].includes(req.user.type)) {
    res.status(403).send({ message: 'Booking management requires admin or supplier access!' })
    return
  }

  next()
}

/**
 * Middleware for fitting appointment management (admin/owner only)
 */
export const requireFittingAccess = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  if (!req.user) {
    res.status(401).send({ message: 'Authentication required!' })
    return
  }

  if (![bookcarsTypes.UserType.Admin, bookcarsTypes.UserType.Supplier].includes(req.user.type)) {
    res.status(403).send({ message: 'Fitting appointment management requires admin or supplier access!' })
    return
  }

  next()
}

/**
 * Middleware to ensure suppliers can only access their own data
 */
export const requireSupplierAccess = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  if (!req.user) {
    res.status(401).send({ message: 'Authentication required!' })
    return
  }

  // Admin has access to everything
  if (req.user.type === bookcarsTypes.UserType.Admin) {
    next()
    return
  }

  // Supplier can only access their own data
  if (req.user.type === bookcarsTypes.UserType.Supplier) {
    // Add supplier filter to request for use in controllers
    req.supplierFilter = { supplier: req.user.id }
    next()
    return
  }

  res.status(403).send({ message: 'Supplier access required!' })
}

/**
 * Middleware to validate supplier ownership of a resource
 */
export const requireSupplierOwnership = (paramName: string = 'supplierId') => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      res.status(401).send({ message: 'Authentication required!' })
      return
    }

    // Admin has access to everything
    if (req.user.type === bookcarsTypes.UserType.Admin) {
      next()
      return
    }

    // Supplier can only access their own resources
    if (req.user.type === bookcarsTypes.UserType.Supplier) {
      const resourceSupplierId = req.params[paramName] || req.body[paramName] || req.query[paramName]

      if (!resourceSupplierId) {
        res.status(400).send({ message: 'Supplier ID required!' })
        return
      }

      if (resourceSupplierId !== req.user.id) {
        res.status(403).send({ message: 'Access denied: You can only access your own resources!' })
        return
      }

      next()
      return
    }

    res.status(403).send({ message: 'Supplier access required!' })
  }
}

export default {
  verifyTokenAndUser,
  requireAdmin,
  requireAdminOrSupplier,
  requireOwnerAccess,
  requireDressCodeAccess,
  requireExpenseAccess,
  requireAccountingAccess,
  requirePaymentAccess,
  requireBookingAccess,
  requireFittingAccess,
  requireSupplierAccess,
  requireSupplierOwnership
}
