import {makeAutoObservable} from 'mobx';

export class DataLoadingStore {
  isLoading = false;
  constructor() {
    makeAutoObservable(this);
  }

  loading = () => {
    this.isLoading = true;
  };

  success = () => {
    this.isLoading = false;
  };

  error = () => {
    this.isLoading = false;
  };
}
