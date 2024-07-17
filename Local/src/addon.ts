import { addonBuilder, MetaVideo, Stream } from 'stremio-addon-sdk';
import { catalog, manifest } from './manifest';
import { EasynewsAPI } from './api';
import {
  createBasic,
  createStreamAuth,
  createStreamPath,
  createStreamUrl,
  getDuration,
  getPostTitle,
  getSize,
  isBadVideo,
  sanitizeTitle,
} from './utils';

const builder = new addonBuilder(manifest);

const prefix = `${catalog.id}:`;

builder.defineCatalogHandler(async ({ extra: { search } }) => {
  console.log(`Catalog search: ${search}`);
  return {
    metas: [
      {
        id: `${prefix}${search}`,
        name: search,
        type: 'series',
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
  const search = id.replace(prefix, '');
  console.log(`Meta search: ${search}`);

  const videos: MetaVideo[] = [];
  const api = new EasynewsAPI(config);
  const results = await api.search(search);
  console.log(`API results: ${JSON.stringify(results)}`);

  const files = results?.data ?? [];

  for (const file of files) {
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

    // Extract username and password from config
    const { username, password } = config;
    const fileDl = `${createStreamUrl(results)}/${createStreamPath(file)}|${createStreamAuth(username, password)}`;

    videos.push({
      id: `${prefix}${file.sig}`,
      released: new Date(file['5']).toISOString(),
      title: sanitizedTitle,
      overview: file['6'],
      streams: [
        {
          name: sanitizedTitle,
          description: `${postTitle} (${duration}) - ${size}MB`,
          url: fileDl,
          behaviorHints: {
            notWebReady: true,
            proxyHeaders: {
              request: {
                Authorization: createBasic(username, password),
              },
            },
          } as Stream['behaviorHints'],
        },
      ],
    });
  }

  console.log(`Meta handler returning videos: ${JSON.stringify(videos)}`);

  return {
    meta: {
      id: `${prefix}${search}`,
      name: search,
      type: 'series',
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
  console.log(`Stream handler ID: ${id}`);
  if (!manifest.idPrefixes?.some((prefix) => id.startsWith(prefix))) {
    return { streams: [] };
  }

  const search = id;
  const api = new EasynewsAPI(config);
  const results = await api.search(search);

  if (!results || !results.data) {
    return { streams: [] };
  }

  const streams: Stream[] = [];
  const files = results.data ?? [];

  for (const file of files) {
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

    // Extract username and password from config
    const { username, password } = config;
    const fileDl = `${createStreamUrl(results)}/${createStreamPath(file)}|${createStreamAuth(username, password)}`;

    streams.push({
      name: sanitizedTitle,
      description: `${postTitle} (${duration}) - ${size}MB`,
      url: fileDl,
      behaviorHints: {
        notWebReady: sanitizedTitle.includes('HDR'),
      },
    });
  }

  console.log(`Stream handler returning streams: ${JSON.stringify(streams)}`);

  return { streams };
});

export default builder.getInterface();
