const cheerio = require('cheerio');

const { LinkRepository } = require('../repositories/link.repository');
const { crawlerInstance } = require('../instances/crawler.instance');
const { removeDuplicates } = require('../common/utils');
const { validateUrl, formatUrl, updateProtocol, getHighLevelDomain } = require('../services/url.service');
const { getRobotRules, validateUrlByRobots } = require('../services/robots.service');

const handleLinks = async (queue, connection) => {
  const url  = queue.dequeue();
  const currentDomain = getHighLevelDomain(url);
  const linksRepository = new LinkRepository(connection);
  const outboundLinks = [];

  console.log(`Current url: ${url}`);
  console.log(`Queue length: ${queue.getLength()}`);
  try {
    const visitedLinks = await linksRepository.findAll();

    const robotRules = await getRobotRules(url);
    if (!validateUrlByRobots(url, robotRules)) {
      return;
    }

    const { data } = await crawlerInstance.get(url) || {};
    if (!data) {
      await linksRepository.updateAfterCrawling(url, 'failed');

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
      const isLinkVisited = visitedLinks.find(({ link: visitedLink }) => visitedLink === preparedUrl || visitedLink === updatedProtocolUrl);
      if (isLinkVisited) {
        !outboundLinks.includes(preparedUrl) && outboundLinks.push(isLinkVisited);

        return null;
      }

      return preparedUrl;
    })
        .filter((_, url) => !!url);
    const withoutDuplicates = removeDuplicates(urls);
    const inboundLinksFound = withoutDuplicates.length + outboundLinks.length;
    const currentPagePreRank = 1/inboundLinksFound;

    for (let link of outboundLinks) {
      const { link: visitedUrl, outboundCount } = link;
      const domain = getHighLevelDomain(visitedUrl);
      const outboundPreRank = domain === currentDomain ? currentPagePreRank / 1.5 : currentPagePreRank;

      await linksRepository.updateOutbounds(visitedUrl, outboundCount, outboundPreRank, currentPagePreRank);
    }

    for (let link of withoutDuplicates) {
      queue.enqueue(link);
      const domain = getHighLevelDomain(link);
      const outboundPreRank = domain === currentDomain ? currentPagePreRank / 1.5 : currentPagePreRank;

      await linksRepository.addDomainIfNotExist(link);
      await linksRepository.add(link, outboundPreRank);
    }

    await linksRepository.updateAfterCrawling(url, 'crawled', inboundLinksFound);
  } catch (e) {
    console.log(e.message);

    await linksRepository.updateAfterCrawling(url, 'failed');
  }
};

module.exports = {
  handleLinks,
};
