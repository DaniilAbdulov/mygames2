import {makeAutoObservable, runInAction} from 'mobx';
import {DataLoadingStore} from './shared/DataLoadingStore';

type User = {
  fullName: string;
};

export class UserStore {
  user: User | null = null;
  isAuthenticated = false;

  formValues: Record<string, string> = {
    phone: '',
    password: '',
  };

  errors: Record<string, boolean> | null = null;

  loadingState = new DataLoadingStore();
  userStoreloadingState = new DataLoadingStore();

  constructor() {
    makeAutoObservable(this);

    this.init();
  }

  get isLoading() {
    return this.loadingState.isLoading;
  }

  get userIsLoading() {
    return this.userStoreloadingState.isLoading;
  }

  setValue = (key: string, val: string) => {
    this.formValues[key] = val;

    if (this.errors?.[key]) {
      this.errors[key] = false;
    }
  };

  setPhone = (phone: string) => {
    this.setValue('phone', phone);
  };

  setPassword = (password: string) => {
    this.setValue('password', password);
  };

  setError = (key: string) => {
    this.errors = {
      ...this.errors,
      [key]: true,
    };
  };

  init = async () => {
    console.log(`init`);
    this.userStoreloadingState.loading();

    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));

      const user = null;
      // const user = {
      //   fullName: 'Абдулов Даниил',
      // };

      if (user) {
        runInAction(() => {
          this.user = user;
          this.isAuthenticated = true;
        });
      }
      this.userStoreloadingState.success();
    } catch (error) {
      console.log(error);

      this.userStoreloadingState.error();
    }
  };

  _validate = () => {
    const {phone, password} = this.formValues;

    console.log({
      phone,
      password,
    });

    if (!phone) {
      this.setError('phone');
    }

    if (!password) {
      this.setError('password');
    }

    if (!this.errors) {
      return true;
    }

    return !Object.values(this.errors).some(Boolean);
  };

  login = async () => {
    console.log(`login`);
    if (this.isLoading) {
      return;
    }

    if (!this._validate()) {
      return;
    }

    try {
      this.loadingState.loading();

      await new Promise((resolve) => setTimeout(resolve, 1000));

      const user = {
        fullName: 'Абдулов Даниил',
      };

      if (user) {
        runInAction(() => {
          this.user = user;
          this.isAuthenticated = true;
        });
      }

      this.resetData();
      this.loadingState.success();
    } catch (error) {
      console.log(error);

      this.loadingState.error();
    }
  };

  logout = async () => {
    if (this.isLoading) {
      return;
    }
    try {
      this.loadingState.loading();
      await new Promise((resolve) => setTimeout(resolve, 1000));

      this.loadingState.success();
    } catch (error) {
      console.log(error);

      this.loadingState.error();
    }
  };

  resetData = () => {
    this.formValues = {};
    this.setValue('phone', '');
    this.setValue('password', '');
    this.errors = null;
  };
}
