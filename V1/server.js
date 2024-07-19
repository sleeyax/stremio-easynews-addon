require('dotenv').config();
const { serveHTTP, publishToCentral } = require('stremio-addon-sdk');
const addonInterface = require('./addon');

serveHTTP(addonInterface, { port: 7000 });

// Uncomment the following line if you want to publish your addon to the Stremio addon catalog
// publishToCentral("https://my-addon.awesome/manifest.json")