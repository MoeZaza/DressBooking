import mongoose from 'mongoose'
import crypto from 'crypto'
import * as logger from '../common/logger.js'
import BackendValidationService from './ValidationService'

/**
 * Database security configuration interface
 */
export interface DatabaseSecurityConfig {
  enableQuerySanitization: boolean
  enableConnectionEncryption: boolean
  enableAuditLogging: boolean
  enableFieldEncryption: boolean
  maxQueryComplexity: number
  queryTimeout: number
  connectionPoolSize: number
  enableReadConcern: boolean
  enableWriteConcern: boolean
}

/**
 * Encrypted field configuration
 */
export interface EncryptedFieldConfig {
  algorithm: string
  keyLength: number
  ivLength: number
  tagLength: number
}

/**
 * Database Security Service
 */
class DatabaseSecurityService {
  private static instance: DatabaseSecurityService
  private config: DatabaseSecurityConfig
  private encryptionKey: Buffer
  private encryptedFieldConfig: EncryptedFieldConfig
  private queryLog: Array<{ query: any; timestamp: Date; sanitized: boolean }> = []

  private constructor() {
    this.config = this.getDefaultConfig()
    // Initialize encrypted field config first
    this.encryptedFieldConfig = {
      algorithm: 'aes-256-gcm',
      keyLength: 32,
      ivLength: 16,
      tagLength: 16
    }
    // Then generate encryption key using the config
    this.encryptionKey = this.generateEncryptionKey()
    this.setupDatabaseSecurity()
  }

  /**
   * Get singleton instance
   */
  public static getInstance(): DatabaseSecurityService {
    if (!DatabaseSecurityService.instance) {
      DatabaseSecurityService.instance = new DatabaseSecurityService()
    }
    return DatabaseSecurityService.instance
  }

  /**
   * Get default security configuration
   */
  private getDefaultConfig(): DatabaseSecurityConfig {
    // Helper function to convert string to boolean
    const stringToBoolean = (input: string): boolean => {
      try {
        return Boolean(JSON.parse(input.toLowerCase()))
      } catch {
        return false
      }
    }

    return {
      enableQuerySanitization: stringToBoolean(process.env.BC_DB_QUERY_SANITIZATION || 'true'),
      enableConnectionEncryption: stringToBoolean(process.env.BC_DB_SSL || 'false'),
      enableAuditLogging: stringToBoolean(process.env.BC_DB_AUDIT_LOGGING || 'true'),
      enableFieldEncryption: stringToBoolean(process.env.BC_DB_FIELD_ENCRYPTION || 'true'),
      maxQueryComplexity: Number.parseInt(process.env.BC_DB_MAX_QUERY_COMPLEXITY || '100', 10),
      queryTimeout: Number.parseInt(process.env.BC_DB_QUERY_TIMEOUT || '30000', 10),
      connectionPoolSize: Number.parseInt(process.env.BC_DB_CONNECTION_POOL_SIZE || '10', 10),
      enableReadConcern: true,
      enableWriteConcern: true
    }
  }

  /**
   * Generate encryption key for field-level encryption
   */
  private generateEncryptionKey(): Buffer {
    const keyString = process.env.DB_ENCRYPTION_KEY || 'default-key-for-development-only-change-in-production'
    return crypto.scryptSync(keyString, 'salt', this.encryptedFieldConfig.keyLength)
  }

  /**
   * Setup database security measures
   */
  private setupDatabaseSecurity(): void {
    // Configure mongoose with security settings
    // mongoose.set('sanitizeFilter', true) // Temporarily disabled - causing MongoDB query corruption
    mongoose.set('runValidators', true) // Always run validators
    mongoose.set('strictQuery', true) // Strict query mode

    // Setup connection event handlers
    mongoose.connection.on('connected', () => {
      logger.info('Database connected with security measures enabled')
    })

    mongoose.connection.on('error', (error) => {
      logger.logSecurityEvent(
        'Database connection error',
        { error: error.message },
        'HIGH',
        {}
      )
    })

    mongoose.connection.on('disconnected', () => {
      logger.logSecurityEvent(
        'Database disconnected',
        {},
        'MEDIUM',
        {}
      )
    })
  }

