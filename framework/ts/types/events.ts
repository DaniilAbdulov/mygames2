import {ServiceEvents, FrontendEvents} from '../interfaces/events';
import {Extensions} from '../interfaces/extensions';
import {EventModes} from '../enums';
import {Context} from './context';

type THumanDate = {
  s?: number;
  m?: number;
  h?: number;
  d?: number;
  w?: number;
};

type BaseEvent<
  Type = string,
  Entity extends number | undefined = number | undefined,
  EntityId extends number | undefined = number | undefined,
  Payload = any | undefined
> = {
  type: Type;
} & (
  Entity extends undefined ?
    {entity?: Entity} :
    {entity: Entity}
) & (
  EntityId extends undefined ?
    {entityId?: EntityId} :
    {entityId: EntityId}
) & (
  Payload extends undefined ?
    {payload?: Payload} :
    {payload: Payload}
);

type CancelPayload = {
  type: string;
  entity: number;
  entityId: number;
};

type BaseServiceEvent<
  Type = string,
  Entity extends number | undefined = number | undefined,
  EntityId extends number | undefined = number | undefined,
  Payload = any | undefined
> = BaseEvent<Type, Entity, EntityId, Payload> & {
  deferTo?: number | string | THumanDate;
};

type UniqueServiceEvent<
  Type = string,
  Payload = any | undefined
> = BaseServiceEvent<Type, number, number, Payload> & {
  isUnique: true;
};

type CommonServiceEvent<
  Type = string,
  Entity extends number | undefined = number | undefined,
  EntityId extends number | undefined = number | undefined,
  Payload = any | undefined
> = BaseServiceEvent<Type, Entity, EntityId, Payload> & {
  isUnique?: false;
};

type ServiceEventInfo<
  Type = string,
  Entity extends number | undefined = number | undefined,
  EntityId extends number | undefined = number | undefined,
  Payload = any | undefined
> = CommonServiceEvent<Type, Entity, EntityId, Payload> | UniqueServiceEvent<Type, Payload>;

type FrontendEventInfo<
  Type = string,
  Entity extends number | undefined = number | undefined,
  EntityId extends number | undefined = number | undefined,
  Payload = any | undefined
> = BaseEvent<Type, Entity, EntityId, Payload> & {
  broadcast?: boolean;
  users?: number[];
};

export type EventsInfo = {
  serviceEvent: ServiceEventInfo;
  frontendEvent: FrontendEventInfo;
};

export type PlatformEvents = {
  sendToServices(event: ServiceEventInfo, mode?: EventModes): Promise<void>;
  sendToFrontend(event: FrontendEventInfo, mode?: EventModes): Promise<void>;
  cancelDefered(event: CancelPayload, mode?: EventModes): Promise<void>;
}

export type ServicePlatformEvents = {
  sendToServices<
    EventName extends keyof ServiceEvents = '',
    ServiceEventTypes extends ServiceEvents[EventName] = ServiceEvents[EventName],
  >(
    event: ServiceEventInfo<
      EventName,
      ServiceEventTypes['entity'] extends number ? ServiceEventTypes['entity'] : undefined,
      ServiceEventTypes['entity'] extends number ? number : undefined,
      ServiceEventTypes['payload']
    >,
    mode?: EventModes
  ): Promise<void>;
  sendToFrontend<
    EventName extends keyof FrontendEvents = '',
    FrontendEventTypes extends FrontendEvents[EventName] = FrontendEvents[EventName]
  >(
    event: FrontendEventInfo<
      EventName,
      FrontendEventTypes['entity'] extends number ? FrontendEventTypes['entity'] : undefined,
      FrontendEventTypes['entity'] extends number ? number : undefined,
      FrontendEventTypes['payload']
    >,
    mode?: EventModes
  ): Promise<void>;
  cancelDefered(event: CancelPayload, mode?: EventModes): Promise<void>;
};

export type EventHandler<
  EventName extends keyof ServiceEvents = '',
  ServiceEventTypes extends ServiceEvents[EventName] = ServiceEvents[EventName]
> = (
  event: ServiceEventInfo<
    EventName,
    ServiceEventTypes['entity'] extends number ? ServiceEventTypes['entity'] : undefined,
    ServiceEventTypes['entity'] extends number ? number : undefined,
    ServiceEventTypes['payload']
  >,
  ext: Extensions,
  ctx?: Context
) => void | Promise<void>;
