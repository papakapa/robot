const axios = require('axios');

const crawlerInstance = axios.create({
  timeout: 5000,
  timeoutErrorMessage: 'Timeout issue'
});

// crawlerInstance.interceptors.request.use((req) => {
//   console.log(req);
//
//   return req;
// })

// crawlerInstance.interceptors.response.use(
//     res => {
//       console.log(res.status);
//
//       return res;
//     },
//     err => {
//       console.log(err.message);
//       return null;``
//     });

module.exports = {
  crawlerInstance,
};
