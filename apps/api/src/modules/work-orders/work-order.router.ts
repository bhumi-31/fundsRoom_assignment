import { Router } from 'express';
import { handleCreateWorkOrder, handleGetWorkOrders, handleUpdateWorkOrderStatus } from './work-order.controller.js';
import { authenticateJWT } from '../../middleware/auth.js';
import { authorizeRoles } from '../../middleware/rbac.js';
import { validateRequest } from '../../middleware/validate.js';
import { createWorkOrderSchema, updateWorkOrderStatusSchema } from './work-order.schema.js';
import { Role } from '@prisma/client';

export const workOrderRouter = Router();

workOrderRouter.use(authenticateJWT);

workOrderRouter.get('/', authorizeRoles(Role.ADMIN, Role.OPS), handleGetWorkOrders);

// ADMIN manages Work Orders (Mandatory RBAC test!)
workOrderRouter.post(
  '/',
  authorizeRoles(Role.ADMIN),
  validateRequest(createWorkOrderSchema),
  handleCreateWorkOrder
);

workOrderRouter.patch(
  '/:id/status',
  authorizeRoles(Role.ADMIN, Role.OPS),
  validateRequest(updateWorkOrderStatusSchema),
  handleUpdateWorkOrderStatus
);
