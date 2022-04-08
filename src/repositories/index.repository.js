const { Repository } = require('./index');

class IndexRepository extends Repository {
  constructor(connection) {
    super(connection);
  }

  async add(index, url, position) {
    try {
      const { word, relevance, weight } = index;

      await this.connection.query(
          `INSERT INTO test_indexes (word_text, link_text, place, relevance, weight) VALUES ($1, $2, $3, $4, $5)`,
          [word, url, position, relevance, weight]
      );
    } catch (e) {
      console.log(e.message);
    }
  }
}

module.exports = {
  IndexRepository,
};
