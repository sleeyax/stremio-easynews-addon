/**
 * Cloudflare Worker Reverse Proxy
 * Reference: H_Y
 */

addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request));
});

/**
 * Respond to the request
 * @param {Request} request
 */
async function handleRequest(request) {
  // Parse the incoming request URL
  let srvurl = new URL(request.url);
  let srvHostname = srvurl.hostname;

  // Extract the path after the hostname for the proxy target URL
  let urlPath = request.url.substr(request.url.indexOf(srvHostname) + srvHostname.length);
  if (urlPath.startsWith('/')) {
    urlPath = urlPath.substr(1);
  }

  // Base URL for the proxied request
  let targetUrl = new URL(`https://${urlPath}`);
  
  // Headers manipulation
  let reqHeaders = new Headers(request.headers);
  
  // Handle WebSocket upgrade requests
  if (reqHeaders.get('Connection') === 'Upgrade') {
    let upRequest = new Request(targetUrl, request);
    return fetch(upRequest);
  }

  // Modify Referer header if needed
  if (reqHeaders.has('Referer')) {
    let refererUrl = new URL(reqHeaders.get('Referer'));
    reqHeaders.set('Referer', refererUrl.toString());
  }

  // Modify cookies for the proxied request
  if (reqHeaders.has('cookie')) {
    let cookies = reqHeaders.get('cookie')
      .replace(new RegExp(`Domain=${srvHostname}`, 'g'), `Domain=${targetUrl.hostname}`)
      .replace(new RegExp(`Path=/`, 'g'), `Path=/${targetUrl.hostname}/`);
    reqHeaders.set('cookie', cookies);
  }

  // Prepare the proxied request
  let fetchOptions = {
    method: request.method,
    headers: reqHeaders,
    redirect: 'follow'
  };

  if (['POST', 'PUT'].includes(request.method)) {
    fetchOptions.body = await request.clone().text();
  }

  // Perform the proxied request
  let response = await fetch(targetUrl, fetchOptions);
  
  // Modify the response headers for CORS and content security
  let myHeaders = new Headers(response.headers);
  myHeaders.set("Access-Control-Allow-Origin", "*");
  myHeaders.set("Access-Control-Allow-Methods", "GET, PUT, PATCH, POST, DELETE");
  myHeaders.set("Access-Control-Allow-Headers", "*");
  myHeaders.set('Access-Control-Allow-Credentials', 'true');
  myHeaders.delete('content-security-policy');
  myHeaders.delete('content-security-policy-report-only');
  myHeaders.delete('clear-site-data');

  // Optionally rewrite URLs in the response body
  let contentType = myHeaders.get('content-type');
  let responseText = await response.clone().text();

  if (contentType && contentType.includes('text/html')) {
    responseText = responseText
      .replace(new RegExp('href="/', 'g'), `href="/${targetUrl.hostname}/`)
      .replace(new RegExp('src="/', 'g'), `src="/${targetUrl.hostname}/`)
      .replace(new RegExp('url("/', 'g'), `url("/${targetUrl.hostname}/`);
  }

  // Modify set-cookie headers
  if (myHeaders.has('set-cookie')) {
    let setCookie = myHeaders.get('set-cookie')
      .replace(new RegExp('Path=/', 'g'), `Path=/${targetUrl.hostname}/`)
      .replace(new RegExp(`Domain=${targetUrl.hostname}`, 'g'), `Domain=${srvHostname}`);
    myHeaders.set('set-cookie', setCookie);
  }

  // Return the modified response
  return new Response(responseText, {
    status: response.status,
    headers: myHeaders
  });
}
