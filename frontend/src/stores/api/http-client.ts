// src/stores/api/http-client.ts
import {API_CONFIG} from './config';

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export interface RequestOptions {
  method?: HttpMethod;
  headers?: Record<string, string>;
  body?: any;
  params?: Record<string, string | number | boolean>;
}

export class HttpError extends Error {
  constructor(
    public status: number,
    public statusText: string,
    public data?: any,
  ) {
    super(`HTTP Error ${status}: ${statusText}`);
    this.name = 'HttpError';
  }
}

export class HttpClient {
  private baseURL: string;
  private defaultHeaders: Record<string, string>;

  constructor(baseURL?: string) {
    this.baseURL = baseURL || API_CONFIG.baseURL;
    this.defaultHeaders = {
      ...API_CONFIG.headers,
    };
  }

  private buildUrl(
    endpoint: string,
    params?: Record<string, string | number | boolean>,
  ): string {
    let url = `${this.baseURL}${endpoint}`;

    if (params && Object.keys(params).length > 0) {
      const queryParams = new URLSearchParams();

      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryParams.append(key, String(value));
        }
      });

      url += `?${queryParams.toString()}`;
    }

    return url;
  }

  private async request<T>(
    endpoint: string,
    options: RequestOptions = {},
  ): Promise<T> {
    const {method = 'GET', headers = {}, body, params} = options;

    const url = this.buildUrl(endpoint, params);

    const requestHeaders: HeadersInit = {
      ...this.defaultHeaders,
      ...headers,
    };

    const config: RequestInit = {
      method,
      headers: requestHeaders,
    };

    if (body) {
      config.body = JSON.stringify(body);
    }

    try {
      console.log({
        url,
        config,
      });
      const response = await fetch(url, config);

      if (!response.ok) {
        let errorData;

        try {
          errorData = await response.json();
        } catch {
          errorData = await response.text();
        }

        throw new HttpError(response.status, response.statusText, errorData);
      }

      if (
        response.status === 204 ||
        response.headers.get('content-length') === '0'
      ) {
        return null as T;
      }

      const data = await response.json();
      return data as T;
    } catch (error) {
      if (error instanceof HttpError) {
        this.handleHttpError(error);
        throw error;
      }

      console.error('Network error:', error);
      throw new Error('Network request failed. Please check your connection.');
    }
  }

  private handleHttpError(error: HttpError): void {
    switch (error.status) {
      case 401:
        // Перенаправление на страницу логина
        window.location.href = '/login';
        break;
      case 403:
        console.warn('Access forbidden:', error.data);
        break;
      case 404:
        console.warn('Resource not found:', error.data);
        break;
      case 500:
        console.error('Server error:', error.data);
        break;
      default:
        console.error('HTTP error:', error);
    }
  }

  get<T>(
    endpoint: string,
    params?: Record<string, string | number | boolean>,
  ): Promise<T> {
    return this.request<T>(endpoint, {method: 'GET', params});
  }

  post<T>(endpoint: string, body?: any): Promise<T> {
    return this.request<T>(endpoint, {method: 'POST', body});
  }

  put<T>(endpoint: string, body?: any): Promise<T> {
    return this.request<T>(endpoint, {method: 'PUT', body});
  }

  patch<T>(endpoint: string, body?: any): Promise<T> {
    return this.request<T>(endpoint, {method: 'PATCH', body});
  }

  delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, {method: 'DELETE'});
  }
}

export const httpClient = new HttpClient();
