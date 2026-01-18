'use strict';

const {isUndefined} = require('../utils');
const {
  UnsupportedStatusCodeError,
  NoContentError,
  ValidationError,
  NoMethodError,
} = require('../exceptions');
const MIMEtype = require('whatwg-mimetype');
const Validator = require('../../json-schema-validator');

class Router {
  constructor(req, reply, controllerName, requestedSchema, operation, ext) {
    this._req = req;
    this._reply = reply;
    this._controllerName = controllerName;
    this._operation = operation;
    this._ext = ext;
    this._requestedSchema = requestedSchema;

    console.debug(
      `Controller: ${controllerName}, Operation: ${req.operationName}`,
    );
  }

  getResponseSection() {
    const responseCodeSection =
      this._requestedSchema.responses['200'] ||
      this._requestedSchema.responses['2XX'];

    if (!responseCodeSection) {
      throw new UnsupportedStatusCodeError('200', '2XX');
    }

    if (!responseCodeSection.content) {
      return null;
    }

    return responseCodeSection;
  }

  isValidResponse(dataToSend, schema, resultType) {
    const validator = new Validator();

    const isValid = validator.isValid(schema, dataToSend);

    if (!isValid) {
      const [{params, message, path}] = validator.Errors;

      params.contentType = resultType;

      throw new ValidationError(
        'Request result',
        path,
        dataToSend,
        params,
        message,
        500,
      );
    }
  }

  static convert(sendData, type) {
    if (isUndefined(sendData)) {
      return undefined;
    }

    let convertedValue = sendData;

    switch (type) {
      case 'text/plain':
        if (typeof sendData !== 'string') {
          convertedValue = sendData.toString && sendData.toString();
        }

        break;
      case 'application/json':
        convertedValue = JSON.stringify(sendData);

        break;
    }

    return Buffer.from(convertedValue);
  }

  getResultType(responseCodeSection) {
    const {headers} = this._req;

    if (!responseCodeSection || !responseCodeSection.content) {
      return new MIMEtype('application/json');
    }

    let resultType = null;
    let acceptTypes = [];

    if (headers.accept) {
      acceptTypes = headers.accept.split(',').map((type) => type.trim());
    }

    for (const acceptType of acceptTypes) {
      const keys = Object.keys(responseCodeSection.content);

      for (let g = 0; g < keys.length; g++) {
        const contentType = keys[g];

        const mimeAccept = new MIMEtype(acceptType);
        const mimeContent = new MIMEtype(contentType);
        const firstMatch =
          mimeAccept.type === mimeContent.type || mimeAccept.type === '*';
        const secondMatch =
          mimeAccept.subtype === mimeContent.subtype ||
          mimeAccept.subtype === '*';

        if (firstMatch && secondMatch) {
          resultType = mimeContent;
          break;
        }
      }
    }

    if (!resultType && !acceptTypes.length) {
      resultType = new MIMEtype('application/json');
    } else if (!resultType && acceptTypes.length) {
      return null;
    }

    return resultType;
  }

  static getHandler(requestedSchema, method) {
    return requestedSchema[method].operationId;
  }

  static getControllerName(requestedSchema, method) {
    return (
      requestedSchema['x-router-controller'] ||
      requestedSchema[method]['x-router-controller']
    );
  }

  async start() {
    const {operationName} = this._req;
    let {vars} = this._req;
    let context;

    if (!this._operation) {
      throw new NoMethodError(this._controllerName, operationName);
    }

    console.debug('Executing operation...');

    const exts = await this._ext.getExtWithContext(
      operationName,
      'method',
      this._req,
      context,
    );
    let dataToSend;

    try {
      dataToSend = await this._operation(vars, exts, context);
    } catch (err) {
      throw err;
    }

    console.debug('Extracting schema...');

    const responseCodeSection = this.getResponseSection();
    const {essence: resultType} = this.getResultType(responseCodeSection) || {};

    if (!resultType) {
      throw new NoContentError(this._req.headers.accept, ['200', '2XX']);
    }

    const {schema} =
      (responseCodeSection &&
        (responseCodeSection.content[resultType] ||
          responseCodeSection.content['*/*'])) ||
      {};

    console.debug('Validating result data...');

    this.isValidResponse(dataToSend, schema, resultType);

    dataToSend = Router.convert(dataToSend, resultType);

    this._reply.header('Content-Type', `${resultType};charset=utf-8`);

    if (dataToSend) {
      this._reply.header('Content-Length', `${dataToSend.length}`);
    }

    console.debug(
      `Sending data with code = 200 and content-type = '${resultType}'`,
    );

    if (!isUndefined(dataToSend)) {
      this._reply.code(200).send(dataToSend);
    } else {
      this._reply.code(200).send(undefined);
    }
  }
}

module.exports = Router;
