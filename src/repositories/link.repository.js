const { Repository } = require('./index');
const { crawlingStatus } = require('../common/crawling.status');
const { indexingStatus } = require('../common/indexing.status');
const { getSafeField } = require('../common/utils');
const { updateProtocol } = require('../services/url.service');

class LinkRepository extends Repository {
  constructor(connection) {
    super(connection);
  }

  async findAll() {
    try {
      const { rows } = await this.connection.query(
          `SELECT url, external_links_count, pre_rank from links`
      );

      if (!rows.length) {
        console.log('No links founded');

        return [];
      }

      return rows.map(({ url, external_links_count, pre_rank }) => ({
        url,
        externalLinksCount: external_links_count,
        preRank: pre_rank,
      }));
    } catch (e) {
      console.log(e.message);

      return [];
    }
  }

  async isLinkExist(url) {
    try {
      const urlWithUpdatedProtocol = updateProtocol(url);

      const { rows } = await this.connection.query(
          `SELECT url FROM links WHERE url = $1 OR url = $2`,
          [url, urlWithUpdatedProtocol]
      );

      return rows.length !== 0;
    } catch (e) {
      console.log(e);

      return false;
    }
  }

  async findForCrawling(limit = 500) {
    try {
      // `SELECT url FROM links WHERE is_crawled = $1 AND url NOT LIKE '%.by%' LIMIT $2`
      const { rows } = await this.connection.query(
          `SELECT url FROM links 
            WHERE is_crawled = $1 AND url NOT LIKE '%.by%' 
            AND url NOT LIKE '%polpred.com%' 
            AND url NOT LIKE '%github%'
            AND url NOT LIKE '%newsrbc%'
            LIMIT $2`,
          [crawlingStatus.notCrawled, limit]);

      if (!rows || !rows.length) {
        return [];
      }

      return rows.map(({ url }) => url);
    } catch (e) {
      console.log(e.message);

      return [];
    }
  }

  async findForIndexing (limit = 1000) {
    try {
      const { rows } = await this.connection.query(
          `SELECT url, pre_rank, internal_links_count FROM links WHERE is_indexed = $1 AND is_crawled = $2 LIMIT $3`,
          [indexingStatus.notIndexed, crawlingStatus.crawled, limit]);

      if (!rows.length) {
        return [];
      }

      return rows.map(({ url, pre_rank, internal_links_count }) => ({
        url,
        preRank: pre_rank,
        internalLinksCount: internal_links_count,
      }));
    } catch (e) {
      console.log(e.message);

      return [];
    }
  }

  async add(url, pageRank = 0) {
    try {
      await this.connection.query(
          `INSERT INTO links (url, pre_rank, external_links_count) VALUES ($1, $2, $3);`,
          [url, pageRank, 1]
      );
    } catch (e) {
      console.log(e.message);
    }
  }

  async updateAfterIndexing(url, title = null, description = null, info = null, status = indexingStatus.indexed) {
    try {
      if (status === indexingStatus.failed) {
        await this.connection.query(
            `UPDATE links SET is_indexed = $1 WHERE url = $2`,
            [status, url]
        );

        return;
      }

      const { placeName = null, country = null } = info || {};
      const safeTitle = getSafeField(title, 250);
      const safeDescription = getSafeField(description, 250);
      const safeRegion = getSafeField(placeName, 50);

      await this.connection.query(
          `UPDATE links SET title = $1, description = $2, is_indexed = $3, country = $4, region = $5 WHERE url = $6`,
          [safeTitle, safeDescription, status, country, safeRegion, url]);

    } catch (e) {
      console.log(e.message);
    }
  }

  async updateAfterCrawling(url, status = crawlingStatus.crawled, internalCount = 0) {
    try {
      await this.connection.query(
          `UPDATE links SET is_crawled = $1, internal_links_count = $2 WHERE url = $3`,
          [status, internalCount, url]
      )
    } catch (e) {
      console.log(e.message);
    }
  }

  async updateOutbounds(url, previousCount, previousPreRank, pageRank) {
   try {
     const updatedExternalCount = previousCount + 1;
     const currentPreRank = previousPreRank + pageRank;
     await this.connection.query(
         `UPDATE links SET external_links_count = $1, pre_rank = $2 WHERE url = $3`,
         [updatedExternalCount, currentPreRank, url]
     );
   } catch (e) {
     console.log(e.message)
   }
  }
}

module.exports = {
  LinkRepository,
};
