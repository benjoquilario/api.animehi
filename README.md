# <p align="center">AnimeHi API</p>

<div align="center">
  A free and open source RESTful API which is based off consumet api and ghoshRitesh12/aniwatch-api. This fork is meant to provide new & useful features while regularly take updates from consumet and ghoshRitesh12/aniwatch-api.
  <br/>

  <div>
    <a
      href="https://github.com/benjoquilario/api.animehi/issues/new?assignees=benjoquilario&labels=bug&template=bug-report.yml"
    >
      Bug report
    </a>
    ·
    <a
      href="https://github.com/benjoquilario/api.animehi/issues/new?assignees=benjoquilario&labels=enhancement&template=feature-request.md"
    >
      Feature request
    </a>
  </div>
</div>

<br/>

<div align="center">

[![codeql](https://github.com/benjoquilario/api.animehi/actions/workflows/codeql-analysis.yml/badge.svg)](https://github.com/benjoquilario/api.animehi/actions/workflows/codeql-analysis.yml)
[![docker-build](https://github.com/benjoquilario/api.animehi/actions/workflows/docker-build.yml/badge.svg)](https://github.com/benjoquilario/api.animehi/actions/workflows/docker-build.yml)
[![nodejs-ci](https://github.com/benjoquilario/api.animehi/actions/workflows/nodejs-ci.yml/badge.svg)](https://github.com/benjoquilario/api.animehi/actions/workflows/test.yml)
[![GitHub License](https://img.shields.io/github/license/benjoquilario/api.animehi?logo=github&logoColor=%23959da5&labelColor=%23292e34&color=%2331c754)](https://github.com/benjoquilario/api.animehi/blob/main/LICENSE)

</div>

<div align="center">

[![stars](https://img.shields.io/github/stars/benjoquilario/api.animehi?style=social)](https://github.com/benjoquilario/api.animehi/stargazers)
[![forks](https://img.shields.io/github/forks/benjoquilario/api.animehi?style=social)](https://github.com/benjoquilario/api.animehi/network/members)
[![issues](https://img.shields.io/github/issues/benjoquilario/api.animehi?style=social&logo=github)](https://github.com/benjoquilario/api.animehi/issues?q=is%3Aissue+is%3Aopen+)
[![version](https://img.shields.io/github/v/release/benjoquilario/api.animehi?display_name=release&style=social&logo=github)](https://github.com/benjoquilario/api.animehi/releases/latest)

</div>

## Features

All you gotta do is provide a client side the api will do the backend for your need

- anilist authentication
- Comment episode section api
- Reply comment section api
- like/unlike comment
- like reply

`Comming Soon`

- Watch together

### Acknowledgement

<a href="https://github.com/ghoshRitesh12/aniwatch-api">
Aniwatch-api
</a>: as a based code for this application

<a href="https://github.com/consumet/consumet.ts">
Consumet
</a>: for anime scraper provider

## <span id="installation">💻 Installation</span>

### Local

1. Clone the repository and move into the directory.

   ```bash
   git clone https://github.com/benjoquilario/api.animehi.git
   cd api.animehi
   ```

2. Install all the dependencies.

   ```bash
   npm i #or yarn install or pnpm i
   ```

3. Start the server!

   ```bash
   npm start #or yarn start or pnpm start
   ```

   Now the server should be running on [http://localhost:4000](http://localhost:4000)

### Docker

The Docker image is available at [The GitHub Container Registry](https://github.com/benjoquilario/api.animehi/pkgs/container/api.animehi).

Run the following commands to pull and run the docker image.

```bash
docker run -d --name api.animehi -p 4000:4000 ghcr.io/benjoquilario/api.animehi
```

The above command will start the server on port 4000. You can access the server at [http://localhost:4000](http://localhost:4000), and you can also change the port by changing the `-p` option to `-p <port>:4000`.

The `-d` flag runs the container in detached mode, and the `--name` flag is used to name the container that's about to run.

## <span id="configuration">⚙️ Configuration</span>

### Custom HTTP Headers

Currently this API supports parsing of only one custom header, and more may be implemented in the future to accommodate varying needs.

- `X-ANI-CACHE-EXPIRY`: this custom header is used to specify the cache expiration duration in **seconds** (defaults to 60 if the header is missing). The `REDIS_CONN_URL` env is required for this custom header to function as intended; otherwise, there's no point in setting this custom header.

### Environment Variables

More info can be found in the [`.env.example`](https://github.com//api.animehi/blob/benjoquilario/main/.env.example) file, where envs' having a value that is contained within `<` `>` angled brackets, commented out or not, are just examples and should be replaced with relevant ones.

- `PORT`: port number of the animehi API.
- `WINDOW_MS`: duration to track requests for rate limiting (in milliseconds).
- `MAX_REQS`: maximum number of requests in the `WINDOW_MS` time period.
- `CORS_ALLOWED_ORIGINS`: allowed origins, separated by commas and no spaces in between.
- `VERCEL_DEPLOYMENT`: required for distinguishing Vercel deployment from other ones; set it to true or any other non-zero value.
- `HOSTNAME`: set this to your api instance's hostname to enable rate limiting, don't have this value if you don't wish to rate limit.
- `UPSTASH_REDIS_URL`: this env is optional by default and can be set to utilize Redis caching functionality. It has to be a valid connection URL; otherwise, the Redis client can throw unexpected errors.
- `UPSTASH_REDIS_TOKEN`: optional
- `S_MAXAGE`: specifies the maximum amount of time (in seconds) a resource is considered fresh when served by a CDN cache.
- `STALE_WHILE_REVALIDATE`: specifies the amount of time (in seconds) a resource is served stale while a new one is fetched.

For anilist authentication environment variables please provide the following

- `JWT_SECRET`=your_jwt_secret

- `ANILIST_CLIENT_ID`=your_anilist_client_id
- `ANILIST_CLIENT_SECRET`=your_anilist_client_secret

- `REDIRECT_URL`=http://your-api-url/api/auth/anilist/callback
- `FRONTEND_URL`=http://your-frontend-url

- `ANIMEKAI_URL`=https://animekai.to # optional if you want to use AnimeKai as a source
- `ZORO_URL`=https://hianimez.to # optional if you want to use Zoro as a source

## <span id="host-your-instance">⛅ Host your instance</span>

> [!CAUTION]
>
> For personal deployments:
>
> - If you want to have rate limiting in your application, then set the `HOSTNAME` env to your deployed instance's hostname; otherwise, don't set or have this env at all. If you set this env to an incorrect value, you may face other issues.
> - It's optional by default, but if you want to have endpoint response caching functionality, then set the `REDIS_CONN_URL` env to a valid Redis connection URL. If the connection URL is invalid, the Redis client can throw unexpected errors.

### Vercel

Deploy your own instance of AnimeHi API on Vercel.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/benjoquilario/api.animehi)

> [!NOTE]
>
> When deploying to vercel, set an env named `VERCEL_DEPLOYMENT` to `true` or any non-zero value, but this env must be present.

### Render

Deploy your own instance of AnimeHi API on Render.

[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy?repo=https://github.com/benjoquilario/api.animehi)

## <span id="documentation">📚 Documentation</span>

The endpoints exposed by the api are listed below with examples that uses the [Fetch API](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API), but you can use any http library.
