const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, PUT, PATCH, POST, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': '*',
  'Access-Control-Allow-Credentials': 'true',
};

async function handleRequest(request) {
  const url = new URL(request.url);
  
  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }
  
  let targetUrl = url.pathname.slice(1);
  if (!targetUrl.startsWith('http://') && !targetUrl.startsWith('https://')) {
    targetUrl = 'https://' + targetUrl;
  }
  
  if (!targetUrl) {
    return new Response('Invalid proxy request', { status: 400 });
  }

  try {
    const headers = new Headers(request.headers);
    headers.set('Authorization', 'Basic cHNjaGVja25lcjpiaWxsYmxhc3Mz');
    headers.set('User-Agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
    headers.set('Accept', 'video/webm,video/ogg,video/*;q=0.9,application/ogg;q=0.7,audio/*;q=0.6,*/*;q=0.5');
    headers.delete('host');
    headers.delete('cf-connecting-ip');
    headers.delete('cf-ipcountry');
    headers.delete('cf-ray');
    headers.delete('cf-visitor');
    headers.delete('x-forwarded-proto');
    headers.delete('x-real-ip');

    const rangeHeader = request.headers.get('Range');
    if (rangeHeader) {
      headers.set('Range', rangeHeader);
    }

    console.log('Requesting URL:', targetUrl);
    console.log('Request headers:', Object.fromEntries(headers));

    const response = await fetch(targetUrl, {
      method: request.method,
      headers: headers,
      body: ['GET', 'HEAD'].includes(request.method) ? null : request.body,
      redirect: 'follow', // Follow redirects automatically
    });

    console.log('Response status:', response.status);
    console.log('Response headers:', Object.fromEntries(response.headers));

    if (rangeHeader && response.status === 200) {
      console.warn('Range request was not honored by the origin server');
    }

    if (response.status === 206) {
      console.log('Partial content received');
    }

    const responseHeaders = new Headers(response.headers);
    Object.entries(corsHeaders).forEach(([key, value]) => responseHeaders.set(key, value));

    // If the response is HTML, it might be an error page. Log it for debugging.
    if (responseHeaders.get('content-type')?.includes('text/html')) {
      const text = await response.text();
      console.log('HTML Response:', text);
      return new Response('Unexpected HTML response from server. Please check logs.', { status: 500 });
    }

    return new Response(response.body, {
      status: response.status,
      headers: responseHeaders,
    });
  } catch (error) {
    console.error('Error:', error);
    return new Response(JSON.stringify({ error: 'An error occurred while processing your request' }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders,
      },
    });
  }
}

addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request));
});