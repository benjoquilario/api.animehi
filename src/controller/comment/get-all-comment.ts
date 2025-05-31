import type { Context } from "hono"
import { z } from "zod"
import db from "../../config/database"
import { log } from "../../config/logger"

const getCommentsSchema = z.object({
  episodeId: z.string().min(1, "Episode ID is required"),
  limit: z.coerce.number().int().min(1).max(50).default(10),
  cursor: z.coerce.number().int().min(0).default(0),
})

const getLatestCommentsSchema = z.object({
  limit: z.coerce.number().int().min(1).max(20).default(10),
})

export const getComments = async (c: Context) => {
  try {
    const episodeId = c.req.param("episodeId")
    const limit = c.req.query("limit")
    const cursor = c.req.query("cursor")

    const validationResult = getCommentsSchema.safeParse({
      episodeId,
      limit,
      cursor,
    })

    if (!validationResult.success) {
      return c.json(
        {
          error: "Validation Error",
          message: "Invalid query parameters",
          details: validationResult.error.errors.map((err) => ({
            field: err.path.join("."),
            message: err.message,
          })),
        },
        400
      )
    }

    const {
      episodeId: validEpisodeId,
      limit: validLimit,
      cursor: validCursor,
    } = validationResult.data

    const comments = await db.comment.findMany({
      where: {
        episodeId: validEpisodeId,
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
            userId: true,
          },
        },
        commentDislike: {
          select: {
            id: true,
            userId: true,
          },
        },
        _count: {
          select: {
            commentLike: true,
            commentDislike: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: Number(validLimit) || 5,
      skip: Number(validCursor) || 0,
    })

    if (comments.length === 0) {
      return c.json(
        {
          comments: [],
          hasNextPage: false,
          nextCursor: null,
        },
        201
      )
    }

    const transformedComments = comments.map((comment) => {
      const { _count, commentLike, user, ...rest } = comment

      return {
        ...rest,
        user,
        _count,
        commentLike,
      }
    })

    const nextCursor =
      comments.length < (Number(validLimit) || 5)
        ? null
        : Number(validCursor) + (Number(validLimit) as number)

    return c.json(
      {
        comments: transformedComments,
        hasNextPage: comments.length < (Number(limit) || 5) ? false : true,
        nextCursor,
      },
      200
    )
  } catch (error) {
    log.error("Error fetching comments:", error)

    if (error instanceof Error) {
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

      // Handle Prisma query errors
      if (
        error.message.includes("Invalid") ||
        error.message.includes("constraint")
      ) {
        return c.json(
          {
            error: "Bad Request",
            message: "Invalid query parameters",
          },
          400
        )
      }
    }

    return c.json(
      {
        error: "Internal Server Error",
        message: "An unexpected error occurred while fetching comments",
      },
      500
    )
  }
}

export const getLatestComments = async (c: Context) => {
  try {
    // Validate query parameters
    const limit = c.req.query("limit")

    const validationResult = getLatestCommentsSchema.safeParse({ limit })

    if (!validationResult.success) {
      return c.json(
        {
          error: "Validation Error",
          message: "Invalid limit parameter",
          details: validationResult.error.errors.map((err) => ({
            field: err.path.join("."),
            message: err.message,
          })),
        },
        400
      )
    }

    const { limit: validLimit } = validationResult.data

    // Fetch latest comments
    const comments = await db.comment.findMany({
      orderBy: { createdAt: "desc" },
      take: validLimit,
      include: {
        user: {
          select: {
            id: true,
            image: true,
            name: true,
          },
        },
        _count: {
          select: {
            commentLike: true,
          },
        },
      },
    })

    return c.json(
      {
        success: true,
        data: comments,
      },
      200
    )
  } catch (error) {
    log.error("Error fetching latest comments:", error)

    if (error instanceof Error) {
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

    return c.json(
      {
        error: "Internal Server Error",
        message: "An unexpected error occurred while fetching latest comments",
      },
      500
    )
  }
}
