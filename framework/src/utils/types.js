'use strict';

const getTag = (value) => {
  if (value === null) {
    return value === undefined ? '[object Undefined]' : '[object Null]';
  }

  return toString.call(value);
};

module.exports = {
  isDate: (value) => !!Date.parse(value),
  isString: (value) => {
    const type = typeof value;

    return type === 'string' ||
      type === 'object' &&
      value !== null &&
      !Array.isArray(value) &&
      getTag(value) === '[object String]';
  },
  isUndefined: (value) => value === undefined,
  isNull: (value) => value === null,
  isObject: (value) => {
    const type = typeof value;

    return value !== null &&
      type === 'object' &&
      type !== 'function' &&
      !Array.isArray(value) &&
      getTag(value) === '[object Object]';
  },
  isNumber: (value) => typeof value === 'number' ||
    typeof value === 'object' && value !== null && getTag(value) === '[object Number]',
  isArray: (value) => Array.isArray(value),
  isBoolean: (value) => typeof value === 'boolean',
  // lint dont know about big int
  isBigInt: (value) => typeof value === 'bigint' // eslint-disable-line
};
