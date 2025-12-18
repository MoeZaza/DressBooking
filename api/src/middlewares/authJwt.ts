import { Request, Response, NextFunction } from 'express'
import mongoose from 'mongoose'
import * as bookcarsTypes from ':bookcars-types'
import * as env from '../config/env.config'
import * as helper from '../common/helper'
import * as authHelper from '../common/authHelper'
import * as logger from '../common/logger'
import User from '../models/User'
import BackendValidationService from '../services/ValidationService'
import { SecurityError, ErrorCode } from '../common/errors'

/**
 * Enhanced authentication token verification middleware with security monitoring.
 *
 * @param {Request} req
 * @param {Response} res
 * @param {NextFunction} next
 */
const verifyToken = async (req: Request, res: Response, next: NextFunction) => {
  // Skip authentication in development mode if disabled or if there are env issues
  try {
    if ((env.DISABLE_AUTH_IN_DEV && env.IS_DEVELOPMENT) ||
        (env.IS_DEVELOPMENT && (!env.JWT_SECRET || !env.COOKIE_SECRET))) {
      console.log('⚠️  Authentication disabled in development mode')
      return next()
    }
  } catch (envError) {
    // If there are issues reading env variables, default to bypassing auth in development
    console.log('⚠️  Environment variable error, bypassing authentication in development:', envError)
    return next()
  }

  const context = logger.createRequestContext(req)
  let token: string
  const isBackend = authHelper.isBackend(req)
  const isFrontend = authHelper.isFrontend(req)

  // Enhanced security monitoring for authentication attempts
  const requestContext = {
    clientIP: req.ip || req.socket.remoteAddress,
    userAgent: req.get('User-Agent'),
    path: req.path,
    method: req.method,
    timestamp: new Date(),
    isBackend,
    isFrontend
  }

  // Log authentication attempt
  logger.logSecurityEvent(
    'Authentication attempt',
    {
      endpoint: req.path,
      method: req.method,
      userAgent: req.get('User-Agent'),
      isBackend,
      isFrontend
    },
    'LOW',
    context
  )

  if (isBackend) {
    token = req.signedCookies[env.BACKEND_AUTH_COOKIE_NAME] as string // backend
  } else if (isFrontend) {
    token = req.signedCookies[env.FRONTEND_AUTH_COOKIE_NAME] as string // frontend
  } else {
    token = req.headers[env.X_ACCESS_TOKEN] as string // mobile app and unit tests
  }

  // Validate token format for security threats
  if (token) {
    const tokenValidation = BackendValidationService.validateInput(
      token,
      'authToken',
      {
        sanitizationLevel: 'basic',
        maxLength: 2048,
        allowSpecialChars: true,
        blockOnThreats: true,
        logThreats: true
      },
      requestContext
    )

    if (tokenValidation.blocked || !tokenValidation.isValid) {
      logger.logSecurityEvent(
        'Malicious token detected',
        {
          threats: tokenValidation.threats,
          errors: tokenValidation.errors,
          endpoint: req.path,
          clientIP: requestContext.clientIP,
          userAgent: requestContext.userAgent
        },
        'HIGH',
        context
      )

      const securityError = new SecurityError(
        ErrorCode.SECURITY_THREAT_DETECTED,
        'Malicious authentication token detected',
        'HIGH',
        context
      )
      return next(securityError)
    }
  }

  if (token) {
    // Enhanced token validation with security monitoring
    try {
      const sessionData = await authHelper.decryptJWT(token)

      // Validate session data for security threats
      if (sessionData?.id) {
        const idValidation = BackendValidationService.validateInput(
          sessionData.id,
          'sessionId',
          {
            sanitizationLevel: 'strict',
            maxLength: 24, // MongoDB ObjectId length
            allowSpecialChars: false,
            blockOnThreats: true
          },
          requestContext
        )

        if (idValidation.blocked || !idValidation.isValid) {
          logger.logSecurityEvent(
            'Malicious session ID detected',
            {
              sessionId: sessionData.id,
              threats: idValidation.threats,
              clientIP: requestContext.clientIP,
              userAgent: requestContext.userAgent
            },
            'HIGH',
            context
          )

          const securityError = new SecurityError(
            ErrorCode.SECURITY_THREAT_DETECTED,
            'Malicious session data detected',
            'HIGH',
            context
          )
          return next(securityError)
        }
      }

      const $match: mongoose.FilterQuery<bookcarsTypes.User> = {
        $and: [
          { _id: sessionData?.id },
          { blacklisted: { $ne: true } }, // Enhanced: explicitly check for non-blacklisted users
        ],
      }

      if (isBackend) {
        $match.$and?.push({ type: { $in: [bookcarsTypes.UserType.Admin, bookcarsTypes.UserType.Supplier] } })
      } else if (isFrontend) {
        $match.$and?.push({ type: bookcarsTypes.UserType.User })
      }

      if (
        !sessionData
        || !helper.isValidObjectId(sessionData.id)
        || !(await User.exists($match))
      ) {
        // Enhanced logging for failed authentication
        logger.logSecurityEvent(
          'Authentication failed: Invalid token or user not found',
          {
            sessionId: sessionData?.id,
            endpoint: req.path,
            clientIP: requestContext.clientIP,
            userAgent: requestContext.userAgent,
            isBackend,
            isFrontend,
            reason: !sessionData ? 'No session data' :
                   !helper.isValidObjectId(sessionData.id) ? 'Invalid session ID' :
                   'User not found or blacklisted'
          },
          'MEDIUM',
          context
        )

        res.status(401).send({ message: 'Unauthorized!' })
      } else {
        // Enhanced logging for successful authentication
        logger.logSecurityEvent(
          'Authentication successful',
          {
            userId: sessionData.id,
            endpoint: req.path,
            clientIP: requestContext.clientIP,
            userAgent: requestContext.userAgent,
            isBackend,
            isFrontend
          },
          'LOW',
          context
        )

        next()
      }
    } catch (err) {
      // Enhanced error logging for token validation failures
      logger.logSecurityEvent(
        'Token validation error',
        {
          error: err instanceof Error ? err.message : 'Unknown error',
          endpoint: req.path,
          clientIP: requestContext.clientIP,
          userAgent: requestContext.userAgent,
          isBackend,
          isFrontend
        },
        'MEDIUM',
        context
      )

      res.status(401).send({ message: 'Unauthorized!' })
    }
  } else {
    // Enhanced logging for missing token
    logger.logSecurityEvent(
      'Authentication failed: No token provided',
      {
        endpoint: req.path,
        clientIP: requestContext.clientIP,
        userAgent: requestContext.userAgent,
        isBackend,
        isFrontend
      },
      'LOW',
      context
    )

    res.status(403).send({ message: 'No token provided!' })
  }
}

export default { verifyToken }
