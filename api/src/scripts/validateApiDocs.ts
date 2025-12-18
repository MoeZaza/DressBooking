#!/usr/bin/env tsx

/**
 * API Documentation Validation Script
 * 
 * This script validates the OpenAPI/Swagger documentation for the BookDress API
 * and checks for common issues and best practices.
 */

import { swaggerSpec } from '../config/swagger.config'

interface ValidationResult {
  valid: boolean
  errors: string[]
  warnings: string[]
  info: string[]
}

async function validateApiDocs(): Promise<ValidationResult> {
  const result: ValidationResult = {
    valid: true,
    errors: [],
    warnings: [],
    info: []
  }
  
  console.log('🔍 Validating API Documentation...')
  
  try {
    // Basic structure validation
    validateBasicStructure(swaggerSpec, result)
    
    // Validate paths and operations
    validatePaths(swaggerSpec, result)
    
    // Validate schemas
    validateSchemas(swaggerSpec, result)
    
    // Validate security definitions
    validateSecurity(swaggerSpec, result)
    
    // Check for best practices
    checkBestPractices(swaggerSpec, result)
    
    // Print results
    printValidationResults(result)
    
  } catch (error) {
    result.valid = false
    result.errors.push(`Validation failed: ${error}`)
    console.error('❌ Validation error:', error)
  }
  
  return result
}

function validateBasicStructure(spec: any, result: ValidationResult) {
  // Check required OpenAPI fields
  if (!spec.openapi) {
    result.errors.push('Missing required field: openapi')
    result.valid = false
  }
  
  if (!spec.info) {
    result.errors.push('Missing required field: info')
    result.valid = false
  } else {
    if (!spec.info.title) {
      result.errors.push('Missing required field: info.title')
      result.valid = false
    }
    if (!spec.info.version) {
      result.errors.push('Missing required field: info.version')
      result.valid = false
    }
  }
  
  if (!spec.paths) {
    result.errors.push('Missing required field: paths')
    result.valid = false
  }
  
  result.info.push(`OpenAPI version: ${spec.openapi}`)
  result.info.push(`API title: ${spec.info?.title}`)
  result.info.push(`API version: ${spec.info?.version}`)
}

function validatePaths(spec: any, result: ValidationResult) {
  if (!spec.paths) return
  
  const pathCount = Object.keys(spec.paths).length
  result.info.push(`Total paths: ${pathCount}`)
  
  let operationCount = 0
  const httpMethods = ['get', 'post', 'put', 'delete', 'patch', 'head', 'options']
  
  Object.entries(spec.paths).forEach(([path, pathItem]: [string, any]) => {
    // Check for path parameters
    const pathParams = path.match(/{([^}]+)}/g) || []
    
    httpMethods.forEach(method => {
      if (pathItem[method]) {
        operationCount++
        const operation = pathItem[method]
        
        // Check for required operation fields
        if (!operation.summary) {
          result.warnings.push(`Missing summary for ${method.toUpperCase()} ${path}`)
        }
        
        if (!operation.description) {
          result.warnings.push(`Missing description for ${method.toUpperCase()} ${path}`)
        }
        
        if (!operation.tags || operation.tags.length === 0) {
          result.warnings.push(`Missing tags for ${method.toUpperCase()} ${path}`)
        }
        
        // Check for response definitions
        if (!operation.responses) {
          result.errors.push(`Missing responses for ${method.toUpperCase()} ${path}`)
          result.valid = false
        } else {
          if (!operation.responses['200'] && !operation.responses['201']) {
            result.warnings.push(`No success response defined for ${method.toUpperCase()} ${path}`)
          }
        }
        
        // Check path parameters are documented
        pathParams.forEach(param => {
          const paramName = param.slice(1, -1) // Remove { }
          const hasParamDoc = operation.parameters?.some((p: any) => 
            p.name === paramName && p.in === 'path'
          )
          if (!hasParamDoc) {
            result.warnings.push(`Path parameter '${paramName}' not documented for ${method.toUpperCase()} ${path}`)
          }
        })
      }
    })
  })
  
  result.info.push(`Total operations: ${operationCount}`)
}

