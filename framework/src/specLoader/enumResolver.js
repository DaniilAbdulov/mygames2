/* eslint-disable id-blacklist, global-require */
const {isNumber, isString} = require('../utils');

module.exports = (includeRefMetadata) => {
  return {
    order: 2,

    canRead: /^enum:/i,

    // or we shall use callback style :(
    // eslint-disable-next-line require-await
    async read(file) {
      const {
        hostname: component,
        searchParams: itemsToInclude,
        pathname: enumNameRaw
      } = new URL(file.url);

      let struct;
      let isNeedToDelete = false;

      try {
        isNeedToDelete = !(require.resolve(`@ecosystem/enums/${component}`) in require.cache);

        struct = require(`@ecosystem/enums/${component}`);
      } catch(err) {
        throw new Error(`Component '${component}' not found!`);
      }

      try {
        const enumName = enumNameRaw.replace('/', '');

        if (enumName && !struct[enumName]) {
          throw new Error(`Enum '${enumName}' not found!`);
        }

        const isAnyItemsToInclude =
          itemsToInclude &&
          Array.from(itemsToInclude.keys()).length !== 0;

        const root = enumName ? struct[enumName] : struct;
        const items = isAnyItemsToInclude ? [] : Object.values(root);
        let enumItems;

        if (isAnyItemsToInclude) {
          const [key] = itemsToInclude.keys();

          enumItems = key
            .split(',')
            .map((enumItem) => enumItem.trim())
            .filter(Boolean);

          for (const item of enumItems) {
            if (
              item in root &&
              (
                isString(root[item]) || isNumber(root[item])
              )
            ) {
              items.push(root[item]);
            }
          }
        }

        return {
          type: isNumber(items[0]) ? 'integer' : 'string',
          enum: items,
          ...includeRefMetadata && {
            'x-enum-component': component,
            'x-enum-name': enumName,
            ...enumItems && {'x-enum-items': enumItems}
          }
        };
      } finally {
        if (isNeedToDelete) {
          delete require.cache[require.resolve(`@ecosystem/enums/${component}`)];

          struct = null;
        }
      }
    }
  };
};
