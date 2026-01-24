import {BaseService} from '../base-service';

type GetGamesParams = {
  limit: number;
  offset: number;
};

export class GamesService extends BaseService {
  constructor() {
    super();
  }

  getGames = (params: GetGamesParams) =>
    this.handleResponse(this.client.get('/games/get', params));
}

export const gamesService = new GamesService();
