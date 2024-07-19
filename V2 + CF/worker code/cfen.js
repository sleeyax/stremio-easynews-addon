addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request));
});

async function handleRequest(request) {
  const url = new URL(request.url);
  const targetUrl = url.pathname.replace('/proxy/', '');

  const reqHeaders = new Headers(request.headers);
  reqHeaders.set('Authorization', 'Basic cHNjaGVja25lcjpiaWxsYmxhc3Mz');

  const response = await fetch(targetUrl, {
    method: request.method,
    headers: reqHeaders,
    redirect: 'follow'
  });

  const newHeaders = new Headers(response.headers);
  newHeaders.set("Access-Control-Allow-Origin", "*");
  newHeaders.set("Access-Control-Allow-Methods", "GET, PUT, PATCH, POST, DELETE");
  newHeaders.set("Access-Control-Allow-Headers", "*");
  newHeaders.set('Access-Control-Allow-Credentials', 'true');

  const body = await response.json();

  // Modify the response body if needed to match your addon's expectations
  const modifiedBody = {
    ...body,
    data: body.data.map(el => ({
      ...el,
      url: new URL(el.url, request.url).href // Ensure URLs are absolute
    }))
  };

  return new Response(JSON.stringify(modifiedBody), {
    status: response.status,
    statusText: response.statusText,
    headers: newHeaders
  });
}
