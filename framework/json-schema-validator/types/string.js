const VType = require('./base');
const {isUndefined, isString, isNull} = require('../utils/types');
const formats = require('../formats');

class VString extends VType {
  _isValidType() {
    return this._schema.nullable && isNull(this._value) || isString(this._value);
  }

  isValid() {
    if (isNull(this._value) && super._isValidNull()) {
      return true;
    }

    if (!this._isValidType()) {
      this._validator._errors.push({
        message: 'Type is incorrect',
        params: {
          typeNeed: 'string',
          value: this._value
        },
        path: this._path
      });

      return false;
    }

    const {
      maxLength, minLength, pattern, format, enum: list
    } = this._schema;

    if (!isUndefined(format) && formats[format]) {
      const isValidFormat = formats[format];

      if (
        typeof isValidFormat === 'function' && !isValidFormat(this._value) ||
        isValidFormat instanceof RegExp && !isValidFormat.test(this._value)
      ) {
        this._validator._errors.push({
          message: 'Format of string is not valid',
          params: {
            format,
            value: this._value
          },
          path: this._path
        });

        return false;
      }
    }

    if (!isUndefined(maxLength) && maxLength < this._value.length) {
      this._validator._errors.push({
        message: 'Too long string',
        params: {
          maxLength,
          currentLength: this._value.length
        },
        path: this._path
      });

      return false;
    }

    if (!isUndefined(minLength) && minLength > this._value.length) {
      this._validator._errors.push({
        message: 'Too short string',
        params: {
          minLength,
          currentLength: this._value.length
        },
        path: this._path
      });

      return false;
    }

    if (
      !isUndefined(list) &&
      Array.isArray(list) &&
      list.length &&
      list.indexOf(this._value) === -1
    ) {
      this._validator._errors.push({
        message: 'The enum does not support value',
        params: {
          notInEnum: this._value
        },
        path: this._path
      });

      return false;
    }

    if (!isUndefined(pattern) && !new RegExp(pattern).test(this._value)) {
      this._validator._errors.push({
        message: 'String does not match pattern',
        params: {
          pattern
        },
        path: this._path
      });

      return false;
    }

    return true;
  }
}

module.exports = VString;
