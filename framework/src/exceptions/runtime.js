function RuntimeError(message, meta, code) {
  this.name = this.constructor.name;

  this.meta = meta || {};
  this.message = message || 'Runtime error without message';
  this.status = 555;

  this.frameworkError = true; // using only in public classes of errors

  if (code) {
    this.code = code;
  }

  if (meta && meta.stack) {
    this.stack = meta.stack;
  } else if (Error.captureStackTrace) {
    Error.captureStackTrace(this, this.constructor);
  } else {
    /* istanbul ignore next */
    this.stack = new Error().stack;
  }
}

module.exports = RuntimeError;
