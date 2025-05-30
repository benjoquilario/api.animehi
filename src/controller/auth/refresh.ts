import type { Context } from "hono"
import { getCookie } from "hono/cookie"
import { verifyJwt } from "../../utils/session"
import db from "../../config/database"
import jwt from "jsonwebtoken"
import { env } from "../../config/env"

export const refresh = async (c: Context) => {
  // check if the refresh token is valid
  const token = getCookie(c, "refreshToken") as string

  try {
    const decoded = verifyJwt(token)

    const user = await db.user.findUnique({
      where: {
        id: `${decoded.sub}`,
      },
    })

    if (!user) {
      return c.json({ error: "User not found" }, 400)
    }

    const account = await db.account.findFirst({
      where: {
        userId: user.id,
      },
    })

    if (!account) {
      return c.json({ error: "Account not found" }, 400)
    }

    const accessToken = jwt.sign(
      { sub: user.id, name: user.name },
      env.JWT_SECRET,
      { expiresIn: "2h" }
    )

    // res.send({ accessToken, user });
    return c.json(
      {
        message: "Token refreshed",
        user: {
          token: account.access_token,
          accessToken,
          user,
        },
      },
      { status: 200 }
    )
  } catch (error) {
    return c.json({ error: "Invalid token" }, { status: 400 })
  }
}
