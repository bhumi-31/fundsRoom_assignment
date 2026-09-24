import { Request, Response, NextFunction } from 'express';
import * as authService from './auth.service.js';

export async function handleRegister(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const result = await authService.registerUser(req.body);
    res.status(201).json({
      success: true,
      data: result,
      requestId: req.requestId,
    });
  } catch (error) {
    next(error);
  }
}

export async function handleLogin(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const result = await authService.loginUser(req.body);
    res.status(200).json({
      success: true,
      data: result,
      requestId: req.requestId,
    });
  } catch (error) {
    next(error);
  }
}

export async function handleMe(req: Request, res: Response): Promise<void> {
  res.status(200).json({
    success: true,
    data: req.user,
    requestId: req.requestId,
  });
}
