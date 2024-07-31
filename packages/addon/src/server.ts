import { serveHTTP } from 'stremio-addon-sdk';
import addon from './addon';

serveHTTP(addon, { port: +(process.env.PORT ?? 1337) });
