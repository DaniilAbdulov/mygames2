const {Extension} = require('../classes');
const {ExtLoadError} = require('../exceptions');
const Api = require('../lib/api');

class ExtLoader {
  constructor(sender) {
    this._ext = [];
    this._sortedExts = [];
    this._sender = sender;
  }

  async load(platformEvents, redisConnect, config, metrics, coordinator) {
    coordinator &&
      coordinator.on('action', (type, value) => {
        this._triggerCustomAction(type, value);
      });

    const promises = [];

    for (const ext of this._ext) {
      promises.push(ext.load({config, redisConnect, metrics, platformEvents}));
    }

    await Promise.all(promises);

    this._sortExts();
  }

  close() {
    for (const ext of this._ext) {
      ext.onClose();
    }
  }

  _triggerCustomAction(type, value) {
    for (const ext of this._ext) {
      try {
        ext.onCustomAction(type, value);
      } catch (err) {
        console.error(`Custom action handler: ${err?.message}`);
      }
    }
  }

  _sortExts() {
    const extsByKey = this._ext.reduce((result, ext) => {
      result[ext.Key] = ext;

      return result;
    }, {});
    const visitedExts = new Set();
    const sortedExts = [];
    const visit = (ext, ancestorExts = new Set()) => {
      if (ancestorExts.has(ext)) {
        const extensionsChain = [...ancestorExts, ext].map((ext_) => ext_.Key);

        throw new Error(
          `Circular dependency detected: ${extensionsChain.join(' -> ')}`,
        );
      }
      if (visitedExts.has(ext)) {
        return;
      }

      visitedExts.add(ext);
      ancestorExts.add(ext);

      if (!ext.RequiredExts?.length) {
        sortedExts.push(ext);

        return;
      }

      for (const requiredExtKey of ext.RequiredExts) {
        const requiredExt = extsByKey[requiredExtKey];

        if (!requiredExt) {
          throw new Error(`Extension '${requiredExtKey}' not found`);
        }
        if (
          ext.Type === Extension.Types.STATIC &&
          requiredExt.Type === Extension.Types.DYNAMIC
        ) {
          throw new Error(
            `Extension '${ext.Key}' is static but dynamic extension required`,
          );
        }

        visit(requiredExt, new Set(ancestorExts));
      }

      sortedExts.push(ext);
    };

    this._ext.forEach((ext) => visit(ext));

    this._sortedExts = sortedExts;
  }

  add(Ext, isInternal) {
    if (!Ext) {
      throw new Error('Content is empty!');
    }

    const ext = new Ext();

    if (isInternal) {
      ext.isInternal();
    }

    if (!(ext instanceof Extension)) {
      throw new Error('Extension must be instance of Service.Extension class');
    }

    this._ext.push(ext);
  }

  static EMPTY_REQ_CONTEXT = {
    headers: {
      // format as in core
      'x-user': '0;user;service;ru-RU;300',
      'x-offices': '0;0',
      'x-cities': '0;0',
    },
  };

