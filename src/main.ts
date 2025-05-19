import https from "https"
import { config } from "dotenv"
import type { APIVariables } from "./config/variables"
import { Hono } from "hono"
import { logger } from "hono/logger"
import corsConfig from "./config/cors"
import { serve } from "@hono/node-server"
import { cacheControlMiddleware } from "./middleware/cache"
import { ratelimit } from "./config/ratelimit"

const BASE_PATH = "/api" as const
const PORT: number = Number(process.env.PORT) || 4000
const HOSTNAME = process.env.HOSTNAME

const app = new Hono<{ Variables: APIVariables }>()

app.use(logger())
app.use(corsConfig)
app.use(cacheControlMiddleware)

const ISNT_PERSONAL_DEPLOYMENT = Boolean(HOSTNAME)
if (ISNT_PERSONAL_DEPLOYMENT) {
  app.use(ratelimit)
}

app.get("/", async (c) => c.text("Running"))

if (!Boolean(process.env?.VERCEL_DEPLOYMENT)) {
  serve({
    port: PORT,
    fetch: app.fetch,
  }).addListener("listening", () =>
    console.info(
      "\x1b[1;36m" + `aniwatch-api at http://localhost:${PORT}` + "\x1b[0m"
    )
  )

  // NOTE: remove the `if` block below for personal deployments
  if (ISNT_PERSONAL_DEPLOYMENT) {
    const interval = 9 * 60 * 1000 // 9mins

    // don't sleep
    setInterval(() => {
      console.log("aniwatch-api HEALTH_CHECK at", new Date().toISOString())
      https.get(`https://${HOSTNAME}/health`).on("error", (err) => {
        console.error(err.message)
      })
    }, interval)
  }
}
