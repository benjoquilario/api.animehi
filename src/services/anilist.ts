import { env } from "../config/env"

export interface AnilistAuth {
  token_type: string
  expires_in: number
  access_token: string
  refresh_token: string
}

export interface AnilistUser {
  id: string
  username: string
  image_url: string
  email: string
}

export const getAnilistAuth = async (code: string) => {
  const res = await fetch("https://anilist.co/api/v2/oauth/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      grant_type: "authorization_code",
      client_id: env.ANILIST_CLIENT_ID,
      client_secret: env.ANILIST_CLIENT_SECRET,
      redirect_uri: env.REDIRECT_URL, // http://your-api-url/api/auth/anilist/callback
      code: code, // The Authorization Code received previously
    }),
  })

  const { access_token, refresh_token, token_type } =
    (await res.json()) as AnilistAuth

  return { access_token, refresh_token, token_type }
}

export const getAnilistUser = async (accessToken: string) => {
  const response = await fetch("https://graphql.anilist.co", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      query: `query {
                Viewer {
                  id
                  name
                  avatar {
                    large
                    medium
                  }
                }
              }
            `,
    }),
  })
  const data = (await response.json()) as any

  const { id, name, avatar } = data.data.Viewer

  return {
    id: String(id),
    username: name,
    image_url: avatar.large,
    email: `${name}@gmail.com`,
  }
}
