const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Bsfye API Documentation',
      version: '1.0.0',
      description: 'Complete API documentation for Bsfye backend services',
      contact: {
        name: 'Bsfye Support',
        url: 'https://bsfye.com',
        email: 'support@bsfye.com'
      }
    },
    servers: [
      {
        url: 'http://localhost:5004',
        description: 'Development Server'
      },
      {
        url: 'https://api.bsfye.com',
        description: 'Production Server'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'JWT Authorization header using the Bearer scheme'
        }
      },
      schemas: {
        Error: {
          type: 'object',
          properties: {
            status: {
              type: 'boolean',
              example: false
            },
            message: {
              type: 'string',
              example: 'Error message'
            }
          }
        },
        Success: {
          type: 'object',
          properties: {
            status: {
              type: 'boolean',
              example: true
            },
            message: {
              type: 'string',
              example: 'Success message'
            },
            data: {
              type: 'object'
            }
          }
        }
      }
    }
  },
  apis: ['./src/routes/*.js']
};

const specs = swaggerJsdoc(options);

module.exports = specs;
