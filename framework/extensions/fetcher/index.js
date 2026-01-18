/* eslint-disable prefer-promise-reject-errors */

const http = require('http');
const https = require('https');
const {URL} = require('url');
const FormData = require('form-data');
const {Extension} = require('../../src/classes');
const {json2xml, xml2js} = require('xml-js');

class Fetcher extends Extension {
  constructor() {
    super(Extension.Types.STATIC, 'Fetcher');
  }

  fetchPromise(options, body, encoding, asStream) {
    return new Promise((resolve, reject) => {
      const req = (options.protocol === 'https:' ? https : http).request(options, (res) => {
        if (encoding) {
          res.setEncoding(encoding);
        }

        if (asStream) {
          resolve(res);
        } else {
          const response = [];

          res.on('data', (chunk) => response.push(chunk));
          res.on('end', () => resolve({
            statusCode: res.statusCode,
            message: response.join(''),
            headers: res.headers
          }));
        }

      });

      req.on('error', (err) => reject({statusCode: 500, message: err}));

      req.on('timeout', () => {
        reject({statusCode: 504, message: 'Connection Timeout'});
        req.destroy();
      });

      body && req.write(body);
      req.end();
    });
  }

  fetchFormDataPromise(options, formData, encoding, asStream) {
    return new Promise((resolve, reject) => {
      const requestHandler = (res) => {
        if (encoding) {
          res.setEncoding(encoding);
        }

        if (asStream) {
          resolve(res);
        } else {
          const response = [];

          res.on('data', (chunk) => response.push(chunk));
          res.on('end', () => {
            resolve({
              statusCode: res.statusCode,
              message: response.join(''),
              headers: res.headers
            });
          });
        }

      };

      // Необходимо правильно вычислить длину отдаваемого контента,
      // поэтому заворачиваем всё это дело в callback
      formData.getLength((err, length) => {
        if (err) {
          reject({statusCode: 400, message: err});
        }
        // Переопредляем заголовки, чтобы правильно отдавать файлы и другой контент
        // который приходит внутри formData
        options.headers['Content-Type'] = formData.getHeaders()['content-type'];
        options.headers['Content-Length'] = length;

        const req = (options.protocol === 'https:' ? https : http).request(options, requestHandler);

        req.on('error', (reqErr) => reject({statusCode: 500, message: reqErr}));

        req.on('timeout', () => {
          reject({statusCode: 504, message: 'Connection Timeout'});
          req.destroy();
        });

        formData.pipe(req);
      });
    });
  }

  parseContent(res) {
    const contentType = res.headers['content-type'] || '';

    try {
      if (contentType.includes('json')) {
        return JSON.parse(res.message);
      }

      if (contentType.includes('xml')) {
        return xml2js(res.message, {compact: true});
      }

      return res.message;
    } catch(err) {
      return res.message;
    }
  }

  getContent(res, isRawResponse) {
    const content = isRawResponse ? res.message : this.parseContent(res);

    return {
      statusCode: res.statusCode,
      message: content,
      ...res.headers ? {responseHeaders: res.headers} : {}
    };
  }

  createFormData(formData) {
    const requestForm = new FormData();

    const isObject = (val) => {
      if (val === null) {
        return false;
      }

      return typeof val === 'function' || typeof val === 'object';
    };

    const appendFormValue = (key, value) => {
      if (isObject(value) && 'value' in value && 'options' in value) {
        requestForm.append(key, value.value, value.options);
      } else {
        requestForm.append(key, value);
      }
    };

    for (const formKey in formData) {
      if (formKey in formData) {
        const formValue = formData[formKey];

        if (formValue instanceof Array) {
          formValue.forEach((value) => appendFormValue(formKey, value));
        } else {
          appendFormValue(formKey, formValue);
        }
      }
    }

    return requestForm;
  }

  convertArrayToUriParam(key, values) {
    return values
      .map((value) => `${encodeURIComponent(key)}[]=${encodeURIComponent(value)}`)
      .join('&');
  }

  convertObjectToUriParam(obj) {
    return Object.keys(obj)
      .map((k) => Array.isArray(obj[k]) ? this.convertArrayToUriParam(k, obj[k]) :
        `${encodeURIComponent(k)}=${encodeURIComponent(obj[k])}`)
      .join('&');
  }

  action() {
    return {
      /**
       * fetchRequest prepares and sends a request to an external http service
       * @param {Object} params
       * @returns {Promise<Object>}
       */
      fetchRequest: async(params) => {
        const {
          url,
          headers,
          body,
          requestMethod,
          uriParams,
          timeout = 10000,
          formData,
          formUrlencoded,
          xmlEncoded,
          encoding = 'utf8',
          key,
          cert,
          ca,
          rejectUnauthorized = true,
          returnStream,
          isRawBody,
          isRawResponse = false
        } = params;
        const urlWithParams = uriParams ? `${url}?${this.convertObjectToUriParam(uriParams)}` : url;
        const {hostname, port, pathname, search, protocol} = new URL(urlWithParams);
        const requestBody = isRawBody || !body ? body : JSON.stringify(body);

        const options = {
          hostname,
          port,
          path: `${pathname}${search || ''}`,
          protocol,
          method: requestMethod || 'POST',
          headers: {
            'Accept': '*/*',
            'Content-Type': 'application/json',
            'Content-Length': requestBody ? Buffer.from(requestBody).length : 0,
            ...headers
          },
          key,
          cert,
          ca,
          timeout,
          rejectUnauthorized
        };

        if (formData) {
          const requestForm = this.createFormData(formData);
          const streamOrData =
            await this.fetchFormDataPromise(options, requestForm, encoding, returnStream);

          return returnStream ? streamOrData : this.getContent(streamOrData, isRawResponse);
        }

        if (formUrlencoded) {
          options.headers['Content-Type'] = 'application/x-www-form-urlencoded';
          delete options.headers['Content-Length'];

          const streamOrData = await this.fetchPromise(
            options,
            this.convertObjectToUriParam(formUrlencoded),
            encoding,
            returnStream
          );

          return returnStream ? streamOrData : this.getContent(streamOrData, isRawResponse);
        }

        if (xmlEncoded) {
          const xmlBody = json2xml(xmlEncoded, {compact: true});

          options.headers['Content-Type'] = 'application/xml';
          options.headers['Content-Length'] = Buffer.byteLength(xmlBody);

          const streamOrData = await this.fetchPromise(options, xmlBody, encoding, returnStream);

          return returnStream ? streamOrData : this.getContent(streamOrData, isRawResponse);
        }

        const streamOrData =
          await this.fetchPromise(options, requestBody, encoding, returnStream);

        return returnStream ? streamOrData : this.getContent(streamOrData, isRawResponse);
      }
    };
  }
}

module.exports = Fetcher;
