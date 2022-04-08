const RESTRICTED_LANGUAGES = [
  'de', 'es', 'fr', 'zh', 'ar', 'de', 'pl', 'nl', 'pt', 'als', 'az', 'bar', 'ba', 'km',
  'be', 'be-tarask', 'mr', 'pa', 'scn', 'fms', 'yi', 'xmf', 'vec', 'uz', 'sw', 'sd', 'sco',
  'sc', 'rue', 'pms', 'oc', 'ne', 'mzn', 'mn', 'lj', 'li', 'lb', 'jv', 'io', 'gd', 'fy', 'fur',
  'fo', 'diq', 'bat-smg', 'ast', 'af', 'dx',
  'bg', 'bn', 'br', 'bs', 'ca', 'cdo', 'cs', 'cy', 'da', 'el', 'eo', 'et', 'eu', 'fa', 'fi',
  'ga', 'gl', 'hak', 'he', 'hi', 'hr', 'hu', 'hy', 'ia', 'id', 'is', 'it', 'ja', 'ka', 'kk',
  'ko', 'ku', 'ky', 'la', 'lmo', 'lt', 'lv', 'mhr', 'mk', 'ml', 'ms', 'my', 'nn', 'no', 'pnb',
  'pt', 'ro', 'sh', 'simple', 'sk', 'sl', 'sq', 'sr', 'sv', 'ta', 'tet', 'tg', 'th', 'tl', 'tr',
  'tt', 'uk', 'ur', 'vi', 'wuu', 'yo', 'zh', 'zh-min-man', 'zh-yue', 'dl', 'azb', 'arz', 'ckb',
  'war'
];
const RESTRICTED_FILE_EXTENSIONS = ['pdf', 'png', 'cab', 'htm', 'gif', 'xlsx', 'sql', 'jpg', 'zip', 'doc', 'docx', 'mp3', 'mp4'];
const VALID_DOMAINS = ['com', 'ru', 'org', 'by'];
const WIKI_ENTRY_POINT = 'https://www.wikipedia.org';
const HABR_ENTRY_POINT = 'https://habr.com/ru';
const S13_ENTRY_POINT = 'https://s13.ru';
const RESTRICTED_SELECTORS = [
  'footer', 'header', 'iframe', 'script', 'noscript', 'img', 'button', 'span', 'svg', 'ul', 'h3',
  'h4', 'a', 'ol', 'div[class*="nav"]', 'div[class*="footer"]', 'div[class*="header"]', 'div[class*="comm"]',
  'div[class*="menu"]', 'div[class*="banner"]', 'div[class*="pagination"]', 'div[class*="icon"]'
];

const typeWeight = {
  domain: 3,
  title: 2,
  pathname: 2.5,
  keyword: 1,
  description: 1.5,
};

module.exports = {
  RESTRICTED_FILE_EXTENSIONS,
  RESTRICTED_LANGUAGES,
  RESTRICTED_SELECTORS,
  VALID_DOMAINS,
  HABR_ENTRY_POINT,
  WIKI_ENTRY_POINT,
  S13_ENTRY_POINT,
  typeWeight,
};
