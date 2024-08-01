import { MetaDetail, MetaVideo, Stream } from 'stremio-addon-sdk';
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
  getSize,
  isBadVideo,
  sanitizeTitle,
} from './utils';
import {
  EasynewsAPI,
  EasynewsSearchResponse,
  createBasic,
} from '@easynews/api';
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
  };
});

builder.defineMetaHandler(async ({ id, config }) => {
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
  };
});

builder.defineStreamHandler(async ({ id, type, config }) => {
  if (!id.startsWith('tt')) {
    return { streams: [] };
  }

  const meta = await publicMetaProvider(id, type);
  const searchQuery = buildSearchQuery(type, meta);

  const api = new EasynewsAPI(config);
  const res = await api.search(searchQuery);

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
        duration: getDuration(file),
        size: getSize(file),
        title: getPostTitle(file),
        url: `${createStreamUrl(res)}/${createStreamPath(file)}|${createStreamAuth(config)}`,
      })
    );
  }

  return { streams };
});

function mapStream({
  config,
  duration,
  size,
  title,
  url,
}: {
  title: string;
  duration: string | undefined;
  size: string | undefined;
  url: string;
  config: Config;
}): Stream {
  return {
    name: 'Easynews+',
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

export const addonInterface = builder.getInterface();
export const landingHTML = landingTemplate(addonInterface.manifest);
