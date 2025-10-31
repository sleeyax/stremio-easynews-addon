import { serveHTTP } from '@stremio-addon/compat';
import { addonInterface } from './addon.js';

serveHTTP(addonInterface, { port: +(process.env.PORT ?? 1337) });
