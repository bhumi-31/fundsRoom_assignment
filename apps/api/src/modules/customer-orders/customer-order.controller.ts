import { Request, Response, NextFunction } from 'express';
import * as customerOrderService from './customer-order.service.js';

export async function handleCreateCustomerOrder(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const salesUserId = req.user!.id;
    const order = await customerOrderService.createCustomerOrder(req.body, salesUserId);
    res.status(201).json({
      success: true,
      data: order,
      requestId: req.requestId,
    });
  } catch (error) {
    next(error);
  }
}

export async function handleGetCustomerOrders(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const salesUserId = req.user?.role === 'SALES' ? req.user.id : undefined;
    const orders = await customerOrderService.getCustomerOrders({ salesUserId });
    res.status(200).json({
      success: true,
      data: orders,
      requestId: req.requestId,
    });
  } catch (error) {
    next(error);
  }
}
