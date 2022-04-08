const { Repository } = require('./index');
const { getHighLevelDomain } = require('../services/url.service');

class DomainsRepository extends Repository {
  constructor(connection) {
    super(connection);
  }

  async findAll() {
    try {
      const { rows } = await this.connection.query(`SELECT name FROM domains`);

      if (!rows.length) {
        return null;
      }

      return rows.map(({ name }) => name);
    } catch(e) {
      console.log(e.message);

      return null;
    }
  }

  async findOne(domain) {
    try {
      const { rows } = await this.connection.query(`SELECT name FROM domains WHERE name = $1`, [domain]);

      if (!rows.length) {
        return null;
      }

      return rows[0].name;
    } catch(e) {
      console.log(e.message);

      return null;
    }
  }

  async addDomainIfNotExist(url) {
    try {
      const domain = getHighLevelDomain(url);
      const existedDomain = await this.findOne(domain);

      if (existedDomain) {
        return;
      }

      await this.connection.query(`INSERT INTO domains (name) VALUES($1)`, [domain]);
    } catch (e) {
      console.log(e.message);
    }
  }
}

module.exports = {
  DomainsRepository,
};