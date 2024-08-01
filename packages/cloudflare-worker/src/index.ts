import { Hono } from 'hono';
import { getRouter } from 'hono-stremio';
import addonInterface from '@easynews/addon';

const addonRouter = getRouter(addonInterface);

const app = new Hono();

app.route('/', addonRouter);

export default app;
