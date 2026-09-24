import { Request, Response, NextFunction } from 'express';
import * as workOrderService from './work-order.service.js';

export async function handleCreateWorkOrder(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const workOrder = await workOrderService.createWorkOrder(req.body);
    res.status(201).json({
      success: true,
      data: workOrder,
      requestId: req.requestId,
    });
  } catch (error) {
    next(error);
  }
}

export async function handleGetWorkOrders(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { locationId } = req.query as { locationId?: string };
    const workOrders = await workOrderService.getWorkOrders({ locationId });
    res.status(200).json({
      success: true,
      data: workOrders,
      requestId: req.requestId,
    });
  } catch (error) {
    next(error);
  }
}

export async function handleUpdateWorkOrderStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    const workOrder = await workOrderService.updateWorkOrderStatus(id, req.body);
    res.status(200).json({
      success: true,
      data: workOrder,
      requestId: req.requestId,
    });
  } catch (error) {
    next(error);
  }
}
