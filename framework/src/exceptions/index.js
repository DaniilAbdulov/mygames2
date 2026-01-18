const SchemaValidationError = require('./schemaValidation');
const BadParamError = require('./badParam');
const UndefinedParamError = require('./undefinedParam');
const ConvertError = require('./convert');
const ValidationError = require('./validation');
const NoContentError = require('./noContent');
const UnsupportedStatusCodeError = require('./unsupportedStatusCode');
const NoAccessError = require('./noAccess');
const NoMethodError = require('./noMethod');
const RuntimeError = require('./runtime');
const UncaughtError = require('./uncaught');
const ServiceMethodNotFoundError = require('./serviceMethodNotFoundError');
const ServiceNotFoundError = require('./serviceNotFoundError');
const ConnectionTimeoutError = require('./connectionTimeout');
const InternalError = require('./internalError');
const ServiceAccessError = require('./noAccessToService');
const ExtLoadError = require('./extLoadError');
const WrongEventError = require('./wrongEventError');
const TooBigResponse = require('./bigResponse');

module.exports = {
  SchemaValidationError,
  BadParamError,
  UndefinedParamError,
  ConvertError,
  ValidationError,
  NoContentError,
  UnsupportedStatusCodeError,
  NoAccessError,
  NoMethodError,
  RuntimeError,
  UncaughtError,
  ServiceMethodNotFoundError,
  ServiceNotFoundError,
  ConnectionTimeoutError,
  InternalError,
  ServiceAccessError,
  ExtLoadError,
  WrongEventError,
  TooBigResponse
};
