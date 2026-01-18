import RPC = require('etcd3/lib/rpc');

import logger = require('../interfaces/logger');

declare class PluginSettings {
  static initializeSettings(settings: object, group: string, key: string, val: string): void;
  constructor(logger: logger);
  get(pluginKey: string): Promise<string>;
  watchChanges(pluginKey: string, callback: (kv: RPC.IKeyValue, previous?: RPC.IKeyValue) => void): void;
}

export = PluginSettings;
