const {SERVICE_STATES} = require('./consts');

class States {
  constructor() {
    this._state = SERVICE_STATES.PREPARE;
  }

  setState(newState) {
    this._state = newState;
  }

  get Current() {
    return this._state;
  }

  setTermination() {
    this._state = SERVICE_STATES.TERMINATING;
  }

  get isTerminating() {
    return this._state === SERVICE_STATES.TERMINATING;
  }

  setReady() {
    this._state = SERVICE_STATES.READY;
  }

  get isReady() {
    return this._state === SERVICE_STATES.READY;
  }

  get isPreparing() {
    return this._state === SERVICE_STATES.PREPARE;
  }
}

const t = new States();

module.exports = t;