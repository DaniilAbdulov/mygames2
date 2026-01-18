import Plugin = require('./plugin');

declare interface IHookOptions {
  isAsync: boolean;
  stopIfError?: boolean;
}

declare class Hook {
  constructor(name: string, priority?: number, options?: IHookOptions);
  get Name(): string;
  get Priority(): number;
  set IsAsync(arg: boolean);
  get IsAsync(): boolean;
  set StopIfError(arg: boolean);
  get StopIfError(): boolean;
  set Plugin(arg: Plugin);
  get Plugin(): Plugin;
  set Settings(arg: object);
  get Settings(): object;
  action(...args: any[]): undefined | void | Promise<undefined> | Promise<void>;
}

export = Hook;
