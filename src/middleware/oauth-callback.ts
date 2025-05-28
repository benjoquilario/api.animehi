import type { Context, Next } from "hono"
import { getAnilistAuth, getAnilistUser } from "../services/anilist"

export const oAuthCallback = async (c: Context, next: Next) => {
  try {
    // get the code from the query parameters "code" the ones that anilist sends back
    const { access_token, refresh_token, token_type } = await getAnilistAuth(
      c.req.query("code")!
    )

    // we need the access token from getAnilist to get the anilist user data
    const userData = await getAnilistUser(access_token)

    // set the user data in the context for later use including the access token
    // and refresh token
    c.set("anilistUser", {
      ...userData,
      access_token,
      refresh_token,
      token_type,
    })

    await next()
  } catch (error) {
    return c.json({ error: "Access token is not valid" }, { status: 401 })
  }
}
