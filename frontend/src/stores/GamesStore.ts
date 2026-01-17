import {makeAutoObservable} from 'mobx';

export class GamesStore {
  constructor(private rootStore: any) {
    makeAutoObservable(this);

    this.init();
  }

  init = async () => {
    await new Promise((resolve) => setTimeout(resolve, 2000));

    console.log(`init`);
  };
}
