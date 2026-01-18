import logger = require('../interfaces/logger');
import events = require('events');

declare class EventEmitter extends events.EventEmitter {
    constructor(logger: logger);
}

export = EventEmitter;
