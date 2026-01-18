module.exports = function NoMethodError(controllerName, operationName) {
  this.name = this.constructor.name;

  this.meta = {
    controller: controllerName,
    operation: operationName
  };
  this.message = 'No controller or operation';
  this.status = 501;

  if (Error.captureStackTrace) {
    Error.captureStackTrace(this, this.constructor);
  } else {
    /* istanbul ignore next */
    this.stack = new Error().stack;
  }
};
