import { Router } from 'express';
import { handleCreateCustomerOrder, handleGetCustomerOrders, handleCancelCustomerOrder } from './customer-order.controller.js';
import { authenticateJWT } from '../../middleware/auth.js';
import { authorizeRoles } from '../../middleware/rbac.js';
import { validateRequest } from '../../middleware/validate.js';
import { createCustomerOrderSchema, updateOrderStatusSchema } from './customer-order.schema.js';
import { Role } from '@prisma/client';

export const customerOrderRouter = Router();

customerOrderRouter.use(authenticateJWT);

customerOrderRouter.get('/', authorizeRoles(Role.ADMIN, Role.OPS, Role.SALES), handleGetCustomerOrders);

customerOrderRouter.post(
  '/',
  authorizeRoles(Role.ADMIN, Role.SALES),
  validateRequest(createCustomerOrderSchema),
  handleCreateCustomerOrder
);

// PATCH /orders/:id/status — Cancel order and release reserved stock
customerOrderRouter.patch(
  '/:id/status',
  authorizeRoles(Role.ADMIN, Role.SALES),
  validateRequest(updateOrderStatusSchema),
  handleCancelCustomerOrder
);
