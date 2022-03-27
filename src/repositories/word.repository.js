const { Repository } = require('./index');

class WordRepository extends Repository {
  constructor(connection) {
    super(connection);
  }

  async findAll() {
    try {
      const { rows } = await this.connection.query(`SELECT word from words`);

      if (!rows.length) {
        console.log('No words founded');

        return [];
      }

      return rows.map(({ word }) => word);
    } catch (e) {
      console.log(e.message);

      return [];
    }
  }

  async findOne(word) {
    try {
      const { rows } = await this.connection.query(`SELECT word FROM words WHERE word = $1`, [word]);

      if (!rows.length) {
        return null;
      }

      return rows[0].word;
    } catch (e) {
      console.log(e.message);

      return null;
    }
  }

  async add(word) {
    try {
      const existingWord = await this.findOne(word);

      if (existingWord) {
        return;
      }

      await this.connection.query(`INSERT INTO words (word) VALUES ($1)`, [word]);
    } catch (e) {
      console.log(e.message);
    }
  }
}

module.exports = {
  WordRepository,
};
