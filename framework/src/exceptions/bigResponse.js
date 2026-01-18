function TooBigResponse() {
  this.name = this.constructor.name;

  this.status = 507;

  if (Error.captureStackTrace) {
    Error.captureStackTrace(this, this.constructor);
  } else {
    /* istanbul ignore next */
    this.stack = new Error().stack;
  }
}

module.exports = TooBigResponse;
