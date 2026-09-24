import { Request, Response } from 'express';
import { sseEvents } from './event.emitter.js';

export function handleSSEStream(req: Request, res: Response): void {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders?.();

  // Send initial connection event
  const connectMsg = JSON.stringify({ type: 'connected', message: 'FOUNDRY SSE Stream Active' });
  res.write(`data: ${connectMsg}\n\n`);

  const onEvent = (eventData: any) => {
    res.write(`data: ${JSON.stringify(eventData)}\n\n`);
  };

  sseEvents.on('event', onEvent);

  req.on('close', () => {
    sseEvents.off('event', onEvent);
    res.end();
  });
}
