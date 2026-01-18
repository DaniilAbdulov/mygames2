/* eslint-disable id-blacklist */

const VType = require('./base');
const {isUndefined, isArray, isNull} = require('../utils/types');

class VArray extends VType {
  _isValidType() {
    return this._schema.nullable && isNull(this._value) || isArray(this._value);
  }

  isValid() {
    if (isNull(this._value) && super._isValidNull()) {
      return true;
    }

    if (!this._isValidType()) {
      this._validator._errors.push({
        message: 'Type is incorrect',
        params: {
          typeNeed: 'array',
          typeNow: typeof this._value
        },
        path: this._path
      });

      return false;
    }

    const {
      maxItems, minItems, items, contains, enum: list, uniqueItems
    } = this._schema;

    if (!isUndefined(maxItems) && maxItems < this._value.length) {
      this._validator._errors.push({
        message: 'Items count more than can be',
        params: {
          maxItems,
          currentLength: this._value.length
        },
        path: this._path
      });

      return false;
    }

    if (!isUndefined(minItems) && minItems > this._value.length) {
      this._validator._errors.push({
        message: 'Items count less than can be',
        params: {
          minItems,
          currentLength: this._value.length
        },
        path: this._path
      });

      return false;
    }

    if (!isUndefined(contains) && this._value.indexOf(contains) === -1) {
      this._validator._errors.push({
        message: 'Must contain a value, but does not',
        params: {
          contains
        },
        path: this._path
      });

      return false;
    }

    if (!isUndefined(items) && !this._options?.ignoreNested) {
      for (let i = 0; i < this._value.length; i++) {
        const schema = isArray(items) ? items[i] : items;

        if (!this._validator.isValid(schema, this._value[i], `${this._path}[${i}]`)) {
          return false;
        }
      }
    }

    if (
      !isUndefined(list) &&
      Array.isArray(list) &&
      list.length
    ) {
      const serializedList = [];
      const serializedValue = JSON.stringify(this._value);

      for (const item of list) {
        serializedList.push(JSON.stringify(item));
      }

      if (serializedList.indexOf(serializedValue) === -1) {
        this._validator._errors.push({
          message: 'The enum does not support one of array elements',
          params: {
            notInEnum: serializedValue
          },
          path: this._path
        });

        return false;
      }
    }

    if (!isUndefined(uniqueItems) && uniqueItems && this._value.length !== 1) {
      const uniq = new Set();

      for (const item of this._value) {
        uniq.add(JSON.stringify(item));
      }

      if (uniq.size !== this._value.length) {
        this._validator._errors.push({
          message: 'Elements of array not unique',
          params: {},
          path: this._path
        });

        return false;
      }
    }

    return true;
  }
}

module.exports = VArray;
