import app from "../src/main"
import { handle } from "hono/vercel"

const handler = handle(app)

export const GET = handler
export const POST = handler
export const PATCH = handler
export const PUT = handler
export const OPTIONS = handler
