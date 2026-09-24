import { Router } from 'express';
import { handleGetBalances, handleGetLedger, handleReserveInventory, handleAddReceipt } from './inventory.controller.js';
import { authenticateJWT } from '../../middleware/auth.js';
import { authorizeRoles } from '../../middleware/rbac.js';
import { validateRequest } from '../../middleware/validate.js';
import { reserveInventorySchema, addStockReceiptSchema, getInventoryQuerySchema } from './inventory.schema.js';
import { Role } from '@prisma/client';

export const inventoryRouter = Router();

inventoryRouter.use(authenticateJWT);

inventoryRouter.get('/balances', validateRequest(getInventoryQuerySchema), handleGetBalances);
inventoryRouter.get('/ledger', validateRequest(getInventoryQuerySchema), handleGetLedger);
inventoryRouter.post(
  '/reserve',
  authorizeRoles(Role.ADMIN, Role.OPS, Role.SALES),
  validateRequest(reserveInventorySchema),
  handleReserveInventory
);
inventoryRouter.post(
  '/receipt',
  authorizeRoles(Role.ADMIN, Role.OPS),
  validateRequest(addStockReceiptSchema),
  handleAddReceipt
);
