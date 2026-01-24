declare module '@mygames/framework-service' {
  export class ServiceImpl {
    constructor(options?: any);
    initialize(): Promise<void>;
  }
}
