const VType = require('./base');
const {isNull, isObject, isUndefined} = require('../utils/types');

class VObject extends VType {
  _isValidType() {
    return this._schema.nullable && isNull(this._value) || isObject(this._value);
  }

  isValid() {
    if (isNull(this._value) && super._isValidNull()) {
      return true;
    }

    if (!this._isValidType()) {
      this._validator._errors.push({
        message: 'Type is incorrect',
        params: {
          typeNeed: 'object',
          value: this._value
        },
        path: this._path
      });

      return false;
    }

    const {
      maxProperties, minProperties, required, additionalProperties, patternProperties, properties
    } = this._schema;

    const keys = Object.keys(this._value);

    if (!isUndefined(maxProperties) && maxProperties < keys.length) {
      this._validator._errors.push({
        message: 'Too many properties in object',
        params: {
          maxProperties,
          currentLength: this._value.length
        },
        path: this._path
      });

      return false;
    }

    if (!isUndefined(minProperties) && minProperties > keys.length) {
      this._validator._errors.push({
        message: 'Too few properties in object',
        params: {
          minProperties,
          currentLength: this._value.length
        },
        path: this._path
      });

      return false;
    }

    if (!isUndefined(required) && required.length) {
      for (const item of required) {
        if (!(item in this._value)) {
          this._validator._errors.push({
            message: 'Property required, but value is undefined',
            params: {
              prop: item,
              keys
            },
            path: this._path
          });

          return false;
        }
      }
    }

    const patternPropKeys = patternProperties ? Object.keys(patternProperties) : undefined;

    for (const key of keys) {
      if (
        !this._options?.ignoreAdditionalProperties &&
        additionalProperties === false &&
        properties &&
        !(key in properties) &&
        (
          isUndefined(patternPropKeys) ||
          !isUndefined(patternPropKeys) &&
          !this._isOneOfPatternIsValid(patternPropKeys, key)
        )
      ) {
        this._validator._errors.push({
          message: 'An object cant have additional properties',
          params: {
            additionalProp: key
          },
          path: this._path
        });

        return false;
      }

      const keyValue = this._value[key];

      if (
        !this._options?.ignoreNested &&
        (
          !properties ||
          properties && !(key in properties)
        ) &&
        patternPropKeys
      ) {
        const patternKey = this._getKeyFromPatterns(patternPropKeys, key);

        if (
          patternKey &&
          !this._validator.isValid(patternProperties[patternKey], keyValue, `${this._path}.${key}`)
        ) {
          return false;
        }
      }

      if (
        !this._options?.ignoreNested &&
        properties &&
        key in properties &&
        !this._validator.isValid(properties[key], keyValue, `${this._path}.${key}`)
      ) {
        return false;
      }
    }

    return true;
  }

  _isOneOfPatternIsValid(patternPropKeys, key) {
    for (const patternPropKey of patternPropKeys) {
      const isOk = new RegExp(patternPropKey).test(key);

      if (isOk) {
        return true;
      }
    }

    return false;
  }

  _getKeyFromPatterns(patternPropKeys, key) {
    for (const patternPropKey of patternPropKeys) {
      const isOk = new RegExp(patternPropKey).test(key);

      if (isOk) {
        return patternPropKey;
      }
    }

    return null;
  }
}

module.exports = VObject;
