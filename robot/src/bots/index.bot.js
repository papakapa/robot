const { Queue } = require('../instances/queue');
const { getConnection } = require('../clients/pg.client');
const { fetchWithEncoding } = require('../services/download.service');
const { LinkService } = require('../services/links.service');
const { PageService } = require('../services/page.service');

const indexPage = async (queue, linksService, pageService) => {
  console.log(`Queue length: ${queue.getLength()}`);
  const { url, preRank, internalLinksCount} = queue.dequeue();
  console.log(`Current url: ${url}`);

  try {
    const pageData = await fetchWithEncoding(url);

    if (!pageData) {
      await linksService.updateFailedLinkWhileIndexing(url);

      return;
    }

    const { title, description, keywords, ...pageInfo } = pageService.getPageSignificantData(pageData);
    console.log('Heh');


  } catch (e) {
    console.log(e.message);

    await linksService.updateFailedLinkWhileIndexing(url);
  }
}
const startIndexingBot = async () => {
  const pgConnection = await getConnection();
  const linksService = new LinkService(pgConnection);
  const pageService = new PageService();

  const links = await linksService.findForIndexing();

  const queue = new Queue(links);

  while (!queue.isEmpty()) {
    await indexPage(queue, linksService, pageService)
  }
};

module.exports = {
  startIndexingBot,
};
