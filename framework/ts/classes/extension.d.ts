import {Extensions} from '../interfaces/extensions';
import {ExtensionTypes, ExtensionTraceModeTypes} from '../enums';
import {ServiceApiFactory} from '../types/api';
import {Context as OperationContext} from '../types/context';
import Logger = require("../interfaces/logger");

type Tracer = {
  create(): void;
  markAsError(): void;
  end(): void;
  addEvent(message: any): void;
  setAttributes(attrs: Record<string, unknown>): void;
};

type Context<RequiredExts extends keyof Extensions = never> = {
  req: any;
  operationName: string;
  operationType: 'standaloneComponent' | 'event' | 'hook' | 'method';
  api: ServiceApiFactory;
  exts: Pick<Extensions, RequiredExts>;
  tracer?: Tracer;
  context?: OperationContext;
};

declare interface IExtensionOptions {
  deps: {services: string[]};
  autoExecute: boolean;
  traceMode: ExtensionTraceModeTypes;
  requiredExts: string[];
}

declare class Extension <T = undefined> {
  static get Types(): typeof ExtensionTypes;
  static get TraceModeTypes():typeof ExtensionTraceModeTypes;

  get TraceMode(): ExtensionTraceModeTypes;
  get AutoExecute(): boolean;
  get Key(): string;
  set Key(arg: string);
  get Deps(): string[];
  get Logger(): Logger;
  get Name(): string;
  get Type(): ExtensionTypes;

  constructor(
    type: ExtensionTypes,
    name: string,
    options?: Partial<IExtensionOptions>
  );
  // todo context
  action(
    context: Context,
    ...args: any[]
  ): unknown | T;
}

export {Extension, Context};
