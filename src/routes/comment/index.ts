import { Hono } from "hono"
import { createComment } from "../../controller/comment/create-comment"
import { updateComment } from "../../controller/comment/update-comment"
import { deleteComment } from "../../controller/comment/delete-comment"
import { commentRateLimiter } from "../../config/ratelimit"
import { verifyLogin } from "../../middleware/verify-login"
import { getComments } from "../../controller/comment/get-all-comment"

const router = new Hono()

router.get("/get-comments/:episodeId", getComments)

router.post("/create-comment", verifyLogin, commentRateLimiter, createComment)
router.patch(
  "/update-comment/:id",
  verifyLogin,
  commentRateLimiter,
  updateComment
)
router.delete(
  "/delete-comment/:id",
  verifyLogin,
  commentRateLimiter,
  deleteComment
)

export { router as commentRouter }
