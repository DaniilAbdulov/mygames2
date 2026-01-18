const VType = require('./base');
const {isNull, isBoolean} = require('../utils/types');

class VBoolean extends VType {
  _isValidType() {
    return this._schema.nullable && isNull(this._value) || isBoolean(this._value);
  }

  isValid() {
    if (isNull(this._value) && super._isValidNull()) {
      return true;
    }

    if (!this._isValidType()) {
      this._validator._errors.push({
        message: 'Type is incorrect',
        params: {
          typeNeed: 'boolean',
          typeNow: typeof this._value
        },
        path: this._path
      });

      return false;
    }

    return true;
  }
}

module.exports = VBoolean;
