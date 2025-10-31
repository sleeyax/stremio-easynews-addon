import { Hono } from 'hono';
import { addonInterface, landingHTML } from '@easynews/addon';
import { getRouter } from './router.js';

const addonRouter = getRouter(addonInterface, { landingHTML });

const app = new Hono();

app.route('/', addonRouter);

export default app;
