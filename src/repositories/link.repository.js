const {Repository} = require('./index');

class LinkRepository extends Repository {
  constructor(connection) {
    super(connection);
  }

  async findAll() {
    try {
      const { rows } = await this.connection.query(`SELECT link from links`);

      if (!rows.length) {
        console.log('No links founded');

        return [];
      }

      return rows.map(({ link }) => link);
    } catch (e) {
      console.log(e.message);

      return [];
    }
  }

  async findForIndexing (limit = 1000) {
    try {
      const { rows } = await this.connection.query(`SELECT link FROM links WHERE is_indexed = $1 LIMIT 1000`, ['not_indexed']);

      if (!rows.length) {
        return [];
      }

      return rows.map(({ link }) => link);
    } catch (e) {
      console.log(e.message);

      return [];
    }
  }

  async add(url) {
    try {
      await this.connection.query(`INSERT INTO links (link) VALUES ($1);`, [url]);
    } catch (e) {
      console.log(e.message);
    }
  }

  async updateAfterIndexing(url, title = null, description = null, status = 'indexed') {
    try {
      if (!description) {
        await this.connection.query(`UPDATE links SET title = $1, description = $2, is_indexed = $3 WHERE link = $4`,
            [title, description, status, url]);

        return;
      }

      const safeDescription = description.slice(0, 250).concat('...');

      await this.connection.query(`UPDATE links SET title = $1, description = $2, is_indexed = $3 WHERE link = $4`,
          [title, safeDescription, status, url]);

    } catch (e) {
      console.log(e.message);
    }
  }
}

module.exports = {
  LinkRepository,
};
