const RESTRICTED_LANGUAGES = [
  'de', 'es', 'fr', 'zh', 'ar', 'de', 'pl', 'nl', 'pt', 'als', 'az', 'bar', 'ba', 'km',
  'be', 'be-tarask', 'mr', 'pa', 'scn', 'fms', 'yi', 'xmf', 'vec', 'uz', 'sw', 'sd', 'sco',
  'sc', 'rue', 'pms', 'oc', 'ne', 'mzn', 'mn', 'lj', 'li', 'lb', 'jv', 'io', 'gd', 'fy', 'fur',
  'fo', 'diq', 'bat-smg', 'ast', 'af', 'dx', 'an',
  'bg', 'bn', 'bh', 'br', 'bs', 'ca', 'cdo', 'cs', 'ceb', 'chr', 'ce', 'cv', 'cy', 'da', 'el', 'eo', 'et', 'eu', 'fa', 'fi',
  'ga', 'gl', 'hak', 'he', 'hi', 'hif', 'hr', 'hu', 'hy', 'hyw', 'ia', 'id', 'is', 'it', 'ja', 'ka', 'kk',
  'ko', 'ku', 'ky', 'la', 'lmo', 'lt', 'lv', 'mhr', 'mk', 'mg','ml', 'ms', 'my', 'nn', 'nso', 'cv', 'nds-nl', 'no', 'os','pnb',
  'pt', 'pdc', 'ro', 'si','sh', 'simple', 'sk', 'st', 'sl', 'sq', 'sr', 'sv','su', 'sn', 'sah','to', 'ta', 'te', 'tet', 'tg', 'th', 'tl', 'tr',
  'tt', 'vep', 'uk', 'ur', 'vi', 'vo', 've', 'wuu', 'yo', 'zh', 'zh-min-man', 'zh-yue', 'dl', 'azb', 'arz', 'ckb', 'xh',
  'war', 'zh-classical', 'zu',
];

const RESTRICTED_FILE_EXTENSIONS = [
    'pdf', 'png', 'cab', 'htm', 'gif', 'xlsx', 'sql', 'jpg', 'zip', 'doc', 'docx', 'mp3', 'mp4', 'webm', 'gz', 'gzip', 'bz2', 'djvu'
];
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

const domainTypeWeights = {
  main: 5,
  'main+p1': 4.66,
  'main+p2': 4.33,
  p1: 2.5,
  p2: 2,
  ppp: 2,
  path: 2,
};

const DISALLOWED_PATH_DICTIONARY = [
    'content', 'view', 'item', 'section', 'pull', 'login', 'auth', 'edit', 'component',
    'post', 'abs', 'indexphp', 'catalog',
];

module.exports = {
  RESTRICTED_FILE_EXTENSIONS,
  RESTRICTED_LANGUAGES,
  RESTRICTED_SELECTORS,
  VALID_DOMAINS,
  HABR_ENTRY_POINT,
  WIKI_ENTRY_POINT,
  S13_ENTRY_POINT,
  typeWeight,
  domainTypeWeights,
};
