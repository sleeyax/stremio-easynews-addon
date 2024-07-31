import { ContentType } from 'stremio-addon-sdk';

// The SDk type system is incomplete so we have to augment it with our own types for now.

type Config = { username: string; password: string };

declare module 'stremio-addon-sdk' {
  interface Args {
    type: ContentType;
    id: string;
    extra: { search: string; genre: string; skip: number };
    config: Config;
  }

  interface Stream {
    description?: string;
  }

  interface addonBuilder {
    defineMetaHandler(
      handler: (args: {
        type: ContentType;
        id: string;
        config: Config;
      }) => Promise<{ meta: MetaDetail } & Cache>
    ): void;

    defineStreamHandler(
      handler: (args: {
        type: ContentType;
        id: string;
        config: Config;
      }) => Promise<{ streams: Stream[] } & Cache>
    ): void;
  }
}
