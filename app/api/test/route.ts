import { NextResponse } from "next/server"

export async function GET() {
  return NextResponse.json({
    message: "API is working!",
    timestamp: new Date().toISOString(),
    routes: ["/api/test", "/api/transcribe", "/api/video-info", "/api/enhance"],
  })
}

export async function POST() {
  return NextResponse.json({
    message: "POST request received!",
    timestamp: new Date().toISOString(),
  })
}
