import ServiceConfig = require('./types/config');
import {
  PlatformEvents as ServicePlatformEvents,
  ServicePlatformEvents as Events,
  EventHandler,
  EventsInfo as PlatformEventsInfo
} from './types/events';
import {IMetricInfo, IMetricBusinessInfo} from './types/metrics';
import ServicePlugin = require('./classes/plugin');
import ServiceHook = require('./classes/hook');
import ServiceConnectionPool = require('./classes/connectionPool');
import ServiceEventEmitter = require('./classes/eventEmitter');
import ServiceSyncEvents = require('./classes/serviceEvents');
import ServiceError = require('./classes/error');
import ServiceSpecLoader = require('./classes/specLoader');
import ServiceLogger = require('./interfaces/logger');
import PostgresClient = require('./interfaces/postgres');
import ServiceLocalization = require('./interfaces/localization');
import {Extension as ServiceExtension, Context as ExtensionContext} from './classes/extension';
import {AccessControl as ServiceAccessControl} from './types/accessControl';
import {Extensions} from './interfaces/extensions';
import {Services} from './interfaces/services';
import {FrontendEvents, ServiceEvents} from './interfaces/events';
import {Fetcher as ServiceFetcher} from './types/fetcher';
import {FeatureFlags as ServiceFeatureFlags} from './types/featureFlags';
import {OperationHandler, ServiceApiFactory, Api as ServiceApi} from './types/api';
import {Catalogs as ServiceCatalogs} from './types/catalogs';
import {Context} from './types/context';
import {Permissions as ServicePermissions} from './types/permissions';
import {
  ClickHouse as ServiceClickHouse,
  ClickHouseQueryBuilder as ServiceClickHouseQueryBuilder,
  ClickHouseQuery,
  ClickHouseOperations
} from './types/clickHouse';
import {Metrics as ServiceMetrics} from './types/metrics';
import {Uploader as ServiceUploader} from './types/uploader';
import {Cache} from './types/cache';
import {Locks} from './types/locks';
import enums = require('./enums');
import {Knex} from 'knex/types';

declare namespace Service {
  export type Config = ServiceConfig;
  export type Plugin = typeof ServicePlugin;
  export type Hook = typeof ServiceHook;
  export type ConnectionPool = typeof ServiceConnectionPool;
  export type EventEmitter = ServiceEventEmitter;
  export type Error = ServiceError;
  export type Logger = ServiceLogger;
  export type EventModes = typeof enums.EventModes;
  export type MetricTypes = typeof enums.MetricTypes;
  export type Database = Knex;
  export type Postgres = PostgresClient;
  export type MetricInfo = IMetricInfo;
  export type DBTransaction = Knex.Transaction;
  export type DBQueryBuilder = Knex.QueryBuilder;
  export type MetricBusinessInfo = IMetricBusinessInfo;
  export type Extension = typeof ServiceExtension;
  export type Fetcher = ServiceFetcher;
  export type Localization = ServiceLocalization;
  export type Api = ServiceApi;
  export type ApiFactory = ServiceApiFactory;
  export type Catalogs = ServiceCatalogs;
  export type Permissions = ServicePermissions;
  export type SpecLoader = ServiceSpecLoader;
  export type AccessControl = ServiceAccessControl;
  export type ClickHouse = ServiceClickHouse;
  export type ClickHouseQueryBuilder = ServiceClickHouseQueryBuilder;
  export type Metrics = ServiceMetrics;
  export type Uploader = ServiceUploader;
  export type PlatformEvents = ServicePlatformEvents;
  export type FeatureFlags = ServiceFeatureFlags;
  export type {
    OperationHandler,
    Extensions,
    Services,
    ClickHouseQuery,
    ClickHouseOperations,
    ExtensionContext,
    Cache,
    EventHandler,
    Events,
    PlatformEventsInfo,
    ServiceEvents,
    FrontendEvents,
    Context,
    Locks
  };
}

declare interface IDependencies {
  services: string[];
}

declare class Service {
  static get EventModes(): Service.EventModes;
  static get MetricTypes(): Service.MetricTypes;
  static get Extension(): Service.Extension;
  static get Config(): Service.Config;
  static buildLogger(name: string): Service.Logger;
  static get Exceptions(): {
    NoAccessError: Service.Error;
    RuntimeError: Service.Error;
  };
  static get Plugin(): Service.Plugin;
  static get Hook(): Service.Hook;
  static get ConnectionPool(): Service.ConnectionPool;
  static get SpecLoader(): Service.SpecLoader;
  static get ClickHouseQueryBuilder(): typeof ServiceClickHouseQueryBuilder;
  constructor(config: Service.Config);
  use(arg: Service.Extension): void;
  registerMetric(humanName: string, struct: IMetricInfo): void;
  registerBusinessMetric(humanName: string, businessInfo: IMetricBusinessInfo, struct: IMetricInfo): void;
  setLabel(key: string, val: string): void;
  set Dependencies(arg: IDependencies);
  useCustomExtension(extName: string): void;
  get Events(): Service.EventEmitter;
  get SyncEvents(): ServiceSyncEvents;
  get Address(): string;
  initialize(): Promise<any>;
}

export = Service;
