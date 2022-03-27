const cheerio = require('cheerio');
const aposToLexForm = require('apos-to-lex-form');
const natural = require('natural');
const { removeStopwords , en, ru } = require('stopword');
const SpellCorrector = require('spelling-corrector');

const { crawlerInstance } = require('../instances/crawler.instance');
const { IndexRepository } = require('../repositories/index.repository');
const { WordRepository } = require('../repositories/word.repository');
const { getPageSignificantData, removeRestrictedSelectors } = require('../services/web.page.service');

const prepareIndexes = (text, type = 'text') => {
  // const spellCorrector = new SpellCorrector();
  // spellCorrector.loadDictionary();
  const parsedText = text.replace(/\s+/g, " ")
      .replace(/[^a-zA-Z-9А-Яа-я ]/g, "")
      .toLowerCase();

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

  return stemmedTokens.map(el => ({ word: el, relevance: type})).filter(({ word }) => {
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

  return [...titleIndexes, ...descriptionIndexes];
  // return [...titleIndexes, ...textIndexes, ...descriptionIndexes];
};

const getKeyWordsIndexes = (keywords) => {
  if (!keywords || !keywords.length) {
    return [];
  }

  return keywords.map(el => ({ word: el, relevance: 'keyword'}));
};

const handleIndexes = async (queue, connection, linksRepository) => {
  const url = queue.dequeue();
  console.log(`Current URL: ${url}`);

  try {
    const { data } = await crawlerInstance.get(url) || {};
    if (!data) {
      await linksRepository.updateAfterIndexing(url,  null, null, 'failed');

      return;
    }

    const { title, description, keywords } = getPageSignificantData(data);
    const keywordIndexes = getKeyWordsIndexes(keywords);
    const pageIndexes = getPageIndexes(data, title, description);
    const indexes = [...pageIndexes, ...keywordIndexes];

    console.log(`Number of indexes: ${indexes.length}`);

    const wordsRepository = new WordRepository(connection);
    const indexRepository = new IndexRepository(connection);

    for (let i = 0; i < indexes.length; i++) {
      const { word } = indexes[i] || {};
      await wordsRepository.add(word);
      await indexRepository.add(indexes[i], url, i);
    }

    await linksRepository.updateAfterIndexing(url, title, description);
  } catch (e) {
    console.log(e.message);

    await linksRepository.updateAfterIndexing(url,  null, null, 'failed');
  }
};

module.exports = {
  handleIndexes,
};
