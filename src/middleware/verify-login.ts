import type { Context, Next } from "hono"
import { verifyJwt } from "../utils/session"
// import { getCookie, deleteCookie, setCookie } from "hono/cookie";
import { createMiddleware } from "hono/factory"

export const verifyLogin = createMiddleware(async (c: Context, next: Next) => {
  const authHeader = c.req.header("Authorization")

  if (authHeader) {
    if (authHeader.startsWith("Bearer ")) {
      const token = authHeader.slice(7)

      try {
        const payload = verifyJwt(token)

        console.log(payload)

        c.set("userId", payload.sub)

        await next()
      } catch (error) {
        return c.json({ error: "Access token is not valid" }, { status: 401 })
      }
    } else {
      return c.json({ error: "Invalid token format" }, { status: 401 })
    }
  } else {
    return c.json({ error: "Authorization header is missing" }, { status: 401 })
  }
})
