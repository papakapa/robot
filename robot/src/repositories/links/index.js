const { Repository } = require('../common/index');

class LinkRepository extends Repository {
  constructor(connection) {
    super(connection, {
      link_id: 'linkId',
      url: 'url',
      title: 'title',
      description: 'description',
      preview_url: 'previewUrl',
      internal_links_count: 'internalLinksCount',
      external_links_count: 'externalLinksCount',
      pre_rank: 'preRank',
      link_geo_data: 'linkGeoDataId',
      link_host_id: 'linkHostId',
      link_type: 'linkType',
      crawled_status: 'crawledStatus',
      indexed_status: 'indexedStatus',
    }, 'links');
  }

  async find({ select = null, where = null } = {}) {
    return this.select({select, where});
  }
}

module.exports = {
  LinkRepository,
};
