"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.manifest = exports.catalog = void 0;
const { version, description } = require('../package.json');
exports.catalog = {
    id: 'easynews-plus',
    name: 'Easynews+',
    type: 'series',
    extra: [{ name: 'search', isRequired: true }],
};
exports.manifest = {
    id: 'community.easynews-plus',
    version,
    description,
    catalogs: [exports.catalog],
    resources: [
        'catalog',
        { name: 'meta', types: ['series'], idPrefixes: [exports.catalog.id] },
        { name: 'stream', types: ['movie', 'series'], idPrefixes: ['tt'] },
    ],
    types: ['movie', 'series'],
    name: 'Easynews+',
    background: 'https://images.pexels.com/photos/2521619/pexels-photo-2521619.jpeg',
    logo: 'https://pbs.twimg.com/profile_images/479627852757733376/8v9zH7Yo_400x400.jpeg',
    behaviorHints: { configurable: true, configurationRequired: true },
    config: [
        { title: 'username', key: 'username', type: 'text' },
        { title: 'password', key: 'password', type: 'password' },
    ],
};
