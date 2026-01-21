import { NextResponse } from "next/server"
import { COOKIE_NAME } from "@/lib/admin-auth"

export async function POST() {
  const res = NextResponse.json({ success: true })
  const opts = { secure: process.env.NODE_ENV === "production", sameSite: "lax" as const, maxAge: 0, path: "/" }
  res.cookies.set(COOKIE_NAME, "", { ...opts, httpOnly: true })
  res.cookies.set("admin_token", "", { ...opts, httpOnly: false })
  return res
}
