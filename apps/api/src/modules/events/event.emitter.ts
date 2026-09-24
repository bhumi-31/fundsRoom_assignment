import { EventEmitter } from 'events';

class SSEEventEmitter extends EventEmitter {}

export const sseEvents = new SSEEventEmitter();

export function emitInventoryEvent(eventType: string, data: Record<string, any>) {
  sseEvents.emit('event', {
    type: eventType,
    data,
    timestamp: new Date().toISOString(),
  });
}
