import { NextRequest, NextResponse } from "next/server"
import { getAdminSession } from "@/lib/admin-auth"

export const runtime = 'edge';

const ADMIN_EMAIL = "admin@carprice.com"

export async function GET(request: NextRequest) {
  const session = await getAdminSession(request)
  if (!session) {
    return NextResponse.json({ detail: "Not authenticated" }, { status: 401 })
  }

  return NextResponse.json({
    id: 1,
    email: ADMIN_EMAIL,
    name: "Admin",
    role: "admin",
  })
}
