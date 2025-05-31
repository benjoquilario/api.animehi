import type { Context } from "hono"
import { z } from "zod"
import { log } from "../../config/logger"
import db from "../../config/database"

// Input validation schema for comment ID
const deleteCommentSchema = z.object({
  id: z.string().cuid("Comment ID must be a valid CUID"),
})

export const deleteComment = async (c: Context) => {
  try {
    // Get and validate user ID from context
    const userId = c.get("userId")
    if (!userId) {
      return c.json(
        {
          error: "Unauthorized",
          message: "User authentication required",
        },
        401
      )
    }

    // Get and validate comment ID from params
    const commentId = c.req.param("id")
    const validationResult = deleteCommentSchema.safeParse({ id: commentId })

    if (!validationResult.success) {
      return c.json(
        {
          error: "Validation Error",
          message: "Invalid comment ID format",
          details: validationResult.error.errors.map((err) => ({
            field: err.path.join("."),
            message: err.message,
          })),
        },
        400
      )
    }

    const { id } = validationResult.data

    // Check if comment exists and user has permission to delete it
    const existingComment = await db.comment.findUnique({
      where: { id },
      select: {
        id: true,
        userId: true,
        content: true,
        createdAt: true,
      },
    })

    if (!existingComment) {
      return c.json(
        {
          error: "Not Found",
          message: "Comment not found",
        },
        404
      )
    }

    if (existingComment.userId !== userId) {
      return c.json(
        {
          error: "Forbidden",
          message: "You can only delete your own comments",
        },
        403
      )
    }

    await db.$transaction(async (tx) => {
      await tx.commentLike.deleteMany({
        where: { commentId: id },
      })

      await tx.commentDislike.deleteMany({
        where: { commentId: id },
      })

      // Delete the comment
      await tx.comment.delete({
        where: { id },
      })
    })

    // Log the deletion for audit purposes
    log.info(`Comment deleted`, {
      commentId: id,
      userId,
      timestamp: new Date().toISOString(),
    })

    return c.json(
      {
        success: true,
        message: "Comment deleted successfully",
      },
      200
    )
  } catch (error) {
    log.error("Error deleting comment:", error)

    if (error instanceof Error) {
      if (error.message.includes("Record to delete does not exist")) {
        return c.json(
          {
            error: "Not Found",
            message: "Comment not found or already deleted",
          },
          404
        )
      }

      // Handle foreign key constraint violations
      if (error.message.includes("Foreign key constraint")) {
        return c.json(
          {
            error: "Conflict",
            message: "Cannot delete comment due to existing references",
          },
          409
        )
      }

      // Handle database connection errors
      if (
        error.message.includes("connect") ||
        error.message.includes("timeout")
      ) {
        return c.json(
          {
            error: "Service Unavailable",
            message: "Database connection error. Please try again later",
          },
          503
        )
      }
    }

    // Generic server error (don't expose internal details)
    return c.json(
      {
        error: "Internal Server Error",
        message: "An unexpected error occurred while deleting the comment",
      },
      500
    )
  }
}
