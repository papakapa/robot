const { startCrawlingBot } = require('./bots/page.bot');
const { startIndexingBot } = require('./bots/index.bot');

// startCrawlingBot().then(res => console.log(res)).catch(err => console.log(err));
startIndexingBot().then(res => console.log(res)).catch(err => console.log(err));
