const { Client } = require('pg');

const { initQuery } = require('../common/queries');

const getConnection = async () => {
  const postgresClient = new Client({
    host: 'localhost',
    port: 5432,
    user: 'me',
    password: '1111',
    database: 'search',
  });

  await postgresClient.connect(err => err && console.log(err));
  await postgresClient.query(initQuery);

  return postgresClient;
};

module.exports = {
  getConnection,
};
