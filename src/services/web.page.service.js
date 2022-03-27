const cheerio = require('cheerio');

const { RESTRICTED_SELECTORS } = require('../common/constants');

const getPageTitle = (cheerioInstance) => {
  const metaTitle = cheerioInstance('meta[property="og:title"]');
  const tagTitle = cheerioInstance('head > title');

  if (metaTitle.length && metaTitle.attr('content')) {
    return metaTitle.attr('content');
  }

  if (tagTitle.length) {
    return tagTitle.text();
  }

  return null;
};

const getPageDescription = (cheerioInstance) => {
  const metaDescription = cheerioInstance('meta[property="og:description"]');
  const tagDescription = cheerioInstance('head > description');

  if (metaDescription.length && metaDescription.attr('content')) {
    return metaDescription.attr('content');
  }

  if (tagDescription.length) {
    return tagDescription.text();
  }

  return null;
};

const getPageKeywords = (cheerioInstance) => {
  try {
    const metaKeywords = cheerioInstance('meta[name="keywords"]');

    if (metaKeywords.length && metaKeywords.attr('content')) {
      return metaKeywords.attr('content').split(',');
    }

    return null;
  } catch (e) {
    console.log(e.message);
    return null;
  }
};

const getPageSignificantData = (document) => {
  const $page = cheerio.load(document);
  const title = getPageTitle($page);
  const description = getPageDescription($page);
  const keywords = getPageKeywords($page);

  return { title, description, keywords };
};

const removeRestrictedSelectors = (document) => {
  const $ = cheerio.load(document);

  RESTRICTED_SELECTORS.forEach((selector) => {
    $(selector).each(function () {
      $(this).remove();
    })
  });

  return $.html();
};

module.exports = {
  getPageSignificantData,
  removeRestrictedSelectors,
}