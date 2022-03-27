const axios = require('axios');

const crawlerInstance = axios.create({
  timeout: 5000,
  timeoutErrorMessage: 'Timeout issue'
});

crawlerInstance.interceptors.response.use(
    res => res,
    err => console.log(err.message));

module.exports = {
  crawlerInstance,
};
