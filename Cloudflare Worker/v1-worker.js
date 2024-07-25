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
    if (path === '/' || path === '/manifest.json') {
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
    id: "org.hy.easynews",
    version: "1.0.0",
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

  console.log(`Handling stream request for IMDb ID: ${imdbId}`);

  try {
    const movieInfo = await getMovieInfoFromOmdb(imdbId);
    console.log('Movie info retrieved:', JSON.stringify(movieInfo));

    const searchResults = await searchEasynews(movieInfo.title, movieInfo.year);
    console.log(`Found ${searchResults.length} results from Easynews`);

    const streams = searchResults.map(result => ({
      name: `Easynews - ${result.filename} (${result.fileSize})`,
      title: result.filename,
      url: result.linkUrl,
      type: 'movie',
      infoHash: result.value,
      fileIdx: 0,
      behaviorHints: {
        bingeGroup: `easynews-${imdbId}`,
      },
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

async function getMovieInfoFromOmdb(imdbId) {
  // Check if the IMDb ID is in the correct format (tt followed by 7 or 8 digits)
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
      };
    } else {
      console.error('OMDB API error:', data.Error);
      throw new Error(data.Error || 'Movie not found');
    }
  } catch (error) {
    console.error('Error in getMovieInfoFromOmdb:', error.message);
    throw error;
  }
}

async function searchEasynews(title, year) {
  const searchTerm = `${title} ${year}`;
  const searchUrl = `https://members.easynews.com/global5/search.html?gps=&sbj=&from=&ns=&fil=${encodeURIComponent(searchTerm)}&fex=&vc=&ac=&fty%5B%5D=VIDEO&s1=nsubject&s1d=%2B&s2=nrfile&s2d=%2B&s3=dsize&s3d=%2B&pby=100&pno=1&sS=0&spamf=1&svL=&d1=&d1t=&d2=&d2t=&b1=&b1t=&b2=&b2t=&px1=&px1t=&px2=&px2t=&fps1=&fps1t=&fps2=&fps2t=&bps1=&bps1t=&bps2=&bps2t=&hz1=&hz1t=&hz2=&hz2t=&rn1=&rn1t=&rn2=&rn2t=&submit=Search&fly=2`;

  const username = 'chadbell'; // Ensure this is set securely in your environment
  const password = 'Myahbell12345'; // Ensure this is set securely in your environment

  const auth = btoa(`${username}:${password}`);
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
    return parseEasynewsSearchResults(html, username, password);
  } catch (error) {
    console.error('Error searching Easynews:', error);
    throw error;
  }
}

function parseEasynewsSearchResults(html, username, password) {
  const regex = /<tr class="rRow\d+">.*?<input.*?name="([^"]+)".*?value="([^"]+)".*?<a href="([^"]+)".*?>([^<]+)<\/a>.*?<td class="fSize" nowrap>([\d.]+ [GM]B)<\/td>.*?<td class="StatusLink" nowrap>([^<]+)<\/td>.*?<td class="StatusLink" nowrap>([^<]+)<\/td>/gs;

  let match;
  const results = [];
  while ((match = regex.exec(html)) !== null) {
    let linkUrl = match[3];
    linkUrl = linkUrl.replace('https://', `https://${username}:${password}@`);
    
    results.push({
      checkboxValue: match[1],
      value: match[2],
      linkUrl: linkUrl,
      filename: match[4],
      fileSize: match[5],
      codec: match[6],
      views: match[7],
    });
  }

  console.log(`Parsed ${results.length} results from Easynews`);
  return results;
}