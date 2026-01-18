const {execFileSync} = require('child_process');
const path = require('path');

class Processes {
  static syncUnregister(name, port) {
    try {
      // это такой хак, который позволяет сделать асинхронную операцию синхронной
      execFileSync(
        'node',
        [path.join(__dirname, '/unregister.js'), `${name}`, `${port}`],
        {timeout: 5000}
      );
    } catch(_) {
      // не получилось и ладно, это механим резервный
    }
  }
}

module.exports = Processes;
