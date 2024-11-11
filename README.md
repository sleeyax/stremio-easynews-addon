# stremio-easynews-addon (Easynews+)

> [!NOTE]  
> I am not affiliated with Easynews in any way. This project is a fan-made addon for Stremio that provides access to Easynews content. You need an active Easynews subscription to use this addon.

Provides content from Easynews & includes a search catalog. This addon can also be [self-hosted](#self-hosting).

Public instance: [b89262c192b0-stremio-easynews-addon.baby-beamup.club](https://b89262c192b0-stremio-easynews-addon.baby-beamup.club/).

## FAQ

### What is Easynews?

Easynews is a premium Usenet provider that offers a web-based Usenet browser. It allows you to search, preview, and download files from Usenet newsgroups without the need for a newsreader. Easynews is known for its user-friendly interface and fast download speeds. The Easynews addon for Stremio provides access to Easynews content directly within the Stremio app. You can search for and stream movies, TV shows, and other media files from Easynews using the addon. In a way it can serve as an alternative to debrid services (Real-Debrid, Premiumize, AllDebrid etc.). An Easynews account with an active subscription is required to use the addon.

### Why not extend the existing Easynews addon?

The original Easynews addon for Stremio is lacking features, contains bug and its developer is inactive to say the least (I did everything in my power to reach out to them, but they haven't responded since July 8 2024). It doesn't help that the original addon is closed-source too, which makes it difficult to contribute to the project. This addon aims to provide a better alternative by offering more features, better performance, and an open-source codebase that anyone can contribute to.

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

To release a new version of the addon:

```bash
$ npm version <major|minor|patch>
$ git push --follow-tags
```

Finally, create a new release targeting the tag you just pushed on GitHub and include some release notes.

## License

[MIT](./LICENSE)
