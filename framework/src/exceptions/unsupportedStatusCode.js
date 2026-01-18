module.exports = function UnsupportedStatusCodeError(code, patternCode) {
  this.name = this.constructor.name;

  this.meta = {
    code,
    patternCode
  };
  this.message = `No response code = ${code} or ${patternCode} in spec`;
  this.status = 500;
  this.code = 1;

  if (Error.captureStackTrace) {
    Error.captureStackTrace(this, this.constructor);
  } else {
    /* istanbul ignore next */
    this.stack = new Error().stack;
  }
};
