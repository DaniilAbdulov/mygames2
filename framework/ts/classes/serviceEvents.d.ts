import logger = require('../interfaces/logger');

declare class ServiceEvents {
  constructor(logger: logger);
  listenerCount(eventName: string): number;
  once(eventName: string, listener: (...args: any[]) => void): void;
  emit(eventName: string, ...args: any[]): void;
}

export = ServiceEvents;
