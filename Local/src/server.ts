import { serveHTTP } from 'stremio-addon-sdk';
import addon from './addon';

const port = +(process.env.PORT ?? 1337);
serveHTTP(addon, { port });
