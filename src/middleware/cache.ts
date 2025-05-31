import type { MiddlewareHandler } from "hono"
import { createMiddleware } from "hono/factory"
import { env } from "../config/env"

import { APICache } from "../config/cache"

// Define middleware to add Cache-Control header
export const cacheControlMiddleware: MiddlewareHandler = createMiddleware(
  async (c, next) => {
    const sMaxAge = env.S_MAXAGE || "60"
    const staleWhileRevalidate = env.STALE_WHILE_REVALIDATE || "30"

    c.header(
      "Cache-Control",
      `s-maxage=${sMaxAge}, stale-while-revalidate=${staleWhileRevalidate}`
    )

    await next()
  }
)

// validateApikeyInDatabase

export const validateApiKey: MiddlewareHandler = async (c, next) => {
  const apiKey = c.req.header("x-api-key")

  if (!apiKey) {
    return c.json({ error: "API key is required" }, 401)
  }

  await next()
}

export const cacheConfigSetter = (keySliceIndex: number): MiddlewareHandler => {
  return createMiddleware(async (c, next) => {
    const { pathname, search } = new URL(c.req.url)

    c.set("CACHE_CONFIG", {
      key: `${pathname.slice(keySliceIndex) + search}`,
      duration: Number(
        c.req.header(APICache.CACHE_EXPIRY_HEADER_NAME) ||
          APICache.DEFAULT_CACHE_EXPIRY_SECONDS
      ),
    })

    await next()
  })
}
