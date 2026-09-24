import {
  OpenAPIRegistry,
  OpenApiGeneratorV3,
  extendZodWithOpenApi,
} from '@asteasolutions/zod-to-openapi';
import { z } from 'zod';
import fs from 'fs';
import path from 'path';

extendZodWithOpenApi(z);

export const registry = new OpenAPIRegistry();

// Register Security Scheme
registry.registerComponent('securitySchemes', 'bearerAuth', {
  type: 'http',
  scheme: 'bearer',
  bearerFormat: 'JWT',
});

// Register Health Route
registry.registerPath({
  method: 'get',
  path: '/api/v1/health',
  summary: 'Health and DB readiness check endpoint',
  responses: {
    200: {
      description: 'System health status',
      content: {
        'application/json': {
          schema: z.object({
            status: z.string(),
            service: z.string(),
            timestamp: z.string(),
            database: z.string(),
            requestId: z.string(),
          }),
        },
      },
    },
  },
});

export function generateOpenAPIDocument() {
  const generator = new OpenApiGeneratorV3(registry.definitions);
  return generator.generateDocument({
    openapi: '3.0.0',
    info: {
      title: 'FOUNDRY // FORGE-OS API Engine',
      version: '1.0.0',
      description: 'Production Operations ERP RESTful API specification auto-generated from Zod schemas.',
    },
    servers: [
      {
        url: 'http://localhost:4000',
        description: 'Local Development Server',
      },
    ],
  });
}

if (process.env.NODE_ENV !== 'test') {
  const doc = generateOpenAPIDocument();
  const outputPath = path.resolve(process.cwd(), 'openapi.json');
  fs.writeFileSync(outputPath, JSON.stringify(doc, null, 2));
  console.log(`📄 Generated OpenAPI 3.0 specification at ${outputPath}`);
}
