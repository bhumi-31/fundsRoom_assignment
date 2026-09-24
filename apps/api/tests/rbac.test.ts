import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { app } from '../src/app.js';
import jwt from 'jsonwebtoken';
import { env } from '../src/config/env.js';
import { Role } from '@prisma/client';

describe('RBAC Authorization Security Middleware', () => {
  it('[Mandatory Test #5] Unauthorized user cannot perform restricted operation (SALES cannot create Work Orders -> HTTP 403)', async () => {
    // Generate valid JWT token with SALES role claim
    const salesToken = jwt.sign(
      {
        id: 'user-sales-123',
        email: 'sales@foundry.com',
        role: Role.SALES,
        assignedLocationId: null,
      },
      env.JWT_SECRET
    );

    const response = await request(app)
      .post('/api/v1/work-orders')
      .set('Authorization', `Bearer ${salesToken}`)
      .send({
        locationId: '00000000-0000-0000-0000-000000000001',
        itemId: '00000000-0000-0000-0000-000000000002',
        requiredQty: 10,
      });

    expect(response.status).toBe(403);
    expect(response.body.code).toBe('FORBIDDEN');
    expect(response.body.message).toContain("Role 'SALES' is not authorized");
    expect(response.body.requestId).toBeDefined();
  });
});
