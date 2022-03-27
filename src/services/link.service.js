const cheerio = require('cheerio');

const { LinkRepository } = require('../repositories/link.repository');
const { crawlerInstance } = require('../instances/crawler.instance');
const { removeDuplicates } = require('../common/utils');
const { validateUrl, formatUrl } = require('../services/url.service');
const { getRobotRules, validateUrlByRobots } = require('../services/robots.service');

const handleLinks = async (queue, connection) => {
  const url = queue.dequeue();
  const linksRepository = new LinkRepository(connection);

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
      return;
    }

    const $ = cheerio.load(data);
    const urls = $('a').map((_, link) => {
      const url = $(link).attr('href');
      const preparedUrl = formatUrl(url);

      if (validateUrl(preparedUrl) || visitedLinks.includes(preparedUrl)) {
        return null;
      }

      return preparedUrl;
    })
        .filter((_, url) => !!url);
    const withoutDuplicates = removeDuplicates(urls);

    for (let link of withoutDuplicates) {
      queue.enqueue(link);
      await linksRepository.add(link);
    }
  } catch (e) {
    console.log(e.message);
  }
};

module.exports = {
  handleLinks,
};
