module.exports = function BadParamError(paramName, reason) {
  this.name = this.constructor.name;

  this.meta = {
    paramName,
    errMsg: typeof reason !== 'string' ? JSON.stringify(reason) : reason
  };
  this.message = `Cant get param '${paramName}'`;
  this.status = 400;
  this.code = 1;

  if (Error.captureStackTrace) {
    Error.captureStackTrace(this, this.constructor);
  } else {
    /* istanbul ignore next */
    this.stack = new Error().stack;
  }
};
