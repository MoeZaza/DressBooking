#!/usr/bin/env tsx

/**
 * API Documentation Generation Script
 * 
 * This script generates OpenAPI/Swagger documentation for the BookDress API
 * and exports it to various formats (JSON, YAML).
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { swaggerSpec } from '../config/swagger.config'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

async function generateApiDocs() {
  try {
    console.log('🚀 Generating API Documentation...')
    
    // Create docs directory if it doesn't exist
    const docsDir = path.join(__dirname, '../../../docs/api')
    if (!fs.existsSync(docsDir)) {
      fs.mkdirSync(docsDir, { recursive: true })
    }
    
    // Generate OpenAPI JSON specification
    const jsonPath = path.join(docsDir, 'openapi.json')
    fs.writeFileSync(jsonPath, JSON.stringify(swaggerSpec, null, 2))
    console.log(`✅ Generated OpenAPI JSON: ${jsonPath}`)
    
    // Generate OpenAPI YAML specification (if yaml package is available)
    try {
      const yaml = await import('yaml')
      const yamlPath = path.join(docsDir, 'openapi.yaml')
      fs.writeFileSync(yamlPath, yaml.stringify(swaggerSpec))
      console.log(`✅ Generated OpenAPI YAML: ${yamlPath}`)
    } catch (error) {
      console.log('⚠️  YAML generation skipped (yaml package not installed)')
    }
    
    // Generate API documentation summary
    const summary = generateApiSummary(swaggerSpec)
    const summaryPath = path.join(docsDir, 'api-summary.md')
    fs.writeFileSync(summaryPath, summary)
    console.log(`✅ Generated API Summary: ${summaryPath}`)
    
    // Generate endpoint list
    const endpointsList = generateEndpointsList(swaggerSpec)
    const endpointsPath = path.join(docsDir, 'endpoints.md')
    fs.writeFileSync(endpointsPath, endpointsList)
    console.log(`✅ Generated Endpoints List: ${endpointsPath}`)
    
    console.log('\n🎉 API Documentation generated successfully!')
    console.log('\n📖 Access documentation at:')
    console.log('   • Swagger UI: http://localhost:4002/api-docs')
    console.log('   • JSON Spec: http://localhost:4002/api-docs.json')
    console.log(`   • Local Files: ${docsDir}`)
  } catch (error) {
    console.error('❌ Error generating API documentation:', error)
    process.exit(1)
  }
}

function generateApiSummary(spec: any): string {
  const { info, servers, tags } = spec
  
  return `# ${info.title} - API Documentation

${info.description}

## API Information

- **Version**: ${info.version}
- **Contact**: ${info.contact?.email || 'N/A'}
- **License**: ${info.license?.name || 'N/A'}

## Servers

${servers.map((server: any) => `- **${server.description}**: ${server.url}`).join('\n')}

## API Categories

${tags.map((tag: any) => `### ${tag.name}\n${tag.description}\n`).join('\n')}

## Authentication

This API uses JWT (JSON Web Tokens) for authentication. Include the token in the Authorization header:

\`\`\`
Authorization: Bearer <your-jwt-token>
\`\`\`

## Rate Limiting

API requests are rate-limited to prevent abuse. Standard limits apply per IP address.

## Localization

The API supports Arabic (ar) and English (en) languages. Set the Accept-Language header or use language parameters where available.

## Getting Started

1. Start the API server: \`npm run dev\`
2. Access Swagger UI: http://localhost:4002/api-docs
3. Use the interactive documentation to test endpoints
4. Obtain JWT token from login endpoints for authenticated requests

## Support

For API support and questions, please contact: ${info.contact?.email || 'support@bookdress.com'}
`
}

function generateEndpointsList(spec: any): string {
  const { paths } = spec
  let endpointsList = '# API Endpoints Reference\n\n'
  
  // Group endpoints by tags
  const endpointsByTag: { [key: string]: any[] } = {}
  
  Object.entries(paths).forEach(([path, methods]: [string, any]) => {
    Object.entries(methods).forEach(([method, endpoint]: [string, any]) => {
      const tags = endpoint.tags || ['Untagged']
      tags.forEach((tag: string) => {
        if (!endpointsByTag[tag]) {
          endpointsByTag[tag] = []
        }
        endpointsByTag[tag].push({
          method: method.toUpperCase(),
          path,
          summary: endpoint.summary,
          description: endpoint.description,
          security: endpoint.security
        })
      })
    })
  })
  
  // Generate markdown for each tag
  Object.entries(endpointsByTag).forEach(([tag, endpoints]) => {
    endpointsList += `## ${tag}\n\n`
    
    endpoints.forEach(endpoint => {
      const authRequired = endpoint.security && endpoint.security.length > 0 ? '🔒' : '🔓'
      endpointsList += `### ${authRequired} ${endpoint.method} ${endpoint.path}\n\n`
      endpointsList += `**${endpoint.summary}**\n\n`
      if (endpoint.description) {
        endpointsList += `${endpoint.description}\n\n`
      }
      endpointsList += '---\n\n'
    })
  })
  
  return endpointsList
}

// Run the script
if (import.meta.url === `file://${process.argv[1]}`) {
  generateApiDocs()
}

export { generateApiDocs }
