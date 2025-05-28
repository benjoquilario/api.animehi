import type { MiddlewareHandler } from "hono"
import { logger as honoLogger } from "hono/logger"
import { log } from "../config/logger"

export const logging: MiddlewareHandler = honoLogger(
  (msg: string, ...rest: string[]) => {
    log.info(msg, ...rest)
  }
)
