import {RequestOptions} from 'https';

type FetchParams = {
  url: string,
  body?: any,
  uriParams?: any,
  formData?: any,
  formUrlencoded?: any,
  key?: RequestOptions['key'],
  requestMethod?: RequestOptions['method'],
  cert?: RequestOptions['cert'],
  ca?: RequestOptions['ca'],
  headers?: RequestOptions['headers'],
  timeout?: RequestOptions['timeout'],
  rejectUnauthorized?: RequestOptions['rejectUnauthorized'],
  encoding?: string,
  returnStream?: boolean
};

export type Fetcher = {
  fetchRequest<T = any>(params: FetchParams): Promise<T>
}
