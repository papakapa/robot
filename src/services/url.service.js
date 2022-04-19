const Url = require('url-parse');

const { getLastBySeparator } = require('../common/utils');
const { RESTRICTED_LANGUAGES, RESTRICTED_FILE_EXTENSIONS, VALID_DOMAINS } = require('../common/constants');

const getProtocol = (url) => {
  const { protocol } = new Url(url);

  return protocol;
}

const updateProtocol = (url) => {
  const { protocol } = new Url(url);

  if (!url || !protocol) {
    return url;
  }

  return protocol === 'http:' ? url.replace('http:', 'https:') : url.replace('https:', 'http:');
};

const getHighLevelDomain = (url) => {
  const { hostname } = new Url(url);

  return hostname;
}

const getUrlPathname = (url) => {
  const { pathname } = new Url(url);

  return pathname;
}

const validatePath = (path) => {
  if (!path) {
    return true;
  }

  const restrictedDictionary = ['login', 'authorize', 'auth'];
  const restrictedValues = [ ...RESTRICTED_LANGUAGES, ...RESTRICTED_FILE_EXTENSIONS];
  const lastPathSlashValue = path && getLastBySeparator(path, '/');
  const lastPathDotValue = path && getLastBySeparator(path, '.');

  if (path.split('/').length > 5) {
    return false;
  }

  if (RESTRICTED_LANGUAGES.includes(lastPathSlashValue) || restrictedDictionary.includes(lastPathSlashValue)) {
    return false;
  }

  return !restrictedValues.includes(lastPathDotValue);
}

const validateHost = (host) => {
  if (!host) {
    return false;
  }

  if (host.split('.').length > 2 && RESTRICTED_LANGUAGES.includes(host.split('.')[0])) {
    return false;
  }

  if (host.includes('docs.google')) {
    return false;
  }

  if (host.includes('wikipedia') && !['wikipedia', 'ru', 'en'].includes(host.split('.')[0])) {
    return false;
  }

  return VALID_DOMAINS.includes(getLastBySeparator(host, '.'));
}

const validateUrl = (url) => {
  const { protocol, host, query, pathname } = new Url(url);

  if (url && url.length > 250) {
    return true;
  }

  if (!validatePath(pathname)) {
    return true;
  }

  if (!validateHost(host)) {
    return true;
  }

  return !url || !protocol || !host || !!query;
};

const checkFileUrlExtensions = (url, symbols) => {
  const lastPathDotValue = url && getLastBySeparator(url, '.');

  if (!url || !lastPathDotValue) {
    return { isEndedWithSymbol: false, symbol: null };
  }

  const symbol = symbols.find(el => el === lastPathDotValue);

  return { isEndedWithSymbol: !!symbol, symbol }
}

const formatUrl = (url) => {
  if (!url) {
    return url;
  }

  let formattedUrl = url;

  const { symbol, isEndedWithSymbol } = checkFileUrlExtensions(url, ['html', 'php', 'aspx']);
  // formattedUrl = formattedUrl.replace('/url?q=', '').split('&')[0];
  formattedUrl = formattedUrl.split('?')[0];
  formattedUrl = formattedUrl.split('#')[0];

  if (isEndedWithSymbol && symbol) {
    formattedUrl = formattedUrl.replace(`.${symbol}`, '');
  }
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
  updateProtocol,
  getHighLevelDomain,
  getUrlPathname,
  getProtocol,
};
