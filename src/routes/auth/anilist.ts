import { Hono } from "hono"
import { anilistAuth } from "../../controller/auth/anilist"
import { refresh } from "../../controller/auth/refresh"
import { logoutHandler } from "../../controller/auth/logout"
import { loginOauth } from "../../middleware/login"
import { oAuthCallback } from "../../middleware/oauth-callback"

const router = new Hono<{
  Variables: {
    anilistUser: any
  }
}>()

router.post("/refresh", refresh)
router.get("/logout", logoutHandler)
router.get("/anilist", anilistAuth)
router.get("/anilist/callback", oAuthCallback, loginOauth)

export { router as authRouter }
