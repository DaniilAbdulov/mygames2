import {UserStore} from './UserStore';
import {GamesStore} from './GamesStore';

export class RootStore {
  userStore: UserStore;
  gamesStore: GamesStore;

  constructor() {
    this.userStore = new UserStore();
    this.gamesStore = new GamesStore();
  }
}
