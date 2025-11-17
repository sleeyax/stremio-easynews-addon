import { Hono } from 'hono';
import { createRouter, type AddonInterface } from '@stremio-addon/sdk';

export type Options = {
  /**
   * Landing page HTML.
   */
  landingHTML: string;
};

export function getRouter(
  addonInterface: AddonInterface,
  { landingHTML }: Options
) {
  const router = createRouter(addonInterface);

  const honoRouter = new Hono();
  
  honoRouter.get('/', ({ html }) => html(landingHTML));
  honoRouter.get('/config', ({ html }) => html(landingHTML)); // for reverse compatibility with the old 'hono-stremio' package
  
  // Proxy endpoint for ExoPlayer compatibility
  honoRouter.get('/proxy/:encodedData', async (c) => {
    try {
      const { encodedData } = c.req.param();
      
      // Decode base64url
      let decoded = encodedData.replace(/-/g, '+').replace(/_/g, '/');
      while (decoded.length % 4) decoded += '=';
      const proxyData = JSON.parse(atob(decoded));
      
      const { url: targetUrl, username, password } = proxyData;
      
      if (!targetUrl || !username || !password) {
        return c.text('Invalid proxy data', 400);
      }
      
      console.log('Proxying stream to:', new URL(targetUrl).hostname);
      
      // Build headers with proper authentication
      const authHeader = 'Basic ' + btoa(`${username}:${password}`);
      const headers: Record<string, string> = {
        'Authorization': authHeader,
        'User-Agent': 'Stremio-Easynews-Addon/2.0.0',
      };
      
      // Forward Range header for seeking support
      const rangeHeader = c.req.header('Range');
      if (rangeHeader) {
        headers['Range'] = rangeHeader;
      }
      
      // Fetch from Easynews without following redirects
      const streamResponse = await fetch(targetUrl, {
        headers,
        redirect: 'manual',
      });
      
      console.log('Easynews response:', streamResponse.status);
      
      // Handle redirect to CDN
      if (streamResponse.status >= 300 && streamResponse.status < 400) {
        const location = streamResponse.headers.get('Location');
        if (location) {
          console.log('Got CDN redirect, validating...');
          
          // Validate CDN URL accessibility
          try {
            const validateResponse = await fetch(location, {
              method: 'HEAD',
              headers: {
                'User-Agent': 'Stremio-Easynews-Addon/2.0.0',
              },
            });
            
            if (!validateResponse.ok) {
              console.error('CDN validation failed:', validateResponse.status);
              return c.text('CDN URL not accessible', 502);
            }
            
            console.log('CDN validated, redirecting');
            
            // Return redirect to public CDN URL
            return c.redirect(location, 302);
            
          } catch (error) {
            console.error('CDN validation error:', error);
            return c.text('CDN validation failed', 502);
          }
        }
      }
      
      // Direct response (shouldn't normally happen with Easynews)
      const responseHeaders: Record<string, string> = {
        'Content-Type': streamResponse.headers.get('Content-Type') || 'video/x-matroska',
        'Accept-Ranges': 'bytes',
      };
      
      const contentLength = streamResponse.headers.get('Content-Length');
      if (contentLength) responseHeaders['Content-Length'] = contentLength;
      
      const contentRange = streamResponse.headers.get('Content-Range');
      if (contentRange) responseHeaders['Content-Range'] = contentRange;
      
      return new Response(streamResponse.body, {
        status: streamResponse.status,
        headers: responseHeaders,
      });
      
    } catch (error) {
      console.error('Proxy error:', error);
      return c.text('Proxy failed: ' + (error as Error).message, 500);
    }
  });
  
  honoRouter.all('*', async (c) => {
    const req = c.req.raw;
    const res = await router(req);
    if (res) {
      return res;
    }
  });

  return honoRouter;
}
