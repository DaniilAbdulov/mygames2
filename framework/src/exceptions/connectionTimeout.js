function ConnectionTimeoutError() {
  this.name = this.constructor.name;

  this.message = 'Connection Timeout';
  this.status = 504;
}

module.exports = ConnectionTimeoutError;
