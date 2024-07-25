// Easynews credentials
const EASYNEWS_USERNAME = 'chadbell';
const EASYNEWS_PASSWORD = 'Myahbell12345';

addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request));
});

function logError(error) {
  console.error('Error:', error.message);
  console.error('Stack:', error.stack);
}

async function handleRequest(request) {
  try {
    const url = new URL(request.url);
    const path = url.pathname;

    const headers = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers });
    }

    let response;
    if ( path === '/manifest.json') {
      response = handleManifest();
    } else if (path.startsWith('/stream/')) {
      response = await handleStream(request);
    } else {
      response = new Response('Not found', { status: 404 });
    }

    Object.entries(headers).forEach(([key, value]) => {
      response.headers.set(key, value);
    });

    return response;
  } catch (error) {
    logError(error);
    return new Response(JSON.stringify({ error: 'An unexpected error occurred' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

function handleManifest() {
  const manifest = {
    id: "org.yourapp.easynews",
    version: "1.1.1",
    name: "Easynews Search",
    description: "Search and stream content from Easynews",
    resources: ["stream"],
    types: ["movie", "series"],
    catalogs: [],
    behaviorHints: {
      configurable: false,
      configurationRequired: false,
    },
  };
  return new Response(JSON.stringify(manifest), {
    headers: { 'Content-Type': 'application/json' },
  });
}

async function handleStream(request) {
  const url = new URL(request.url);
  let imdbId = url.pathname.split('/').pop();
  
  // Remove .json extension if present
  imdbId = imdbId.replace(/\.json$/, '');

  // Decode the URL-encoded imdbId
  imdbId = decodeURIComponent(imdbId);

  console.log(`Handling stream request for IMDb ID: ${imdbId}`);

  try {
    const [baseImdbId, season, episode] = imdbId.split(':');
    const itemInfo = await getItemInfoFromOmdb(baseImdbId);
    console.log('Item info retrieved:', JSON.stringify(itemInfo));

    let searchResults;
    if (itemInfo.type === 'series' && season && episode) {
      searchResults = await searchEasynewsSeries(itemInfo.title, itemInfo.year, season, episode);
    } else if (itemInfo.type === 'series' && season) {
      searchResults = await searchEasynewsSeries(itemInfo.title, itemInfo.year, season);
    } else {
      searchResults = await searchEasynews(itemInfo.title, itemInfo.year);
    }
    console.log(`Found ${searchResults.length} results from Easynews`);

    const streams = searchResults.map(result => ({
      name: `Easynews - ${result.filename} (${result.fileSize})`,
      title: result.filename,
      url: result.linkUrl,
      type: itemInfo.type,
      infoHash: result.value,
      fileIdx: 0,
      behaviorHints: {
         notWebReady: true
      },
      proxyHeaders: {
        request: {
          'User-Agent': 'Stremio',
          'Authorization': `Basic ${btoa(`${EASYNEWS_USERNAME}:${EASYNEWS_PASSWORD}`)}`
        }
      }
    }));

    return new Response(JSON.stringify({ streams }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in handleStream:', error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

async function getItemInfoFromOmdb(imdbId) {
  if (!/^tt\d{7,8}$/.test(imdbId)) {
    throw new Error(`Invalid IMDb ID format: ${imdbId}`);
  }

  const omdbApiKey = 'fd20b0e6';
  const url = `http://www.omdbapi.com/?i=${imdbId}&apikey=${omdbApiKey}`;

  console.log(`Fetching OMDB data for IMDb ID: ${imdbId}`);

  try {
    const response = await fetch(url);
    console.log(`OMDB API response status: ${response.status}`);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log('OMDB API response data:', JSON.stringify(data));

    if (data.Response === 'True') {
      console.log(`Successfully fetched data for: ${data.Title} (${data.Year})`);
      return {
        title: data.Title,
        year: data.Year,
        type: data.Type,
      };
    } else {
      console.error('OMDB API error:', data.Error);
      throw new Error(data.Error || 'Item not found');
    }
  } catch (error) {
    console.error('Error in getItemInfoFromOmdb:', error.message);
    throw error;
  }
}

async function searchEasynews(title, year) {
  const searchTerm = `${title} ${year}`;
  const searchUrl = `https://members.easynews.com/global5/search.html?gps=&sbj=&from=&ns=&fil=${encodeURIComponent(searchTerm)}&fex=&vc=&ac=&fty[]=VIDEO&s1=dsize&s1d=-&s2=nrfile&s2d=%2B&s3=dsize&s3d=-&pby=500&pno=1&sS=0&spamf=1&svL=&d1=&d1t=&d2=&d2t=&b1=&b1t=&b2=&b2t=&px1=&px1t=&px2=&px2t=&fps1=&fps1t=&fps2=&fps2t=&bps1=&bps1t=&bps2=&bps2t=&hz1=&hz1t=&hz2=&hz2t=&rn1=&rn1t=&rn2=&rn2t=&submit=Search&fly=2`;

  const auth = btoa(`${EASYNEWS_USERNAME}:${EASYNEWS_PASSWORD}`);
  const headers = {
    'Authorization': `Basic ${auth}`,
  };

  console.log(`Searching Easynews for: ${searchTerm}`);

  try {
    const response = await fetch(searchUrl, { headers });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const html = await response.text();
    console.log(`Received Easynews response, length: ${html.length}`);
    const results = parseEasynewsSearchResults(html);
    console.log(`Filtered results for movie "${title} (${year})": ${results.length}`);
    return results;
  } catch (error) {
    console.error('Error searching Easynews:', error);
    throw error;
  }
}

async function searchEasynewsSeries(title, year, season, episode) {
  let searchTerm;
  if (season && episode) {
    searchTerm = `${title} S${season.toString().padStart(2, '0')}E${episode.toString().padStart(2, '0')} ${year}`;
  } else if (season) {
    searchTerm = `${title} S${season.toString().padStart(2, '0')} ${year}`;
  } else {
    searchTerm = `${title} ${year}`;
  }

  const searchUrl = `https://members.easynews.com/global5/search.html?gps=&sbj=&from=&ns=&fil=${encodeURIComponent(searchTerm)}&fex=&vc=&ac=&fty[]=VIDEO&s1=dsize&s1d=-&s2=nrfile&s2d=%2B&s3=dsize&s3d=-&pby=500&pno=1&sS=0&spamf=1&svL=&d1=&d1t=&d2=&d2t=&b1=&b1t=&b2=&b2t=&px1=&px1t=&px2=&px2t=&fps1=&fps1t=&fps2=&fps2t=&bps1=&bps1t=&bps2=&bps2t=&hz1=&hz1t=&hz2=&hz2t=&rn1=&rn1t=&rn2=&rn2t=&submit=Search&fly=2`;

  const auth = btoa(`${EASYNEWS_USERNAME}:${EASYNEWS_PASSWORD}`);
  const headers = {
    'Authorization': `Basic ${auth}`,
  };

  console.log(`Searching Easynews for series: ${searchTerm}`);

  try {
    const response = await fetch(searchUrl, { headers });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const html = await response.text();
    console.log(`Received Easynews response, length: ${html.length}`);
    const results = parseEasynewsSearchResults(html);
    console.log(`Filtered results for series "${searchTerm}": ${results.length}`);
    return results;
  } catch (error) {
    console.error('Error searching Easynews for series:', error);
    throw error;
  }
}

function parseEasynewsSearchResults(html) {
  const regex = /<tr class="rRow\d+">.*?<input.*?name="([^"]+)".*?value="([^"]+)".*?<a href="([^"]+)".*?>([^<]+)<\/a>.*?<td class="fSize" nowrap>([\d.]+ [GM]B)<\/td>.*?<td class="StatusLink" nowrap>([^<]+)<\/td>.*?<td class="StatusLink" nowrap>([^<]+)<\/td>/gs;

  let match;
  const results = [];
  let totalResults = 0;
  let filteredOutSamples = 0;

  while ((match = regex.exec(html)) !== null) {
    totalResults++;
    let filename = match[4];
    
    // Skip files with "sample" in the name (case-insensitive)
    if (filename.toLowerCase().includes('sample')) {
      filteredOutSamples++;
      continue;
    }

    let linkUrl = match[3];
    linkUrl = linkUrl.replace('https://', `https://${EASYNEWS_USERNAME}:${EASYNEWS_PASSWORD}@`);
    
    results.push({
      checkboxValue: match[1],
      value: match[2],
      linkUrl: linkUrl,
      filename: filename,
      fileSize: match[5],
      codec: match[6],
      views: match[7],
    });
  }

  console.log(`Total results: ${totalResults}`);
  console.log(`Filtered out ${filteredOutSamples} samples`);
  console.log(`Parsed ${results.length} results from Easynews (excluding samples)`);
  return results;
}