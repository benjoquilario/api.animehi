import { config } from "dotenv"
import type { MiddlewareHandler } from "hono"

config()

import { APICache } from "../config/cache"

// Define middleware to add Cache-Control header
export const cacheControlMiddleware: MiddlewareHandler = async (c, next) => {
  const sMaxAge = process.env.S_MAXAGE || "60"
  const staleWhileRevalidate = process.env.STALE_WHILE_REVALIDATE || "30"

  c.header(
    "Cache-Control",
    `s-maxage=${sMaxAge}, stale-while-revalidate=${staleWhileRevalidate}`
  )

  await next()
}

// validateApikeyInDatabase

export const validateApiKey: MiddlewareHandler = async (c, next) => {
  const apiKey = c.req.header("x-api-key")

  if (!apiKey) {
    return c.json({ error: "API key is required" }, 401)
  }

  await next()
}

export function cacheConfigSetter(keySliceIndex: number): MiddlewareHandler {
  return async (c, next) => {
    const { pathname, search } = new URL(c.req.url)

    c.set("CACHE_CONFIG", {
      key: `${pathname.slice(keySliceIndex) + search}`,
      duration: Number(
        c.req.header(APICache.CACHE_EXPIRY_HEADER_NAME) ||
          APICache.DEFAULT_CACHE_EXPIRY_SECONDS
      ),
    })

    await next()
  }
}
