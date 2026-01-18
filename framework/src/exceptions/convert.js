module.exports = function ConvertError(value, type, reason) {
  this.name = this.constructor.name;

  this.meta = {
    value, type
  };
  this.message =
    `Cant convert value '${value}' to type '${type}'`;
  this.status = 400;
  this.code = 2;

  if (reason) {
    this.meta.errMsg = reason;
  }

  if (Error.captureStackTrace) {
    Error.captureStackTrace(this, this.constructor);
  } else {
    /* istanbul ignore next */
    this.stack = new Error().stack;
  }
};
