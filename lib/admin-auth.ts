import { createHmac, timingSafeEqual } from "crypto"
import { NextRequest } from "next/server"

const SECRET = process.env.ADMIN_SECRET || "admin-secret-change-in-production"
const COOKIE_NAME = "admin_session"
const MAX_AGE = 7 * 24 * 60 * 60 // 7 days in seconds
export const ADMIN_EMAIL = "admin@carprice.com"

export { COOKIE_NAME, MAX_AGE }

export function createAdminToken(payload: { email: string }): string {
  const exp = Math.floor(Date.now() / 1000) + MAX_AGE
  const data = Buffer.from(JSON.stringify({ ...payload, exp })).toString("base64url")
  const sig = createHmac("sha256", SECRET).update(data).digest("base64url")
  return `${data}.${sig}`
}

export function verifyAdminToken(token: string): { email: string } | null {
  try {
    const [data, sig] = token.split(".")
    if (!data || !sig) return null
    const expected = createHmac("sha256", SECRET).update(data).digest("base64url")
    if (sig.length !== expected.length || !timingSafeEqual(Buffer.from(sig, "base64url"), Buffer.from(expected, "base64url"))) return null
    const raw = JSON.parse(Buffer.from(data, "base64url").toString())
    if (typeof raw.exp !== "number" || raw.exp < Math.floor(Date.now() / 1000)) return null
    if (typeof raw.email !== "string") return null
    return { email: raw.email }
  } catch {
    return null
  }
}

/**
 * Verifies admin auth from admin_session cookie, admin_token cookie, or Authorization: Bearer.
 */
export function getAdminSession(request: NextRequest): { email: string } | null {
  const adminSession = request.cookies.get(COOKIE_NAME)?.value
  const adminTokenCookie = request.cookies.get("admin_token")?.value
  const authHeader = request.headers.get("authorization")
  const bearerToken = authHeader?.match(/^Bearer\s+(.+)$/i)?.[1]?.trim()
  const token = adminSession || adminTokenCookie || bearerToken
  if (!token) return null
  const payload = verifyAdminToken(token)
  if (!payload || payload.email !== ADMIN_EMAIL) return null
  return payload
}
