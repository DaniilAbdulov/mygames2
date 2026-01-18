const {
  RuntimeError,
  BadParamError,
  ConvertError,
  NoAccessError,
  NoContentError,
  NoMethodError,
  SchemaValidationError,
  UndefinedParamError,
  UnsupportedStatusCodeError,
  ValidationError,
  UncaughtError,
  ServiceNotFoundError,
  ServiceMethodNotFoundError,
  InternalError,
  ConnectionTimeoutError,
  ServiceAccessError,
  ExtLoadError,
  TooBigResponse,
} = require('../exceptions');

class ErrorMw {
  constructor() {}

  static _isFastifyError(err) {
    if (typeof err !== 'object') {
      return false;
    }

    return [
      'FST_ERR_CTP_EMPTY_JSON_BODY',
      'FST_ERR_CTP_INVALID_MEDIA_TYPE',
    ].includes(err.code);
  }

  middleware() {
    return (err, request, reply) => {
      // eslint-disable-line
      if (
        err instanceof RuntimeError ||
        err instanceof BadParamError ||
        err instanceof ConvertError ||
        err instanceof NoAccessError ||
        err instanceof NoContentError ||
        err instanceof NoMethodError ||
        err instanceof SchemaValidationError ||
        err instanceof UndefinedParamError ||
        err instanceof UnsupportedStatusCodeError ||
        err instanceof ValidationError ||
        err instanceof ServiceNotFoundError ||
        err instanceof ServiceMethodNotFoundError ||
        err instanceof InternalError ||
        err instanceof ConnectionTimeoutError ||
        err instanceof ServiceAccessError ||
        err instanceof ExtLoadError ||
        err instanceof TooBigResponse ||
        err?.frameworkError ||
        ErrorMw._isFastifyError(err)
      ) {
        console.debug(`Sending data with code = ${err.code}`);

        const response = {
          reason: err.message,
          meta: {
            ...(err.meta || (err.stack ? {stack: err.stack} : {})),
          },
        };

        if ('code' in err) {
          reply.header('x-ecode', err.code.toString());
        }

        // statusCode property from fastify
        const replyStatus = err.status || err.statusCode;

        reply.code(replyStatus).send(response);

        return;
      }

      console.debug('Found uncaught exception!');

      const error =
        typeof err === 'object'
          ? new UncaughtError({
              message: err.message,
              stack: err.stack,
              ...(err.meta || (err.stack ? {stack: err.stack} : {})),
            })
          : new UncaughtError({
              message: err,
              surprise:
                'You found something strange, report it to your teamlead',
            });

      const response = {
        reason: error.message,
        meta: error.meta,
      };

      reply.code(error.status).send(response);
    };
  }
}

module.exports = ErrorMw;
