module.exports = function UncaughtError(meta) {
  this.name = this.constructor.name;

  this.meta = meta || {};
  this.message = 'Uncaught exception';
  this.status = 554;

  if (meta && meta.stack) {
    this.stack = meta.stack;
  } else if (Error.captureStackTrace) {
    Error.captureStackTrace(this, this.constructor);
  } else {
    /* istanbul ignore next */
    this.stack = new Error().stack;
  }
};
