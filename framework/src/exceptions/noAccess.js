module.exports = function NoAccessError(message) {
  this.name = this.constructor.name;

  this.meta = {};
  this.message = message || `Access denied :)`;
  this.status = 403;
  this.code = 0;

  this.frameworkError = true; // using only in public classes of errors

  if (Error.captureStackTrace) {
    Error.captureStackTrace(this, this.constructor);
  } else {
    /* istanbul ignore next */
    this.stack = new Error().stack;
  }
};
