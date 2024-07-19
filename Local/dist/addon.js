"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const stremio_addon_sdk_1 = require("stremio-addon-sdk");
const manifest_1 = require("./manifest");
const api_1 = require("./api");
const utils_1 = require("./utils");
const builder = new stremio_addon_sdk_1.addonBuilder(manifest_1.manifest);
const prefix = `${manifest_1.catalog.id}:`;
builder.defineCatalogHandler(async ({ extra: { search } }) => {
    console.log(`Catalog search: ${search}`);
    return {
        metas: [
            {
                id: `${prefix}${search}`,
                name: search,
                type: 'series',
                logo: manifest_1.manifest.logo,
                background: manifest_1.manifest.background,
                posterShape: 'square',
                poster: manifest_1.manifest.logo,
                description: `Provides search results from Easynews for '${search}'`,
            },
        ],
    };
});
builder.defineMetaHandler(async ({ id, config }) => {
    const search = id.replace(prefix, '');
    console.log(`Meta search: ${search}`);
    const videos = [];
    const api = new api_1.EasynewsAPI(config);
    const results = await api.search(search);
    console.log(`API results: ${JSON.stringify(results)}`);
    const files = results?.data ?? [];
    for (const file of files) {
        if ((0, utils_1.isBadVideo)(file)) {
            continue;
        }
        const postTitle = (0, utils_1.getPostTitle)(file);
        const sanitizedTitle = (0, utils_1.sanitizeTitle)(postTitle);
        if (!sanitizedTitle.toLowerCase().includes(search.toLowerCase())) {
            continue;
        }
        const size = (0, utils_1.getSize)(file);
        const duration = (0, utils_1.getDuration)(file);
        // Extract username and password from config
        const { username, password } = config;
        const fileDl = `${(0, utils_1.createStreamUrl)(results)}/${(0, utils_1.createStreamPath)(file)}|${(0, utils_1.createStreamAuth)(username, password)}`;
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
                                Authorization: (0, utils_1.createBasic)(username, password),
                            },
                        },
                    },
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
            logo: manifest_1.manifest.logo,
            background: manifest_1.manifest.background,
            poster: manifest_1.manifest.logo,
            posterShape: 'square',
            description: `Provides search results from Easynews for '${search}'`,
            videos,
        },
    };
});
builder.defineStreamHandler(async ({ id, config }) => {
    console.log(`Stream handler ID: ${id}`);
    if (!manifest_1.manifest.idPrefixes?.some((prefix) => id.startsWith(prefix))) {
        return { streams: [] };
    }
    const search = id;
    const api = new api_1.EasynewsAPI(config);
    const results = await api.search(search);
    if (!results || !results.data) {
        return { streams: [] };
    }
    const streams = [];
    const files = results.data ?? [];
    for (const file of files) {
        if ((0, utils_1.isBadVideo)(file)) {
            continue;
        }
        const postTitle = (0, utils_1.getPostTitle)(file);
        const sanitizedTitle = (0, utils_1.sanitizeTitle)(postTitle);
        if (!sanitizedTitle.toLowerCase().includes(search.toLowerCase())) {
            continue;
        }
        const size = (0, utils_1.getSize)(file);
        const duration = (0, utils_1.getDuration)(file);
        // Extract username and password from config
        const { username, password } = config;
        const fileDl = `${(0, utils_1.createStreamUrl)(results)}/${(0, utils_1.createStreamPath)(file)}|${(0, utils_1.createStreamAuth)(username, password)}`;
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
exports.default = builder.getInterface();
