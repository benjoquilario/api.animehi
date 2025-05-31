import type { Context } from "hono"
import { z } from "zod"
import db from "../../config/database"
import { log } from "../../config/logger"

// Input validation schemas
const updateCommentParamsSchema = z.object({
  id: z.string().cuid("Comment ID must be a valid CUID"),
})

const updateCommentBodySchema = z.object({
  content: z
    .string()
    .min(1, "Content is required")
    .max(1000, "Content must be less than 1000 characters")
    .trim(),
  isSpoiler: z.boolean().optional(),
})

export const updateComment = async (c: Context) => {
  try {
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

    const commentId = c.req.param("id")
    const paramsValidation = updateCommentParamsSchema.safeParse({
      id: commentId,
    })

    if (!paramsValidation.success) {
      return c.json(
        {
          error: "Validation Error",
          message: "Invalid comment ID format",
          details: paramsValidation.error.errors.map((err) => ({
            field: err.path.join("."),
            message: err.message,
          })),
        },
        400
      )
    }

    let body: unknown
    try {
      body = await c.req.json()
    } catch {
      return c.json(
        {
          error: "Invalid JSON",
          message: "Request body must be valid JSON",
        },
        400
      )
    }

    const bodyValidation = updateCommentBodySchema.safeParse(body)
    if (!bodyValidation.success) {
      return c.json(
        {
          error: "Validation Error",
          message: "Invalid input data",
          details: bodyValidation.error.errors.map((err) => ({
            field: err.path.join("."),
            message: err.message,
          })),
        },
        400
      )
    }

    const { id } = paramsValidation.data
    const { content, isSpoiler } = bodyValidation.data

    const existingComment = await db.comment.findUnique({
      where: { id },
      select: {
        id: true,
        userId: true,
        content: true,
        createdAt: true,
        isEdited: true,
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
          message: "You can only edit your own comments",
        },
        403
      )
    }

    if (existingComment.content.trim() === content.trim()) {
      return c.json(
        {
          error: "Bad Request",
          message: "No changes detected in comment content",
        },
        400
      )
    }

    const sanitizedContent = content
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
      .replace(/<[^>]*>/g, "")
      .trim()

    const updatedComment = await db.$transaction(async (tx) => {
      return await tx.comment.update({
        where: { id },
        data: {
          content: sanitizedContent,
          isEdited: true,
          updatedAt: new Date(),
          ...(isSpoiler !== undefined && { isSpoiler }),
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              image: true,
            },
          },
          _count: {
            select: {
              commentLike: true,
              commentDislike: true,
            },
          },
        },
      })
    })

    // Log the edit for audit purposes
    log.info("Comment edited", {
      commentId: id,
      userId,
      previousContent: existingComment.content.substring(0, 50) + "...",
      newContent: sanitizedContent.substring(0, 50) + "...",
      timestamp: new Date().toISOString(),
    })

    return c.json(
      {
        success: true,
        data: updatedComment,
        message: "Comment updated successfully",
      },
      200
    )
  } catch (error) {
    log.error("Error updating comment:", error)

    if (error instanceof Error) {
      // Handle case where comment doesn't exist (race condition)
      if (error.message.includes("Record to update not found")) {
        return c.json(
          {
            error: "Not Found",
            message: "Comment not found or has been deleted",
          },
          404
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

      // Handle Prisma constraint violations
      if (error.message.includes("constraint")) {
        return c.json(
          {
            error: "Conflict",
            message: "Update operation violates database constraints",
          },
          409
        )
      }
    }

    // Generic server error
    return c.json(
      {
        error: "Internal Server Error",
        message: "An unexpected error occurred while updating the comment",
      },
      500
    )
  }
}
