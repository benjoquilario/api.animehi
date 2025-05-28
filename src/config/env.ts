import { config } from "dotenv"
import { cleanEnv, num, str, bool, url, port } from "envalid"

config()

export const env = cleanEnv(process.env, {
  PORT: port({
    default: 4000,
    desc: "Port number of the Aniwatch API.",
  }),

  WINDOW_MS: num({
    // 60 mins if dev, else 30 mins
    default: isDevEnv() ? 60 * 60 * 1000 : 30 * 60 * 1000,
    desc: "Duration to track requests for rate limiting (in milliseconds).",
    docs: "https://github.com/ghoshRitesh12/aniwatch-api/blob/main/.env.example#L9",
  }),

  MAX_REQS: num({
    default: isDevEnv() ? 600 : 6,
    desc: "Maximum number of requests in the `WINDOW_MS` time period.",
  }),

  CORS_ALLOWED_ORIGINS: str({
    default: undefined,
    example:
      "https://your-production-domain.com,https://another-trusted-domain.com",
    desc: "Allowed origins, separated by commas and no spaces in between (CSV).",
  }),

  VERCEL_DEPLOYMENT: bool({
    default: false,
    desc: "Required for distinguishing Vercel deployment from other ones; set it to true",
  }),

  HOSTNAME: str({
    default: undefined,
    example: "your-production-domain.com",
    desc: "Set this to your api instance's hostname to enable rate limiting, don't have this value if you don't wish to rate limit.",
    docs: "https://github.com/ghoshRitesh12/aniwatch-api/blob/main/.env.example#L18",
  }),

  REDIS_CONN_URL: url({
    default: undefined,
    example:
      "rediss://default:your-secure-password@your-redis-instance-name.provider.com:6379",
    desc: "This env is optional by default and can be set to utilize Redis caching functionality. It has to be a valid connection URL.",
  }),

  S_MAXAGE: num({
    default: 60,
    desc: "Specifies the maximum amount of time (in seconds) a resource is considered fresh when served by a CDN cache.",
  }),

  STALE_WHILE_REVALIDATE: num({
    default: 30,
    desc: "Specifies the amount of time (in seconds) a resource is served stale while a new one is fetched.",
  }),

  ANIMEKAI_URL: str({
    default: "https://animekai.to",
    desc: "The base URL for the AnimeKai API.",
  }),

  ZORO_URL: str({
    default: "https://hianimez.to",
    desc: "The base URL for the Zoro API.",
  }),

  // auth
  JWT_SECRET: str({
    default: "your_jwt_secret",
    desc: "Secret key for signing JWT tokens.",
  }),

  // anilist
  ANILIST_CLIENT_ID: str({
    default: "your_anilist_client_id",
    desc: "Client ID for Anilist API.",
  }),
  ANILIST_CLIENT_SECRET: str({
    default: "your_anilist_client_secret",
    desc: "Client Secret for Anilist API.",
  }),

  REDIRECT_URL: str({
    default: "http://your-api-url/api/auth/anilist/callback",
    desc: "Redirect URL for Anilist OAuth.",
  }),

  FRONTEND_URL: str({
    default: "http://your-frontend-url",
    desc: "Frontend URL for redirecting after login.",
  }),

  NODE_ENV: str({
    default: "development",
    choices: ["development", "production", "test", "staging"],
    desc: "The environment in which the application is running.",
    docs: "https://nodejs.org/en/learn/getting-started/nodejs-the-difference-between-development-and-production",
  }),
})

function isDevEnv(): boolean {
  return (
    !process.env.NODE_ENV ||
    process.env.NODE_ENV === "development" ||
    process.env.NODE_ENV === "test"
  )
}

export function isEnvUndefined(envVar?: string): boolean {
  return typeof envVar === "undefined" || envVar === "undefined"
}
