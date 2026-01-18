export type Cache = {
  set(_: {key: string, val: unknown, ttl?: number}): Promise<unknown>;
  get(key: string): Promise<unknown>;
  has(key: string): Promise<boolean>;
  ttl(_: {key: string, ttl: number}): Promise<unknown>;
  remove(key: string): Promise<void>;
  removeByPrefix(prefix: string): Promise<string>;
  namespace(ns: string): Omit<Cache, 'namespace'> & {invalidate(): Promise<void>};
};
