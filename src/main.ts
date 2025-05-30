import https from "https"
import type { APIVariables } from "./config/variables"
import { Hono } from "hono"
import corsConfig from "./config/cors"
import { serve } from "@hono/node-server"
import { cacheControlMiddleware, validateApiKey } from "./middleware/cache"
import { generalRateLimiter } from "./config/ratelimit"
import { cacheConfigSetter } from "./middleware/cache"
import anilistRouter from "./routes/meta/anilist"
import animekaiRouter from "./routes/anime/animekai"
import zoroRouter from "./routes/anime/zoro"
import { logging } from "./middleware/logger"
import { log } from "./config/logger"
import { env } from "./config/env"
import { authRouter } from "./routes/auth/anilist"
import { commentRouter } from "./routes/comment"

const BASE_PATH = "/api" as const
const PORT: number = env.PORT
const HOSTNAME = env.HOSTNAME
const VERCEL_DEPLOYMENT = env.VERCEL_DEPLOYMENT

const app = new Hono<{ Variables: APIVariables }>()

app.use(logging)
app.use(corsConfig)
app.use(cacheControlMiddleware)

const ISNT_PERSONAL_DEPLOYMENT = Boolean(HOSTNAME)
if (ISNT_PERSONAL_DEPLOYMENT) {
  app.use(generalRateLimiter)
}

app.get("/", async (c) => c.text("Running"))

app.use(cacheConfigSetter(BASE_PATH.length))

// meta routes
app.basePath(BASE_PATH).route("/meta/anilist", anilistRouter)

// anime routes
app.basePath(BASE_PATH).route("/anime/zoro", zoroRouter)
app.basePath(BASE_PATH).route("/anime/animekai", animekaiRouter)

// auth routes
app.basePath(BASE_PATH).route("/auth", authRouter)

// comment routes
app.basePath(BASE_PATH).route("/comment", commentRouter)

const server = function () {
  if (!Boolean(VERCEL_DEPLOYMENT)) {
    serve({
      port: PORT,
      fetch: app.fetch,
    }).addListener("listening", () => {
      log.info(`api.animehi RUNNING at http://localhost:${PORT}`)
    })

    // NOTE: remove the `if` block below for personal deployments
    if (ISNT_PERSONAL_DEPLOYMENT) {
      const interval = 9 * 60 * 1000 // 9mins

      // don't sleep
      setInterval(() => {
        log.info("api.animehi HEALTH_CHECK at", new Date().toISOString())
        https.get(`https://${HOSTNAME}/health`).on("error", (err) => {
          log.error(err.message.trim())
        })
      }, interval)
    }
  }
}

server()

export default app
