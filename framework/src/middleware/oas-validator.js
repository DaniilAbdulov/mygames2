'use strict';

const {
  isNull,
  isString,
  isArray,
  isObject,
  isUndefined,
  isNumber,
  isBigInt,
} = require('../utils');
const {
  BadParamError,
  UndefinedParamError,
  ConvertError,
  ValidationError,
  NoContentError,
} = require('../exceptions');
const Validator = require('../../json-schema-validator');
const {logger} = require('../lib');

class RequestValidator {
  constructor(req, {paths}, requestedSpecPath, parameters) {
    const method = req.method.toLowerCase();

    this._req = req;
    this._requestBody = paths[requestedSpecPath][method].requestBody;
    this._parameters = parameters;

    console.debug(`Requested method-url pair: ${method} - ${req.url}`);
  }

  static filterParams(methodParameters, pathParameters) {
    const result = methodParameters;

    const paramNames = methodParameters.map(({name}) => name);

    pathParameters.forEach((pathParam) => {
      if (!paramNames.includes(pathParam.name)) {
        result.push(pathParam);
      }
    });

    return result;
  }

  getCurrentContent(section) {
    const type = this._req.headers['content-type'] || '*/*';

    return [section[type] || section['application/json'] || {}, type];
  }

  static getParameterType(schema, paramValue) {
    const {type, schema: schemaDeep} = schema;

    if (!type && schemaDeep) {
      /* istanbul ignore next */
      return RequestValidator.getParameterType(schemaDeep, paramValue);
    } else if (!type && schema.enum) {
      return typeof paramValue;
    }

    return type || 'object';
  }

  getParameterValue(parameter) {
    const {in: paramLocation, name} = parameter;
    let paramValue;

    switch (paramLocation) {
      case 'path':
        paramValue = this._req.params[name];

        // даже не знаю что надо сделать чтоб сюда попасть, но магия случается
        if (`{${name}}` === paramValue) {
          /* istanbul ignore next */
          paramValue = undefined;
        }

        break;
      case 'query':
        paramValue = this._req.query[name];

        if (!paramValue && parameter.schema.type === 'boolean') {
          paramValue = 'true';
        }

        break;
      case 'header':
        paramValue = this._req.headers[name.toLowerCase()];

        break;
      case 'cookie':
        paramValue = this._req.cookies[name];

        break;
      default:
        throw new BadParamError(
          name,
          `Current (${paramLocation}) location not implemented`,
        );
    }

    return paramValue;
  }

  convertComplexValue(paramValue, schema, name, path) {
    if (schema.anyOf) {
      let result = new Error();

      for (const schemaToTry of schema.anyOf) {
        try {
          result = this.convertValue(paramValue, schemaToTry, name, path);

          break;
        } catch (err) {
          // nothing
        }
      }

      if (result instanceof Error) {
        throw new ValidationError(
          name,
          path,
          paramValue,
          {selector: 'anyOf'},
          'None schemas are valid',
        );
      }

      return result;
    } else if (schema.oneOf) {
      const validSchemaIndexes = [];
      let i = 0;
      let result = new Error();

      for (const schemaToTry of schema.oneOf) {
        try {
          result = this.convertValue(paramValue, schemaToTry, name, path);

          validSchemaIndexes.push(i);
        } catch (err) {
          //
        }

        i++;
      }

      if (validSchemaIndexes.length > 1) {
        throw new ValidationError(
          name,
          path,
          paramValue,
          {selector: 'oneOf', schemasIndexes: validSchemaIndexes},
          'More than one schema valid for this data',
        );
      }

      if (result instanceof Error) {
        throw new ValidationError(
          name,
          path,
          paramValue,
          {selector: 'oneOf'},
          'None schemas are valid',
        );
      }

      return result;
    } else if (schema.allOf) {
      let i = 0;
      let result = paramValue;

      for (const schemaToTry of schema.allOf) {
        try {
          result = this.convertValue(result, schemaToTry, name, path, {
            ignoreAdditionalProperties: true,
          });
        } catch (err) {
          throw new ValidationError(
            name,
            path,
            paramValue,
            {selector: 'allOf', schemaIndex: i},
            'One of allOf schema is not valid',
          );
        }

        i++;
      }

      return result;
    }

    return undefined;
  }

