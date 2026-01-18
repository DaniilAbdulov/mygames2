module.exports = function SchemaValidationError(errors) {
  this.name = this.constructor.name;

  this.errors = errors;
  this.message = 'Service schema not valid!';
  this.status = 400;

  if (Error.captureStackTrace) {
    Error.captureStackTrace(this, this.constructor);
  } else {
    /* istanbul ignore next */
    this.stack = new Error().stack;
  }
};
