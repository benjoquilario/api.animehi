import type { Context } from "hono"
import { env } from "../../config/env"
import db from "../../config/database"

export const anilistAuth = async (c: Context) => {
  // This is where we'll send the user to authorize our app
  const authEndpoint = new URL("https://anilist.co/api/v2/oauth/authorize")

  // Build the URL parameters
  const params: Record<string, string> = {
    scope: "",
    client_id: env.ANILIST_CLIENT_ID!,
    redirect_uri: env.REDIRECT_URL!,
    response_type: "code",
  }
  for (const key in params) authEndpoint.searchParams.set(key, params[key])

  return c.redirect(authEndpoint.toString())
}

export const anilistAccessToken = async (c: Context) => {
  const userId = c.req.param("userId")

  if (!userId) {
    return c.json({ message: "userId is request" }, 401)
  }

  const accessToken = await db.account.findFirst({
    where: {
      userId,
    },
  })

  if (!accessToken) {
    return c.json({ message: "Can't find access TOken" })
  }

  return c.json(
    {
      data: accessToken.access_token,
    },
    200
  )
}
