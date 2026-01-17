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

  constructor() {
    makeAutoObservable(this);

    this.init();
  }

  get isLoading() {
    return this.loadingState.isLoading;
  }

  init = async () => {
    console.log(`init`);
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
}
