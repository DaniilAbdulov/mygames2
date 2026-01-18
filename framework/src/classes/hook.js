/*
 * Made by Vladislav Moshkovskiy, Esoft. 17.10.2019, 15:35
 */

class Hook {
  constructor(name, priority, options = {}) {
    if (!name) {
      throw new Error('Name is empty!');
    }

    const {isAsync, stopIfError} = options;
    const isEventHook = name.indexOf('onEvent') === 0;
    const isErrorHook = name.indexOf('onError') === 0;

    this._name = name;
    this._priority = !isNaN(Number(priority)) && Number(priority) > 0 ? priority : 100;
    this._pluginLink = null;
    this._isAsync = isEventHook ||
      isErrorHook ||
      isAsync ||
      false;
    this._stopIfError = this._isAsync ?
      false :
      stopIfError || false;
  }

  get Name() {
    return this._name;
  }

  set Name(value) {
    throw new Error('U cant change name!');
  }

  get Priority() {
    return this._priority;
  }

  set Priority(value) {
    throw new Error('U cant change priority!');
  }

  get IsAsync() {
    return this._isAsync;
  }

  set IsAsync(value) {
    if (typeof value !== 'boolean') {
      throw new TypeError('Value should be boolean type');
    }

    if (this._name.indexOf('onEvent') === 0 && !value) {
      throw new Error('Event hooks always async');
    }

    this._isAsync = value;

    if (value) {
      this._stopIfError = false;
    }
  }

  get StopIfError() {
    return this._stopIfError;
  }

  set StopIfError(value) {
    if (typeof value !== 'boolean') {
      throw new TypeError('Value should be boolean type');
    }

    if (this._isAsync && value) {
      throw new Error('Async hook cant block service methods execution');
    }

    this._stopIfError = value;
  }

  set Plugin(link) {
    if (!this._pluginLink) {
      this._pluginLink = link;
    } else {
      throw new Error('U cant change plugin link!');
    }
  }

  get Plugin() {
    return this._pluginLink;
  }

  onCustomAction() {
    return undefined;
  }

  // eslint-disable-next-line require-await
  async action() {
    return undefined;
  }
}

module.exports = Hook;
