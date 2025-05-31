import { rateLimiter } from "hono-rate-limiter"
import { getConnInfo } from "@hono/node-server/conninfo"
import { env } from "./env"
import { type Context } from "hono"

const generateKey = (c: Context, prefix: string = "global") => {
  const userId = c.get("userId") as string | undefined
  const { remote } = getConnInfo(c)
  if (userId) {
    return `${prefix}:user:${userId}`
  }

  const userAgent = c.req.header("user-agent") || "unknown"
  const forwardedFor =
    c.req.header("x-forwarded-for") ||
    c.req.header("x-real-ip") ||
    String(remote.address)

  const fingerprint = Buffer.from(`${forwardedFor}:${userAgent}`).toString(
    "base64"
  )

  return `${prefix}:ip:${fingerprint}`
}

interface Options {
  windowMs: number
  limit: number
  prefix: string
  message?: string
}

const createRateLimiter = (options: Options) => {
  return rateLimiter({
    windowMs: options.windowMs,
    limit: options.limit,
    standardHeaders: "draft-7",
    keyGenerator: (c) => generateKey(c, options.prefix),
    handler: (c) => {
      const retryAfter = Math.ceil(options.windowMs / 1000)

      return c.json(
        {
          status: 429,
          message: options.message || "Too Many Requests 😵",
          retryAfter,
          timestamp: new Date().toISOString(),
        },
        { status: 429 }
      )
    },
  })
}

export const authRatelimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 5,
  prefix: "auth",
  message: "Authentication rate limit exceeded. Please try again later.",
})

export const commentRateLimiter = createRateLimiter({
  windowMs: 5 * 60 * 1000, // 5 minutes
  limit: 10,
  prefix: "comment",
  message: "Comment rate limit exceeded. Please try again later.",
})

export const likeRateLimiter = createRateLimiter({
  windowMs: 2 * 60 * 1000, // 2 minutes
  limit: 10,
  prefix: "like",
  message: "Like rate limit exceeded. Please try again later.",
})

export const repliesRateLimiter = createRateLimiter({
  windowMs: 5 * 60 * 1000, // 5 minutes
  limit: 10,
  prefix: "replies",
  message: "Replies rate limit exceeded. Please try again later.",
})

export const generalRateLimiter = createRateLimiter({
  windowMs: Number(env.WINDOW_MS) || 30 * 60 * 1000, // Default to 30 minutes
  limit: Number(env.MAX_REQS) || 100, // Default to 100 requests per minute
  prefix: "global",
  message: "Global rate limit exceeded. Please try again later.",
})
