export type Context = {
  set(key: string, value: unknown): Context;
  remove(key: string): Context;
  has(key: string): boolean;
  get(key: string): any;
};
