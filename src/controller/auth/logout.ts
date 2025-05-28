import type { Context } from "hono"
import { getCookie, deleteCookie } from "hono/cookie"

export const logoutHandler = async (c: Context) => {
  const token = getCookie(c, "refreshToken")

  if (!token) {
    return c.json({ message: "No token found" }, { status: 400 })
  }

  deleteCookie(c, "refreshToken", {
    secure: true,
  })
  return c.json({ message: "Logged out successfully" }, { status: 200 })
}
