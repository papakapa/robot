const cheerio = require('cheerio');

const { RESTRICTED_SELECTORS } = require('../common/constants');

const getPageTitle = (cheerioInstance) => {
  const metaTitle = cheerioInstance('meta[property="og:title"]');
  const tagTitle = cheerioInstance('head > title');

  if (metaTitle.length && metaTitle.attr('content')) {
    return metaTitle.attr('content').trim();
  }

  if (tagTitle.length) {
    return tagTitle.text().trim();
  }

  return null;
};

const getPageDescription = (cheerioInstance) => {
  const metaDescription = cheerioInstance('meta[property="og:description"]');
  const tagDescription = cheerioInstance('meta[name="description"]');

  if (metaDescription.length && metaDescription.attr('content')) {
    return metaDescription.attr('content').trim();
  }

  if (tagDescription.length && tagDescription.attr('content')) {
    return tagDescription.attr('content').trim();
  }

  return null;
};

const getPageGeo = (cheerioInstance) => {
 try {
   const metaCountry = cheerioInstance('meta[name="geo.country"]');
   const metaPlace = cheerioInstance('meta[name="geo.placename"]');

   return {
     country: (metaCountry.length && metaCountry.attr('content')) ? metaCountry.attr('content') : null,
     placeName: (metaPlace.length && metaPlace.attr('content')) ? metaPlace.attr('content') : null,
   };
 } catch (e) {
   console.log(e.message);

   return { placeName: null, country: null };
 }
};

const getPageLocale = (cheerioInstance) => {
  try {
    const metaLocale = cheerioInstance('meta[property="og:locale"]');

    return (metaLocale.length && metaLocale.attr('content')) ? metaLocale.attr('content') : null;
  } catch (e) {
    console.log(e.message);

    return null;
  }
};

const getPageType = (cheerioInstance) => {
  try {
    const metaType = cheerioInstance('meta[property="og:type"]');

    return (metaType.length && metaType.attr('content')) ? metaType.attr('content') : null;
  } catch (e) {
    console.log(e.message);

    return null;
  }
};

const getPageKeywords = (cheerioInstance) => {
  try {
    const metaKeywords = cheerioInstance('meta[name="keywords"]');

    if (metaKeywords.length && metaKeywords.attr('content')) {
      return metaKeywords.attr('content').split(',').map(keyword => keyword.trim());
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
  const geoData = getPageGeo($page);

  return { title, description, keywords, ...geoData };
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