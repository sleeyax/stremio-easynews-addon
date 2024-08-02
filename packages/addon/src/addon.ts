import { Cache, MetaDetail, MetaVideo, Stream } from 'stremio-addon-sdk';
import addonBuilder from 'stremio-addon-sdk/src/builder';
import landingTemplate from 'stremio-addon-sdk/src/landingTemplate';
import { catalog, manifest } from './manifest';
import {
  buildSearchQuery,
  createStreamAuth,
  createStreamPath,
  createStreamUrl,
  createThumbnailUrl,
  getDuration,
  getPostTitle,
  getQuality,
  getSize,
  isBadVideo,
  logError,
} from './utils';
import { EasynewsAPI, createBasic } from '@easynews/api';
import { publicMetaProvider } from './meta';
import { Config } from './stremio-addon-sdk';

const builder = new addonBuilder(manifest);

const prefix = `${catalog.id}:`;

builder.defineCatalogHandler(async ({ extra: { search } }) => {
  return {
    metas: [
      {
        id: `${prefix}${search}`,
        name: search,
        type: 'tv',
        logo: manifest.logo,
        background: manifest.background,
        posterShape: 'square',
        poster: manifest.logo,
        description: `Provides search results from Easynews for '${search}'`,
      },
    ],
    cacheMaxAge: 3600 * 24 * 30, // The returned data is static so it may be cached for a long time (30 days).
  };
});

builder.defineMetaHandler(async ({ id, type, config }) => {
  try {
    if (!id.startsWith(catalog.id)) {
      return { meta: null as unknown as MetaDetail };
    }

    const search = id.replace(prefix, '');

    const videos: MetaVideo[] = [];

    const api = new EasynewsAPI(config);
    const res = await api.searchAll(search);

    for (const file of res?.data ?? []) {
      if (isBadVideo(file)) {
        continue;
      }

      const title = getPostTitle(file);

      videos.push({
        id: `${prefix}${file.sig}`,
        released: new Date(file['5']).toISOString(),
        title,
        overview: file['6'],
        thumbnail: createThumbnailUrl(res, file),
        streams: [
          mapStream({
            config,
            title,
            fullResolution: file.fullres,
            duration: getDuration(file),
            size: getSize(file),
            url: `${createStreamUrl(res)}/${createStreamPath(file)}|${createStreamAuth(config)}`,
          }),
        ],
      });
    }

    return {
      meta: {
        id: `${prefix}${search}`,
        name: search,
        type: 'tv',
        logo: manifest.logo,
        background: manifest.background,
        poster: manifest.logo,
        posterShape: 'square',
        description: `Provides search results from Easynews for '${search}'`,
        videos,
      },
      ...getCacheOptions(videos.length),
    };
  } catch (error) {
    logError({
      message: 'failed to handle meta',
      error,
      context: { resource: 'meta', id, type },
    });
    return { meta: null as unknown as MetaDetail };
  }
});

builder.defineStreamHandler(async ({ id, type, config }) => {
  try {
    if (!id.startsWith('tt')) {
      return { streams: [] };
    }

    const meta = await publicMetaProvider(id, type);

    const api = new EasynewsAPI(config);

    let res = await api.search(
      buildSearchQuery(type, { ...meta, year: undefined })
    );

    if (res?.data?.length <= 1 && meta.year !== undefined) {
      res = await api.search(buildSearchQuery(type, meta));
    }

    if (!res || !res.data) {
      return { streams: [] };
    }

    const streams: Stream[] = [];

    for (const file of res.data ?? []) {
      if (isBadVideo(file)) {
        continue;
      }

      streams.push(
        mapStream({
          config,
          fullResolution: file.fullres,
          duration: getDuration(file),
          size: getSize(file),
          title: getPostTitle(file),
          url: `${createStreamUrl(res)}/${createStreamPath(file)}|${createStreamAuth(config)}`,
        })
      );
    }

    return { streams, ...getCacheOptions(streams.length) };
  } catch (error) {
    logError({
      message: 'failed to handle stream',
      error,
      context: { resource: 'stream', id, type },
    });
    return { streams: [] };
  }
});

function mapStream({
  config,
  duration,
  size,
  fullResolution,
  title,
  url,
}: {
  title: string;
  duration: string | undefined;
  size: string | undefined;
  fullResolution: string | undefined;
  url: string;
  config: Config;
}): Stream {
  const quality = getQuality(title, fullResolution);

  return {
    name: `Easynews+${quality ? `\n${quality}` : ''}`,
    title: title,
    description: [
      title,
      `🕛 ${duration ?? 'unknown duration'}`,
      `📦 ${size ?? 'unknown size'}`,
    ].join('\n'),
    url: url,
    behaviorHints: {
      notWebReady: true,
      proxyHeaders: {
        request: {
          'User-Agent': 'Stremio',
          Authorization: createBasic(config.username, config.password),
        },
      },
    } as Stream['behaviorHints'],
  };
}

function getCacheOptions(itemsLength: number): Partial<Cache> {
  if (itemsLength === 0) {
    return {};
  }

  const oneDay = 3600 * 24;
  const oneWeek = oneDay * 7;

  return {
    cacheMaxAge: oneWeek,
    staleError: oneDay,
    staleRevalidate: oneDay,
  };
}

export const addonInterface = builder.getInterface();
export const landingHTML = landingTemplate(addonInterface.manifest);
