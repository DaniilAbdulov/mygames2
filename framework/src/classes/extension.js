class Extension {
  constructor(type, name, options = {}) {
    if (!type || !name) {
      throw new Error('Ext type or name is empty');
    }

    this._name = name;
    this._type = type;

    if (options.autoExecute) {
      this._autoExec = true;
    }

    if (this._type === Extension.Types.STATIC) {
      this._traceMode = Extension.TraceModeTypes.DISABLE;
    } else if (options.traceMode) {
      this._traceMode = options.traceMode;
    }

    if (options.requiredExts) {
      this._requiredExts = options.requiredExts;
    }
  }

  load() {
    return undefined;
  }

  static get Types() {
    return {
      STATIC: 1,
      DYNAMIC: 2,
    };
  }

  static get TraceModeTypes() {
    return {
      AUTO: 1,
      MANUAL: 2,
      DISABLE: 3,
    };
  }

  get TraceMode() {
    return this._traceMode || Extension.TraceModeTypes.AUTO;
  }

  get AutoExecute() {
    return this._autoExec;
  }

  get Key() {
    return this._key || this.Name;
  }

  set Key(newKey) {
    if (!newKey) {
      throw new Error('New key is empty');
    }

    this._key = newKey;
  }

  get Name() {
    return this._name.toLowerCase();
  }

  get Type() {
    return this._type;
  }

  get RequiredExts() {
    return this._requiredExts;
  }

  // используется для внутренних системных дополнений и не должно быть описано в ts интерфейсе
  isInternal() {
    this._isInternal = true;
  }

  // используется для внутренних системных дополнений и не должно быть описано в ts интерфейсе
  get IsInternal() {
    return this._isInternal;
  }

  onClose() {
    return undefined;
  }

  onCustomAction() {
    return undefined;
  }

  action() {
    throw new Error('Must be implemented');
  }
}

module.exports = Extension;
