# stremio-easynews-addon

Provides content from Easynews & includes a search catalog. This addon can also be [self-hosted](#self-hosting).

Public instance: [b89262c192b0-stremio-easynews-addon.baby-beamup.club](https://b89262c192b0-stremio-easynews-addon.baby-beamup.club/).

## Self-hosting

To get results in a fast and private manner, you may wish to self-host the addon. This is easy to do, and only requires a few steps. We support multiple ways of self-hosting:

### Cloudflare workers

The addon can be deployed as a [Cloudflare worker](https://workers.cloudflare.com/), which is a serverless platform that runs your code in data centers around the world. It's incredibly fast and reliable, and you can deploy the addon for free.

Follow the [getting started guide](https://developers.cloudflare.com/workers/get-started/guide/) and then deploy the addon with the [wrangler CLI](https://developers.cloudflare.com/workers/wrangler/install-and-update/):

```bash
$ git clone https://github.com/sleeyax/stremio-easynews-addon.git && cd stremio-easynews-addon
$ npm i
$ npm run build
$ npm run deploy:cloudflare-worker
```

Navigate to the URL provided by Cloudflare to verify that the addon is running. It should look something like `https://stremio-easynews-addon.yourname.workers.dev/`.

### Docker

You can use the provided Dockerfile to build and run the addon in a container. To do this, you need to have [Docker](https://docs.docker.com/get-docker/) installed on your system.

```bash
$ docker run -p 8080:1337 ghcr.io/sleeyax/stremio-easynews-addon:latest
```

Alternatively, build the image yourself:

```bash
$ git clone https://github.com/sleeyax/stremio-easynews-addon.git && cd stremio-easynews-addon
$ docker build -t stremio-easynews-addon .
$ docker run -p 8080:1337 stremio-easynews-addon
```

Navigate to `http://localhost:8080/` in your browser to verify that the addon is running.

### Node.js

If you'd rather run directly from source, you can do so with [Node.js](https://nodejs.org/en/download/prebuilt-installer/current). Make sure you have NPM 7 or higher installed on your system. We also recommend Node 20 or higher, though older versions might still work.

```bash
# version should be >= 20
$ node -v
# version must be >= 7
$ npm -v
$ git clone https://github.com/sleeyax/stremio-easynews-addon.git && cd stremio-easynews-addon
$ npm i
$ npm run build
# starts the addon in production mode
$ npm run start:addon
```

Navigate to `http://localhost:1337/` in your browser to verify that the addon is running. You can set the `PORT` environment variable to change the listener port. For example, to run the addon on port `8080`:

```bash
$ PORT=8080 npm run start:addon
```

---

Looking for additional hosting options? Let us know which platform(s) you'd like to see supported by [creating an issue](https://github.com/sleeyax/stremio-easynews-addon/issues/new).

## Contribute

Notes for contributors.

### Development

Clone the repository and install the dependencies:

```bash
$ git clone https://github.com/sleeyax/stremio-easynews-addon.git
$ cd stremio-easynews-addon
$ npm i
```

Run the easynews addon in development mode:

```bash
# addon
$ npm run start:addon:dev
# cloudflare worker
$ npm run start:cloudflare-worker:dev
```

### Production

To deploy the addon to beamup, run:

```bash
$ npm run deploy:beamup
```

## License

[MIT](./LICENSE)
