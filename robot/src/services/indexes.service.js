const cheerio = require('cheerio');
const aposToLexForm = require('apos-to-lex-form');
const natural = require('natural');
const { removeStopwords , en, ru } = require('stopword');

const { PageService } = require('./page.service');
const { TokenTypes } = require('../common/token.types');
const { formatTextSymbols, removeDuplicates } = require('../common/utils');

class IndexesService {
 constructor() {
   const { WordTokenizer, PorterStemmer, PorterStemmerRu } = natural;

   this.wordTokenizer = WordTokenizer;
   this.porterStemmer = PorterStemmer;
   this.rusPorterStemmer = PorterStemmerRu;
   this.pageService = new PageService();
 }

  prepareIndexes(text, type = TokenTypes.TEXT) {
    const tokenizer = new this.wordTokenizer();

    const parsedText = formatTextSymbols(text);
    const lexedText = aposToLexForm(parsedText);
    const tokenizedReview = tokenizer.tokenize(lexedText);
    const filteredReviewEng = removeStopwords(tokenizedReview, en);
    const filteredReviewRus = removeStopwords(filteredReviewEng, ru);

    return filteredReviewRus.map(el => ({ token: el, relevance: type })).filter(({ token }) => {
      const wordCondition = token && token.length > 2;
      const specCondition = token && !token.includes('&nbsp');

      return wordCondition && specCondition;
    });
  }

  getStemmedIndexes = (indexes) => {
    return indexes.map(el => {
      const { token } = el;
      const rusStemming = this.rusPorterStemmer.stem(token);
      const engStemming = this.porterStemmer.stem(rusStemming);

      return { ...el, token: engStemming };
    })
  }

  getPrimaryInfoIndexes(text, place = TokenTypes.TITLE) {
    if (!text) {
      return [];
    }

    return this.prepareIndexes(text, place);
  };

  getTextIndexes = (document) => {
    const parsedDoc = this.pageService.removeRestrictedSelectors(document);
    const $page = cheerio.load(parsedDoc);
    const pageBody = $page('body');
    const pageText = pageBody.text();

    return this.prepareIndexes(pageText);
  };

  getKeyWordsIndexes (keywords) {
    if (!keywords || !keywords.length) {
      return [];
    }

    return keywords.reduce((acc, cur) => {
      const parsedText = cur.replace(/\s+/g, " ")
          .replace(/[^a-zA-Z-9А-Яа-я ]/g, "")
          .toLowerCase();
      const tokenizer = new this.wordTokenizer();
      const tokenizedReview = removeDuplicates(tokenizer.tokenize(parsedText));
      const preparedKeywords = tokenizedReview.map((token) => ({ token: token, relevance: TokenTypes.KEYWORD, weight: 2 }));

      return [ ...acc, ...preparedKeywords];
    }, []);
  }

  getPageInfoIndexes = (title, description) => {
    const titleIndexes = this.getPrimaryInfoIndexes(title);
    const descriptionIndexes = this.getPrimaryInfoIndexes(description, TokenTypes.DESCRIPTION);

    return { titleIndexes, descriptionIndexes };
  };

  getPageIndexes(html) {
    const { title, description, keywords, ...pageInfo } = this.pageService.getPageSignificantData(html);
    const { titleIndexes, descriptionIndexes } = this.getPageInfoIndexes(title, description);
    const keywordIndexes = this.getKeyWordsIndexes(keywords);

  }
}

module.exports = {
  IndexesService,
};
