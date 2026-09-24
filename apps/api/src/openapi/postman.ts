import fs from 'fs';
import path from 'path';

export function generatePostmanCollection() {
  const postmanCollection = {
    info: {
      name: 'FOUNDRY // FORGE-OS API Suite',
      description: 'Production Postman Collection for FOUNDRY Operations ERP REST API',
      schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json',
    },
    item: [
      {
        name: 'Authentication',
        item: [
          {
            name: 'Login (Admin)',
            request: {
              method: 'POST',
              header: [{ key: 'Content-Type', value: 'application/json' }],
              body: {
                mode: 'raw',
                raw: JSON.stringify({ email: 'admin@foundry.com', password: 'Password123!' }, null, 2),
              },
              url: { raw: '{{baseUrl}}/api/v1/auth/login', host: ['{{baseUrl}}'], path: ['api', 'v1', 'auth', 'login'] },
            },
          },
          {
            name: 'Login (Ops)',
            request: {
              method: 'POST',
              header: [{ key: 'Content-Type', value: 'application/json' }],
              body: {
                mode: 'raw',
                raw: JSON.stringify({ email: 'ops@foundry.com', password: 'Password123!' }, null, 2),
              },
              url: { raw: '{{baseUrl}}/api/v1/auth/login', host: ['{{baseUrl}}'], path: ['api', 'v1', 'auth', 'login'] },
            },
          },
        ],
      },
      {
        name: 'Inventory',
        item: [
          {
            name: 'Get Balances',
            request: {
              method: 'GET',
              header: [{ key: 'Authorization', value: 'Bearer {{token}}' }],
              url: { raw: '{{baseUrl}}/api/v1/inventory/balances', host: ['{{baseUrl}}'], path: ['api', 'v1', 'inventory', 'balances'] },
            },
          },
          {
            name: 'Get Ledger History',
            request: {
              method: 'GET',
              header: [{ key: 'Authorization', value: 'Bearer {{token}}' }],
              url: { raw: '{{baseUrl}}/api/v1/inventory/ledger', host: ['{{baseUrl}}'], path: ['api', 'v1', 'inventory', 'ledger'] },
            },
          },
        ],
      },
      {
        name: 'Work Orders',
        item: [
          {
            name: 'Get Work Orders with Computed Shortage',
            request: {
              method: 'GET',
              header: [{ key: 'Authorization', value: 'Bearer {{token}}' }],
              url: { raw: '{{baseUrl}}/api/v1/work-orders', host: ['{{baseUrl}}'], path: ['api', 'v1', 'work-orders'] },
            },
          },
        ],
      },
      {
        name: 'Transfers',
        item: [
          {
            name: 'Get Transfers',
            request: {
              method: 'GET',
              header: [{ key: 'Authorization', value: 'Bearer {{token}}' }],
              url: { raw: '{{baseUrl}}/api/v1/transfers', host: ['{{baseUrl}}'], path: ['api', 'v1', 'transfers'] },
            },
          },
        ],
      },
    ],
    variable: [
      { key: 'baseUrl', value: 'http://localhost:4000' },
      { key: 'token', value: '' },
    ],
  };

  const outputPath = path.resolve(process.cwd(), 'postman_collection.json');
  fs.writeFileSync(outputPath, JSON.stringify(postmanCollection, null, 2));
  console.log(`📮 Exported Postman collection at ${outputPath}`);
}

if (process.env.NODE_ENV !== 'test') {
  generatePostmanCollection();
}
