export type FeatureFlags = {
  get<T = any>(key: string): T;
};
