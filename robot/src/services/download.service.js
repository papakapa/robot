const axios = require('axios');
const iconv = require('iconv-lite');
const encodeDetection = require('jschardet');

const fetchWithEncoding = async (url) => {
  const { data } = await axios.get(url, {
    timeout: 4000,
    timeoutErrorMessage: 'Timeout issue detected',
    responseType: 'arraybuffer'
  }) || {};

  if (!data) {
    return null;
  }

  const { encoding } = encodeDetection.detect(data) || {};

  return iconv.decode(data, encoding ? encoding : 'utf8');
};

module.exports = { fetchWithEncoding };
