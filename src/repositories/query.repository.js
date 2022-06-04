const { Repository } = require('./index');

class QueryRepository extends Repository {
  constructor(connection) {
    super(connection);
  }

  async add(query, clientId) {
    try {

      await this.connection.query(
          `INSERT INTO indexes (token, link_url, position, relevance, weight) VALUES ($1, $2, $3, $4, $5)`,
          [token, url, position, relevance, weight]
      );
    } catch (e) {
      console.log(e.message);
    }
  }
}

module.exports = {
  QueryRepository,
};
