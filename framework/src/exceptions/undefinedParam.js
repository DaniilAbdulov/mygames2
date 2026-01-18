module.exports = function UndefinedParamError(paramName) {
  this.name = this.constructor.name;

  this.meta = {
    paramName
  };
  this.message =
    `Required parameter '${paramName}' but value is undefined`;
  this.status = 400;
  this.code = 3;

  if (Error.captureStackTrace) {
    Error.captureStackTrace(this, this.constructor);
  } else {
    /* istanbul ignore next */
    this.stack = new Error().stack;
  }
};
