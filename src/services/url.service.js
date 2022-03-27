const Url = require('url-parse');

const { getLastBySeparator } = require('../common/utils');
const { RESTRICTED_LANGUAGES, RESTRICTED_FILE_EXTENSIONS, VALID_DOMAINS } = require('../common/constants');

const validateUrl = (url) => {
  const { protocol, host, query, pathname } = new Url(url);
  const restrictedValues = [ ...RESTRICTED_LANGUAGES, ...RESTRICTED_FILE_EXTENSIONS];

  if (url && url.length > 250) {
    return true;
  }

  if (pathname && pathname.split('/').length > 5) {
    return true;
  }

  if (host && host.split('.').length > 2 && RESTRICTED_LANGUAGES.includes(host.split('.')[0])) {
    return true;
  }
  if (pathname && RESTRICTED_LANGUAGES.includes(getLastBySeparator(pathname, '/'))){
    return true;
  }

  if (pathname && restrictedValues.includes(getLastBySeparator(pathname, '.'))) {
    return true;
  }

  if (host && !VALID_DOMAINS.includes(getLastBySeparator(host, '.'))){
    return true;
  }
  return !url || !protocol || !host || !!query;
};

const formatUrl = (url) => {
  if (!url) {
    return url;
  }

  let formattedUrl = url;

  // formattedUrl = formattedUrl.replace('/url?q=', '').split('&')[0];
  formattedUrl = formattedUrl.split('?')[0];
  // avoid duplicates urls like habr.com/ru && habr.com/ru/
  formattedUrl = formattedUrl.charAt(formattedUrl.length-1) === '/'
      ? formattedUrl.slice(0, -1)
      : formattedUrl;
  formattedUrl = formattedUrl.replace('www.', '');

  return formattedUrl;
};

module.exports = {
  formatUrl,
  validateUrl,
};
