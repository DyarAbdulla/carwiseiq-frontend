import { NextResponse } from 'next/server'

export const runtime = 'edge';

const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
  <rect width="100" height="100" fill="#5B7FFF" rx="20"/>
  <text x="50" y="70" font-size="60" text-anchor="middle" fill="white">🚗</text>
</svg>`

export async function GET() {
  return new NextResponse(svgContent, {
    headers: {
      'Content-Type': 'image/svg+xml',
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  })
}
