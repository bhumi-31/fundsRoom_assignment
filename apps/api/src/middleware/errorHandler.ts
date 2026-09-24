import { Request, Response, NextFunction } from 'express';
import { ApiError } from '../utils/apiError.js';
import { logger } from '../utils/logger.js';
import { ZodError } from 'zod';

export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  next: NextFunction
): void {
  const requestId = req.requestId || 'unknown';

  if (err instanceof ApiError) {
    logger.warn({
      requestId,
      statusCode: err.statusCode,
      code: err.code,
      message: err.message,
      path: req.path,
    });

    res.status(err.statusCode).json({
      code: err.code,
      message: err.message,
      requestId,
    });
    return;
  }

  if (err instanceof ZodError) {
    const formattedIssues = err.issues.map(issue => `${issue.path.join('.')}: ${issue.message}`).join(', ');
    logger.warn({
      requestId,
      statusCode: 400,
      code: 'VALIDATION_ERROR',
      message: formattedIssues,
      path: req.path,
    });

    res.status(400).json({
      code: 'VALIDATION_ERROR',
      message: formattedIssues,
      requestId,
    });
    return;
  }

  logger.error({
    requestId,
    err,
    path: req.path,
    message: err.message,
  });

  res.status(500).json({
    code: 'INTERNAL_SERVER_ERROR',
    message: 'An unexpected internal server error occurred',
    requestId,
  });
}
