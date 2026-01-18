module.exports = function ServiceNotFoundError(service) {
  this.name = this.constructor.name;

  this.meta = {service};
  this.message = 'Service not found or empty!';
  this.status = 404;
  this.code = 1;

  if (Error.captureStackTrace) {
    Error.captureStackTrace(this, this.constructor);
  } else {
    /* istanbul ignore next */
    this.stack = new Error().stack;
  }
};
