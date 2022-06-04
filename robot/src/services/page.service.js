const cheerio = require('cheerio');

const { RESTRICTED_SELECTORS } = require('../common/constants');

class PageService {
  constructor(connection) {
    this.a = html;
  }

  getPageTitle(documentInstance) {
    const metaTitle = documentInstance('meta[property="og:title"]');
    const tagTitle = documentInstance('head > title');
    const title = documentInstance('title');

    if (metaTitle.length && metaTitle.attr('content')) {
      return metaTitle.attr('content').trim();
    }

    if (tagTitle.length) {
      return tagTitle.text().trim();
    }

    if (title.length) {
      return title.text().trim();
    }

    return null;
  }

  getPageDescription(documentInstance) {
    const metaDescription = documentInstance('meta[property="og:description"]');
    const tagDescription = documentInstance('meta[name="description"]');
    const tagUpDescription = documentInstance('meta[name="Description"]');

    if (metaDescription.length && metaDescription.attr('content')) {
      return metaDescription.attr('content').trim();
    }

    if (tagDescription.length && tagDescription.attr('content')) {
      return tagDescription.attr('content').trim();
    }

    if (tagUpDescription.length && tagUpDescription.attr('content')) {
      return tagUpDescription.attr('content').trim();
    }

    return null;
  }

  getPageKeywords(documentInstance) {
    try {
      const metaKeywords = documentInstance('meta[name="keywords"]');
      const metaUpperKeywords = documentInstance('meta[name="Keywords"]');

      if (metaKeywords.length && metaKeywords.attr('content')) {
        return metaKeywords.attr('content').split(',').map(keyword => keyword.trim());
      }

      if (metaUpperKeywords.length && metaUpperKeywords.attr('content')) {
        return metaUpperKeywords.attr('content').split(',').map(keyword => keyword.trim());
      }

      return null;
    } catch (e) {
      console.log(e.message);
      return null;
    }
  }

  getPageGeoData(documentInstance) {
    try {
      const metaCountry = documentInstance('meta[name="geo.country"]');
      const metaPlace = documentInstance('meta[name="geo.placename"]');

      return {
        country: (metaCountry.length && metaCountry.attr('content')) ? metaCountry.attr('content') : null,
        placeName: (metaPlace.length && metaPlace.attr('content')) ? metaPlace.attr('content') : null,
      };
    } catch (e) {
      console.log(e.message);

      return { placeName: null, country: null };
    }
  };

  getPageSignificantData(html) {
    const $page = cheerio.load(html);

    const title = this.getPageTitle($page);
    const description = this.getPageDescription($page);
    const keywords = this.getPageKeywords($page);
    const geoData = this.getPageGeoData($page);

    return { title, description, keywords, ...geoData };
  }

  removeRestrictedSelectors(html) {
    const $ = cheerio.load(html);

    RESTRICTED_SELECTORS.forEach((selector) => {
      $(selector).each(function () {
        $(this).remove();
      })
    });

    return $.html();
  }
}

module.exports = {
  PageService,
};
