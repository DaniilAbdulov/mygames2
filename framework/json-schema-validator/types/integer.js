const VType = require('./base');
const {isUndefined, isNumber, isNull} = require('../utils/types');

class VNumber extends VType {
  _isValidType() {
    if (this._schema.nullable && isNull(this._value)) {
      return false;
    }

    if (!isNumber(this._value) || !Number.isInteger(this._value)) {
      return false;
    }

    return true;
  }

  isValid() {
    if (isNull(this._value) && super._isValidNull()) {
      return true;
    }

    if (!this._isValidType()) {
      this._validator._errors.push({
        message: 'Type is incorrect',
        params: {
          typeNeed: 'integer',
          value: this._value
        },
        path: this._path
      });

      return false;
    }

    const {
      maximum, exclusiveMaximum, minimum, exclusiveMinimum, enum: list, multipleOf
    } = this._schema;

    if (
      !isUndefined(maximum) &&
      (
        !isUndefined(exclusiveMaximum) && exclusiveMaximum && maximum <= this._value ||
        isUndefined(exclusiveMaximum) && maximum < this._value
      )
    ) {
      this._validator._errors.push({
        message: 'Value is greater than it can be',
        params: {
          max: maximum,
          exclusive: !!exclusiveMaximum,
          value: this._value
        },
        path: this._path
      });

      return false;
    }

    if (
      !isUndefined(minimum) &&
      (
        !isUndefined(exclusiveMinimum) && exclusiveMinimum && minimum >= this._value ||
        isUndefined(exclusiveMinimum) && minimum > this._value
      )
    ) {
      this._validator._errors.push({
        message: 'Value is less than it can be',
        params: {
          min: minimum,
          exclusive: !!exclusiveMinimum,
          value: this._value
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

    if (
      !isUndefined(multipleOf) &&
      multipleOf !== 0 &&
      this._value % multipleOf !== 0
    ) {
      this._validator._errors.push({
        message: 'Cant divide without trace',
        params: {
          multipleOf,
          value: this._value
        },
        path: this._path
      });

      return false;
    }

    return true;
  }
}

module.exports = VNumber;
