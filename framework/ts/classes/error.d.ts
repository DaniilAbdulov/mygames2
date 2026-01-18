interface ServiceError extends Error {
  name: string;
  meta: object;
  message: string;
  status: number;
  code: number;
  stack: string;
}

interface ServiceErrorConstructor extends Error {
  new(message?: string, meta?: object, code?: number): ServiceError;
  (message?: string, meta?: object, code?: number): ServiceError;
  readonly prototype: ServiceError;
}

export = ServiceErrorConstructor;
