function WrongEventError(message) {
  this.name = this.constructor.name;
  this.message = message;
  this.meta = {};

  if (Error.captureStackTrace) {
    Error.captureStackTrace(this, this.constructor);
  } else {
    /* istanbul ignore next */
    this.stack = new Error().stack;
  }
}

module.exports = WrongEventError;
