import Hook = require('./hook');
import PluginSettings = require('../types/pluginSettings');

declare type filterFunction = <T>(element?: T, index?: number, array?: T[]) => boolean;

declare class Context {
  set(key: string, value: any): this;
  remove(key: string): this;
  has(key: string): boolean;
  get<T>(key: string): T;
}

declare class Plugin {
  constructor(name: string, version: string, hooks?: Hook[]);
  get Name(): string;
  get Version(): string;
  get Hooks(): Hook[];
  set Settings(arg: object);
  get Settings(): object;
  get SharedContext(): Context;
  getSettingByCity(cityId: number | string, filterFunc: filterFunction): PluginSettings;
  getSettingByOffice(officeId: number | string, filterFunc: filterFunction): PluginSettings;
}

export = Plugin;
