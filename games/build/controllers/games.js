"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.addGame = exports.getGames = void 0;
const games_1 = require("../services/games");
Object.defineProperty(exports, "getGames", { enumerable: true, get: function () { return games_1.get; } });
Object.defineProperty(exports, "addGame", { enumerable: true, get: function () { return games_1.create; } });
