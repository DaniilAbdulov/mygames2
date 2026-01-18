
class Context {
  constructor() {
    this._context = null;
  }

  set(key, value) {
    if (!key) {
      throw new Error('Key should not be empty');
    }

    if (!this._context) {
      this._context = {};
    }

    this._context[key] = value;

    return this;
  }

  remove(key) {
    if (!key) {
      throw new Error('Key should not be empty');
    }

    if (!this._context) {
      return this;
    }

    delete this._context[key];

    return this;
  }

  has(key) {
    if (!key) {
      throw new Error('Key should not be empty');
    }

    if (!this._context) {
      return false;
    }

    return key in this._context;
  }

  get(key) {
    if (!key) {
      throw new Error('Key should not be empty');
    }

    if (!this._context) {
      return null;
    }

    return this._context[key];
  }
}

module.exports = Context;
