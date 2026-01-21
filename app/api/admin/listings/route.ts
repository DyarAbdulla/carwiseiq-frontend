import { NextRequest, NextResponse } from "next/server"
import { getAdminSession } from "@/lib/admin-auth"

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000"

export async function GET(request: NextRequest) {
  const session = getAdminSession(request)
  if (!session) {
    return NextResponse.json({ detail: "Not authenticated" }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const auth = request.headers.get("authorization")
  const query = searchParams.toString()

  try {
    const res = await fetch(`${API_BASE}/api/marketplace/listings${query ? `?${query}` : ""}`, {
      headers: { ...(auth ? { Authorization: auth } : {}), "Content-Type": "application/json" },
    })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) return NextResponse.json(data, { status: res.status })
    return NextResponse.json(data)
  } catch (e) {
    return NextResponse.json({ detail: "Backend unavailable" }, { status: 502 })
  }
}