  async getExtWithContext(operationName, operationType, _req, reqContext) {
    const exts = {};

    const req = _req ? {headers: _req.headers} : ExtLoader.EMPTY_REQ_CONTEXT;
    const baseContext = {
      req,
      operationName,
      operationType,
      context: reqContext,
      api: () => new Api({req, operationType}, this._sender, null),
    };

    for (const ext of this._sortedExts) {
      if (ext.Type === Extension.Types.STATIC) {
        const context = {exts: this._createExtsContext(ext, exts)};

        try {
          // причина отключения линта: сложно и очень запутанно
          // переделать на паралелльное выполнение, код потом ваще не понять будет
          exts[ext.Key] =
            ext.action.constructor.name === 'AsyncFunction'
              ? // eslint-disable-next-line no-await-in-loop
                await ext.action(context)
              : ext.action(context);
        } catch (err) {
          throw new ExtLoadError(err.message, {extension: ext.Name});
        }
      } else if (ext.Type === Extension.Types.DYNAMIC) {
        const context = {
          ...baseContext,
          exts: this._createExtsContext(ext, exts),
        };

        if (ext.AutoExecute) {
          this._addSpanToContext(ext, context);

          // объяснение этого находится в коментарии ниже
          //
          // причина отключения линта: сложно и очень запутанно
          // переделать на паралелльное выполнение, код потом ваще не понять будет
          try {
            exts[ext.Key] =
              ext.action.constructor.name === 'AsyncFunction'
                ? // eslint-disable-next-line no-await-in-loop
                  await ext.action(context)
                : ext.action(context);
          } catch (err) {
            this._markSpanAsError(context);

            throw err;
          } finally {
            this._endSpanInContext(context);
          }
        } else {
          // сложно, надо пояснить
          //
          // дело в том, что дополнение может определить основную функцию
          // как асихнронной, так и обычной
          //
          // обертка должна быть такого же типа как и исходная функция,
          // поэтому приходится извращаться
          //
          // помимо этого использование await на обычной функции автоматически
          // оборачивает ее в лишний бесполезный промис
          exts[ext.Key] =
            ext.action.constructor.name === 'AsyncFunction'
              ? async (...args) => {
                  this._addSpanToContext(ext, context, traceInfo);

                  try {
                    return await ext.action(context, ...args);
                  } catch (err) {
                    this._markSpanAsError(context);

                    throw err;
                  } finally {
                    this._endSpanInContext(context);
                  }
                }
              : (...args) => {
                  this._addSpanToContext(ext, context, traceInfo);

                  try {
                    return ext.action(context, ...args);
                  } catch (err) {
                    this._markSpanAsError(context);

                    throw err;
                  } finally {
                    this._endSpanInContext(context);
                  }
                };
        }
      }
    }

    return exts;
  }

  _createExtsContext(ext, exts) {
    if (!ext.RequiredExts?.length) {
      return null;
    }

    const extsContext = {};

    for (const requiredExt of ext.RequiredExts) {
      extsContext[requiredExt] = exts[requiredExt];
    }

    return extsContext;
  }

  _markSpanAsError(context) {
    if (context.tracer?.span) {
      context.tracer.span.setAttributes({error: true});
    }
  }

  _setAttrToSpan(context, attr) {
    if (context.tracer?.span) {
      context.tracer.span.setAttributes(attr);
    }
  }

  _addEventToSpan(context, message) {
    if (context.tracer?.span) {
      context.tracer.span.addEvent(
        this._tracer.sanitizeMessage(
          typeof message !== 'string' ? JSON.stringify(message) : message,
        ),
      );
    }
  }

  _endSpanInContext(context) {
    if (context.tracer?.span && context.tracer.span.isRecording()) {
      context.tracer.span.end();
    }
  }

  _addSpanToContext(ext, context, traceInfo) {
    if (ext.TraceMode === Extension.TraceModeTypes.DISABLE || !traceInfo) {
      return;
    }

    if (ext.TraceMode === Extension.TraceModeTypes.AUTO) {
      this._injectAutoSpan(ext, context, traceInfo);
    } else if (ext.TraceMode === Extension.TraceModeTypes.MANUAL) {
      this._injectManualSpan(ext, context, traceInfo);
    }
  }

  _injectManualSpan(ext, context, traceInfo) {
    context.tracer = {
      create: () => {
        this._injectAutoSpan(ext, context, traceInfo);
      },
      markAsError: () => {
        this._markSpanAsError(context);
      },
      end: () => {
        this._endSpanInContext(context);
      },
      addEvent: (message) => {
        this._addEventToSpan(context, message);
      },
      setAttributes: (attr) => {
        this._setAttrToSpan(context, attr);
      },
    };
  }

  _injectAutoSpan(ext, context, traceInfo) {
    const [extSpan] = this._tracer.createNewSpan(
      traceInfo.span,
      traceInfo.traceContext,
      `Extension:${ext.Name}`,
    );

    if (context.api) {
      context.api._Span = extSpan;
    }

    if (!context.tracer) {
      context.tracer = {};
    }
    context.tracer.span = extSpan;
  }
}

module.exports = ExtLoader;
