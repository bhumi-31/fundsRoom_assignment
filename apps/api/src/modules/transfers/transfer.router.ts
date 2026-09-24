import { Router } from 'express';
import { handleCreateTransfer, handleGetTransfers, handleTransitionTransfer } from './transfer.controller.js';
import { authenticateJWT } from '../../middleware/auth.js';
import { authorizeRoles } from '../../middleware/rbac.js';
import { validateRequest } from '../../middleware/validate.js';
import { createTransferSchema, updateTransferStatusSchema } from './transfer.schema.js';
import { Role } from '@prisma/client';

export const transferRouter = Router();

transferRouter.use(authenticateJWT);

transferRouter.get('/', authorizeRoles(Role.ADMIN, Role.OPS), handleGetTransfers);

transferRouter.post(
  '/',
  authorizeRoles(Role.ADMIN, Role.OPS),
  validateRequest(createTransferSchema),
  handleCreateTransfer
);

transferRouter.patch(
  '/:id/status',
  authorizeRoles(Role.ADMIN, Role.OPS),
  validateRequest(updateTransferStatusSchema),
  handleTransitionTransfer
);
