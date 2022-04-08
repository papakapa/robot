const cheerio = require('cheerio');
const aposToLexForm = require('apos-to-lex-form');
const natural = require('natural');
const { removeStopwords , en, ru } = require('stopword');
const SpellCorrector = require('spelling-corrector');

const { formatTextSymbols } = require('../common/utils');
const { RESTRICTED_LANGUAGES, typeWeight } = require('../common/constants');
const { getHighLevelDomain, getUrlPathname, getProtocol } = require('../services/url.service');
const { crawlerInstance } = require('../instances/crawler.instance');
const { IndexRepository } = require('../repositories/index.repository');
const { WordRepository } = require('../repositories/word.repository');
const { getPageSignificantData, removeRestrictedSelectors } = require('../services/web.page.service');

const prepareIndexes = (text, type = 'text') => {
  // const spellCorrector = new SpellCorrector();
  // spellCorrector.loadDictionary();
  const parsedText = formatTextSymbols(text);

  const lexedText = aposToLexForm(parsedText);
  const { WordTokenizer, PorterStemmer, PorterStemmerRu } = natural;
  const tokenizer = new WordTokenizer();
  const tokenizedReview = tokenizer.tokenize(lexedText);
  // const correctedTokens = tokenizedReview.map((word) => spellCorrector.correct(word));
  const filteredReviewEng = removeStopwords(tokenizedReview, en);
  const filteredReviewRus = removeStopwords(filteredReviewEng, ru);

  const stemmedTokens = filteredReviewRus.map(el => {
    const rusStemming = PorterStemmerRu.stem(el);

    return PorterStemmer.stem(rusStemming);
  });

  return stemmedTokens.map(el => ({ word: el, relevance: type })).filter(({ word }) => {
    const wordCondition = word && word.length > 2;
    const specCondition = word && !word.includes('&nbsp');

    return wordCondition && specCondition;
  });
};

const getPrimaryIndexes = (text, place = 'title') => {
  if (!text) {
    return [];
  }

  return prepareIndexes(text, place);
};

const getTextIndexes = (document) => {
  const parsedDoc = removeRestrictedSelectors(document);
  const $page = cheerio.load(parsedDoc);
  const pageBody = $page('body');
  const pageText = pageBody.text();

  return prepareIndexes(pageText);
};

const getPageIndexes = (document, title, description) => {
  const titleIndexes = getPrimaryIndexes(title);
  const descriptionIndexes = getPrimaryIndexes(description, 'description');
  // const keywordsIndexes = getPrimaryIndexes(keywords, 'keyword');
  // const textIndexes = getTextIndexes(document);

  return { titleIndexes, descriptionIndexes };
  // return [...titleIndexes, ...textIndexes, ...descriptionIndexes];
};

const restrictedStrings = ['ru', 'eng', 'by', 'org', 'com'];

const getDomainIndexes = (url) => {
  const { WordTokenizer } = natural;
  const tokenizer = new WordTokenizer();

  const domainArr = getHighLevelDomain(url)
      .split('.')
      .slice(0, -1)
      .filter(el => el && el.length > 2 && !restrictedStrings.includes(el))
      .reduce((acc, cur) => {
        const tokenizedReview = tokenizer.tokenize(cur);

        return [...acc, ...tokenizedReview];
      }, []);

  return domainArr.map(el => ({ word: el, relevance: 'domain' }));
};

const getPathIndexes = (url) => {
  const pathname = getUrlPathname(url);

  if (!pathname || pathname === '/') {
    return { pathIndexes: [], pathDepth: 0 };
  }
  const { WordTokenizer } = natural;
  const tokenizer = new WordTokenizer();
  const pathStr = pathname.split('/')
      .map(el => formatTextSymbols(el).trim())
      .slice(1);
  const preparedPathStr = pathStr.reduce((acc, cur, i) => {
    if (cur.includes('.')) {
      return acc;
    }

    const lexedText = aposToLexForm(cur);
    const tokenizedReview = tokenizer.tokenize(lexedText);
    const preparedPathIndexes = tokenizedReview.map(el => ({ word: el, relevance: 'pathname', pathIndex: i}));

    return [...acc, ...preparedPathIndexes];
  }, []);

  const filteredReview = preparedPathStr.filter(({word}) => word && word.length > 2 && word.length < 25 && !restrictedStrings.includes(word) && !RESTRICTED_LANGUAGES.includes(word));

  return {
    pathIndexes: filteredReview,
    pathDepth: pathStr.length,
  };
};

