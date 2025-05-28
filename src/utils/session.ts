import jwt from "jsonwebtoken"
import { env } from "../config/env"

export const verifyJwt = (token: string) => {
  return jwt.verify(token, env.JWT_SECRET)
}

export function parseJwtPayload(token: string) {
  return JSON.parse(Buffer.from(token.split(".")[1], "base64").toString())
}