  /**
   * Sanitize MongoDB query to prevent NoSQL injection
   */
  public sanitizeQuery(query: any, context?: any): { sanitizedQuery: any; threats: any[] } {
    const threats: any[] = []
    let sanitizedQuery = JSON.parse(JSON.stringify(query)) // Deep clone

    try {
      // Convert query to string for validation
      const queryString = JSON.stringify(query)
      
      // Validate query string for threats
      const validationResult = BackendValidationService.validateInput(
        queryString,
        'mongoQuery',
        {
          sanitizationLevel: 'paranoid',
          blockOnThreats: false,
          logThreats: true
        },
        context
      )

      threats.push(...validationResult.threats)

      // Remove dangerous operators
      sanitizedQuery = this.removeDangerousOperators(sanitizedQuery)

      // Validate query complexity
      if (this.calculateQueryComplexity(sanitizedQuery) > this.config.maxQueryComplexity) {
        threats.push({
          type: 'QUERY_COMPLEXITY',
          description: 'Query complexity exceeds maximum allowed',
          severity: 'HIGH',
          pattern: 'COMPLEX_QUERY',
          location: 'mongoQuery',
          timestamp: new Date()
        })
      }

      // Log query for audit
      if (this.config.enableAuditLogging) {
        this.logQuery(query, sanitizedQuery, threats.length > 0)
      }

    } catch (error) {
      logger.error('Error sanitizing MongoDB query:', error)
      threats.push({
        type: 'QUERY_SANITIZATION_ERROR',
        description: 'Error during query sanitization',
        severity: 'HIGH',
        pattern: 'SANITIZATION_ERROR',
        location: 'mongoQuery',
        timestamp: new Date()
      })
    }

    return { sanitizedQuery, threats }
  }

  /**
   * Remove dangerous MongoDB operators
   */
  private removeDangerousOperators(query: any): any {
    const dangerousOperators = [
      '$where',
      '$regex',
      '$expr',
      '$jsonSchema',
      '$function'
    ]

    const sanitize = (obj: any): any => {
      if (Array.isArray(obj)) {
        return obj.map(item => sanitize(item))
      } else if (obj !== null && typeof obj === 'object') {
        const sanitized: any = {}
        for (const [key, value] of Object.entries(obj)) {
          if (!dangerousOperators.includes(key)) {
            sanitized[key] = sanitize(value)
          }
        }
        return sanitized
      }
      return obj
    }

    return sanitize(query)
  }

  /**
   * Calculate query complexity score
   */
  private calculateQueryComplexity(query: any): number {
    let complexity = 0

    const analyze = (obj: any, depth: number = 0): void => {
      if (depth > 10) { // Prevent infinite recursion
        complexity += 50
        return
      }

      if (Array.isArray(obj)) {
        complexity += obj.length
        obj.forEach(item => analyze(item, depth + 1))
      } else if (obj !== null && typeof obj === 'object') {
        const keys = Object.keys(obj)
        complexity += keys.length

        // Add complexity for specific operators
        keys.forEach(key => {
          if (key.startsWith('$')) {
            complexity += 5 // MongoDB operators add complexity
          }
          analyze(obj[key], depth + 1)
        })
      }
    }

    analyze(query)
    return complexity
  }

  /**
   * Encrypt sensitive field data
   */
  public encryptField(data: string): string {
    if (!this.config.enableFieldEncryption || !data) {
      return data
    }

    try {
      const iv = crypto.randomBytes(this.encryptedFieldConfig.ivLength)
      const cipher = crypto.createCipheriv(this.encryptedFieldConfig.algorithm, this.encryptionKey, iv)
      
      let encrypted = cipher.update(data, 'utf8', 'hex')
      encrypted += cipher.final('hex')
      
      // Combine IV and encrypted data
      return iv.toString('hex') + ':' + encrypted
    } catch (error) {
      logger.error('Error encrypting field:', error)
      return data
    }
  }

  /**
   * Decrypt sensitive field data
   */
  public decryptField(encryptedData: string): string {
    if (!this.config.enableFieldEncryption || !encryptedData || !encryptedData.includes(':')) {
      return encryptedData
    }

    try {
      const [ivHex, encrypted] = encryptedData.split(':')
      const iv = Buffer.from(ivHex, 'hex')
      const decipher = crypto.createDecipheriv(this.encryptedFieldConfig.algorithm, this.encryptionKey, iv)
      
      let decrypted = decipher.update(encrypted, 'hex', 'utf8')
      decrypted += decipher.final('utf8')
      
      return decrypted
    } catch (error) {
      logger.error('Error decrypting field:', error)
      return encryptedData
    }
  }

  /**
   * Create secure database connection string
   */
  public createSecureConnectionString(baseConnectionString: string): string {
    const url = new URL(baseConnectionString)
    
    // Add security parameters
    const securityParams = new URLSearchParams()
    
    if (this.config.enableConnectionEncryption) {
      securityParams.append('ssl', 'true')
      securityParams.append('sslValidate', 'true')
    }
    
    if (this.config.enableReadConcern) {
      securityParams.append('readConcern', 'majority')
    }
    
    if (this.config.enableWriteConcern) {
      securityParams.append('w', 'majority')
      securityParams.append('wtimeout', '5000')
    }
    
    securityParams.append('maxPoolSize', this.config.connectionPoolSize.toString())
    securityParams.append('serverSelectionTimeoutMS', '5000')
    securityParams.append('socketTimeoutMS', this.config.queryTimeout.toString())
    
    // Merge with existing parameters
    const existingParams = url.searchParams
    securityParams.forEach((value, key) => {
      if (!existingParams.has(key)) {
        existingParams.append(key, value)
      }
    })
    
    return url.toString()
  }