  convertValue(paramValue, schema, name, path, defaultOptions) {
    if (isUndefined(schema) || schema === null) {
      return paramValue;
    }

    const {default: defaultVal} = schema;

    if (
      isNull(paramValue) ||
      paramValue === 'null' ||
      (isNull(defaultVal) && isUndefined(paramValue))
    ) {
      paramValue = null;
    }

    if (isUndefined(paramValue)) {
      if (isUndefined(defaultVal)) {
        return undefined;
      } else if (!isUndefined(defaultVal)) {
        paramValue = defaultVal;
      }
    }

    // выглядит странно? ничего странного - не создаем структур,
    // которые могут не понадобиться
    let validatorOptions = defaultOptions ? {...defaultOptions} : null;

    if (schema.oneOf || schema.anyOf || schema.allOf) {
      // если в схеме есть дискриминатор и это схема oneOf,
      // то просто поверяем по выбранной схеме
      if (
        schema.oneOf &&
        isObject(paramValue) &&
        schema.discriminator &&
        schema.discriminator.mapping &&
        paramValue[schema.discriminator.propertyName]
      ) {
        const discriminatorPropValue =
          paramValue[schema.discriminator.propertyName];
        const selectedSchema =
          schema.discriminator.mapping[discriminatorPropValue];

        if (selectedSchema) {
          return this.convertValue(
            paramValue,
            selectedSchema,
            name,
            `${path}.oneOf[discriminator:${discriminatorPropValue}]`,
          );
        }
      } else if (schema['x-disable-converting']) {
        // в случае allOf с отключенной конвертацией проверяем по всем схемам,
        // но отключаем проверку additionalProperties
        if (schema.allOf) {
          if (!validatorOptions) {
            validatorOptions = {};
          }

          validatorOptions.ignoreAdditionalProperties = true;
        }

        this._validate(paramValue, schema, name, path, validatorOptions);

        return paramValue;
      }

      // в остальных случаях выполняем ковертацию и валидацию по каждой схеме
      return this.convertComplexValue(paramValue, schema, name, path);
    }

    const type = RequestValidator.getParameterType(schema, paramValue);

    switch (type) {
      case 'array':
        if (isString(paramValue)) {
          try {
            paramValue = JSON.parse(paramValue);
          } catch (err) {
            // ok
          }
        }

        if (!Array.isArray(paramValue) && !isNull(paramValue)) {
          paramValue = [paramValue];
        }

        paramValue =
          paramValue &&
          isArray(paramValue) &&
          paramValue.map((item, index) => {
            const iSchema = isArray(schema.items)
              ? schema.items[index]
              : schema.items;

            return this.convertValue(item, iSchema, name, `${path}[${index}]`);
          });

        if (!validatorOptions) {
          validatorOptions = {};
        }
        validatorOptions.ignoreNested = true;

        break;
      case 'boolean':
        if (
          isString(paramValue) &&
          ['false', 'true'].indexOf(paramValue) !== -1
        ) {
          paramValue = paramValue === 'true';
        } else {
          paramValue = !!paramValue;
        }

        break;
      case 'integer':
        if (isNumber(paramValue) && Number.isInteger(paramValue)) {
          break;
        }

        if (schema['x-big-int']) {
          try {
            paramValue = BigInt(paramValue);
          } catch (err) {
            throw new ConvertError(paramValue, `${type}(BigInt)`, err.message);
          }
        } else if (
          !isNumber(paramValue) &&
          !isNull(paramValue) &&
          !isArray(paramValue)
        ) {
          paramValue = Number(paramValue); // Math.trunc(null || []) = 0

          if (isNaN(paramValue)) {
            throw new ConvertError(
              paramValue,
              type,
              'Cant convert this value to number!',
            );
          }
        }

        if (!isBigInt(paramValue) && isNumber(paramValue)) {
          paramValue = Math.trunc(paramValue); // Math.trunc(null || []) = 0
        }

        break;
      case 'number':
        if (
          !isNumber(paramValue) &&
          !isNull(paramValue) &&
          !isArray(paramValue)
        ) {
          paramValue = Number(paramValue); // Math.trunc(null || []) = 0

          if (isNaN(paramValue)) {
            throw new ConvertError(
              paramValue,
              type,
              'Cant convert this value to number!',
            );
          }
        }

        break;
      case 'object':
        if (isString(paramValue)) {
          try {
            paramValue = JSON.parse(paramValue);
          } catch (err) {
            throw new ConvertError(
              paramValue,
              type,
              'Cant convert to object from this string!',
            );
          }
        }

        paramValue &&
          isObject(paramValue) &&
          schema.properties &&
          Object.keys(schema.properties).forEach((key) => {
            const keySchema = schema.properties[key];

            const convertedValue = this.convertValue(
              paramValue[key],
              keySchema,
              name,
              `${path}.${key}`,
            );

            if (!isUndefined(convertedValue)) {
              paramValue[key] = convertedValue;
            }
          });

        if (!validatorOptions) {
          validatorOptions = {};
        }
        validatorOptions.ignoreNested = true;

        break;
      case 'string':
        if (
          !isString(paramValue) &&
          !isObject(paramValue) &&
          !isNull(paramValue) &&
          !isArray(paramValue)
        ) {
          paramValue = paramValue.toString();
        }

        break;
      default:
        break;
    }

    this._validate(paramValue, schema, name, path, validatorOptions);

    return paramValue;
  }

