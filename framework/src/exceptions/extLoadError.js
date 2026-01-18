function ExtLoadError(message, meta) {
  this.name = this.constructor.name;

  this.meta = meta || {};
  this.message = message || 'Extension load error';
  this.status = 500;
  this.code = 3;

  if (Error.captureStackTrace) {
    Error.captureStackTrace(this, this.constructor);
  } else {
    /* istanbul ignore next */
    this.stack = new Error().stack;
  }
}

module.exports = ExtLoadError;
