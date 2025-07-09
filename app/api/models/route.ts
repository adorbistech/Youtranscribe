import OpenAI from "openai"
import { NextResponse } from "next/server"

// runtime = 'edge' is NOT allowed with AI SDK routes; Next.js defaults to node.
// export const runtime = 'edge'

const openrouter = new OpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: process.env.OPENROUTER_API_KEY,
  defaultHeaders: {
    "HTTP-Referer": process.env.NEXT_PUBLIC_SITE_URL || "https://your-vercel-app.vercel.app",
    "X-Title": "YouTube AI Transcriber",
  },
})

interface ModelInfo {
  id: string
  name?: string
  description?: string
  pricing?: { prompt: string; completion: string }
  context_length?: number
  top_provider?: { max_completion_tokens?: number }
}

export async function GET() {
  try {
    // Ask OpenRouter for the public model catalogue
    const headers: Record<string, string> = {
      "HTTP-Referer": process.env.NEXT_PUBLIC_SITE_URL || "https://your-vercel-app.vercel.app",
      "X-Title": "YouTube AI Transcriber",
    }
    if (process.env.OPENROUTER_API_KEY) {
      headers.Authorization = `Bearer ${process.env.OPENROUTER_API_KEY}`
    }

    const res = await fetch("https://openrouter.ai/api/v1/models", { headers })

    if (!res.ok) {
      return NextResponse.json({ error: "Failed to fetch models from OpenRouter" }, { status: 502 })
    }

    const data = (await res.json()) as { data: ModelInfo[] }

    const models = data.data
      // keep LLMs useful for text-based tasks
      .filter((m) => /(gpt|claude|deepseek|llama|mistral)/i.test(m.id))
      .map((m) => ({
        id: m.id,
        name: m.name || m.id,
        description: m.description,
        pricing: m.pricing,
        contextLength: m.context_length,
        maxTokens: m.top_provider?.max_completion_tokens,
        isFree: m.pricing?.prompt === "0" && m.pricing?.completion === "0",
      }))
      .sort((a, b) => (a.isFree === b.isFree ? a.name.localeCompare(b.name) : a.isFree ? -1 : 1))

    return NextResponse.json(models)
  } catch (err) {
    console.error("Model list error:", err)
    return NextResponse.json({ error: "Unexpected server error" }, { status: 500 })
  }
}
