const Url = require('url-parse');
const robotsParser = require('robots-parser');

const { crawlerInstance } = require('../instances/crawler.instance');

const getRobotRules = async (url) => {
  try {
    const { origin: hostUrl } = new Url(url);

    const { data: hostRobot } = await crawlerInstance.get(`${hostUrl}/robots.txt`) || {};

    return hostRobot;
  } catch (e) {
    console.log(e.message);

    return null;
  }
};

const validateUrlByRobots = (url, rules) => {
  if (!rules) {
    return true;
  }

  const { origin: hostUrl } = new Url(url);
  let robotParser;

  try {
    robotParser = robotsParser(`${hostUrl}/robots.txt`, rules);
  } catch (e) {
    console.log(e.message);
  }

  return robotParser ? robotParser.isAllowed(url) : true;
};

module.exports = {
  getRobotRules,
  validateUrlByRobots,
};
