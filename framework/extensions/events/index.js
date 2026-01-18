const {Extension} = require('../../src/classes');

class Events extends Extension {
  constructor() {
    super(Extension.Types.STATIC, 'Events');
  }

  load({platformEvents}) {
    this._platformEvents = platformEvents;
  }

  action() {
    return this._platformEvents.ext();
  }
}

module.exports = Events;
