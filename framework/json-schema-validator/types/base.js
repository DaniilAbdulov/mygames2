class VType {
  constructor(validator, schema, value, path, options) {
    this._schema = schema;
    this._value = value;
    this._validator = validator;
    this._path = path;

    if (options) {
      this._options = options;
    }
  }

  _isValidType() {
    return false;
  }

  _isValidNull() {
    if (!this._schema.nullable) {
      this._validator._errors.push({
        message: 'Value is null, but nullable false',
        params: {},
        path: this._path
      });

      return false;
    }

    return true;
  }

  isValid() {
    if (!this._isValidType()) {
      this._validator._errors.push({
        message: 'Unknown type',
        params: {},
        path: this._path
      });
    }

    return false;
  }
}

module.exports = VType;
