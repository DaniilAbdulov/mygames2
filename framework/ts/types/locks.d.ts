export type Locks = {
  acquire(key: string, ttl: number, options?: Partial<Options>): Promise<{
    release(): Promise<void>
  }>;
  using<T>(
    key: string,
    ttl: number,
    fn: () => T | Promise<T>,
    options?: Partial<Options>
  ): Promise<T>;
};

type Options = {
  timeout: number;
  maxAttempts: number;
};
