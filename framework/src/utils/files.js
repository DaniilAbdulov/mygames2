const fs = require('fs');

class File {
  static readdirAsync(path) {
    return new Promise((resolve, reject) => {
      fs.readdir(path, (err, result) => err ? reject(err) : resolve(result));
    });
  }

  static stat(path) {
    return new Promise((resolve, reject) => {
      fs.stat(path, (err, result) => err ? reject(err) : resolve(result));
    });
  }
}

module.exports = File;
