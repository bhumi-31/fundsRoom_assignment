import { Request, Response, NextFunction } from 'express';
import * as transferService from './transfer.service.js';

export async function handleCreateTransfer(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const transfer = await transferService.createTransfer(req.body);
    res.status(201).json({
      success: true,
      data: transfer,
      requestId: req.requestId,
    });
  } catch (error) {
    next(error);
  }
}

export async function handleGetTransfers(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { locationId } = req.query as { locationId?: string };
    const transfers = await transferService.getTransfers({ locationId });
    res.status(200).json({
      success: true,
      data: transfers,
      requestId: req.requestId,
    });
  } catch (error) {
    next(error);
  }
}

export async function handleTransitionTransfer(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    const userId = req.user!.id;
    const transfer = await transferService.transitionTransferStatus(id, req.body, userId);
    res.status(200).json({
      success: true,
      data: transfer,
      requestId: req.requestId,
    });
  } catch (error) {
    next(error);
  }
}
