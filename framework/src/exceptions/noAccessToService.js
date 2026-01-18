module.exports = function ServiceAccessError() {
  this.name = this.constructor.name;

  this.meta = {};
  this.message = 'U cant use this service';
  this.status = 403;
  this.code = 1;

  if (Error.captureStackTrace) {
    Error.captureStackTrace(this, this.constructor);
  } else {
    /* istanbul ignore next */
    this.stack = new Error().stack;
  }
};
