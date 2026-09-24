import { Request, Response, NextFunction } from 'express';
import * as inventoryService from './inventory.service.js';

export async function handleGetBalances(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { locationId, itemId } = req.query as { locationId?: string; itemId?: string };
    const balances = await inventoryService.getInventoryBalances({ locationId, itemId });

    res.status(200).json({
      success: true,
      data: balances,
      requestId: req.requestId,
    });
  } catch (error) {
    next(error);
  }
}

export async function handleGetLedger(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { locationId, itemId } = req.query as { locationId?: string; itemId?: string };
    const history = await inventoryService.getStockLedgerHistory({ locationId, itemId });

    res.status(200).json({
      success: true,
      data: history,
      requestId: req.requestId,
    });
  } catch (error) {
    next(error);
  }
}

export async function handleReserveInventory(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user!.id;
    const result = await inventoryService.reserveInventoryAtomic(req.body, userId);

    res.status(result.idempotent ? 200 : 201).json({
      success: true,
      data: result,
      requestId: req.requestId,
    });
  } catch (error) {
    next(error);
  }
}

export async function handleAddReceipt(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user!.id;
    const result = await inventoryService.addStockReceipt(req.body, userId);

    res.status(result.idempotent ? 200 : 201).json({
      success: true,
      data: result,
      requestId: req.requestId,
    });
  } catch (error) {
    next(error);
  }
}
