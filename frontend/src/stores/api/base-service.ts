import {httpClient, HttpClient} from './http-client';

export abstract class BaseService {
  protected client: HttpClient;

  constructor(client?: HttpClient) {
    this.client = client || httpClient;
  }

  protected async handleResponse<T>(promise: Promise<T>): Promise<T> {
    try {
      return await promise;
    } catch (error) {
      console.error('Service error:', error);
      throw error;
    }
  }
}
