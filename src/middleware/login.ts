import type { Context } from "hono"
import db from "../config/database"
import { type AnilistAuth } from "../services/anilist"
import type { AnilistUser } from "../services/anilist"
import { env } from "../config/env"
import jwt from "jsonwebtoken"
import { setCookie } from "hono/cookie"

export const loginOauth = async (c: Context) => {
  // this is the data we get from the anilist callback
  // we need to save the user to our db and create a session for them
  const { id, username, email, image_url, refresh_token, access_token } = c.get(
    "anilistUser"
  ) as AnilistUser & AnilistAuth

  const providerAccountId = id.toString()

  // Check if the user is already registered in our app
  const account = await db.account.findUnique({
    where: {
      provider_providerAccountId: {
        provider: "anilist",
        providerAccountId,
      },
    },
  })

  let userId

  // Register the user to our app if they're not yet registered
  if (!account) {
    const createUser = await db.user.create({
      data: {
        name: username,
        email,
        image: image_url,
      },
    })

    if (createUser) {
      await db.account.create({
        data: {
          provider: "anilist",
          providerAccountId,
          userId: createUser.id,
          type: "oauth",
          refresh_token,
          access_token,
        },
      })
    }

    userId = createUser.id
  } else {
    userId = account.userId
  }

  // Create a cookie for the user
  const token = jwt.sign({ sub: userId, name: username }, env.JWT_SECRET, {
    expiresIn: "24h",
  })

  setCookie(c, "refreshToken", token, {
    secure: true,
    maxAge: 24 * 60 * 60, // 24 hours in seconds
    httpOnly: true,
    sameSite: "none",
  })

  // redirect the user to the frontend application after successful login
  return c.redirect(`${env.FRONTEND_URL}`)
}
