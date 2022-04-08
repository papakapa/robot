const { Repository } = require('./index');
const { getSafeField } = require('../common/utils');
const { updateProtocol, getHighLevelDomain } = require('../services/url.service');

class LinkRepository extends Repository {
  constructor(connection) {
    super(connection);
  }

  async findAll() {
    try {
      const { rows } = await this.connection.query(`SELECT link, outbound_count, pre_rank from links`);

      if (!rows.length) {
        console.log('No links founded');

        return [];
      }

      return rows.map(({ link, outbound_count, pre_rank }) => ({
        link,
        outboundCount: outbound_count,
        preRank: pre_rank,
      }));
    } catch (e) {
      console.log(e.message);

      return [];
    }
  }


  async isLinkExist(link) {
    try {
      const updatedLink = updateProtocol(link);

      const { rows } = await this.connection.query(
          `SELECT link FROM links WHERE link = $1 OR link = $2`,
          [link, updatedLink]
      );

      return rows.length !== 0;
    } catch (e) {
      console.log(e);

      return false;
    }
  }

  async findAllDomains() {
    try {
      const { rows } = await this.connection.query(`SELECT name FROM domains`);

      if (!rows.length) {
        return null;
      }

      return rows.map(({name}) => name);
    } catch(e) {
      console.log(e.message);

      return null;
    }
  }

  async findOneDomain(domain) {
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

  async findForCrawling(limit = 500) {
    try {
      const { rows } = await this.connection.query(
          `SELECT link FROM links WHERE is_crawled = $1 AND link NOT LIKE '%pro.imdb.com%' LIMIT $2`,
          ['not_crawled', limit]);

      if (!rows || !rows.length) {
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
      const { rows } = await this.connection.query(
          `SELECT link, pre_rank, inbound_count FROM links WHERE is_indexed = $1 AND is_crawled = $2 LIMIT $3`,
          ['not_indexed', 'crawled', limit]);

      if (!rows.length) {
        return [];
      }

      return rows.map(({ link, pre_rank, inbound_count }) => ({
        link,
        preRank: pre_rank,
        internalLinks: inbound_count,
      }));
    } catch (e) {
      console.log(e.message);

      return [];
    }
  }

  async add(url, pageRank = 0) {
    try {
      await this.connection.query(
          `INSERT INTO links (link, pre_rank, outbound_count) VALUES ($1, $2, $3);`,
          [url, pageRank, 1]
      );
    } catch (e) {
      console.log(e.message);
    }
  }

  async addDomainIfNotExist(url) {
    try {
     const domain = getHighLevelDomain(url);
     const existedDomain = await this.findOneDomain(domain);

     if (existedDomain) {
       return;
     }

     await this.connection.query(`INSERT INTO domains (name) VALUES($1)`, [domain]);
    } catch (e) {
      console.log(e.message);
    }
  }

  async updateAfterIndexing(url, title = null, description = null, info = null, status = 'indexed') {
    try {
      if (status === 'failed') {
        await this.connection.query(
            `UPDATE links SET is_indexed = $1 WHERE link = $2`,
            [status, url]
        );

        return;
      }

      const safeTitle = getSafeField(title, 250);
      const safeDescription = getSafeField(description, 250);
      const { placeName = null, country = null, pageType = null, locale = null } = info || {};
      const safePlaceName = getSafeField(placeName, 250);

      await this.connection.query(
          `UPDATE links SET title = $1, description = $2, is_indexed = $3, country = $4, place_name = $5, type = $6, locale = $7 WHERE link = $8`,
          [safeTitle, safeDescription, status, country, safePlaceName, pageType, locale, url]);

    } catch (e) {
      console.log(e.message);
    }
  }

  async updateAfterCrawling(url, status = 'crawled', inboundCount = 0) {
    try {
      await this.connection.query(
          `UPDATE links SET is_crawled = $1, inbound_count = $2 WHERE link = $3`,
          [status, inboundCount, url]
      )
    } catch (e) {
      console.log(e.message);
    }
  }

  async updateOutbounds(url, previousCount, previousPreRank, pageRank) {
   try {
     const updatedOutbound = previousCount + 1;
     const currentPreRank = previousPreRank + pageRank;
     await this.connection.query(
         `UPDATE links SET outbound_count = $1, pre_rank = $2 WHERE link = $3`,
         [updatedOutbound, currentPreRank, url]
     );
   } catch (e) {
     console.log(e.message)
   }
  }
}

module.exports = {
  LinkRepository,
};
