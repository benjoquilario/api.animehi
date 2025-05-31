import type { Context } from "hono"
import { z } from "zod"
import { log } from "../../config/logger"
import db from "../../config/database"

// Input validation schema
const createCommentSchema = z.object({
  animeId: z.string().min(1, "Anime ID is required"),
  episodeNumber: z
    .number()
    .int()
    .positive("Episode number must be a positive integer"),
  content: z
    .string()
    .min(1, "Content is required")
    .max(1000, "Content must be less than 1000 characters"),
  title: z.string().optional(),
  isSpoiler: z.boolean().default(false),
})

type CreateCommentInput = z.infer<typeof createCommentSchema>

export const createComment = async (c: Context) => {
  try {
    // Get and validate user ID
    const userId = c.get("userId")

    log.info("Creating comment for user:", userId)

    if (!userId) {
      return c.json(
        {
          error: "Unauthorized",
          message: "User ID not found in context",
        },
        401
      )
    }

    // Parse and validate request body
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

    // Validate input schema
    const validationResult = createCommentSchema.safeParse(body)
    if (!validationResult.success) {
      return c.json(
        {
          error: "Validation Error",
          message: "Invalid input data",
          details: validationResult.error.errors.map((err) => ({
            field: err.path.join("."),
            message: err.message,
          })),
        },
        400
      )
    }

    const { animeId, episodeNumber, content, title, isSpoiler } =
      validationResult.data

    // Sanitize content (basic XSS prevention)
    const sanitizedContent = content
      .trim()
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")

    // Generate episode ID consistently
    const episodeId = `${animeId}-episode-${episodeNumber}`

    // Check if user exists and is active
    const user = await db.user.findUnique({
      where: { id: userId },
      select: { id: true },
    })

    if (!user) {
      return c.json(
        {
          error: "Forbidden",
          message: "User not found or inactive",
        },
        403
      )
    }

    const createdComment = await db.$transaction(async (tx) => {
      return await tx.comment.create({
        data: {
          animeId,
          episodeId,
          content: sanitizedContent,
          episodeNumber: String(episodeNumber),
          userId,
          title: title?.trim() || null,
          isSpoiler,
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              image: true,
              email: true,
            },
          },
          commentLike: {
            select: {
              id: true,
            },
            where: {
              userId: userId,
            },
          },
          commentDislike: {
            select: {
              id: true,
            },
            where: {
              userId: userId,
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

    // Return success response
    return c.json(
      {
        success: true,
        data: createdComment,
        message: "Comment created successfully",
      },
      201
    )
  } catch (error) {
    log.error("Error creating comment:", error)

    // Handle specific database errors
    if (error instanceof Error) {
      if (error.message === "Anime not found") {
        return c.json(
          {
            error: "Not Found",
            message: "The specified anime does not exist",
          },
          404
        )
      }

      // Handle Prisma unique constraint violations
      if (error.message.includes("Unique constraint")) {
        return c.json(
          {
            error: "Conflict",
            message: "A comment with similar data already exists",
          },
          409
        )
      }

      // Handle Prisma foreign key constraint violations
      if (error.message.includes("Foreign key constraint")) {
        return c.json(
          {
            error: "Bad Request",
            message: "Invalid reference to related data",
          },
          400
        )
      }
    }

    // Generic server error
    return c.json(
      {
        error: "Internal Server Error",
        message: "An unexpected error occurred while creating the comment",
      },
      500
    )
  }
}
