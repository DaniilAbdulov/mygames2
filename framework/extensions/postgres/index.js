const {Extension} = require('../../src/classes');
const DatabaseConnector = require('./databaseConnector');
const errorCodes = require('./errorCodes');

class Postgres extends Extension {
  constructor() {
    super(
      Extension.Types.DYNAMIC,
      'Postgres',
      {traceMode: Extension.TraceModeTypes.MANUAL, autoExecute: true}
    );

    this.Key = 'pg';
  }

  load({config}) {
    this._alwaysForceTraces = config.alwaysFullDebugInfo;
    this._masterConnection = new DatabaseConnector(config.db, this.Logger);
    this._replicaConnection = config.replica?.connection?.host ?
      new DatabaseConnector(config.replica, this.Logger) : this._masterConnection;
    this._archiveConnection = config.archive?.connection?.host ?
      new DatabaseConnector(config.archive, this.Logger) : this._masterConnection;
  }

  onClose() {
    this._masterConnection.close();
    this._replicaConnection.close();
    this._archiveConnection.close();
  }

  _attachTracer(isForceTrace, model, context, connectionType) {
    const {tracer} = context;

    if (isForceTrace || this._alwaysForceTraces) {
      model
        .on('query', (queryInfo) => {
          tracer?.create();
          tracer?.setAttributes({'pg.connect': connectionType});
          tracer?.addEvent({
            'pg.sql': queryInfo.sql,
            'pg.bindings': queryInfo.bindings
          });
        })
        .on('query-error', (err) => {
          if (err?.code) {
            tracer?.setAttributes({'pg.errcode': err.code});
          }

          tracer?.markAsError();
          tracer?.end();
        })
        .on('query-response', () => tracer?.end());
    }

    return model;
  }

  action(context) {
    const isForceTrace = !!Number(context.req.headers['x-debug']);
    const master = DatabaseConnector.get(this._masterConnection);
    const replica = DatabaseConnector.get(this._replicaConnection);
    const archive = DatabaseConnector.get(this._archiveConnection);

    return {
      queryOnArchive: (tableName) => {
        if (tableName) {
          return this._attachTracer(isForceTrace, archive(tableName), context);
        }

        return this._attachTracer(isForceTrace, archive.queryBuilder(), context);
      },
      queryOnReplica: (tableName) => {
        if (tableName) {
          return this._attachTracer(isForceTrace, replica(tableName), context, 'replica');
        }

        return this._attachTracer(isForceTrace, replica.queryBuilder(), context, 'replica');
      },
      query: (tableName) => {
        if (tableName) {
          return this._attachTracer(isForceTrace, master(tableName), context, 'master');
        }

        return this._attachTracer(isForceTrace, master.queryBuilder(), context, 'master');
      },
      transaction: async(f) => {
        if (!f) {
          const trx = await master.transaction();

          await trx.raw(`set local statement_timeout = 0`);

          return trx;
        }

        return master.transaction(async(trx) => {
          await trx.raw(`set local statement_timeout = 0`);

          return f(trx);
        });
      },
      raw: master.raw.bind(master),
      ref: master.ref.bind(master),
      errorCodes
    };
  }
}

module.exports = Postgres;
