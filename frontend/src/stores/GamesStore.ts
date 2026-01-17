import {makeAutoObservable, runInAction} from 'mobx';
import {DataLoadingStore} from './shared/DataLoadingStore';

export type Game = {
  id: number;
  name: string;
  year: number;
  author: string;
};
export class GamesStore {
  loadingState = new DataLoadingStore();
  games: Game[] = [];
  values: Record<string, string | number | null> = {
    name: '',
    year: '',
    author: '',
  };
  errors: Record<string, boolean> | null = null;

  constructor() {
    makeAutoObservable(this);
  }

  get isLoading() {
    return this.loadingState.isLoading;
  }

  setValue = (key: string, val: string) => {
    this.values[key] = val;

    if (this.errors?.[key]) {
      this.errors[key] = false;
    }
  };

  setName = (name: string) => {
    this.setValue('name', name);
  };

  setYear = (year: string) => {
    this.setValue('year', year);
  };

  setAuthor = (author: string) => {
    this.setValue('author', author);
  };

  setError = (key: string) => {
    this.errors = {
      ...this.errors,
      [key]: true,
    };
  };

  loadGames = async () => {
    if (this.isLoading) {
      return;
    }

    console.log(`loadGames`);

    try {
      this.loadingState.loading();

      await new Promise((resolve) => setTimeout(resolve, 2000));

      runInAction(() => {
        this.games = [
          {
            id: 1,
            name: 'Grand Theft Auto: San Andreas',
            year: 2004,
            author: 'Rockstar',
          },
        ];
      });

      this.loadingState.success();
    } catch (error) {
      console.log(error);

      this.loadingState.error();
    }
  };

  _validate = () => {
    const {name, author, year} = this.values;
    const numberedYear = year ? Number(year) : null;

    if (!name) {
      this.setError('name');
    }

    if (!author) {
      this.setError('author');
    }

    const yearIsValid =
      numberedYear &&
      (numberedYear < 1900 || numberedYear > new Date().getFullYear());

    if (!yearIsValid) {
      this.setError('year');
    }

    if (!this.errors) {
      return true;
    }

    return !Object.values(this.errors).some(Boolean);
  };

  addGame = async () => {
    if (this.isLoading || !this._validate()) {
      return;
    }

    try {
      this.loadingState.loading();

      console.log(this.values);

      await new Promise((resolve) => setTimeout(resolve, 1000));

      this.resetData();
      this.loadingState.success();
    } catch (error) {
      console.log(error);
      this.loadingState.error();
    }
  };

  resetData = () => {
    this.setValue('name', '');
    this.setValue('year', '');
    this.setValue('author', '');
    this.errors = null;
  };
}
