const cheerio = require('cheerio');

const { LinkRepository } = require('../repositories/link.repository');
const { DomainsRepository } = require('../repositories/domains.repository');
const { crawlerInstance } = require('../instances/crawler.instance');
const { crawlingStatus } = require('../common/crawling.status');
const { removeDuplicates } = require('../common/utils');
const { validateUrl, formatUrl, updateProtocol, getHighLevelDomain } = require('../services/url.service');
const { getRobotRules, validateUrlByRobots } = require('../services/robots.service');

const handleLinks = async (queue, connection) => {
  const url  = queue.dequeue();
  const currentDomain = getHighLevelDomain(url);
  const linksRepository = new LinkRepository(connection);
  const domainsRepository = new DomainsRepository(connection);
  const externalLinks = [];

  console.log(`Current url: ${url}`);
  console.log(`Queue length: ${queue.getLength()}`);
  try {
    const visitedLinks = await linksRepository.findAll();

    const robotRules = await getRobotRules(url);
    if (!validateUrlByRobots(url, robotRules)) {
      await linksRepository.updateAfterCrawling(url, crawlingStatus.failed);

      return;
    }

    const { data } = await crawlerInstance.get(url) || {};
    if (!data) {
      await linksRepository.updateAfterCrawling(url, crawlingStatus.failed);

      return;
    }

    const $ = cheerio.load(data);
    const urls = $('a').map((_, link) => {
      const url = $(link).attr('href');
      const preparedUrl = formatUrl(url);

      if (validateUrl(preparedUrl)) {
        return null;
      }

      const updatedProtocolUrl = updateProtocol(preparedUrl);
      const isLinkVisited = visitedLinks.find(({ url: visitedLink }) => visitedLink === preparedUrl || visitedLink === updatedProtocolUrl);
      if (isLinkVisited) {
        !externalLinks.includes(preparedUrl) && externalLinks.push(isLinkVisited);

        return null;
      }

      return preparedUrl;
    })
        .filter((_, url) => !!url);
    const withoutDuplicates = removeDuplicates(urls);
    const internalLinksFound = withoutDuplicates.length + externalLinks.length;
    const currentPagePreRank = 1/internalLinksFound;

    for (let link of externalLinks) {
      const { url: visitedUrl, externalLinksCount } = link;
      const domain = getHighLevelDomain(visitedUrl);
      const externalPreRank = domain === currentDomain ? currentPagePreRank / 1.5 : currentPagePreRank;

      await linksRepository.updateOutbounds(visitedUrl, externalLinksCount, externalPreRank, currentPagePreRank);
    }

    for (let link of withoutDuplicates) {
      queue.enqueue(link);
      const domain = getHighLevelDomain(link);
      const outboundPreRank = domain === currentDomain ? currentPagePreRank / 1.5 : currentPagePreRank;

      await domainsRepository.addDomainIfNotExist(link);
      await linksRepository.add(link, outboundPreRank);
    }

    await linksRepository.updateAfterCrawling(url, crawlingStatus.crawled, internalLinksFound);
  } catch (e) {
    console.log(e.message);

    await linksRepository.updateAfterCrawling(url, crawlingStatus.failed);
  }
};

module.exports = {
  handleLinks,
};
