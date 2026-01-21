import { NextRequest, NextResponse } from "next/server"
import { getAdminSession } from "@/lib/admin-auth"

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000"

/** ADMIN_API_SECRET or ADMIN_SECRET from env; in NODE_ENV=development with neither set, use dev-admin-secret. */
function getAdminSecret(): string | undefined {
  return (
    process.env.ADMIN_API_SECRET ||
    process.env.ADMIN_SECRET ||
    (process.env.NODE_ENV === "development" ? "dev-admin-secret" : undefined)
  )
}

function getBackendBearer(request: NextRequest): string | null {
  const authHeader = request.headers.get("authorization")
  if (authHeader) return authHeader.startsWith("Bearer ") ? authHeader : `Bearer ${authHeader.trim()}`
  const t = request.cookies.get("admin_token")?.value || request.cookies.get("admin_session")?.value
  return t ? `Bearer ${t}` : null
}

function getBackendAuthHeaders(request: NextRequest): HeadersInit {
  const headers: Record<string, string> = { "Content-Type": "application/json" }
  const bearer = getBackendBearer(request)
  if (bearer) headers["Authorization"] = bearer
  const secret = getAdminSecret()
  if (secret) headers["X-Admin-Secret"] = secret
  return headers
}

function getBackendAuthHeadersNoContentType(request: NextRequest): HeadersInit {
  const headers: Record<string, string> = {}
  const bearer = getBackendBearer(request)
  if (bearer) headers["Authorization"] = bearer
  const secret = getAdminSecret()
  if (secret) headers["X-Admin-Secret"] = secret
  return headers
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = getAdminSession(request)
    if (!session) {
      return NextResponse.json(
        { detail: "Unauthorized - Admin access required" },
        { status: 401 }
      )
    }

    const { id } = await params
    if (!id) return NextResponse.json({ detail: "Missing id" }, { status: 400 })

    let body: { status?: string; [k: string]: unknown } = {}
    try {
      body = await request.json()
    } catch {
      return NextResponse.json({ detail: "Invalid JSON" }, { status: 400 })
    }

    if (process.env.NODE_ENV === "development") {
      console.log("[API] PATCH listing:", id, "body:", body)
      console.log("[API] Auth header:", request.headers.get("authorization") ? "Present" : "Missing")
      console.log("[API] admin_token cookie:", request.cookies.get("admin_token")?.value ? "Present" : "Missing")
      console.log("[API] admin_session cookie:", request.cookies.get("admin_session")?.value ? "Present" : "Missing")
      const s = getAdminSecret()
      console.log("[API] X-Admin-Secret being sent:", s ? (s === "dev-admin-secret" ? "dev-admin-secret" : "<from env>") : "not set")
    }

    const headers = getBackendAuthHeaders(request)
    let backendUrl: string
    let method: string = "PATCH"
    let backendBody: string | undefined

    const onlyStatusDeleted = body.status === "deleted" && Object.keys(body).length === 1
    if (body.status === "sold") {
      backendUrl = `${API_BASE}/api/marketplace/listings/${id}/mark-sold`
      method = "PUT"
      backendBody = undefined
    } else if (onlyStatusDeleted) {
      backendUrl = `${API_BASE}/api/marketplace/listings/${id}`
      method = "DELETE"
      backendBody = undefined
    } else {
      backendUrl = `${API_BASE}/api/marketplace/listings/${id}`
      backendBody = JSON.stringify(body)
    }

    if (process.env.NODE_ENV === "development") console.log("[API] Calling backend:", method, backendUrl)

    const res = await fetch(backendUrl, {
      method,
      headers: method === "DELETE" ? getBackendAuthHeadersNoContentType(request) : headers,
      body: backendBody,
    })

    if (process.env.NODE_ENV === "development") console.log("[API] Backend response status:", res.status)

    if (!res.ok) {
      const errText = await res.text()
      const err = (() => { try { return JSON.parse(errText) } catch { return {} } })()
      if (process.env.NODE_ENV === "development") console.error("[API] Backend error:", errText)
      return NextResponse.json(
        { detail: err.detail || "Failed to update listing" },
        { status: res.status }
      )
    }

    if (res.status === 204) return NextResponse.json({ success: true })
    const data = await res.json().catch(() => ({ success: true }))
    return NextResponse.json(data)
  } catch (e) {
    console.error("[API] PATCH error:", e)
    return NextResponse.json({ detail: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = getAdminSession(request)
    if (!session) {
      return NextResponse.json(
        { detail: "Unauthorized - Admin access required" },
        { status: 401 }
      )
    }

    const { id } = await params
    if (!id) return NextResponse.json({ detail: "Missing id" }, { status: 400 })

    const secret = getAdminSecret()
    if (process.env.NODE_ENV === "development") {
      console.log("[API] DELETE listing:", id)
      console.log("[API] Auth header:", request.headers.get("authorization") ? "Present" : "Missing")
      console.log("[API] admin_token cookie:", request.cookies.get("admin_token")?.value ? "Present" : "Missing")
      console.log("[API] admin_session cookie:", request.cookies.get("admin_session")?.value ? "Present" : "Missing")
      console.log("[API] X-Admin-Secret being sent:", secret ? (secret === "dev-admin-secret" ? "dev-admin-secret" : "<from env>") : "not set")
      console.log("[API] Calling backend DELETE:", `${API_BASE}/api/marketplace/listings/${id}`)
    }

    const headers = getBackendAuthHeadersNoContentType(request)

    const res = await fetch(`${API_BASE}/api/marketplace/listings/${id}`, {
      method: "DELETE",
      headers,
    })

    if (process.env.NODE_ENV === "development") console.log("[API] Backend response status:", res.status)

    if (!res.ok) {
      const errText = await res.text()
      const err = (() => { try { return JSON.parse(errText) } catch { return {} } })()
      if (process.env.NODE_ENV === "development") console.error("[API] Backend error:", errText)
      return NextResponse.json(
        { detail: err.detail || "Failed to delete listing" },
        { status: res.status }
      )
    }

    return NextResponse.json({ success: true, deleted: true })
  } catch (e) {
    console.error("[API] DELETE error:", e)
    return NextResponse.json({ detail: "Internal server error" }, { status: 500 })
  }
}
