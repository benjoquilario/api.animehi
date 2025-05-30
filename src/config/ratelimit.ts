import { rateLimiter } from "hono-rate-limiter"
import { getConnInfo } from "@hono/node-server/conninfo"
import { env } from "./env"

export const ratelimit = rateLimiter({
  windowMs: Number(env.WINDOW_MS) || 30 * 60 * 1000,
  limit: Number(env.MAX_REQS) || 5,
  standardHeaders: "draft-7",
  keyGenerator(c) {
    const { remote } = getConnInfo(c)
    const key =
      `${String(remote.addressType)}_` +
      `${String(remote.address)}:${String(remote.port)}`

    return key
  },
  handler: (c) =>
    c.json({ status: 429, message: "Too Many Requests 😵" }, { status: 429 }),
})

export const strictRatelimit = rateLimiter({
  windowMs: Number(env.WINDOW_MS) || 30 * 60 * 1000,
  limit: Number(env.MAX_REQS) || 5,
  standardHeaders: "draft-7",
  keyGenerator(c) {
    const { remote } = getConnInfo(c)
    const key =
      `${String(remote.addressType)}_` +
      `${String(remote.address)}:${String(remote.port)}`

    return key
  },
  handler: (c) =>
    c.json({ status: 429, message: "Too Many Requests 😵" }, { status: 429 }),
})