  /**
   * Validate database operation permissions
   */
  public validateOperation(operation: string, collection: string, userId?: string): boolean {
    // Define operation permissions
    const permissions: Record<string, string[]> = {
      'read': ['users', 'dresses', 'bookings', 'locations', 'suppliers'],
      'write': ['bookings', 'users', 'notifications'],
      'admin': ['users', 'dresses', 'suppliers', 'locations', 'expenses', 'payments']
    }

    // Basic validation - can be extended with role-based access control
    if (operation === 'read') {
      return permissions.read.includes(collection)
    } else if (operation === 'write') {
      return permissions.write.includes(collection)
    } else if (operation === 'admin') {
      return permissions.admin.includes(collection) && userId !== undefined
    }

    return false
  }

  /**
   * Log database query for audit purposes
   */
  private logQuery(originalQuery: any, sanitizedQuery: any, hasThreat: boolean): void {
    const logEntry = {
      query: sanitizedQuery,
      timestamp: new Date(),
      sanitized: JSON.stringify(originalQuery) !== JSON.stringify(sanitizedQuery)
    }

    this.queryLog.push(logEntry)

    // Log security events for queries with threats
    if (hasThreat) {
      logger.logSecurityEvent(
        'Database query with security threats',
        {
          originalQuery,
          sanitizedQuery,
          modified: logEntry.sanitized
        },
        'MEDIUM',
        {}
      )
    }

    // Keep only last 1000 queries
    if (this.queryLog.length > 1000) {
      this.queryLog = this.queryLog.slice(-1000)
    }
  }

  /**
   * Get database security metrics
   */
  public getSecurityMetrics(): {
    totalQueries: number
    sanitizedQueries: number
    threatQueries: number
    encryptedFields: number
    connectionSecurity: boolean
  } {
    const sanitizedCount = this.queryLog.filter(log => log.sanitized).length
    const threatCount = this.queryLog.filter(log => log.sanitized).length // Simplified

    return {
      totalQueries: this.queryLog.length,
      sanitizedQueries: sanitizedCount,
      threatQueries: threatCount,
      encryptedFields: this.config.enableFieldEncryption ? 1 : 0,
      connectionSecurity: this.config.enableConnectionEncryption
    }
  }

  /**
   * Create secure mongoose schema with validation
   */
  public createSecureSchema(schemaDefinition: any): mongoose.Schema {
    const schema = new mongoose.Schema(schemaDefinition, {
      timestamps: true,
      versionKey: false,
      strict: true,
      strictQuery: true
    })

    // Add security middleware
    schema.pre('save', function(next) {
      // Validate document before saving
      const doc = this.toObject()
      const validation = BackendValidationService.validateInput(
        JSON.stringify(doc),
        'document',
        { sanitizationLevel: 'strict' }
      )

      if (validation.blocked) {
        return next(new Error('Document contains security threats'))
      }

      next()
    })

    schema.pre(['find', 'findOne', 'findOneAndUpdate', 'updateOne', 'updateMany'], function() {
      // Sanitize query before execution
      const query = this.getQuery()
      const { sanitizedQuery, threats } = DatabaseSecurityService.getInstance().sanitizeQuery(query)
      
      if (threats.length > 0) {
        logger.logSecurityEvent(
          'Query sanitization applied',
          { originalQuery: query, sanitizedQuery, threats },
          'MEDIUM',
          {}
        )
      }

      this.setQuery(sanitizedQuery)
    })

    return schema
  }

  /**
   * Get query audit log
   */
  public getQueryLog(): Array<{ query: any; timestamp: Date; sanitized: boolean }> {
    return [...this.queryLog]
  }

  /**
   * Clear query audit log
   */
  public clearQueryLog(): void {
    this.queryLog = []
  }

  /**
   * Update security configuration
   */
  public updateConfig(newConfig: Partial<DatabaseSecurityConfig>): void {
    this.config = { ...this.config, ...newConfig }
    logger.info('Database security configuration updated', this.config)
  }

  /**
   * Get current security configuration
   */
  public getConfig(): DatabaseSecurityConfig {
    return { ...this.config }
  }
}

// Export singleton instance
export default DatabaseSecurityService.getInstance()
