import { ContentType } from 'stremio-addon-sdk';

declare module 'stremio-addon-sdk' {
  interface Stream {
    description?: string;
  }
}
