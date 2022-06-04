const cheerio = require('cheerio');
const aposToLexForm = require('apos-to-lex-form');
const natural = require('natural');
const { removeStopwords , en, ru } = require('stopword');
const SpellCorrector = require('spelling-corrector');
const encodeDetection = require('jschardet');
const iconv = require('iconv-lite');

const { formatTextSymbols, removeDuplicates } = require('../common/utils');
const { indexTypes } = require('../common/index.types');
const { indexingStatus } = require('../common/indexing.status');
const { RESTRICTED_LANGUAGES, typeWeight, domainTypeWeights } = require('../common/constants');
const { getHighLevelDomain, getUrlPathname, getProtocol } = require('../services/url.service');
const { crawlerInstance } = require('../instances/crawler.instance');
const { IndexRepository } = require('../repositories/index.repository');
const { WordRepository } = require('../repositories/word.repository');
const { getPageSignificantData, removeRestrictedSelectors } = require('../services/web.page.service');

const restrictedPathDomainStrings = ['ru', 'eng', 'by', 'org', 'com'];
const { WordTokenizer, PorterStemmer, PorterStemmerRu } = natural;
const prepareIndexes = (text, type = indexTypes.text) => {
  const parsedText = formatTextSymbols(text);

  const lexedText = aposToLexForm(parsedText);
  const tokenizer = new WordTokenizer();
  const tokenizedReview = tokenizer.tokenize(lexedText);
  const filteredReviewEng = removeStopwords(tokenizedReview, en);
  const filteredReviewRus = removeStopwords(filteredReviewEng, ru);

  return filteredReviewRus.map(el => ({ token: el, relevance: type })).filter(({ token }) => {
    const wordCondition = token && token.length > 2;
    const specCondition = token && !token.includes('&nbsp');

    return wordCondition && specCondition;
  });
};

const getStemmedIndexes = (indexes) => {
  const { PorterStemmer, PorterStemmerRu } = natural;

  return indexes.map(el => {
    const { token } = el;
    const rusStemming = PorterStemmerRu.stem(token);
    const engStemming = PorterStemmer.stem(rusStemming);

    return { ...el, token: engStemming };
  })
}

const getPrimaryIndexes = (text, place = indexTypes.title) => {
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
  const descriptionIndexes = getPrimaryIndexes(description, indexTypes.description);

  return { titleIndexes, descriptionIndexes };
};

const getDomainIndexes = (url, pathDepth) => {
  const { WordTokenizer } = natural;
  const tokenizer = new WordTokenizer();
  const isWithPath = pathDepth > 0;

  const domainArr = getHighLevelDomain(url).split('.').slice(0, -1);

  if (!domainArr.length) {
    return [];
  }

  if (domainArr.length === 1) {
    const tokenizedReview = tokenizer.tokenize(domainArr[0]);

    return tokenizedReview.map(el => (
        { token: el, relevance: indexTypes.domain, domainType: isWithPath ? 'path' : 'main' }
    ));
  }

  if (domainArr.length === 2 || domainArr.length === 3) {
    const subType = domainArr.length === 2 ? 'p1' : 'p2';
    const subDomainsArr = subType === 'p1' ? domainArr[0] : domainArr[0].concat(`.${domainArr[2]}`);
    const subDomainIndexes = tokenizer.tokenize(subDomainsArr)
        .filter(el => el && el.length > 2 && !restrictedPathDomainStrings.includes(el))
        .map(el => ({ token: el, relevance: indexTypes.domain, domainType: isWithPath ? 'path': subType }));
    const mainDomainIndexes = tokenizer.tokenize(domainArr[1])
        .map(el => ({ token: el, relevance: indexTypes.domain, domainType: isWithPath ? 'path': `main+${subType}` }));

    return [...subDomainIndexes, ...mainDomainIndexes];
  }

  return domainArr
      .filter(el => el && el.length > 2 && !restrictedPathDomainStrings.includes(el))
      .reduce((acc, cur) => {
        const tokenizedReview = tokenizer.tokenize(cur);

        return [...acc, ...tokenizedReview];
      }, [])
      .map(el => ({ token: el, relevance: indexTypes.domain, domainType: isWithPath ? 'path' : 'ppp' }));
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
    const preparedPathIndexes = tokenizedReview.map(el => ({ token: el, relevance: indexTypes.path, pathIndex: i}));

    return [...acc, ...preparedPathIndexes];
  }, []);

  const filteredReview = preparedPathStr.filter(({token}) => token && token.length > 2 && token.length < 25 && !restrictedPathDomainStrings.includes(token) && !RESTRICTED_LANGUAGES.includes(token));

  return {
    pathIndexes: filteredReview,
    pathDepth: pathStr.length,
  };
};

