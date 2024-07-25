require('dotenv').config();
const { serveHTTP, publishToCentral } = require('stremio-addon-sdk');
const addonInterface = require('./addon');

// Use process.env.PORT to allow Heroku to assign the correct port
const PORT = process.env.PORT || 7000; // Default to 7000 if PORT is not defined

serveHTTP(addonInterface, { port: PORT });

// Uncomment the following line if you want to publish your addon to the Stremio addon catalog
// publishToCentral("https://my-addon.awesome/manifest.json")
