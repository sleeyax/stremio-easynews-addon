import { Hono } from 'hono';
import { createRouter, type AddonInterface } from '@stremio-addon/sdk';
import { cors } from 'hono/cors';

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
  honoRouter.use('*', cors());
  honoRouter.get('/', ({ html }) => html(landingHTML));
  honoRouter.get('/config', ({ html }) => html(landingHTML)); // for reverse compatibility with the old 'hono-stremio' package
  honoRouter.use(async (c, next) => {
    const req = c.req.raw;
    const res = await router(req);
    if (res) {
      c.res = res;
    }
    next();
  });

  return honoRouter;
}