const getUrlIndexes = (url) => {
  const domainIndexes = getDomainIndexes(url);
  const { pathIndexes, pathDepth } = getPathIndexes(url);

  return { domainIndexes, pathIndexes, pathDepth };
}

const getKeyWordsIndexes = (keywords) => {
  if (!keywords || !keywords.length) {
    return [];
  }

  const { WordTokenizer } = natural;

  return keywords.reduce((acc, cur) => {
    const parsedText = cur.replace(/\s+/g, " ")
        .replace(/[^a-zA-Z-9А-Яа-я ]/g, "")
        .toLowerCase();
    const tokenizer = new WordTokenizer();
    const tokenizedReview = tokenizer.tokenize(parsedText);


    const preparedKeywords = tokenizedReview.map((token) => ({ word: token, relevance: 'keyword', weight: 2 }));

    return [ ...acc, ...preparedKeywords];
  }, []);
};

const getLinkWeight = (url, titleIndexes, descriptionIndexes, pathIndexes, pageInfo, preRank, internalLinks) => {
  let weight = 0;
  const protocol = getProtocol(url);
  const { country, placeName } = pageInfo || {};

  if (country) {
    weight += 0.0025;
  }

  if (placeName) {
    weight += 0.0025;
  }

  if (protocol === 'https:') {
    weight += 0.1;
  }

  if (titleIndexes.length) {
    weight += 0.1;
  }

  if (descriptionIndexes.length) {
    weight += 0.1;
  }

  if (pathIndexes.length) {
    weight += 0.5 / pathIndexes.length;
  }

  const internalRank = internalLinks !== 0 ? 0.15/internalLinks : 0.001;
  const externalRank = 0.85 * (preRank !== 0 ? preRank : 0.001);
  return weight + internalRank + externalRank;
}

const addTypeWeightForIndexes = (indexes, pathDepth) => indexes.map(index => {
  const { relevance, word } = index;

  if (relevance === 'domain') {
    return { word, relevance, weight: 3 - (pathDepth * 0.5) };
  }

  if (relevance === 'pathname') {
    return { word, relevance, weight: 2 - 0.25 * index.pathIndex };
  }

  return { word, relevance, weight: typeWeight[relevance] };
})

const handleIndexes = async (queue, connection, linksRepository) => {
  const { link: url, preRank, internalLinks } = queue.dequeue();
  console.log(`Current URL: ${url}`);

  try {
    const { data } = await crawlerInstance.get(url) || {};
    if (!data) {
      await linksRepository.updateAfterIndexing(url,  null, null, null, 'failed');

      return;
    }

    const { title, description, keywords, ...pageInfo } = getPageSignificantData(data, url);
    const keywordIndexes = getKeyWordsIndexes(keywords);
    const { descriptionIndexes, titleIndexes } = getPageIndexes(data, title, description);
    const { pathIndexes, pathDepth, domainIndexes } = getUrlIndexes(url);
    const linkWeight = getLinkWeight(url, titleIndexes, descriptionIndexes, pathIndexes, pageInfo, preRank, internalLinks);
    const indexes = [...keywordIndexes, ...descriptionIndexes, ...titleIndexes, ...pathIndexes, ...domainIndexes];
    const typeWeightedIndexes = addTypeWeightForIndexes(indexes, pathDepth);
    const linkWeightedIndexes = typeWeightedIndexes.map(({ word, weight, relevance }) => ({ word, relevance, weight: weight + linkWeight, }));

    console.log(`Number of indexes: ${linkWeightedIndexes.length}`);

    const wordsRepository = new WordRepository(connection);
    const indexRepository = new IndexRepository(connection);

    for (let i = 0; i < linkWeightedIndexes.length; i++) {
      const { word } = linkWeightedIndexes[i] || {};
      await wordsRepository.add(word);
      await indexRepository.add(linkWeightedIndexes[i], url, i);
    }

    await linksRepository.updateAfterIndexing(url, title, description, pageInfo);
  } catch (e) {
    console.log(e.message);

    await linksRepository.updateAfterIndexing(url,  null, null,  null, 'failed');
  }
};

module.exports = {
  handleIndexes,
};
