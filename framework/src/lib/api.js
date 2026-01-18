const {isObject} = require('../utils');
const {
  NoAccessError,
  RuntimeError,
  UncaughtError,
  BadParamError,
  ConvertError,
  NoContentError,
  NoMethodError,
  UndefinedParamError,
  UnsupportedStatusCodeError,
  ValidationError,
  ServiceMethodNotFoundError,
  ServiceNotFoundError,
  InternalError,
  ConnectionTimeoutError,
  ServiceAccessError,
  TooBigResponse
} = require('../exceptions');

class API {
  constructor(context, sender, span) {
    const {req, operationType} = context;

    this._req = req;
    this._span = span;
    this._sender = sender;
    this._operationType = operationType;
  }

  set _Span(newSpan) {
    this._span = newSpan;
  }

  service(request = '') {
    const parts = request.split('.');

    if (parts.length === 2) {
      this._service = parts[0].trim().toLowerCase();
      this._method = parts[1];
    } else {
      this._method = parts.pop();
      this._service = parts.join('.');
    }

    return this;
  }

  async _request() {
    const askArgs = {
      service: this._service,
      method: this._method,
      body: this._body,
      params: this._vars,
      disableRights: this._fullRights,
      timeout: this._timeout,
      type: this._type,
      span: this._span,
      reqHeaders: this._req.headers,
      from: `${global.serviceName};${this._operationType}`
    };
    const response = await this._sender.ask(askArgs);

    return response;
  }

  async then(callback, errCallback) {
    try {
      const result = await this._request();

      if (callback) {
        return await callback(result);
      }

      return Promise.resolve(result);
    } catch(err) {
      const errorToThrow = this.getError(err);

      if (errCallback) {
        return errCallback(errorToThrow);
      }

      return Promise.reject(errorToThrow);
    }
  }

  getError(err) {
    if (
      err instanceof ServiceNotFoundError ||
      err instanceof ServiceMethodNotFoundError
    ) {
      return err;
    }

    const {status, response: {reason, meta} = {}, code} = err;

    if (status === 403) {
      if (code === 0) {
        return new NoAccessError(reason);
      } else if (code === 1) {
        return new ServiceAccessError();
      }
    } else if (status === 555) {
      return new RuntimeError(reason, meta, code);
    } else if (status === 554) {
      return new UncaughtError(meta);
    } else if (status === 400) {
      if (code === 1) {
        return new BadParamError(meta.paramName, meta.errMsg);
      } else if (code === 2) {
        return new ConvertError(meta.value, meta.type, meta.errMsg);
      } else if (code === 3) {
        return new UndefinedParamError(meta.paramName);
      } else if (code === 4) {
        return new ValidationError(
          meta.paramName, meta.path, meta.value, meta.paramProps, meta.errMsg, 400
        );
      }
    } else if (status === 404) {
      if (code === 1) {
        return new ServiceNotFoundError(meta.service);
      } else if (code === 2) {
        return new ServiceMethodNotFoundError(meta.service, meta.method);
      }
    } else if (status === 415) {
      return new NoContentError(meta.type, meta.codes);
    } else if (status === 501) {
      return new NoMethodError(meta.controller, meta.operation);
    } else if (status === 500) {
      if (code === 1) {
        return new UnsupportedStatusCodeError(meta.code, meta.patternCode);
      } else if (code === 2) {
        return new ValidationError(
          meta.paramName, meta.path, meta.value, meta.paramProps, meta.errMsg, 500
        );
      } else if (code === 3 || code === 4) {
        return new InternalError(reason, meta);
      }
    } else if (status === 502 || status === 503) {
      return new InternalError(reason, meta);
    } else if (status === 504 || status === 522) {
      return new ConnectionTimeoutError();
    } else if (status === 507) {
      return new TooBigResponse();
    }
  }

  async catch(callback) {
    try {
      const result = await this._request();

      return Promise.resolve(result);
    } catch(err) {
      const errorToThrow = this.getError(err);

      if (callback) {
        return callback(errorToThrow);
      }

      throw errorToThrow;
    }
  }

  timeout(mseconds) {
    this._timeout = mseconds > 2000 ? mseconds : 2000;

    return this;
  }

  body(firstArg, secondArg) {
    if (firstArg && !secondArg) {
      this._body = firstArg;
    } else if (firstArg === 'body') {
      this._body = secondArg;
    } else {
      if (!this._body) {
        this._body = {};
      }

      this._body[firstArg] = secondArg;
    }

    return this;
  }

  params(firstArg, secondArg) {
    if (isObject(firstArg)) {
      /* istanbul ignore else */
      if (firstArg.body) {
        this._body = firstArg.body;

        delete firstArg.body;
      }

      this._vars = firstArg;
    } else if (firstArg === 'body') {
      this._body = secondArg;
    } else {
      if (!this._vars) {
        this._vars = {};
      }

      this._vars[firstArg] = secondArg;
    }

    return this;
  }

  type(contentType) {
    if (contentType) {
      this._type = contentType;
    }

    return this;
  }

  withAllRights() {
    this._fullRights = true;

    return this;
  }
}

module.exports = API;
