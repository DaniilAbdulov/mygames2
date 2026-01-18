const events = require('events');

class EventEmitter extends events.EventEmitter {
  constructor(logger) {
    super({captureRejections: true});
  }

  [events.captureRejectionSymbol](err, event) {
    let errMsg;

    if (typeof err === 'string') {
      errMsg = err;
    } else if (typeof err === 'object' && err.message) {
      errMsg = err.message;
    } else {
      errMsg = JSON.stringify(err);
    }

    console.error(`Uncaught exception in event '${event}': ${errMsg}`);
  }
}

module.exports = EventEmitter;
