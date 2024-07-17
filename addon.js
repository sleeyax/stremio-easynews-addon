const { addonBuilder } = require('stremio-addon-sdk');
const EasyNewsAPI = require('./EasyNewsAPIv3');
const fetch = require('node-fetch');
require('dotenv').config();

console.log('Starting Stremio EasyNews addon...');

const easynews = new EasyNewsAPI();

const manifest = {
    id: 'org.easynews.stremio',
    version: '1.0.0',
    name: 'EasyNews',
    description: 'Search and stream content from EasyNews',
    types: ['movie', 'series'],
    catalogs: [],
    resources: ['stream'],
    idPrefixes: ['tt']
};

console.log('Manifest created:', manifest);

async function getTitleInfo(imdbId, type) {
    try {
        const response = await fetch(`http://www.omdbapi.com/?i=${imdbId}&apikey=fd20b0e6`);
        const data = await response.json();
        return {
            title: data.Title,
            type: data.Type,
            totalSeasons: data.totalSeasons
        };
    } catch (error) {
        console.error('Error fetching title info:', error);
        return null;
    }
}

const builder = new addonBuilder(manifest);

builder.defineStreamHandler(async ({ type, id }) => {
    console.log('Stream handler called with type:', type, 'and id:', id);

    if (type !== 'movie' && type !== 'series') {
        console.log('Unsupported type:', type);
        return { streams: [] };
    }

    try {
        // Extract IMDb ID and episode info from the Stremio id
        let imdbId = id;
        let seasonNumber, episodeNumber;
        if (type === 'series') {
            const match = id.match(/tt\d+:(\d+):(\d+)/);
            if (match) {
                imdbId = match[0].split(':')[0];
                seasonNumber = match[1];
                episodeNumber = match[2];
            }
        } else if (!id.startsWith('tt')) {
            const match = id.match(/tt\d+/);
            if (match) {
                imdbId = match[0];
            } else {
                console.log('Unable to extract IMDb ID from:', id);
                return { streams: [] };
            }
        }

        console.log('Extracted IMDb ID:', imdbId);
        
        // Get title info
        const titleInfo = await getTitleInfo(imdbId, type);
        if (!titleInfo) {
            console.log('Unable to get title info for IMDb ID:', imdbId);
            return { streams: [] };
        }

        let searchQuery;
        if (type === 'series' && seasonNumber && episodeNumber) {
            searchQuery = `${titleInfo.title} S${seasonNumber.padStart(2, '0')}E${episodeNumber.padStart(2, '0')}`;
        } else {
            searchQuery = titleInfo.title;
        }

        console.log('Searching EasyNews for:', searchQuery);
        
        const searchResults = await easynews.search(searchQuery);
        console.log('EasyNews search returned', searchResults.length, 'results');

        const streams = searchResults.map(result => {
            // Extract quality from URL
            const qualityMatch = result.url_dl.match(/(UHD|2160p|4K|1080p|720p|480p)/i);
            const quality = qualityMatch ? qualityMatch[1].toUpperCase() : 'SD';

            return {
                title: `EasyNews - ${quality} - ${result.size} - ${result.name}`,
                url: result.url_dl,
                stream: {
                    type: 'url',
                    url: result.url_dl
                },
                size: result.size,
                quality: quality,
                fileIdx: 0
            };
        });

        console.log('Streams:', streams.map(s => s.title));
        return { streams };
    } catch (error) {
        console.error('Error in stream handler:', error);
        return { streams: [] };
    }
});

console.log('Stream handler defined');

module.exports = builder.getInterface();
console.log('Addon interface created');