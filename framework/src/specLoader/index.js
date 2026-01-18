const pathModule = require('path');
const RefParser = require('@apidevtools/json-schema-ref-parser');

const {Files, isObject} = require('../utils');
const Validator = require('../../json-schema-validator');
const {SchemaValidationError} = require('../exceptions');
const sharedResolver = require('./sharedResolver');
const enumResolver = require('./enumResolver');
const filterResolver = require('./filterResolver');

class SpecLoader {
  constructor(find, specFolder, options) {
    this._find = find;
    this._specFolder = specFolder;
    this._options = options;
  }

  async resolve() {
    const spec = this._find
      ? this._isRawSchema() || (await this._isRawPath())
      : await this._findInLocalPlace();

    try {
      if (!spec) {
        throw new Error(
          `Cant resolve doc file at path ${this._find}, or cant find service spec file`,
        );
      }
      const resolvedSchema = await RefParser.dereference(spec, {
        resolve: {
          shared: sharedResolver,
          enum: enumResolver(this._options?.includeRefMetadata),
          filter: filterResolver,
          http: false,
        },
      });

      await this._throwIfSpecInvalid(resolvedSchema);

      SpecLoader._addSecurityTags(resolvedSchema);

      return resolvedSchema;
    } catch (err) {
      console.log(err);
      if (err instanceof SchemaValidationError) {
        console.error(
          `Specification file is not valid: ${JSON.stringify(err.errors)}`,
        );
      } else {
        console.error(`Resolve schema error: ${JSON.stringify(err.stack)}`);
      }

      throw err;
    } finally {
    }
  }

  static _addSecurityTags(resolvedSchema) {
    let needAddTagToGlobal = false;

    for (const path in resolvedSchema.paths) {
      for (const method in resolvedSchema.paths[path]) {
        const operationSchema = resolvedSchema.paths[path][method];

        if (operationSchema['x-auth-disable']) {
          if (!operationSchema.tags) {
            operationSchema.tags = [];
          }

          operationSchema.tags.push('Auth disabled');
          needAddTagToGlobal = true;
        }
      }
    }

    if (needAddTagToGlobal) {
      if (!resolvedSchema.tags) {
        resolvedSchema.tags = [];
      }

      resolvedSchema.tags.push({
        name: 'Auth disabled',
        description:
          'Методы доступные без авторизации, помните про безопасность данных',
      });
    }
  }

  _isRawSchema() {
    return isObject(this._find) ? this._find : null;
  }

  async _findInLocalPlace() {
    try {
      const pathToFindYml = pathModule.resolve(
        process.cwd(),
        `./${this._specFolder}/root.yml`,
      );

      const stats = await Files.stat(pathToFindYml);

      return stats.isFile() ? pathToFindYml : null;
    } catch (err) {
      return null;
    }
  }

  async _isRawPath() {
    try {
      const stats = await Files.stat(this._find);

      return stats.isFile() ? this._find : null;
    } catch (err) {
      return null;
    }
  }

  async _throwIfSpecInvalid(fullSchema) {
    const openApi = await RefParser.dereference(
      pathModule.resolve(__dirname, '../../schemas/openapi-3.0.yaml'),
    );

    const validator = new Validator();

    const isValid = validator.isValid(openApi, fullSchema);

    if (!isValid) {
      throw new SchemaValidationError(validator.Errors);
    }
  }
}

module.exports = SpecLoader;
