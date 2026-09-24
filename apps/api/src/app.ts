import express from 'express';
import cors from 'cors';
import { requestIdMiddleware } from './middleware/requestId.js';
import { errorHandler } from './middleware/errorHandler.js';
import { healthRouter } from './modules/health/health.router.js';

export const app = express();

// Middlewares
app.use(cors());
app.use(express.json());
app.use(requestIdMiddleware);

// Health check endpoint (versioned and unversioned for readiness probes)
app.use('/health', healthRouter);
app.use('/api/v1/health', healthRouter);

// 404 Handler
app.use((req, res) => {
  res.status(404).json({
    code: 'NOT_FOUND',
    message: `Route ${req.method} ${req.path} not found`,
    requestId: req.requestId,
  });
});

// Centralized Error Handler
app.use(errorHandler);
