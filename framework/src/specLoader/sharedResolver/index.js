/* eslint-disable id-blacklist */

const components = require('./components');

module.exports = {
  order: 1,
  canRead: /^shared:/i,
  // or we shall use callback style :(
  // eslint-disable-next-line require-await
  async read(file) {
    const component = new URL(file.url).hostname;

    if (!components[component]) {
      throw new Error(`Shared component '${component}' not found!`);
    }

    return components[component];
  },
};
