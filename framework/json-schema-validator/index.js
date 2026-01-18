const {
  VNumber,
  VObject,
  VArray,
  VBoolean,
  VInteger,
  VString,
} = require('./types');
const VType = require('./types/base');

class JSONSchema {
  constructor() {
    this._errors = [];
  }

  get Errors() {
    return this._errors;
  }

  isValid(schema = {}, dataToCheck, path = 'root', options) {
    const args = [schema, dataToCheck, path, options];

    if (schema.type) {
      return this._isValidType(...args);
    } else if (schema.allOf) {
      return this._isValidAllOf(...args);
    } else if (schema.anyOf) {
      return this._isValidAnyOf(...args);
    } else if (schema.oneOf) {
      return this._isValidOneOf(...args);
    } else if (schema.not) {
      return this._isValidNot(...args);
    }

    return true;
  }

  _isValidNot(schema, value, path, options) {
    const deepIsValid = !new JSONSchema().isValid(
      schema.not,
      value,
      path,
      options,
    );

    if (!deepIsValid) {
      this._errors.push({
        message: 'Schema are valid for this data',
        params: {
          selector: 'not',
        },
        path,
      });
    }

    return deepIsValid;
  }

  _isValidAllOf(schema, value, path, options) {
    let i = 0;

    for (const item of schema.allOf) {
      if (!new JSONSchema().isValid(item, value, path, options)) {
        this._errors.push({
          message: 'One of allOf schema is not valid',
          params: {
            selector: 'allOf',
            schemaIndex: i,
          },
          path,
        });

        return false;
      }

      i++;
    }

    return true;
  }

  _isValidAnyOf(schema, value, path, options) {
    for (const item of schema.anyOf) {
      if (new JSONSchema().isValid(item, value, path, options)) {
        return true;
      }
    }

    this._errors.push({
      message: 'None schemas are valid',
      params: {
        selector: 'anyOf',
      },
      path,
    });

    return false;
  }

  _isValidOneOf(schema, value, path, options) {
    let validSchemaIndex = -1;
    let i = 0;

    for (const item of schema.oneOf) {
      if (new JSONSchema().isValid(item, value, path, options)) {
        if (validSchemaIndex !== -1) {
          this._errors.push({
            message: 'More than one schema valid for this data',
            params: {
              selector: 'oneOf',
              schemasIndexes: [validSchemaIndex, i],
            },
            path,
          });

          return false;
        }

        validSchemaIndex = i;
      }

      i++;
    }

    if (validSchemaIndex === -1) {
      this._errors.push({
        message: 'None schemas are valid',
        params: {
          selector: 'oneOf',
        },
        path,
      });

      return false;
    }

    return true;
  }

  _isValidType(schema, value, path, options) {
    const {type} = schema;
    const args = [this, schema, value, path, options];
    let classType;

    switch (type) {
      case 'boolean':
        classType = new VBoolean(...args);
        break;
      case 'integer':
        classType = new VInteger(...args);
        break;
      case 'array':
        classType = new VArray(...args);
        break;
      case 'object':
        classType = new VObject(...args);
        break;
      case 'number':
        classType = new VNumber(...args);
        break;
      case 'string':
        classType = new VString(...args);
        break;
      default:
        classType = new VType(...args);
    }

    return classType.isValid();
  }
}

module.exports = JSONSchema;