function validateSchemas(spec: any, result: ValidationResult) {
  if (!spec.components?.schemas) {
    result.warnings.push('No schemas defined in components')
    return
  }
  
  const schemaCount = Object.keys(spec.components.schemas).length
  result.info.push(`Total schemas: ${schemaCount}`)
  
  // Check for common schema issues
  Object.entries(spec.components.schemas).forEach(([schemaName, schema]: [string, any]) => {
    if (schema.type === 'object' && !schema.properties) {
      result.warnings.push(`Schema '${schemaName}' is object type but has no properties`)
    }
    
    if (!schema.description) {
      result.warnings.push(`Schema '${schemaName}' missing description`)
    }
  })
}

function validateSecurity(spec: any, result: ValidationResult) {
  if (!spec.components?.securitySchemes) {
    result.warnings.push('No security schemes defined')
    return
  }
  
  const securitySchemeCount = Object.keys(spec.components.securitySchemes).length
  result.info.push(`Security schemes: ${securitySchemeCount}`)
  
  // Check if security is properly applied
  if (!spec.security && !hasOperationSecurity(spec)) {
    result.warnings.push('No global or operation-level security defined')
  }
}

function hasOperationSecurity(spec: any): boolean {
  if (!spec.paths) return false
  
  const httpMethods = ['get', 'post', 'put', 'delete', 'patch', 'head', 'options']
  
  return Object.values(spec.paths).some((pathItem: any) =>
    httpMethods.some(method => pathItem[method]?.security)
  )
}

function checkBestPractices(spec: any, result: ValidationResult) {
  // Check for consistent naming
  if (spec.paths) {
    const paths = Object.keys(spec.paths)
    const inconsistentPaths = paths.filter(path => 
      !path.startsWith('/api/') && !path.startsWith('/')
    )
    
    if (inconsistentPaths.length > 0) {
      result.warnings.push('Some paths don\'t follow consistent naming convention')
    }
  }
  
  // Check for proper HTTP status codes
  if (spec.paths) {
    Object.entries(spec.paths).forEach(([path, pathItem]: [string, any]) => {
      ['post', 'put', 'patch'].forEach(method => {
        if (pathItem[method]?.responses) {
          const responses = pathItem[method].responses
          if (method === 'post' && !responses['201'] && !responses['200']) {
            result.warnings.push(`POST ${path} should typically return 201 or 200`)
          }
        }
      })
    })
  }
  
  // Check for examples
  let exampleCount = 0
  if (spec.paths) {
    Object.values(spec.paths).forEach((pathItem: any) => {
      Object.values(pathItem).forEach((operation: any) => {
        if (operation.requestBody?.content) {
          Object.values(operation.requestBody.content).forEach((content: any) => {
            if (content.example || content.examples) {
              exampleCount++
            }
          })
        }
      })
    })
  }
  
  result.info.push(`Operations with examples: ${exampleCount}`)
  
  if (exampleCount === 0) {
    result.warnings.push('Consider adding examples to improve documentation usability')
  }
}

function printValidationResults(result: ValidationResult) {
  console.log('\n📊 Validation Results:')
  console.log('='.repeat(50))
  
  if (result.errors.length > 0) {
    console.log('\n❌ Errors:')
    result.errors.forEach(error => console.log(`   • ${error}`))
  }
  
  if (result.warnings.length > 0) {
    console.log('\n⚠️  Warnings:')
    result.warnings.forEach(warning => console.log(`   • ${warning}`))
  }
  
  if (result.info.length > 0) {
    console.log('\n📋 Information:')
    result.info.forEach(info => console.log(`   • ${info}`))
  }
  
  console.log('\n' + '='.repeat(50))
  
  if (result.valid) {
    console.log('✅ API Documentation is valid!')
  } else {
    console.log('❌ API Documentation has errors that need to be fixed.')
    process.exit(1)
  }
  
  if (result.warnings.length > 0) {
    console.log(`⚠️  ${result.warnings.length} warning(s) found. Consider addressing them for better documentation quality.`)
  }
}

// Run the script
if (import.meta.url === `file://${process.argv[1]}`) {
  validateApiDocs()
}

export { validateApiDocs }
