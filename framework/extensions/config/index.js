const {Extension} = require('../../src/classes');

class Config extends Extension {
  constructor() {
    super(Extension.Types.STATIC, 'Config');
  }

  load({config}) {
    this._config = config;
  }

  action() {
    return this._config;
  }
}

module.exports = Config;
