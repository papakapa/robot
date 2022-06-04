const { Client } = require('pg');

const { initQuery } = require('../common/queries');

const getConnection = async () => {
  try {
    const postgresClient = new Client({
      host: 'localhost',
      port: 5432,
      user: 'me',
      password: '1111',
      database: 'search_robot',
    });

    await postgresClient.connect(err => err && console.log(err));
    await postgresClient.query(initQuery);

    return postgresClient;
  } catch (e) {
    console.log(e.message);

    return null;
  }
};

module.exports = {
  getConnection,
};
