const { Repository } = require('./index');

class WordRepository extends Repository {
  constructor(connection) {
    super(connection);
  }

  async findAll() {
    try {
      const { rows } = await this.connection.query(`SELECT text from tokens`);

      if (!rows.length) {
        console.log('No tokens founded');

        return [];
      }

      return rows.map(({ text }) => text);
    } catch (e) {
      console.log(e.message);

      return [];
    }
  }

  async findOne(token) {
    try {
      const { rows } = await this.connection.query(`SELECT text FROM tokens WHERE text = $1`, [token]);

      if (!rows.length) {
        return null;
      }

      return rows[0].text;
    } catch (e) {
      console.log(e.message);

      return null;
    }
  }

  async add(token) {
    try {
      const existingToken = await this.findOne(token);

      if (existingToken) {
        return;
      }

      await this.connection.query(`INSERT INTO tokens (word) VALUES ($1)`, [token]);
    } catch (e) {
      console.log(e.message);
    }
  }
}

module.exports = {
  WordRepository,
};
