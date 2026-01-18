/* eslint-disable id-blacklist, max-len */
const {andOr, baseFilter} = require('./stub');
const components = require('../sharedResolver/components');

const getSharedStubData = (name, component) => {
  return {
    $ref: `shared://${name}`,
    example: component?.example
  };
};

const getEnumStubData = (url) => {
  return {
    $ref: `enum:/${url.pathname}${url.search}`,
    example: 1
  };
};

const getAnyStubData = () => {
  return {
    $ref: undefined,
    example: 'any type'
  };
};

// Базовые типы которые могут быть использованы для фильтра
// Из shared/components не все типы подходят, поэтому делаем отдельным массивом
const allowedTypes = [
  'Boolean',
  'Float',
  'PositiveInteger',
  'Integer',
  'Double',
  'String',
  'NotEmptyString',
  'DateTime',
  'Date',
  'DateShortFormat',
  'Time',
  'NotEmptyText',
  'Text',
  'Email',
  'Url',
  'Uuid',
  'PhoneWithPlus',
  'HexColor'
].map((it) => it.toLowerCase());

const customTypes = [
  'any',
  'and',
  'or',
  'enum'
];

module.exports = {
  order: 3,
  canRead: /^filter:/i,
  // or we shall use callback style :(
  // eslint-disable-next-line require-await
  async read(file) {
    const url = new URL(file.url);
    const name = url.hostname;
    const component = components[name];

    if (!customTypes.includes(name)) {
      if (!allowedTypes.includes(name)) {
        throw new Error(`Does not support '${name}' as filter type!`);
      }

      if (!component) {
        throw new Error(`Filter component '${name}' not found!`);
      }
    }

    let data = getSharedStubData(name, component);

    if (name === 'enum') {
      data = getEnumStubData(url);
    }

    if (name === 'any') {
      data = getAnyStubData();
    }

    if (name === 'and' || name === 'or') {
      return andOr(name);
    }

    return baseFilter(data);
  }
};
