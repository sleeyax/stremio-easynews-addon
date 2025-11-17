import { Hono } from 'hono';
import { addonInterface, landingHTML, setWorkerBaseUrl } from '@easynews/addon';
import { getRouter } from './router.js';

const app = new Hono();

// Middleware to set the base URL for proxy generation
app.use('*', async (c, next) => {
  const url = new URL(c.req.url);
  const baseUrl = `${url.protocol}//${url.host}`;
  setWorkerBaseUrl(baseUrl);
  await next();
});

const addonRouter = getRouter(addonInterface, { landingHTML });

app.route('/', addonRouter);

export default app;
