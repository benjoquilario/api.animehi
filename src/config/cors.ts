import { config } from "dotenv"
import { cors } from "hono/cors"

config()

const allowedOrigins = process.env.CORS_ALLOWED_ORIGINS
  ? process.env.CORS_ALLOWED_ORIGINS.split(",")
  : ["http://localhost:4000", "*"]

const corsConfig = cors({
  allowMethods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
  maxAge: 600,
  credentials: true,
  origin: allowedOrigins,
})

export default corsConfig
