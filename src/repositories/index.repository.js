const { Repository } = require('./index');

class IndexRepository extends Repository {
  constructor(connection) {
    super(connection);
  }

  async add(index, url, position) {
    try {
      const { token, relevance, weight } = index;

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
  IndexRepository,
};
