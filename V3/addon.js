const { addonBuilder } = require('stremio-addon-sdk');
const EasyNewsAPI = require('./EasyNewsAPIv3');
const fetch = require('node-fetch');
require('dotenv').config(); // Load environment variables from .env file

console.log('Starting Stremio EasyNews addon...');

const easynews = new EasyNewsAPI();

// Manifest for the addon
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

// Function to fetch title and year from TMDb API
async function getTitleInfo(tmdbId, type) {
    try {
        let endpoint, url;

        if (type === 'movie') {
            endpoint = 'movie';
            url = `https://api.themoviedb.org/3/${endpoint}/${tmdbId}?api_key=${process.env.TMDB_API_KEY}&language=en-US`;
        } else if (type === 'series') {
            endpoint = 'tv';
            const tmdbData = await fetch(`https://api.themoviedb.org/3/find/${tmdbId}?api_key=${process.env.TMDB_API_KEY}&external_source=imdb_id`);
            const tmdbDataJson = await tmdbData.json();

            if (tmdbDataJson.tv_results && tmdbDataJson.tv_results.length > 0) {
                const tmdbSeriesId = tmdbDataJson.tv_results[0].id;
                url = `https://api.themoviedb.org/3/${endpoint}/${tmdbSeriesId}?api_key=${process.env.TMDB_API_KEY}&language=en-US`;
            } else {
                throw new Error(`No TV results found for IMDb ID: ${tmdbId}`);
            }
        }

        console.log('Fetching URL:', url);
        console.log('Using TMDb API Key:', process.env.TMDB_API_KEY);

        const response = await fetch(url);
        
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const data = await response.json();
        if (!data) {
            throw new Error(`No data returned for ID: ${tmdbId}`);
        }

        return {
            title: data.name || data.title,
            year: data.release_date ? data.release_date.split('-')[0] : 'Unknown',
            type: data.name ? 'series' : 'movie',
            totalSeasons: data.number_of_seasons || null
        };
    } catch (error) {
        console.error('Error fetching title info from TMDb:', error);
        return null;
    }
}

// Function to format file size
function formatSize(sizeInBytes) {
    if (!sizeInBytes) return '🖧 Size not available';

    const sizeInMB = sizeInBytes / (1024 * 1024);
    const sizeInGB = sizeInBytes / (1024 * 1024 * 1024);

    if (sizeInGB >= 1) {
        return `🖧 ${sizeInGB.toFixed(2)} GB`;
    } else if (sizeInMB >= 1) {
        return `🖧 ${sizeInMB.toFixed(2)} MB`;
    } else {
        return `🖧 ${sizeInBytes} Bytes`;
    }
}

// Function to get quality icon
function getQualityIcon(quality) {
    const qualityMap = {
        'UHD': '♔',
        '2160P': '♔',
        '4K': '♔',
        '1080P': '♕',
        '720P': '♖',
        '480P': '♘',
        'SD': '♘'
    };
    return qualityMap[quality.toUpperCase()] || '🎬'; // Default icon if quality is not found
}

// Function to check if a result is a video
function isVideo(element) {
    console.log('Checking if result is a video:', element.name);
    return (
        element.name?.toLowerCase()?.includes('.mkv') ||
        element.name?.toLowerCase()?.includes('.mp4') ||
        element.name?.toLowerCase()?.includes('.avi') ||
        element.name?.toLowerCase()?.includes('.m3u') ||
        element.name?.toLowerCase()?.includes('.m3u8') ||
        element.name?.toLowerCase()?.includes('.flv')
    );
}

// Function to clean and filter search results
function cleanAndFilterResults(results) {
    const filteredResults = results
        .filter(result => {
            const isSample = result.name.toLowerCase().includes('sample');
            const isVideoFile = isVideo(result);
            const isActualSample = isSample && result.name.match(/sample\.\w{2,4}$/i);
            console.log(`Result: ${result.name}, isSample: ${isSample}, isVideoFile: ${isVideoFile}, isActualSample: ${isActualSample}`);
            return isVideoFile && !isActualSample;
        })
        .map(result => ({
            ...result,
            name: result.name.replace(/\./g, ' ')
        }));

    console.log('Filtered results:', filteredResults.map(result => result.name));
    return filteredResults;
}

