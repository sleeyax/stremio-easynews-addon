import { serveHTTP } from 'stremio-addon-sdk';
import { addonInterface } from './addon';

serveHTTP(addonInterface, { port: +(process.env.PORT ?? 1337) });
