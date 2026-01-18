const {Extension} = require('../../src/classes');

class ApiExt extends Extension {
  constructor() {
    super(
      Extension.Types.DYNAMIC,
      'Api',
      {autoExecute: true, traceMode: Extension.TraceModeTypes.DISABLE}
    );
  }

  action({api}) {
    return api;
  }
}

module.exports = ApiExt;