// Create an addon builder with the manifest
const builder = new addonBuilder(manifest);

// Define the stream handler
builder.defineStreamHandler(async ({ type, id }) => {
    console.log('Stream handler called with type:', type, 'and id:', id);

    if (type !== 'movie' && type !== 'series') {
        console.log('Unsupported type:', type);
        return { streams: [] };
    }

    try {
        let tmdbId = id;
        let seasonNumber, episodeNumber;
        if (type === 'series') {
            const match = id.match(/tt\d+:(\d+):(\d+)/);
            if (match) {
                tmdbId = match[0].split(':')[0];
                seasonNumber = match[1];
                episodeNumber = match[2];
            }
        } else if (id.startsWith('tt')) {
            tmdbId = id;
        } else {
            const match = id.match(/tt\d+/);
            if (match) {
                tmdbId = match[0];
            } else {
                console.log('Unable to extract TMDb ID from:', id);
                return { streams: [] };
            }
        }

        console.log('Extracted TMDb ID:', tmdbId);

        const titleInfo = await getTitleInfo(tmdbId, type);
        if (!titleInfo) {
            console.log('Unable to get title info for TMDb ID:', tmdbId);
            return { streams: [] };
        }

        let searchQuery;
        if (type === 'series' && seasonNumber && episodeNumber) {
            searchQuery = `${titleInfo.title} S${seasonNumber.padStart(2, '0')}E${episodeNumber.padStart(2, '0')}`;
        } else {
            searchQuery = `${titleInfo.title} (${titleInfo.year})`;
        }

        console.log('Searching EasyNews for:', searchQuery);

        const searchResults = await easynews.search(searchQuery);
        console.log('EasyNews search returned', searchResults.length, 'results');

        // Clean and filter results
        const filteredResults = cleanAndFilterResults(searchResults);

        // Map results to streams with formatted titles and sizes
        const streams = filteredResults.map(result => {
            // Extract quality from URL
            const qualityMatch = result.url_dl.match(/(UHD|2160p|4K|1080p|720p|480p)/i);
            const quality = qualityMatch ? qualityMatch[1].toUpperCase() : 'SD';
            const qualityIcon = getQualityIcon(quality);

            return {
                title: `${result.name}\n${qualityIcon} ${quality} - ${formatSize(result.size)}`,
                url: result.url_dl,
                stream: {
                    type: 'url',
                    url: result.url_dl,
                    behaviorHints: {
                        bingeGroup: `easynews-${tmdbId}`,
                        notWebReady: true
                    },
                    proxyHeaders: {
                        request: {
                            'User-Agent': 'Stremio',
                            'Authorization': `Basic ${process.env.EASYNEWS_AUTH}`
                        }
                    }
                },
                size: result.size,
                quality: quality,
                fileIdx: 0
            };
        });

        // Sort streams by quality (UHD/4K/1080p etc.) and then by size
        const qualityOrder = {
            'UHD': 5,
            '2160P': 5,
            '4K': 5,
            '1080P': 4,
            '720P': 3,
            '480P': 2,
            'SD': 1
        };

        streams.sort((a, b) => {
            if (qualityOrder[b.quality] !== qualityOrder[a.quality]) {
                return qualityOrder[b.quality] - qualityOrder[a.quality];
            }
            return b.size - a.size;
        });

        console.log('Streams:', streams.map(s => s.title));
        return { streams };
    } catch (error) {
        console.error('Error in stream handler:', error);
        return { streams: [] };
    }
});

console.log('Stream handler defined');

// Export the addon interface
module.exports = builder.getInterface();
console.log('Addon interface created');
