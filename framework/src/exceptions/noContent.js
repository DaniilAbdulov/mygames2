module.exports = function NoContentError(type, codes) {
  this.name = this.constructor.name;

  this.meta = {
    type
  };
  this.message = 'No available content type in spec';

  if (codes) {
    this.meta.codes = codes;
  }

  this.status = 415;

  if (Error.captureStackTrace) {
    Error.captureStackTrace(this, this.constructor);
  } else {
    /* istanbul ignore next */
    this.stack = new Error().stack;
  }
};
