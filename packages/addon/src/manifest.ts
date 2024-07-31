import { Manifest, ManifestCatalog } from 'stremio-addon-sdk';

const { version, description } = require('../package.json');

export const catalog: ManifestCatalog = {
  id: 'easynews-plus',
  name: 'Easynews+',
  type: 'tv',
  extra: [{ name: 'search', isRequired: true }],
};

export const manifest: Manifest = {
  id: 'community.easynews-plus',
  version,
  description,
  catalogs: [catalog],
  resources: [
    'catalog',
    { name: 'meta', types: ['tv'], idPrefixes: [catalog.id] },
    { name: 'stream', types: ['movie', 'series'], idPrefixes: ['tt'] },
  ],
  types: ['movie', 'series', 'tv'],
  name: 'Easynews+',
  background:
    'https://images.pexels.com/photos/2521619/pexels-photo-2521619.jpeg',
  logo: 'https://pbs.twimg.com/profile_images/479627852757733376/8v9zH7Yo_400x400.jpeg',
  behaviorHints: { configurable: true, configurationRequired: true },
  config: [
    { title: 'username', key: 'username', type: 'text' },
    { title: 'password', key: 'password', type: 'password' },
  ],
};
