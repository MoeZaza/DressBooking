import swaggerJSDoc from 'swagger-jsdoc'
import { Options } from 'swagger-jsdoc'
import * as env from './env.config'

/**
 * Swagger/OpenAPI configuration for BookDress API
 */
const swaggerOptions: Options = {
  definition: {
    openapi: '3.0.3',
    info: {
      title: 'BookDress API',
      version: '7.2.0',
      description: `
        Comprehensive API for BookDress - A modern dress rental platform.
        
        ## Features
        - User authentication and management
        - Dress catalog and inventory management
        - Booking and reservation system
        - Fitting appointment scheduling
        - Payment processing (Stripe, PayPal, Visa)
        - Analytics and reporting
        - Multi-language support (Arabic/English)
        - Admin and supplier role management
        
        ## Authentication
        This API uses JWT (JSON Web Tokens) for authentication. Include the token in the Authorization header:
        \`Authorization: Bearer <your-jwt-token>\`
        
        ## Rate Limiting
        API requests are rate-limited to prevent abuse. Standard limits apply per IP address.
        
        ## Localization
        The API supports Arabic (ar) and English (en) languages. Set the Accept-Language header or use language parameters where available.
      `,
      contact: {
        name: 'BookDress API Support',
        email: 'support@bookdress.com'
      },
      license: {
        name: 'ISC',
        url: 'https://opensource.org/licenses/ISC'
      }
    },
    servers: [
      {
        url: env.BACKEND_HOST || 'http://localhost:4002',
        description: 'Development server'
      },
      {
        url: 'https://api.bookdress.com',
        description: 'Production server'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'JWT token obtained from login endpoint'
        },
        apiKey: {
          type: 'apiKey',
          in: 'header',
          name: 'X-API-Key',
          description: 'API key for service-to-service communication'
        }
      },
      parameters: {
        languageParam: {
          name: 'language',
          in: 'path',
          required: true,
          schema: {
            type: 'string',
            enum: ['ar', 'en'],
            default: 'ar'
          },
          description: 'Language code (ar for Arabic, en for English)'
        },
        pageParam: {
          name: 'page',
          in: 'path',
          required: true,
          schema: {
            type: 'integer',
            minimum: 1,
            default: 1
          },
          description: 'Page number for pagination'
        },
        sizeParam: {
          name: 'size',
          in: 'path',
          required: true,
          schema: {
            type: 'integer',
            minimum: 1,
            maximum: 100,
            default: 10
          },
          description: 'Number of items per page'
        },
        idParam: {
          name: 'id',
          in: 'path',
          required: true,
          schema: {
            type: 'string',
            pattern: '^[0-9a-fA-F]{24}$'
          },
          description: 'MongoDB ObjectId'
        }
      },
      responses: {
        UnauthorizedError: {
          description: 'Authentication required',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  error: {
                    type: 'string',
                    example: 'Unauthorized'
                  },
                  message: {
                    type: 'string',
                    example: 'Authentication token required'
                  }
                }
              }
            }
          }
        },
        ForbiddenError: {
          description: 'Insufficient permissions',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  error: {
                    type: 'string',
                    example: 'Forbidden'
                  },
                  message: {
                    type: 'string',
                    example: 'Insufficient permissions to access this resource'
                  }
                }
              }
            }
          }
        },
        NotFoundError: {
          description: 'Resource not found',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  error: {
                    type: 'string',
                    example: 'Not Found'
                  },
                  message: {
                    type: 'string',
                    example: 'The requested resource was not found'
                  }
                }
              }
            }
          }
        },
        ValidationError: {
          description: 'Validation error',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  error: {
                    type: 'string',
                    example: 'Validation Error'
                  },
                  message: {
                    type: 'string',
                    example: 'Invalid input data'
                  },
                  details: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        field: {
                          type: 'string'
                        },
                        message: {
                          type: 'string'
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        },
        ServerError: {
          description: 'Internal server error',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  error: {
                    type: 'string',
                    example: 'Internal Server Error'
                  },
                  message: {
                    type: 'string',
                    example: 'An unexpected error occurred'
                  }
                }
              }
            }
          }
        }
      }
    },
    security: [
      {
        bearerAuth: []
      }
    ],
    tags: [
      {
        name: 'Authentication',
        description: 'User authentication and authorization endpoints'
      },
      {
        name: 'Users',
        description: 'User management and profile operations'
      },
      {
        name: 'Dresses',
        description: 'Dress catalog and inventory management'
      },
      {
        name: 'Bookings',
        description: 'Dress booking and reservation system'
      },
      {
        name: 'Fitting Appointments',
        description: 'Fitting appointment scheduling and management'
      },
      {
        name: 'Payments',
        description: 'Payment processing and financial operations'
      },
      {
        name: 'Locations',
        description: 'Location and geographical data management'
      },
      {
        name: 'Notifications',
        description: 'Notification system and messaging'
      },
      {
        name: 'Analytics',
        description: 'Business analytics and reporting'
      },
      {
        name: 'Admin',
        description: 'Administrative operations and system management'
      },
      {
        name: 'Suppliers',
        description: 'Supplier management and operations'
      }
    ]
  },
  apis: [
    './src/routes/*.ts',
    './src/controllers/*.ts',
    './src/models/*.ts',
    './src/schemas/*.ts'
  ]
}

export const swaggerSpec = swaggerJSDoc(swaggerOptions)
export default swaggerOptions
