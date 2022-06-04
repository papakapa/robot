const cheerio = require('cheerio');

const { LinkRepository } = require('../repositories/link.repository');
const { DomainsRepository } = require('../repositories/domains.repository');
const { crawlerInstance } = require('../instances/crawler.instance');
const { ExecutionStatus } = require('../common/execution.status');
const { removeDuplicates } = require('../common/utils');
const { validateUrl, formatUrl, preFormatUrl, updateProtocol, getHighLevelDomain } = require('../services/url.service');
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
      await linksRepository.updateAfterCrawling(url, ExecutionStatus.REJECTED);

      return;
    }

    const { data } = await crawlerInstance.get(url) || {};
    if (!data) {
      await linksRepository.updateAfterCrawling(url, ExecutionStatus.REJECTED);

      return;
    }

    const $ = cheerio.load(data);
    const tagUrls = $('a').map((_, link) => preFormatUrl($(link).attr('href'), url));
    const uniqueTagLinks = removeDuplicates(tagUrls);
    const urls = uniqueTagLinks.map((curUrl) => {
      const preparedUrl = formatUrl(curUrl);

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
        .filter(el => !!el);
    const withoutDuplicates = removeDuplicates(urls);
    const internalLinksFound = withoutDuplicates.length + externalLinks.length;
    const currentPagePreRank = 1/internalLinksFound * 0.15;

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

    await linksRepository.updateAfterCrawling(url, ExecutionStatus.FULFILLED, internalLinksFound);
  } catch (e) {
    console.log(e.message);

    await linksRepository.updateAfterCrawling(url, ExecutionStatus.REJECTED);
  }
};

module.exports = {
  handleLinks,
};
