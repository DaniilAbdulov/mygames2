module.exports = function ValidationError(paramName, path, value, params, reason, status) {
  this.name = this.constructor.name;

  this.meta = {
    paramProps: typeof params !== 'string' ? JSON.stringify(params) : params,
    paramName,
    path,
    value: typeof value !== 'string' && value !== null ? JSON.stringify(value) : value
  };
  this.message = `Wrong parameter '${paramName}' at path = '${path}'`;
  this.status = status || 400;

  if (this.status === 400) {
    this.code = 4;
  } else if (this.status === 500) {
    this.code = 2;
  }

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
