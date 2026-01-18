export enum EventModes {
  UNSAFE = 1,
  SAFE,
  QUEUE
}

export enum MetricTypes {
  COUNTER = 1,
  HISTOGRAM,
  GAUGE
}

export enum ExtensionTypes {
  STATIC = 1,
  DYNAMIC
}

export enum ExtensionTraceModeTypes {
  AUTO = 1,
  MANUAL,
  DISABLE
}
