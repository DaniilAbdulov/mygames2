module.exports = function ServiceMethodNotFoundError(service, method) {
  this.name = this.constructor.name;

  this.meta = {service, method};
  this.message = 'Service method not found or empty!';
  this.status = 404;
  this.code = 2;

  if (Error.captureStackTrace) {
    Error.captureStackTrace(this, this.constructor);
  } else {
    /* istanbul ignore next */
    this.stack = new Error().stack;
  }
};