const getUrlIndexes = (url) => {
  const { pathIndexes, pathDepth } = getPathIndexes(url);
  const domainIndexes = getDomainIndexes(url, pathDepth);

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
    const tokenizedReview = removeDuplicates(tokenizer.tokenize(parsedText));
    const preparedKeywords = tokenizedReview.map((token) => ({ token: token, relevance: indexTypes.keyword, weight: 2 }));

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

  const internalRank = internalLinks !== 0 ? 0.15/internalLinks : 0.01;
  const externalRank = 0.85 * (preRank !== 0 ? preRank : 0.01);
  return weight + internalRank + externalRank;
}

const addTypeWeightForIndexes = (indexes, pathDepth) => indexes.map(index => {
  const { relevance, token } = index;

  if (relevance === indexTypes.domain) {
    return { token, relevance, weight: domainTypeWeights[index.domainType] - (pathDepth * 0.4) };
  }

  if (relevance === indexTypes.path) {
    return { token, relevance, weight: 2 - 0.33 * index.pathIndex };
  }

  return { token, relevance, weight: typeWeight[relevance] };
})

const handleIndexes = async (queue, connection, linksRepository) => {
  const { url, preRank, internalLinksCount } = queue.dequeue();
  console.log(`Current URL: ${url}`);

  try {
    const { data } = await crawlerInstance.get(url, {
      responseType: 'arraybuffer',
      timeout: 4000
    }) || {};
    if (!data) {
      await linksRepository.updateAfterIndexing(url,  null, null, null, indexingStatus.failed);

      return;
    }

    const { encoding } = encodeDetection.detect(data) || {};
    const decodedData = iconv.decode(data, encoding ? encoding : 'utf8');

    console.log(`Page encoding: ${encoding}`);

    const { title, description, keywords, ...pageInfo } = getPageSignificantData(decodedData, url);
    const keywordIndexes = getKeyWordsIndexes(keywords);
    const { descriptionIndexes, titleIndexes } = getPageIndexes(decodedData, title, description);
    const { pathIndexes, pathDepth, domainIndexes } = getUrlIndexes(url);
    const linkWeight = getLinkWeight(url, titleIndexes, descriptionIndexes, pathIndexes, pageInfo, preRank, internalLinksCount);
    const indexes = [...keywordIndexes, ...descriptionIndexes, ...titleIndexes, ...pathIndexes, ...domainIndexes];
    const stemmedIndexes = getStemmedIndexes(indexes);
    const typeWeightedIndexes = addTypeWeightForIndexes(stemmedIndexes, pathDepth);
    const linkWeightedIndexes = typeWeightedIndexes.map(({ token, weight, relevance }) => ({ token, relevance, weight: weight + linkWeight, }));

    console.log(`Number of indexes: ${linkWeightedIndexes.length}`);

    const wordsRepository = new WordRepository(connection);
    const indexRepository = new IndexRepository(connection);
    for (let i = 0; i < linkWeightedIndexes.length; i++) {
      const { token } = linkWeightedIndexes[i] || {};
      await wordsRepository.add(token);
      await indexRepository.add(linkWeightedIndexes[i], url, i);
    }

    await linksRepository.updateAfterIndexing(url, title, description, pageInfo);
  } catch (e) {
    console.log(e.message);

    await linksRepository.updateAfterIndexing(url,  null, null,  null, indexingStatus.failed);
  }
};

module.exports = {
  handleIndexes,
};
