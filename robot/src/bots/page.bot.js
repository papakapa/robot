const cheerio = require('cheerio');

const { Queue } = require('../instances/queue');
const { getConnection } = require('../clients/pg.client');
const { LinkService } = require('../services/links.service');
const { getHighLevelDomain, preFormatUrl } = require('../services/url.service');
const { fetchWithEncoding } = require('../services/download.service');
const { removeDuplicates } = require('../common/utils');

const downloadAndParsePage = async (queue, linkService) => {
  console.log(`Queue length: ${queue.getLength()}`);
  const url = queue.dequeue();
  console.log(`Current url: ${url}`);
  try {
    const pageData = await fetchWithEncoding(url);

    if (!pageData) {
      await linkService.updateFailedLinkWhileCrawling(url);

      return;
    }

    const $ = cheerio.load(pageData);
    const tagUrls = $('a').map((_, link) => preFormatUrl($(link).attr('href'), url));

    const uniqueTagLinks = removeDuplicates(tagUrls);
    const formattedLinks = linkService.formatAndValidateLinks(uniqueTagLinks);

    const crawledLinks = await linkService.findAll();
    const { existingLinks, uniqueNewLinks } = linkService.getExistingAndNewLinksLists(crawledLinks, formattedLinks);

    const currentCrawledPageDomain = getHighLevelDomain(url);
    const internalLinksFound = existingLinks.length + uniqueNewLinks.length;
    const currentPagePreRank = 1/internalLinksFound * 0.15;

    await linkService.addLinksAfterCrawling(queue, uniqueNewLinks, currentCrawledPageDomain, currentPagePreRank);
    await linkService.updateExistingLinksAfterCrawling(existingLinks, currentCrawledPageDomain, currentPagePreRank);
    await linkService.updateFulfilledLinkWhileCrawling(url, internalLinksFound);
  } catch (e) {
    console.log(e.message);

    await linkService.updateFailedLinkWhileCrawling(url);
  }
};

const startCrawlingBot = async () => {
  const pgConnection = await getConnection();
  const linksService = new LinkService(pgConnection);

  const links = await linksService.findForCrawling();

  const linksQueue = new Queue(links.map(({url}) => url));

  while (!linksQueue.isEmpty()) {
    await downloadAndParsePage(linksQueue, linksService)
  }
};


module.exports = { startCrawlingBot };
