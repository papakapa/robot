const { formatUrl, validateUrl, updateProtocol, getHighLevelDomain } = require('../services/url.service');
const { LinkRepository, HostRepository } = require('../repositories/index');
const { removeDuplicates } = require('../common/utils');
const { ExecutionStatuses } = require('../common/execution.statuses');

class LinkService {
  constructor(connection) {
    this.repository = new LinkRepository(connection);
    this.hostRepository = new HostRepository(connection);
  }

  async findAll() {
    try {
      return this.repository.find({
        select: {
          link_id: true,
          url: true,
          internal_links_count: true,
          external_links_count: true,
          pre_rank: true,
          link_host_id: true
        }
      });
    } catch (e) {
      console.log(e.message);

      return [];
    }
  }

  async findForCrawling() {
    try {
      return this.repository.find({
        select: {
          url: true,
        },
        where: {
          crawled_status: ExecutionStatuses.PENDING
        }
      });
    } catch (e) {
      console.log(e.message);

      return [];
    }
  }

  async findForIndexing() {
    try {
      return this.repository.find({
        select: {
          url: true,
          pre_rank: true,
          internal_links_count: true,
        },
        where: {
          crawled_status: ExecutionStatuses.FULFILLED,
          indexed_status: ExecutionStatuses.PENDING,
        }
      });
    } catch (e) {
      console.log(e.message);

      return [];
    }
  }

  async updateFailedLinkWhileCrawling(url) {
    try {
      await this.repository.update({
        fields: {
          crawled_status: ExecutionStatuses.REJECTED
        },
        where: {
          url
        }
      });
    } catch (e) {
      console.log(e.message);
    }
  }

  async updateFailedLinkWhileIndexing(url) {
    try {
      await this.repository.update({
        fields: {
          indexed_status: ExecutionStatuses.REJECTED
        },
        where: {
          url
        }
      });
    } catch (e) {
      console.log(e.message);
    }
  }

  async updateFulfilledLinkWhileCrawling(url, internalLinksCount) {
    try {
      await this.repository.update({
        fields: {
          crawled_status: ExecutionStatuses.FULFILLED,
          internal_links_count: internalLinksCount
        },
        where: {
          url
        }
      });
    } catch (e) {
      console.log(e.message);
    }
  }

  formatAndValidateLinks(links) {
    return links.map(link => validateUrl(formatUrl(link)) ? formatUrl(link) : null).filter(link => !!link);
  }

  getExistingAndNewLinksLists(links, newLinks) {
    const existingLinks = [];
    const uniqueNewLinks = newLinks.map(link => {
      const existedLink = links.find(({ url }) => url === link || url === updateProtocol(link));
      if (existedLink) {
        !existingLinks.find(({url}) => url === link) && existingLinks.push(existedLink);

        return null;
      }

      return link;
    }).filter(el => !!el);

    return { existingLinks, uniqueNewLinks: removeDuplicates(uniqueNewLinks) };
  }

  async addLinksAfterCrawling(queue, links, currentDomain, currentCrawledPagePreRank) {
    for (let link of links) {
      queue.enqueue(link);
      const domains = await this.hostRepository.findAll();
      const { hostId, domain } = await this.hostRepository.updateAfterCrawling(link, domains);

      const outboundPreRank = domain === currentDomain ? currentCrawledPagePreRank / 1.5 : currentCrawledPagePreRank;

      await this.repository.insert({ fields: {
        url: link,
        link_host_id: hostId,
        external_links_count: 1,
        pre_rank: outboundPreRank,
        link_type: 'wep-page',
        crawled_status: ExecutionStatuses.PENDING,
        indexed_status: ExecutionStatuses.PENDING,
      }})
    }
  }

  async updateExistingLinksAfterCrawling(links, currentCrawledDomain, currentCrawledPagePreRank) {
    for (let link of links) {
      const { url, externalLinksCount, linkId, preRank } = link;
      const domain = getHighLevelDomain(url);
      const externalPreRank = domain === currentCrawledDomain ? currentCrawledPagePreRank / 1.5 : currentCrawledPagePreRank;

      await this.repository.update({
        fields: {
          external_links_count: externalLinksCount + 1,
          pre_rank: preRank + externalPreRank
        },
        where: {
          link_id: linkId
        }
      });
    }
  }
}

module.exports = { LinkService };
