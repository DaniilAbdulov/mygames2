/* eslint-disable max-len */
/* eslint-disable no-control-regex */
const DATE = /^(\d\d\d\d)-(\d\d)-(\d\d)$/;
const TIME = /^(\d\d):(\d\d):(\d\d)(\.\d+)?(z|[+-]\d\d(?::?\d\d)?)?$/i;
const HOSTNAME = /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?:\.[a-z0-9](?:[-0-9a-z]{0,61}[0-9a-z])?)*$/i;
const DATE_TIME_SEPARATOR = /t|\s/i;
const EMAIL = /^[a-z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)*$/i;
const UUID = /^(?:urn:uuid:)?[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i;
const IP4 = /^(?:(?:25[0-5]|2[0-4]\d|[01]?\d\d?)\.){3}(?:25[0-5]|2[0-4]\d|[01]?\d\d?)$/;
const IP6 = /^\s*(?:(?:(?:[0-9a-f]{1,4}:){7}(?:[0-9a-f]{1,4}|:))|(?:(?:[0-9a-f]{1,4}:){6}(?::[0-9a-f]{1,4}|(?:(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(?:\.(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3})|:))|(?:(?:[0-9a-f]{1,4}:){5}(?:(?:(?::[0-9a-f]{1,4}){1,2})|:(?:(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(?:\.(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3})|:))|(?:(?:[0-9a-f]{1,4}:){4}(?:(?:(?::[0-9a-f]{1,4}){1,3})|(?:(?::[0-9a-f]{1,4})?:(?:(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(?:\.(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(?:(?:[0-9a-f]{1,4}:){3}(?:(?:(?::[0-9a-f]{1,4}){1,4})|(?:(?::[0-9a-f]{1,4}){0,2}:(?:(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(?:\.(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(?:(?:[0-9a-f]{1,4}:){2}(?:(?:(?::[0-9a-f]{1,4}){1,5})|(?:(?::[0-9a-f]{1,4}){0,3}:(?:(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(?:\.(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(?:(?:[0-9a-f]{1,4}:){1}(?:(?:(?::[0-9a-f]{1,4}){1,6})|(?:(?::[0-9a-f]{1,4}){0,4}:(?:(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(?:\.(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(?::(?:(?:(?::[0-9a-f]{1,4}){1,7})|(?:(?::[0-9a-f]{1,4}){0,5}:(?:(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(?:\.(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:)))(?:%.+)?\s*$/i;
const Z_ANCHOR = /[^\\]\\Z/;
/* eslint-enable max-len */
/* eslint-enable no-control-regex */

const regex = (str) => {
  if (Z_ANCHOR.test(str)) {
    return false;
  }

  try {
    new RegExp(str);

    return true;
  } catch(err) {
    return false;
  }
};

// https://tools.ietf.org/html/rfc3339#appendix-C
const isLeapYear = (year) => year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);

const dateFormat = (str) => {
  // full-date from http://tools.ietf.org/html/rfc3339#section-5.6
  const matches = str.match(DATE);

  if (!matches) {
    return false;
  }

  const year = Number(matches[1]);
  const month = Number(matches[2]);
  const day = Number(matches[3]);

  return (
    month >= 1 &&
    month <= 12 &&
    day >= 1 &&
    day <= (
      month === 2 &&
      isLeapYear(year) ? 29 : [0, 31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][month]
    )
  );
};

const time = (str) => {
  const matches = str.match(TIME);

  if (!matches) {
    return false;
  }

  const hour = Number(matches[1]);
  const minute = Number(matches[2]);
  const second = Number(matches[3]);

  return (
    hour <= 23 && minute <= 59 && second <= 59 ||
    hour === 23 && minute === 59 && second === 60
  );
};

const dateTime = (str) => {
  // http://tools.ietf.org/html/rfc3339#section-5.6
  const [dateToValidate, timeToValidate] = str.split(DATE_TIME_SEPARATOR);

  return dateToValidate && timeToValidate && dateFormat(dateToValidate) && time(timeToValidate);
};

const urlFormat = (str) => {
  try {
    const url = new URL(str);

    return ['http:', 'https:'].includes(url.protocol);
  } catch(_) {
    return false;
  }
};

// https://tools.ietf.org/html/rfc1034#section-3.5
// https://tools.ietf.org/html/rfc1123#section-2
const hostname = (str) => str.length <= 255 && HOSTNAME.test(str);

module.exports = {
  date: dateFormat, // eslint-disable-line
  time,
  'date-time': dateTime,
  email: EMAIL,
  url: urlFormat,
  hostname,
  ipv4: IP4,
  ipv6: IP6,
  regex,
  uuid: UUID
};
