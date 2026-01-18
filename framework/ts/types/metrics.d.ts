import {MetricTypes} from '../enums';

export declare interface IMetricInfo {
  type: MetricTypes;
  name: string;
  description: string;
  labels?: string[];
  buckets?: number[]
}

export declare interface IMetricBusinessInfo {
  team: string;
  product: string;
}

export type Metrics = {
  set(humanName: string, newValue: number, customLabels?: Record<string, unknown>): void;
  replace(humanName: string, newValue: number, customLabels?: Record<string, unknown>): void;
};
