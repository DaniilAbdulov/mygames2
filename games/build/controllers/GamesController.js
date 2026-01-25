"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.gamesController = void 0;
const games_1 = require("../services/games");
class GamesController {
    constructor() {
        this.getGames = (limit, ext) => (0, games_1.get)(limit, ext);
    }
}
exports.gamesController = new GamesController();
