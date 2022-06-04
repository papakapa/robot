const { Queue } = require('./instances/queue');
const { getConnection } = require('./clients/pg.client');
const { handleLinks } = require('./services/link.service');
const { handleIndexes } = require('./services/index.service');
const { LinkRepository } = require('./repositories/link.repository');

const crawleLinks = async () => {
  const queue = new Queue();

  const pgConnection = await getConnection();
  const linksRepository = new LinkRepository(pgConnection);

  const crawlingLinks = await linksRepository.findForCrawling(1000);
  crawlingLinks.forEach(link => queue.enqueue(link));

  while (!queue.isEmpty()) {
   await handleLinks(queue, pgConnection);
  }
};

const crawleIndexes = async () => {
  const queue = new Queue();
  try {
    const pgConnection = await getConnection();
    const linksRepository = new LinkRepository(pgConnection);

    const indexingPages = await linksRepository.findForIndexing(5000);

    indexingPages.forEach(el => queue.enqueue(el));
    // queue.enqueue({ url: 'https://kinopoisk.ru/name/57575', preRank: 0, internalLinksCount: 1 })
    while (!queue.isEmpty()) {
      await handleIndexes(queue, pgConnection, linksRepository);
    }
  } catch (e) {
    console.log(e.message);
  }
};

// crawleLinks().then(res => console.log(`Finished: ${res}`)).catch(e => e.message);
crawleIndexes().then(res => console.log(`Finished: ${res}`)).catch(e => e.message);
