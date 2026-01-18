const fastify = require('fastify');

module.exports = () => {
  const app = fastify({
    keepAliveTimeout: 10000,
    maxParamLength: 200,
    bodyLimit: 1048576 * 10, // 10 mb
    caseSensitive: false,
    requestIdHeader: 'rid',
    trustProxy: true
  });

  app.setNotFoundHandler((request, reply) => {
    reply
      .code(404)
      .send();
  });

  app.decorateRequest('vars', null);
  app.decorateRequest('traceContext', null);
  app.decorateRequest('operationName', '');
  app.decorateRequest('span', null);

  return app;
};
