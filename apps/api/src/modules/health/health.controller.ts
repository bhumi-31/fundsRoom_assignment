import { Request, Response } from 'express';
import { prisma } from '../../db/prisma.js';
import { logger } from '../../utils/logger.js';

export async function getHealthStatus(req: Request, res: Response): Promise<void> {
  const requestId = req.requestId || 'unknown';
  let dbStatus = 'OFFLINE';
  let isHealthy = false;

  try {
    await prisma.$queryRaw`SELECT 1`;
    dbStatus = 'ONLINE';
    isHealthy = true;
  } catch (error) {
    logger.error({ requestId, error }, 'Database health check failed');
  }

  const statusCode = isHealthy ? 200 : 503;
  res.status(statusCode).json({
    status: isHealthy ? 'ONLINE' : 'DEGRADED',
    service: 'foundry-api',
    timestamp: new Date().toISOString(),
    uptimeSeconds: process.uptime(),
    database: dbStatus,
    requestId,
  });
}
