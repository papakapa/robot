const { Queue } = require('./instances/queue');
const { getConnection } = require('./clients/pg.client');
const { handleLinks } = require('./services/link.service');
const { handleIndexes } = require('./services/index.service');
const { LinkRepository } = require('./repositories/link.repository');
const { WIKI_ENTRY_POINT, HABR_ENTRY_POINT, S13_ENTRY_POINT } = require('./common/constants');

const crawleLinks = async () => {
  const pgConnection = await getConnection();

  const queue = new Queue();
  queue.enqueue(S13_ENTRY_POINT);

  while (!queue.isEmpty()) {
   await handleLinks(queue, pgConnection);
  }
};

const crawleIndexes = async () => {
  const queue = new Queue();
  try {
    const pgConnection = await getConnection();
    const linksRepository = new LinkRepository(pgConnection)

    // queue.enqueue(testUrl);

    const indexingPages = await linksRepository.findForIndexing();

    indexingPages.forEach(el => queue.enqueue(el));

    while (!queue.isEmpty()) {
      await handleIndexes(queue, pgConnection, linksRepository);
    }
  } catch (e) {
    console.log(e.message);
  }
};

// crawleLinks().then(res => console.log(`Finished: ${res}`)).catch(e => e.message);
crawleIndexes().then(res => console.log(`Finished: ${res}`)).catch(e => e.message);