const CINEMETA_ENDPOINT = "https://v3-cinemeta.strem.io";

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
    if (path === '/') {
      response = handleLoginPage();
    } else if (path === '/manifest.json') {
      response = handleManifest(request);
    } else if (path.startsWith('/stream/')) {
      response = await handleStream(request);
    } else if (path.startsWith('/catalog/')) {
      response = await handleCatalog(request);
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

function handleLoginPage() {
  const html = `
  <!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Easynews Stremio Addon - Login</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            background-color: #e3f2fd; /* Light blue background */
            color: #0d47a1; /* Dark blue text color */
            text-align: center; /* Center-align text */
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
        }
        .logo {
            width: 150px;
            margin: 20px auto;
        }
        h1 {
            font-size: 24px;
            color: #0d47a1; /* Match text color to logo color */
            margin-bottom: 20px;
        }
        input[type="text"], input[type="password"] {
            display: block;
            width: calc(100% - 22px); /* Adjust width to account for padding */
            margin: 10px auto;
            padding: 10px; /* Adjust padding */
            border-radius: 5px;
            border: 1px solid #90caf9; /* Light blue border to match the background */
            font-size: 16px;
        }
        button {
          background-color: #0d47a1; /* Dark blue background */
          color: white;
          border: none;
          cursor: pointer;
          padding: 12px 24px; /* Increase padding for larger button */
          font-size: 16px; /* Increase font size for better readability */
          margin: 10px auto;
          display: block;
          width: 200px; /* Set width to double the normal size */
          border-radius: 5px;
      }
    
        button:hover {
            background-color: #1565c0; /* Slightly lighter blue for hover effect */
        }
        .error {
            color: red;
            margin: 10px 0;
        }
    </style>
</head>
<body>
    <!-- Using a placeholder image URL; replace with your actual image URL -->
    <img src="data:image/svg+xml;base64,PHN2ZyB4bWxucz0naHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmcnIHhtbG5zOnhsaW5rPSdodHRwOi8vd3d3LnczLm9yZy8xOTk5L3hsaW5rJyBzdHlsZT0naXNvbGF0aW9uOmlzb2xhdGUnIHZpZXdCb3g9JzAgMCA5MDAgMTcwJyB3aWR0aD0nMjQ0JyBoZWlnaHQ9JzQ2Jz48ZyB0cmFuc2Zvcm09J3RyYW5zbGF0ZSgwIDE4LjI0MyknIGZpbGw9J3VybCgjbGluZWFyR3JhZGllbnQ0OTQ4KSc+PHBhdGggZD0nTTc2MC42MDEgODcuNTNoODQuNTUycS45MjctLjMwNCAxLjg1My0zLjA0NC45MjctMi43NDEuOTI3LTQuMjYzIDAtMS44MjctLjkyNy00LjU2Ny0uOTI2LTMuMDQ0LTEuMzktMy4wNDRoLTY4LjU2N3EwLTkuMTM0IDIuMzE2LTE3LjY1OSAyLjMxNi04LjUyNSA2LjQ4Ni0xNC45MTkgNC40MDEtNi42OTggMTAuMTkzLTEwLjY1NiA2LjAyMy0zLjk1OCAxMy40MzUtMy45NThoNTYuNTIydjE2Ljc0NWgtNTYuNTIybC0yLjA4NSAyLjc0MXEtMS44NTMgMi40MzUtMy4yNDMgNC44NzEtLjY5NSAxLjUyMi0xLjE1OCAyLjQzNi0uMjMxLjkxMy0uMjMxIDIuMTMxIDAgLjYwOS45MjYgMy4wNDRoNTcuNjgxcTIuNTQ4IDAgNC44NjQgMi40MzYgMi4zMTcgMi40MzYgMy43MDcgNi4wODkgMS42MjEgMy42NTQgMi41NDggNy42MTIuOTI2IDMuOTU4LjkyNiA2LjY5OCAwIDQuMjYzLTEuMzkgOC41MjUtMS4xNTggNC4yNjItMy40NzQgNy45MTYtMi4wODUgMy4zNDktNS4wOTcgNS43ODUtMy4wMTEgMi4xMzEtNi40ODYgMi4xMzFoLTk2LjM2NXonLz48cGF0aCBkPSdNNzY3LjEyNiAyNS40MnY2Mi43MTlxLS45MjcgMy4wNDUtMy4wMTIgNi4wODktMS44NTMgMi43NC00LjQwMSA1LjE3Ni0yLjMxNyAyLjEzMS01LjA5NiAzLjY1NC0yLjU0OSAxLjUyMi00LjYzMyAxLjUyMmgtMzEuNzM2VjkyLjQwMXEtNS4zMjggNi4wOS05LjAzNCA5LjEzNC0zLjcwNyAzLjA0NS02Ljk1IDMuMDQ1aC00OS4xMDlWMjUuNDJoMTkuNDU4djYwLjU4OGgxOC43NjRxNC44NjQtMS41MjIgNi43MTctMy42NTQgMS44NTQtMi4xMzEgMi43OC02LjM5M1YyNS40MmgxOC41MzJ2NjAuNTg4aDE5LjY5cTQuODY1LTEuNTIyIDYuNzE4LTMuNjU0IDEuODUzLTIuMTMxIDIuNzgtNi4zOTNWMjUuNDJ6TTU2MC4zNyA2Ni44MjdoLTEzLjQzNXEuNDYzLTMuOTU4IDIuMDg1LTguNTI1IDEuNjIxLTQuODcyIDYuMjU0LTEyLjE3OSAyLjA4NS0zLjM0OSA1LjA5Ni03LjAwMiAzLjAxMi0zLjY1NCA2Ljk1LTYuMzk0IDMuOTM4LTMuMDQ1IDguMzM5LTQuODcxIDQuNDAyLTIuMTMyIDguODAzLTIuNDM2aDU3LjIxN3YxNi43NDVoLTUzLjk3NHEtMS4zOS42MDktMi43OCAxLjUyMy0xLjM5LjkxMy0zLjQ3NSAzLjY1My0yLjA4NCAyLjc0LTMuMDExIDQuODcyLS45MjcgMi4xMzEtMS4zOSA1LjE3NWg1Ny42ODF2MTUuMjI0aC00Ny45NTJxLTIuNTQ4IDAtNS4wOTYgNC41NjYtMi41NDggNC4yNjMtMy45MzggMTAuNjU3aDY2LjAydjE2Ljc0NWgtOTYuODI5cTAtMy45NTggMS4xNTgtOC44MjkgMS4zOS00Ljg3MiAzLjcwNi05Ljc0MyAyLjMxNy01LjE3NiA1LjMyOC0xMC4wNDcgMy4wMTItNS4xNzYgNi4yNTUtOS4xMzR6TTUzOC42ODggMTA0LjU4VjQxLjg2MXEtLjkyNy0zLjA0NS0zLjAxMi02LjA4OS0yLjA4NC0zLjA0NS00LjYzMy01LjE3Ni0yLjMxNi0yLjQzNi00Ljg2NC0zLjY1NC0yLjU0OC0xLjUyMi00LjYzMy0xLjUyMmgtNzUuNTE4djc5LjE2aDE5LjQ1OVY0My45OTJoNDUuMTcxcTQuODY1IDEuNTIyIDYuNzE4IDMuNjU0IDEuODUzIDIuMTMxIDIuNzggNi4zOTN2NTAuNTQxek00MzYuMzIxIDEwNC41OGgtOTAuMzQzVjg3LjgzNWg3MS4xMTZWMjUuNDJoMTkuMjI3em0tNzkuMjI0LTQxLjQwN3EtMy4yNDMtMy45NTgtNi4yNTQtOC44MjktMi43OC00Ljg3Mi01LjA5Ny0xMC4wNDctMi4zMTYtNS4xNzYtMy43MDYtMTAuMDQ4LTEuMzktNC44NzEtMS4zOS04LjgyOWgyMi45MzNxMi41NDggOC41MjUgNC4xNyAxMy43MDEgMS42MjIgNC44NzEgMi41NDggNi4zOTMgMS4xNTggMS41MjMgMi4zMTcgMy42NTQgMS4xNTggMS44MjcgMi4zMTYgMy45NTggMS4zOSAxLjgyNyAyLjc4IDMuMDQ1IDEuMzkgMS4yMTcgMi43OCAxLjIxN2gyNi44NzF2MTUuMjI0aC0zNy4wNjRxLTguODAyLTMuNjU0LTEzLjIwNC05LjQzOXpNMjE5LjAzMyA4Ny41M2g4NC41NTJxLjkyNi0uMzA0IDEuODUzLTMuMDQ0LjkyNi0yLjc0MS45MjYtNC4yNjMgMC0xLjgyNy0uOTI2LTQuNTY3LS45MjctMy4wNDQtMS4zOS0zLjA0NEgyMzUuNDhxMC05LjEzNCAyLjMxNi0xNy42NTkgMi4zMTctOC41MjUgNi40ODctMTQuOTE5IDQuNDAxLTYuNjk4IDEwLjE5Mi0xMC42NTYgNi4wMjMtMy45NTggMTMuNDM2LTMuOTU4aDU2LjUyMnYxNi43NDVoLTU2LjUyMmwtMi4wODUgMi43NDFxLTEuODUzIDIuNDM1LTMuMjQzIDQuODcxLS42OTUgMS41MjItMS4xNTggMi40MzYtLjIzMi45MTMtLjIzMiAyLjEzMSAwIC42MDkuOTI3IDMuMDQ0aDU3LjY4cTIuNTQ4IDAgNC44NjUgMi40MzYgMi4zMTYgMi40MzYgMy43MDYgNi4wODkgMS42MjIgMy42NTQgMi41NDggNy42MTIuOTI3IDMuOTU4LjkyNyA2LjY5OCAwIDQuMjYzLTEuMzkgOC41MjUtMS4xNTggNC4yNjItMy40NzUgNy45MTYtMi4wODUgMy4zNDktNS4wOTYgNS43ODUtMy4wMTIgMi4xMzEtNi40ODYgMi4xMzFoLTk2LjM2NnonLz48cGF0aCBkPSdNMTUxLjMzNyA3Mi45MTZ2MzEuNjY0aC0xOC41MzJWNDEuODYxcS45MjctMy4wNDUgMi43OC02LjA4OSAyLjA4NS0zLjA0NSA0LjYzMy01LjE3NiAyLjU0OC0yLjQzNiA1LjA5Ni0zLjY1NCAyLjU0OS0xLjUyMiA0LjYzMy0xLjUyMmg3NS41MTh2NzkuMTZoLTE5LjQ1OVY3Mi45MTZ6bTU0LjY2OS0xNS4yMjNWNDMuOTkyaC00NS4xNzFxLTQuODY1IDEuNTIyLTYuNzE4IDMuNjU0LTEuODUzIDIuMTMxLTIuNzggNi4zOTN2My42NTR6TTQwLjAyMSA2Ni44MjdIMjYuNTg2cS40NjMtMy45NTggMi4wODQtOC41MjUgMS42MjItNC44NzIgNi4yNTUtMTIuMTc5IDIuMDg1LTMuMzQ5IDUuMDk2LTcuMDAyIDMuMDEyLTMuNjU0IDYuOTUtNi4zOTQgMy45MzgtMy4wNDUgOC4zMzktNC44NzEgNC40MDEtMi4xMzIgOC44MDMtMi40MzZoNTcuMjE3djE2Ljc0NUg2Ny4zNTZxLTEuMzkuNjA5LTIuNzggMS41MjMtMS4zOS45MTMtMy40NzUgMy42NTN0LTMuMDExIDQuODcycS0uOTI3IDIuMTMxLTEuMzkgNS4xNzVoNTcuNjh2MTUuMjI0SDY2LjQyOXEtMi41NDggMC01LjA5NiA0LjU2Ni0yLjU0OCA0LjI2My0zLjkzOCAxMC42NTdoNjYuMDJ2MTYuNzQ1SDI2LjU4NnEwLTMuOTU4IDEuMTU4LTguODI5IDEuMzktNC44NzIgMy43MDYtOS43NDMgMi4zMTctNS4xNzYgNS4zMjgtMTAuMDQ3IDMuMDEyLTUuMTc2IDYuMjU1LTkuMTM0eicvPjwvZz48ZGVmcyBpZD0nZGVmczQ2MTUnPjxsaW5lYXJHcmFkaWVudCBpZD0nbGluZWFyR3JhZGllbnQ0OTQ2Jz48c3RvcCBvZmZzZXQ9JzAnIGlkPSdzdG9wNDk0Micgc3RvcC1jb2xvcj0nIzNjNmNkZScvPjxzdG9wIG9mZnNldD0nMScgaWQ9J3N0b3A0OTQ0JyBzdG9wLWNvbG9yPScjNmQ5OWZmJy8+PC9saW5lYXJHcmFkaWVudD48ZmlsdGVyIGlkPSduYkVQeHdyS3pmd3FhZzdBOUFvSGpjQ3pvcmZLRnJ5dycgeD0nLTInIHk9Jy0yJyB3aWR0aD0nNCcgaGVpZ2h0PSc0Jz48ZmVPZmZzZXQgaW49J1NvdXJjZUFscGhhJyByZXN1bHQ9J29mZk91dCcgZHg9JzcuNScgZHk9JzcuNScgaWQ9J2ZlT2Zmc2V0NDYwNCcvPjxmZUdhdXNzaWFuQmx1ciBpbj0nb2ZmT3V0JyByZXN1bHQ9J2JsdXJPdXQnIHN0ZERldmlhdGlvbj0nNS42MjUnIGlkPSdmZUdhdXNzaWFuQmx1cjQ2MDYnLz48ZmVDb21wb25lbnRUcmFuc2ZlciBpbj0nYmx1ck91dCcgcmVzdWx0PSdvcGFjT3V0JyBpZD0nZmVDb21wb25lbnRUcmFuc2ZlcjQ2MTAnPjxmZUZ1bmNBIHR5cGU9J3RhYmxlJyB0YWJsZVZhbHVlcz0nMCAwLjUnIGlkPSdmZUZ1bmNBNDYwOCcvPjwvZmVDb21wb25lbnRUcmFuc2Zlcj48ZmVCbGVuZCBpbj0nU291cmNlR3JhcGhpYycgaW4yPSdvcGFjT3V0JyBpZD0nZmVCbGVuZDQ2MTInLz48L2ZpbHRlcj48bGluZWFyR3JhZGllbnQgeGxpbms6aHJlZj0nI2xpbmVhckdyYWRpZW50NDk0NicgaWQ9J2xpbmVhckdyYWRpZW50NDk0OCcgeDE9JzI2LjU4NicgeTE9JzY1JyB4Mj0nODczLjQxNCcgeTI9JzY1JyBncmFkaWVudFVuaXRzPSd1c2VyU3BhY2VPblVzZScvPjwvZGVmcz48L3N2Zz4=" alt="Easynews Stremio Addon Logo" class="logo">
    <h1>Easynews Stremio Addon</h1>
    <form>
        <input type="text" id="username" name="username" placeholder="Username" required>
        <input type="password" id="password" name="password" placeholder="Password" required>
        <button type="submit">Install</button>
        <p class="error" id="error-message"></p>
    </form>
</body>
</html>


  
  `;
  return new Response(html, { headers: { 'Content-Type': 'text/html' } });
}


function handleManifest(request) {
  const url = new URL(request.url);
  const username = url.searchParams.get('username');
  const password = url.searchParams.get('password');

  if (!username || !password) {
    return new Response(JSON.stringify({ error: 'Missing credentials' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const manifest = {
    id: "org.yourapp.easynews2",
    version: "2.0.0",
    name: "Easynews Search",
    description: "Search and stream content from Easynews",
    resources: ["stream", "catalog"],
    types: ["movie", "series"],
    catalogs: [
      {
        type: "movie",
        id: "easynews_movie",
        name: "Easynew",
        extra: [{ name: "search" }]
      },
      ],
    behaviorHints: {
      configurable: true,
      configurationRequired: false,
    },
  };
  return new Response(JSON.stringify(manifest), {
    headers: { 'Content-Type': 'application/json' },
  });
}
async function handleStream(request) {
  const url = new URL(request.url);
  const username = url.searchParams.get('username');
  const password = url.searchParams.get('password');

  if (!username || !password) {
    return new Response(JSON.stringify({ error: 'Missing credentials' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  let id = url.pathname.split('/').pop().replace(/\.json$/, '');
  id = decodeURIComponent(id);

  console.log(`Handling stream request for ID: ${id}`);

  try {
    if (id.startsWith('en_')) {
      const linkUrl = atob(id.replace('en_', ''));
      const filename = linkUrl.split('/').pop().split('?')[0];
      const quality = getQualityFromFilename(filename);
      
      const stream = {
        url: linkUrl,
        title: filename,
        name: `Easynews - ${quality}`,
        behaviorHints: {
          notWebReady: true,
          proxyHeaders: {
            request: {
              'User-Agent': 'Stremio',
              'Authorization': `Basic ${btoa(`${username}:${password}`)}`
            }
          }
        }
      };

      return new Response(JSON.stringify({ streams: [stream] }), {
        headers: { 'Content-Type': 'application/json' },
      });
    } else {
      const [baseImdbId, season, episode] = id.split(':');
      const type = season ? 'series' : 'movie';
      let itemInfo = await getItemInfo(type, baseImdbId);
      console.log('Item info retrieved:', JSON.stringify(itemInfo));

      let searchResults;
      try {
        searchResults = await performSearch(itemInfo, season, episode, username, password);
        console.log(`Search results: ${JSON.stringify(searchResults)}`);
      } catch (error) {
        console.error(`Error in performSearch: ${error.message}`);
        searchResults = [];
      }

      if (searchResults.length === 0 && itemInfo.name.startsWith("Unknown")) {
        console.log(`No results found. Attempting search with IMDb ID: ${baseImdbId}`);
        searchResults = await searchEasynews(baseImdbId, "", username, password);
      }

      console.log(`Found ${searchResults.length} results from Easynews`);

      const streams = searchResults.map(result => {
        const quality = getQualityFromFilename(result.filename);
        const language = result.languages.map(lang => getLanguageEmoji(lang)).join(' ');
        const readableSize = formatFileSize(result.fileSize);
      
        return {
          name: `Easynews ${getQualityEmoji(quality)} ${quality} ${language}`,
          title: `${result.filename}\nSize: ${readableSize}`,
          url: result.linkUrl,
          type: itemInfo.type,
          size: readableSize,
          behaviorHints: {
            notWebReady: true,
            proxyHeaders: {
              request: {
                'User-Agent': 'Stremio',
                'Authorization': `Basic ${btoa(`${username}:${password}`)}`
              }
            }
          }
        };
      });
      
      streams.sort((a, b) => {
        const qualityOrder = { '4K': 4, '1080p': 3, '720p': 2, '480p': 1, 'SD': 0 };
        const aQuality = a.name.split(' ')[2];
        const bQuality = b.name.split(' ')[2];
        if (qualityOrder[aQuality] !== qualityOrder[bQuality]) {
          return qualityOrder[bQuality] - qualityOrder[aQuality];
        }
        return parseFloat(b.size) - parseFloat(a.size);
      });

      return new Response(JSON.stringify({ streams }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }
  } catch (error) {
    console.error('Error in handleStream:', error.message);
    return new Response(JSON.stringify({ streams: [] }), {
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

async function handleCatalog(request) {
  const url = new URL(request.url);
  const username = url.searchParams.get('username');
  const password = url.searchParams.get('password');
  const type = url.pathname.split('/')[2];

  if (!username || !password) {
    return new Response(JSON.stringify({ error: 'Missing credentials' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const pathParts = url.pathname.split('/');
  const searchPart = pathParts[pathParts.length - 1];
  const searchMatch = searchPart.match(/search=(.+)\.json/);
  const searchQuery = searchMatch ? decodeURIComponent(searchMatch[1]) : null;

  console.log(`Received catalog request for type: ${type}, search: ${searchQuery}`);

  if (!searchQuery) {
    return new Response(JSON.stringify({ metas: [] }), {
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const searchResults = await searchEasynews(searchQuery, null, username, password);
    console.log(`Search results for "${searchQuery}":`, searchResults.length);

    const metas = searchResults.map(result => {
      const quality = getQualityFromFilename(result.filename);
      const logoText = result.filename.replace(/\.[^/.]+$/, "");
      const logo = generateLogoDataUri(logoText);
      return {
        id: `en_${btoa(result.linkUrl)}`,
        type: type,
        name: result.filename,
        poster: logo,
        background: null,
        logo: null,
        description: `Size: ${result.fileSize}\nQuality: ${quality}\nLanguages: ${result.languages.join(', ')}`,
        streams: [{
          url: result.linkUrl,
          title: result.filename,
          name: `Easynews - ${quality}`,
        }],
      };
    });

    return new Response(JSON.stringify({ metas }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in handleCatalog:', error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
async function getItemInfo(type, imdbId) {
  try {
    return await getItemInfoFromCinemeta(type, imdbId);
  } catch (error) {
    console.warn('Failed to fetch from Cinemeta, trying IMDb suggestion API:', error.message);
    try {
      return await getItemInfoFromImdb(imdbId);
    } catch (imdbError) {
      console.warn('Failed to fetch from IMDb suggestion API, using fallback method:', imdbError.message);
      return getFallbackItemInfo(imdbId, type);
    }
  }
}

async function getItemInfoFromCinemeta(type, imdbId) {
  if (!/^tt\d{7,8}$/.test(imdbId)) {
    throw new Error(`Invalid IMDb ID format: ${imdbId}`);
  }

  console.log(`Fetching Cinemeta data for IMDb ID: ${imdbId}`);

  const url = `${CINEMETA_ENDPOINT}/meta/${type}/${imdbId}.json`;
  const response = await fetch(url);
  console.log(`Cinemeta API response status: ${response.status}`);

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const data = await response.json();
  console.log('Cinemeta API response data:', JSON.stringify(data));

  if (data.meta) {
    console.log(`Successfully fetched data for: ${data.meta.name} (${data.meta.year})`);
    return {
      name: data.meta.name,
      year: data.meta.year,
      type: type,
    };
  } else {
    console.error('Cinemeta API error: Item not found');
    throw new Error('Item not found');
  }
}

async function getItemInfoFromImdb(imdbId) {
  const url = `https://v2.sg.media-imdb.com/suggestion/t/${imdbId}.json`;
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`IMDb API HTTP error! status: ${response.status}`);
  }

  const data = await response.json();
  
  if (data.d && data.d.length > 0) {
    const item = data.d[0];
    return {
      name: item.l,
      year: item.y,
      type: determineType(item),
      imageUrl: item.i?.imageUrl
    };
  } else {
    throw new Error('Item not found in IMDb suggestion API');
  }
}

function determineType(item) {
  if (item.qid === 'movie' || item.q === 'feature') {
    return 'movie';
  } else if (item.qid === 'tvSeries' || item.q === 'TV series') {
    return 'series';
  } else {
    return 'movie';
  }
}

function getFallbackItemInfo(imdbId, type) {
  const name = `Unknown ${type.charAt(0).toUpperCase() + type.slice(1)}`;
  const year = new Date().getFullYear();
  
  console.log(`Using fallback info for IMDb ID: ${imdbId}`);
  return { name, year, type };
}

async function performSearch(itemInfo, season, episode, username, password) {
  if (isUFCEvent(itemInfo.name)) {
    return await searchUFCEvent(itemInfo.name, username, password);
  } else if (itemInfo.type === 'series' && season && episode) {
    return await searchEasynewsSeries(itemInfo.name, itemInfo.year, season, episode, username, password);
  } else if (itemInfo.type === 'series' && season) {
    return await searchEasynewsSeries(itemInfo.name, itemInfo.year, season, null, username, password);
  } else {
    return await searchEasynews(itemInfo.name, itemInfo.year, username, password);
  }
}

function isUFCEvent(title) {
  return title.toLowerCase().includes('ufc') && /\d+/.test(title);
}

async function searchUFCEvent(title, username, password) {
  const ufcNumber = title.match(/UFC\s*(\d+)/i);
  const fighters = title.split(':')[1]?.trim();

  if (ufcNumber && ufcNumber[1] && fighters) {
    const searchTerm = `UFC ${ufcNumber[1]} ${fighters}`;
    console.log(`Searching for UFC event: ${searchTerm}`);
    const xml = await fetchEasynewsRssFeed(searchTerm, username, password);
    return parseEasynewsRssFeed(xml);
  } else {
    console.log(`Unable to parse UFC number and fighters from title: ${title}. Falling back to regular search.`);
    return await searchEasynews(title, '', username, password);
  }
}

function decodeHTMLEntities(text) {
  return text.replace(/&quot;/g, '"')
             .replace(/&#39;/g, "'")
             .replace(/&lt;/g, '<')
             .replace(/&gt;/g, '>')
             .replace(/&amp;/g, '&')
             .replace(/&#(\d+);/g, (match, dec) => String.fromCharCode(dec));
}

function parseEasynewsRssFeed(xml) {
  xml = decodeHTMLEntities(xml);
  
  const items = [];
  const itemRegex = /<item>([\s\S]*?)<\/item>/g;
  let match;

  while ((match = itemRegex.exec(xml)) !== null) {
    const itemXml = match[1];
    
    const enclosureMatch = itemXml.match(/<enclosure url="([^"]+)"/);
    const link = enclosureMatch ? enclosureMatch[1] : '';
    
    const sizeMatch = itemXml.match(/length="([^"]+)"/);
    const fileSize = sizeMatch ? sizeMatch[1] : '';
    
    const descriptionMatch = itemXml.match(/<description>([\s\S]*?)<\/description>/);
    const description = descriptionMatch ? descriptionMatch[1] : '';
    
    const filenameMatch = link.match(/\/([^\/]+\.(?:mkv|mp4|avi))(?:\?|$)/i);
    const filename = filenameMatch 
      ? cleanFilename(decodeURIComponent(filenameMatch[1]))
      : '';
    
    const languageFlags = (description.match(/flags\/16\/([^.]+)\.png/g) || [])
      .map(flag => flag.split('/').pop().split('.')[0])
      .filter((v, i, a) => a.indexOf(v) === i);
    
    items.push({
      filename: filename,
      linkUrl: link,
      fileSize: fileSize,
      languages: languageFlags,
    });
  }

  return items;
}

function cleanFilename(filename) {
  return filename
    .replace(/%20/g, '')
    .replace(/%[0-9A-Fa-f]{2}/g, '')
    .replace(/\./g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

async function searchEasynews(title, year, username, password) {
  const searchTerm = year ? `${title} ${year}` : title;
  const xml = await fetchEasynewsRssFeed(searchTerm, username, password);
  return parseEasynewsRssFeed(xml);
}

async function searchEasynewsSeries(title, year, season, episode, username, password) {
  let searchTerm;
  if (season && episode) {
    searchTerm = `${title} S${season.toString().padStart(2, '0')}E${episode.toString().padStart(2, '0')} ${year}`;
  } else if (season) {
    searchTerm = `${title} S${season.toString().padStart(2, '0')} ${year}`;
  } else {
    searchTerm = `${title} ${year}`;
  }
  const xml = await fetchEasynewsRssFeed(searchTerm, username, password);
  return parseEasynewsRssFeed(xml);
}

async function fetchEasynewsRssFeed(searchTerm, username, password) {
  const encodedSearchTerm = encodeURIComponent(searchTerm);
  const url = `https://members.easynews.com//global5/search.html?submit=Search&gps=&sbj=&from=&ns=&fil=${encodedSearchTerm}&fex=&vc=&ac=&fty%5B%5D=VIDEO&s1=dsize&s1d=-&s2=dsize&s2d=-&s3=dsize&s3d=-&pby=100&pno=1&sS=5&u=1&svL=&d1=&d1t=&d2=&d2t=&b1=&b1t=&b2=&b2t=&px1=&px1t=&px2=&px2t=&fps1=&fps1t=&fps2=&fps2t=&bps1=&bps1t=&bps2=&bps2t=&hz1=&hz1t=&hz2=&hz2t=&rn1=&rn1t=&rn2=&rn2t=&fly=1  `;

  const response = await fetch(url, {
    headers: {
      'Authorization': `Basic ${btoa(`${username}:${password}`)}`,
    },
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  return await response.text();
}

function getQualityFromFilename(filename) {
  const lowerFilename = filename.toLowerCase();
  if (lowerFilename.includes('2160p') || lowerFilename.includes('4k')) return '4K';
  if (lowerFilename.includes('1080p')) return '1080p';
  if (lowerFilename.includes('720p')) return '720p';
  if (lowerFilename.includes('480p')) return '480p';
  return 'SD';
}

function getLanguageEmoji(lang) {
  const langMap = {
    'us': '🇺🇸', 'gb': '🇬🇧', 'spa': '🇪🇸', 'ita': '🇮🇹', 
    'fr': '🇫🇷', 'de': '🇩🇪', 'rus': '🇷🇺', 'jpn': '🇯🇵'
  };
  return langMap[lang] || '🌐';
}

function getQualityEmoji(quality) {
  switch (quality) {
    case '4K': return '🌟';
    case '1080p': return '🎥';
    case '720p': return '📺';
    case '480p': return '📱';
    default: return '💾';
  }
}

function formatFileSize(size) {
  const [value, unit] = size.split(' ');
  const numValue = parseFloat(value);
  if (unit === 'GB') {
    return numValue.toFixed(2) + ' GB';
  } else if (unit === 'MB') {
    return (numValue / 1024).toFixed(2) + ' GB';
  }
  return size;
}

function generateLogoDataUri(text) {
  const lines = [
    text.slice(0, 20),
    text.slice(20, 40),
    text.slice(40, 60),
    text.slice(60, 80),
    text.slice(80, 100)
  ].map(line => line.trim()).filter(line => line.length > 0);

  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="200" height="300" viewBox="0 0 200 300">
      <rect width="100%" height="100%" fill="black"/>
      <text x="100" y="150" text-anchor="middle" fill="white" font-family="Arial, sans-serif" font-size="14">
        ${lines.map((line, index) => `<tspan x="100" dy="${index === 0 ? '-2em' : '1.2em'}">${line}</tspan>`).join('')}
      </text>
    </svg>
  `;
  return `data:image/svg+xml;base64,${btoa(svg)}`;
}
