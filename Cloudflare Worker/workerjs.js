addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request))
})

const OMDB_API_KEY = 'KEY-HERE'

function parseUrl(url) {
  const parsedUrl = new URL(url)
  return {
    baseUrl: `${parsedUrl.protocol}//${parsedUrl.hostname}${parsedUrl.port ? ':' + parsedUrl.port : ''}`,
    username: parsedUrl.searchParams.get('username'),
    password: parsedUrl.searchParams.get('password')
  }
}

const sourcesText = `
http://d8380c4177d6.sn.mynetname.net:25461/get.php?username=test&password=test&type=m3u&output=ts
http://iptvpro2.premium-tv.org:8789/get.php?username=test&password=test&type=m3u&output=ts
http://iptvpro.premium-tv.org:8789/get.php?username=test&password=test&type=m3u&output=ts
http://iptvpro.premium-tv.media:8789/get.php?username=test&password=test&type=m3u&output=ts
http://iptvpro2.premium-tv.media:8789/get.php?username=test&password=test&type=m3u&output=ts
http://tv.siptv-pro2.com:8789/get.php?username=test&password=test&type=m3u&output=ts
http://ip.tvballer.com:8080/get.php?username=test&password=test&type=m3u&output=ts
http://ipro.iptvpro2.com:8789/get.php?username=test&password=test&type=m3u&output=ts
http://iptv-premium-ott.com:8789/get.php?username=test&password=test&type=m3u&output=ts
http://tv.host-pro2.com:8789/get.php?username=test&password=test&type=m3u&output=ts
`

const sources = sourcesText.trim().split('\n').map(parseUrl)

async function handleRequest(request) {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json'
  }

  if (request.method === 'OPTIONS') {
    return new Response(null, { headers })
  }

  try {
    const url = new URL(request.url)
    const path = url.pathname

    // Handle Manifest Request
    if (path === '/manifest.json') {
      const manifest = {
        id: "org.yourname.multisource.streamioapp",
        version: "1.0.0",
        name: "Your Multi-Source Stremio App",
        description: "Stream movies from multiple custom sources",
        resources: ["stream"],
        types: ["movie"],
        catalogs: [{
          type: 'movie',
          id: 'yourtvstreams',
          name: 'Your TV Streams',
          extraSupported: ['search']
        }],
        behaviorHints: {
          adult: false,
          p2p: false
        }
      };

      return new Response(JSON.stringify(manifest), { headers })
    }

    // Handle Health Check
    if (path === '/health') {
      return new Response(JSON.stringify({ status: 'ok' }), { headers })
    }

    // Handle Stream Requests
    if (path.startsWith('/stream/movie/')) {
      const imdbId = path.split('/').pop().replace('.json', '')
      
      try {
        console.log(`Fetching data for IMDb ID: ${imdbId}`)
        const omdbResponse = await fetch(`http://www.omdbapi.com/?i=${imdbId}&apikey=${OMDB_API_KEY}`)
        if (!omdbResponse.ok) {
          throw new Error(`OMDB API request failed: ${omdbResponse.status} ${omdbResponse.statusText}`)
        }
        const omdbData = await omdbResponse.json()
        
        console.log('OMDB API response:', JSON.stringify(omdbData))
        
        if (omdbData.Response === 'True') {
          const movieTitle = omdbData.Title
          const movieYear = omdbData.Year
          console.log(`Searching for movie: ${movieTitle} (${movieYear})`)
          
          let allStreams = []

          console.log(`Total sources to search: ${sources.length}`)
          sources.forEach((source, index) => {
            console.log(`Source ${index + 1}: ${source.baseUrl}`)
          })

          for (const source of sources) {
            console.log(`Searching source: ${source.baseUrl}`)
            try {
              const apiUrl = new URL(source.baseUrl)
              apiUrl.pathname = '/player_api.php'
              apiUrl.searchParams.set('username', source.username)
              apiUrl.searchParams.set('password', source.password)
              apiUrl.searchParams.set('action', 'get_vod_streams')

              console.log(`Fetching from API URL: ${apiUrl.toString()}`)
              const apiResponse = await fetch(apiUrl.toString())
              console.log(`API response status for ${source.baseUrl}: ${apiResponse.status}`)

              if (!apiResponse.ok) {
                console.error(`API request failed for ${source.baseUrl}: ${apiResponse.status} ${apiResponse.statusText}`)
                continue
              }
              const movies = await apiResponse.json()

              if (!Array.isArray(movies)) {
                console.error(`Unexpected response from ${source.baseUrl}: ${JSON.stringify(movies)}`)
                continue
              }

              console.log(`Total movies received from ${source.baseUrl}: ${movies.length}`)

              const similarMovies = movies.filter(movie => {
                const movieNameLower = movie.name.toLowerCase()
                const targetTitleLower = movieTitle.toLowerCase()
                const yearMatch = movie.name.includes(movieYear)
                return (movieNameLower.includes(targetTitleLower) || targetTitleLower.includes(movieNameLower)) && yearMatch
              })

              console.log(`Found ${similarMovies.length} matching movies from ${source.baseUrl}`)

              const streams = similarMovies.map(movie => ({
                title: movie.name,
                url: `${source.baseUrl}/movie/${source.username}/${source.password}/${movie.stream_id}.${movie.container_extension}`,
                behaviorHints: {
                  notWebReady: true,
                }
              }))

              allStreams = allStreams.concat(streams)
            } catch (error) {
              console.error(`Error fetching from ${source.baseUrl}:`, error.message)
            }
          }

          console.log(`Total streams found across all sources: ${allStreams.length}`)
          return new Response(JSON.stringify({ streams: allStreams }), { headers })
        } else {
          console.error(`OMDB API error: ${omdbData.Error}`)
          return new Response(JSON.stringify({ streams: [] }), { headers })
        }
      } catch (error) {
        console.error('Error in stream handler:', error.message)
        return new Response(JSON.stringify({ streams: [] }), { headers })
      }
    }

    // Handle Search Requests
    if (path.startsWith('/catalog/movie/yourtvstreams/search=')) {
      const query = path.split('/search=')[1].replace('.json', '')
      
      try {
        console.log(`Searching for query: ${query}`)
        const omdbResponse = await fetch(`http://www.omdbapi.com/?s=${encodeURIComponent(query)}&apikey=${OMDB_API_KEY}`)
        if (!omdbResponse.ok) {
          throw new Error(`OMDB API request failed: ${omdbResponse.status} ${omdbResponse.statusText}`)
        }
        const omdbData = await omdbResponse.json()
        
        console.log('OMDB API search response:', JSON.stringify(omdbData))
        
        if (omdbData.Response === 'True') {
          const metas = omdbData.Search.map(item => ({
            id: item.imdbID,
            title: item.Title,
            year: item.Year,
            poster: item.Poster
          }))

          console.log(`Found ${metas.length} movies matching query "${query}"`)
          return new Response(JSON.stringify({ metas }), { headers })
        } else {
          console.error(`OMDB API search error: ${omdbData.Error}`)
          return new Response(JSON.stringify({ metas: [] }), { headers })
        }
      } catch (error) {
        console.error('Error in search handler:', error.message)
        return new Response(JSON.stringify({ metas: [] }), { headers })
      }
    }

    // Default 404 Response
    return new Response('Not Found', { status: 404, headers })
  } catch (error) {
    console.error('Error in handleRequest:', error.message)
    return new Response(JSON.stringify({ error: 'An internal error occurred' }), { 
      status: 500, 
      headers 
    })
  }
}
