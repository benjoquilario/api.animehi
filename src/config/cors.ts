import { cors } from "hono/cors"
import { env } from "./env"

const allowedOrigins = env.CORS_ALLOWED_ORIGINS
  ? env.CORS_ALLOWED_ORIGINS.split(",")
  : ["http://localhost:5173", "*"]

const corsConfig = cors({
  allowMethods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
  maxAge: 600,
  credentials: true,
  origin: allowedOrigins,
})

export default corsConfig
