const { v4: uuidv4 } = require('uuid');

const { Repository } = require('../common/index');
const { getHighLevelDomain } = require('../../services/url.service');

class HostRepository extends Repository {
  constructor(connection) {
    super(connection, {
      host_id: 'hostId',
      name: 'name',
      links_count: 'linksCount',
      failed_count: 'failedLinksCount'
    }, 'hosts');
  }

  async findAll({ select = null } = {}) {
    return this.select({select});
  }

  async findOne({ select = null, where = null } = {}) {
    return this.select({select, where});
  }

  async updateAfterCrawling(url, domains) {
    try {
      const domain = getHighLevelDomain(url);

      const existedDomain = domains.find(({name}) => name === domain);

      if (existedDomain) {
        return { hostId: existedDomain.hostId, domain };
      }
      const generatedHostId = uuidv4();

      await this.insert({
        fields: {
          host_id: generatedHostId,
          name: domain,
          links_count: 1
        }
      });

      return { hostId: generatedHostId, domain };
    } catch (e) {
      console.log(e.message);

      return { hostId: null, domain: null };
    }
  }
}

module.exports = {
  HostRepository,
};
