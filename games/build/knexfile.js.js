"use strict";
const { development } = require('./config');
const config = {
    development: development.connect,
};
module.exports = config;
