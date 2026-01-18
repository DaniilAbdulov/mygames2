class ServiceEvents {
  constructor(logger) {
    this._listeners = null;
  }

  listenerCount(eventName) {
    if (!this._listeners || !this._listeners[eventName]) {
      return 0;
    }

    return this._listeners[eventName].length;
  }

  once(eventName, listener) {
    if (!this._listeners) {
      this._listeners = {};
    }

    if (!this._listeners[eventName]) {
      this._listeners[eventName] = [];
    }

    this._listeners[eventName].push(listener);
  }

  async emit(eventName, ...args) {
    if (!this._listeners || !this._listeners[eventName]) {
      return;
    }

    for (const listener of this._listeners[eventName]) {
      try {
        // eslint-disable-next-line
        await listener(...args);
      } catch (err) {
        console.error(`Service event emit error: ${err.message}`);
      }
    }

    delete this._listeners[eventName];

    if (!Object.keys(this._listeners).length) {
      this._listeners = null;
    }
  }
}

module.exports = ServiceEvents;
