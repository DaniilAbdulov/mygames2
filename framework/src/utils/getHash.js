const crypto = require('crypto');

module.exports = (content) =>
  crypto.createHash('sha256')
    .update(content)
    .digest('hex');
