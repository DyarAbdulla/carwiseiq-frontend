import { NextRequest, NextResponse } from "next/server"
import { createAdminToken, COOKIE_NAME, MAX_AGE } from "@/lib/admin-auth"

export const runtime = 'edge';

// Change password: update ADMIN_PASSWORD below (and optionally ADMIN_EMAIL).
const ADMIN_EMAIL = "admin@carprice.com"
const ADMIN_PASSWORD = "admin123"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const email = typeof body.email === "string" ? body.email.trim() : ""
    const password = typeof body.password === "string" ? body.password : ""

    if (!email || !password) {
      return NextResponse.json(
        { detail: "Email and password are required" },
        { status: 400 }
      )
    }

    if (password.length < 6) {
      return NextResponse.json(
        { detail: "Password must be at least 6 characters" },
        { status: 400 }
      )
    }

    if (email !== ADMIN_EMAIL || password !== ADMIN_PASSWORD) {
      return NextResponse.json(
        { detail: "Invalid email or password" },
        { status: 401 }
      )
    }

    const token = createAdminToken({ email })
    const isProd = process.env.NODE_ENV === "production"
    const res = NextResponse.json({
      access_token: token,
      admin: { id: 1, email: ADMIN_EMAIL, name: "Admin", role: "admin" },
    })

    res.cookies.set(COOKIE_NAME, token, {
      httpOnly: true,
      secure: isProd,
      sameSite: "lax",
      maxAge: MAX_AGE,
      path: "/",
    })

    res.cookies.set("admin_token", token, {
      httpOnly: false,
      secure: isProd,
      sameSite: "lax",
      maxAge: MAX_AGE,
      path: "/",
    })

    if (process.env.NODE_ENV === "development") {
      console.log("[Login] Admin logged in, token created")
    }

    return res
  } catch {
    return NextResponse.json({ detail: "Invalid request" }, { status: 400 })
  }
}
