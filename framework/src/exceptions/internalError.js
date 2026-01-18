function InternalError(message, meta) {
  this.name = this.constructor.name;

  this.meta = meta || {};
  this.message = message || 'Undefined internal error';
  this.status = 500;

  if (meta && meta.stack) {
    this.stack = meta.stack;
  } else if (Error.captureStackTrace) {
    Error.captureStackTrace(this, this.constructor);
  } else {
    /* istanbul ignore next */
    this.stack = new Error().stack;
  }
}

module.exports = InternalError;
