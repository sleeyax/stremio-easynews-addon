import { MetaDetail, MetaVideo, Stream } from 'stremio-addon-sdk';
import addonBuilder from 'stremio-addon-sdk/src/builder';
import { catalog, manifest } from './manifest';
import {
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
import { EasynewsAPI, createBasic } from '@easynews/api';

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

    const postTitle = getPostTitle(file);

    const sanitizedTitle = sanitizeTitle(postTitle);
    if (!sanitizedTitle.toLowerCase().includes(search.toLowerCase())) {
      continue;
    }

    const size = getSize(file);
    const duration = getDuration(file);
    const fileDl = `${createStreamUrl(res)}/${createStreamPath(file)}|${createStreamAuth(config)}`;
    const thumbnail = createThumbnailUrl(res, file);

    videos.push({
      id: `${prefix}${file.sig}`,
      released: new Date(file['5']).toISOString(),
      title: sanitizedTitle,
      overview: file['6'],
      thumbnail,
      streams: [
        {
          name: sanitizedTitle,
          description: `${postTitle} (${duration}) - ${size}MB`,
          url: fileDl,
          behaviorHints: {
            notWebReady: true,
            proxyHeaders: {
              request: {
                Authorization: createBasic(config.username, config.password),
              },
            },
          } as Stream['behaviorHints'],
        },
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

builder.defineStreamHandler(async ({ id, config }) => {
  if (!id.startsWith('tt')) {
    return { streams: [] };
  }

  const search = id;

  const api = new EasynewsAPI(config);
  const results = await api.search(search);

  if (!results || !results.data) {
    return { streams: [] };
  }

  const streams: Stream[] = [];

  for (const file of results.data ?? []) {
    if (isBadVideo(file)) {
      continue;
    }

    const postTitle = getPostTitle(file);

    const sanitizedTitle = sanitizeTitle(postTitle);
    if (!sanitizedTitle.toLowerCase().includes(search.toLowerCase())) {
      continue;
    }

    const size = getSize(file);
    const duration = getDuration(file);

    const fileDl = `${createStreamUrl(results)}/${createStreamPath(file)}|${createStreamAuth(config)}`;

    streams.push({
      name: sanitizedTitle,
      description: `${postTitle} (${duration}) - ${size}MB`,
      url: fileDl,
      behaviorHints: {
        notWebReady: sanitizedTitle.includes('HDR'),
      },
    });
  }

  return { streams };
});

export default builder.getInterface();
