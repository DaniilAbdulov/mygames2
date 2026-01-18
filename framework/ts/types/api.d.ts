import {Services} from '../interfaces/services';
import {Extensions} from '../interfaces/extensions';
import {Context} from './context';

type Split<S extends string> = S extends `${infer Head}.${infer Tail}`
  ? Head extends keyof Services
    ? Tail extends keyof Services[Head]
      ? [Head, Tail]
      : never
    : never
  : never;

type ServicesApi<
  Service extends string = '',
  ServiceName extends keyof Services = Split<Service>[0],
  MethodName extends keyof Services[ServiceName] = Split<Service>[1],
  ServiceTypes extends Record<string, unknown> = Services[ServiceName][MethodName]
> = {
  service<OperationName extends string>(name: OperationName): ServicesApi<OperationName>;
  
  params(params: ServiceTypes['params']): ServicesApi<Service>;

  body(body: ServiceTypes['body']): ServicesApi<Service>;
  body<K extends keyof ServiceTypes['body'], Y extends K | 'body'>(
    prop: Y,
    value: Y extends 'body'
      ? ServiceTypes['body']
      : ServiceTypes['body'][K]
  ): ServicesApi<Service>;


  timeout(mseconds: number): ServicesApi<Service>;
  
  withAllRights(): ServicesApi<Service>;
  
  then<UResult1, UResult2>(
    onFulfilled?: ((value: ServiceTypes['result']) => UResult1 | PromiseLike<UResult1>) | null | undefined,
    onRejected?: ((reason: unknown) => UResult2 | PromiseLike<UResult2>) | null | undefined,
  ): PromiseLike<UResult1 | UResult2>;
  
  catch<UResult>(
    onRejected?: ((reason: unknown) => UResult | PromiseLike<UResult>) | null | undefined,
  ): PromiseLike<ServiceTypes['result'] | UResult>;
};

export type ServiceApiFactory = () => ServicesApi;

type Meta = Partial<{
  lang: string;
  userId: number;
  sessionId: string;
  tz: number;
  mainOfficeId: number;
  officesIds: number[];
  mainCityId: number;
  citiesIds: number[];
  source: number;
}>;

export type OperationHandler<
  Service extends string = '',
  BodyKey extends string = 'body',
  ServiceName extends keyof Services = Split<Service>[0],
  MethodName extends keyof Services[ServiceName] = Split<Service>[1],
  ServiceTypes extends Record<string, unknown> = Services[ServiceName][MethodName]
> = (
  vars:
    ServiceTypes['params'] &
    (
      ServiceTypes['body'] extends never ?
        {} :
        {[P in BodyKey]: ServiceTypes['body']}
      ) &
    Meta,
  ext: Extensions,
  ctx?: Context
) => ServiceTypes['result'] | Promise<ServiceTypes['result']>;


export type Api = () => Record<string, any>;