  getMeta() {
    const app = this._req.headers['x-app'];
    const [appId, appVersion] = (app || '').split(';');

    const base = {
      app: {
        id: appId ? Number(appId) : undefined,
        version: appVersion || undefined,
      },
      lang: 'ru-RU',
    };

    if ('x-user' in this._req.headers) {
      const userInfo = this._req.headers['x-user'];
      const offices = this._req.headers['x-offices'];
      const cities = this._req.headers['x-cities'];

      const [userId, , sessionId, lang, tz] = userInfo.split(';');
      const [mainOfficeId, rawOfficesIds] = offices.split(';');
      const [mainCityId, rawCitiesIds] = cities.split(';');

      return {
        ...base,
        sessionId,
        userId: Number(userId),
        lang: lang || 'ru-RU',
        officesIds: rawOfficesIds
          ? rawOfficesIds.split(',').map(Number)
          : undefined,
        mainOfficeId: Number(mainOfficeId),
        citiesIds: rawCitiesIds
          ? rawCitiesIds.split(',').map(Number)
          : undefined,
        mainCityId: Number(mainCityId),
        tz: Number(tz),
      };
    }

    return base;
  }

  start() {
    for (const parameter of this._parameters) {
      const {schema, required, name} = parameter;

      const oVal = this.getParameterValue(parameter);
      const paramValue = this.convertValue(oVal, schema, name, 'root');

      console.debug(
        `Parameter: ${name}, type: ${typeof paramValue}, value: ${paramValue}`,
      );

      if (required && isUndefined(paramValue)) {
        throw new UndefinedParamError(name);
      }

      if (!isUndefined(paramValue)) {
        this._req.vars[parameter.name] = paramValue;
      }
    }

    if (!this._requestBody) {
      this._attachMeta();

      return;
    }

    const {required, content} = this._requestBody;

    if (required && isUndefined(this._req.body)) {
      throw new UndefinedParamError('RequestBody');
    }

    const [{schema}, type] = this.getCurrentContent(content);

    console.debug(`Request content-type: ${type}`);

    if (!schema) {
      throw new NoContentError(type);
    }

    const paramValue = this.convertValue(
      this._req.body,
      schema,
      'body',
      'root',
    );

    /* istanbul ignore else */
    if (!isUndefined(paramValue)) {
      this._req.vars[this._requestBody['x-name'] || 'body'] = paramValue;
    }

    this._attachMeta();
  }

  _validate(paramValue, schema, name, _path, options) {
    const validator = new Validator();
    const isValid =
      paramValue !== undefined
        ? validator.isValid(schema, paramValue, _path, options)
        : true;

    if (!isValid) {
      const [{params, message, path}] = validator.Errors;

      throw new ValidationError(name, path, paramValue, params, message);
    }
  }

  _attachMeta() {
    const meta = this.getMeta();

    this._req.vars = {
      ...this._req.vars,
      ...meta,
    };
  }
}

module.exports = RequestValidator;
