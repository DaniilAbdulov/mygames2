const {Extension} = require('../../src/classes');
const EtcdConnector = require('../../src/lib/database/etcdConnector');

class Etcd extends Extension {
  constructor() {
    super(Extension.Types.STATIC, 'Etcd');
  }

  load({config}) {
    this._etcdConnection = new EtcdConnector(config);
  }

  onClose() {
    this._etcdConnection.close();
  }

  action() {
    return {
      set: (key, val) => this._etcdConnection.put(key, val),
      delete: (key) => this._etcdConnection.delete(key),
      deleteByPrefix: (name) => this._etcdConnection.deleteByPrefix(name),
      get: (key) => this._etcdConnection.get(key),
      getByPrefix: (name) => this._etcdConnection.getByPrefix(name)
    };
  }
}

module.exports = Etcd;
