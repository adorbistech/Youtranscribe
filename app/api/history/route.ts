import { NextResponse } from "next/server"

interface TranscriptionRecord {
  id: string
  videoId: string
  title: string
  transcript: string
  service: string
  language: string
  timestamp: string
  duration?: number
  model?: string
}

/* ------------------------------------------------------------------
   In-memory store for demo. Replace with a real DB in production.
-------------------------------------------------------------------*/
let history: TranscriptionRecord[] = []

export async function GET() {
  return NextResponse.json(history)
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as Omit<TranscriptionRecord, "id" | "timestamp">
    const record: TranscriptionRecord = {
      id: Date.now().toString(),
      ...body,
      timestamp: new Date().toISOString(),
    }
    history.unshift(record)
    return NextResponse.json(record, { status: 201 })
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }
}

export async function DELETE(req: Request) {
  const { searchParams } = new URL(req.url)
  const id = searchParams.get("id")
  history = history.filter((r) => r.id !== id)
  return NextResponse.json({ success: true })
}
