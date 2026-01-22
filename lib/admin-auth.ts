import { NextRequest } from "next/server"

const SECRET = process.env.ADMIN_SECRET || "admin-secret-change-in-production"
const COOKIE_NAME = "admin_session"
const MAX_AGE = 7 * 24 * 60 * 60 // 7 days in seconds
export const ADMIN_EMAIL = "admin@carprice.com"

export { COOKIE_NAME, MAX_AGE }

// Base64URL encoding/decoding for Edge Runtime
function base64UrlEncode(bytes: Uint8Array): string {
  const base64 = btoa(String.fromCharCode(...bytes))
  return base64
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '')
}

function base64UrlDecode(str: string): Uint8Array {
  str = str.replace(/-/g, '+').replace(/_/g, '/')
  while (str.length % 4) {
    str += '='
  }
  const binary = atob(str)
  return new Uint8Array(binary.length).map((_, i) => binary.charCodeAt(i))
}

// Constant-time comparison for Edge Runtime
function timingSafeEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false
  let result = 0
  for (let i = 0; i < a.length; i++) {
    result |= a[i] ^ b[i]
  }
  return result === 0
}

// HMAC using Web Crypto API (Edge Runtime compatible)
async function hmacSha256(message: string, secret: string): Promise<string> {
  const encoder = new TextEncoder()
  const keyData = encoder.encode(secret)
  const messageData = encoder.encode(message)
  
  const key = await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  )
  
  const signature = await crypto.subtle.sign('HMAC', key, messageData)
  return base64UrlEncode(new Uint8Array(signature))
}

export async function createAdminToken(payload: { email: string }): Promise<string> {
  const exp = Math.floor(Date.now() / 1000) + MAX_AGE
  const jsonStr = JSON.stringify({ ...payload, exp })
  const encoder = new TextEncoder()
  const data = base64UrlEncode(encoder.encode(jsonStr))
  const sig = await hmacSha256(data, SECRET)
  return `${data}.${sig}`
}

export async function verifyAdminToken(token: string): Promise<{ email: string } | null> {
  try {
    const [data, sig] = token.split(".")
    if (!data || !sig) return null
    const expected = await hmacSha256(data, SECRET)
    
    // Convert signatures to Uint8Array for constant-time comparison
    const sigBytes = base64UrlDecode(sig)
    const expectedBytes = base64UrlDecode(expected)
    
    if (sig.length !== expected.length || !timingSafeEqual(sigBytes, expectedBytes)) return null
    
    const decoder = new TextDecoder()
    const dataBytes = base64UrlDecode(data)
    const raw = JSON.parse(decoder.decode(dataBytes))
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
export async function getAdminSession(request: NextRequest): Promise<{ email: string } | null> {
  const adminSession = request.cookies.get(COOKIE_NAME)?.value
  const adminTokenCookie = request.cookies.get("admin_token")?.value
  const authHeader = request.headers.get("authorization")
  const bearerToken = authHeader?.match(/^Bearer\s+(.+)$/i)?.[1]?.trim()
  const token = adminSession || adminTokenCookie || bearerToken
  if (!token) return null
  const payload = await verifyAdminToken(token)
  if (!payload || payload.email !== ADMIN_EMAIL) return null
  return payload
}
