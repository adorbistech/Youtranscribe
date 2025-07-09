import { type NextRequest, NextResponse } from "next/server"
import OpenAI from "openai"

// Initialize OpenRouter client
const openrouter = new OpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: process.env.OPENROUTER_API_KEY,
  defaultHeaders: {
    "HTTP-Referer": process.env.NEXT_PUBLIC_SITE_URL || "https://v0-chrome-extension-guide-livid.vercel.app",
    "X-Title": "YouTube AI Transcriber",
  },
})

interface EnhanceRequest {
  transcript: string
  action: "translate" | "summarize" | "extract-key-points"
  targetLanguage?: string
  model?: string
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as EnhanceRequest
    const { transcript, action, targetLanguage, model = "deepseek/deepseek-r1-distill-qwen-14b:free" } = body

    console.log("Enhancement request:", { action, model, transcriptLength: transcript.length })

    if (!transcript || !action) {
      return NextResponse.json({ error: "Transcript and action are required" }, { status: 400 })
    }

    let result: string

    switch (action) {
      case "translate":
        if (!targetLanguage) {
          return NextResponse.json({ error: "Target language required for translation" }, { status: 400 })
        }
        result = await translateTextWithOpenRouter(transcript, targetLanguage, model)
        break

      case "summarize":
        result = await summarizeTextWithOpenRouter(transcript, model)
        break

      case "extract-key-points":
        result = await extractKeyPointsWithOpenRouter(transcript, model)
        break

      default:
        return NextResponse.json({ error: "Invalid action" }, { status: 400 })
    }

    console.log("Enhancement completed:", { action, resultLength: result.length })

    return NextResponse.json({ result, action, model })
  } catch (error) {
    console.error("Enhancement error:", error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Enhancement failed",
        details: error instanceof Error ? error.stack : "Unknown error",
      },
      { status: 500 },
    )
  }
}

async function translateTextWithOpenRouter(text: string, targetLanguage: string, model: string): Promise<string> {
  const completion = await openrouter.chat.completions.create({
    model,
    messages: [
      {
        role: "system",
        content: `You are a professional translator. Translate the following text to ${targetLanguage}. Maintain the original meaning, context, and tone. Only return the translated text without any additional commentary.`,
      },
      {
        role: "user",
        content: text,
      },
    ],
    temperature: 0.3,
  })

  return completion.choices[0].message.content || "Translation failed"
}

async function summarizeTextWithOpenRouter(text: string, model: string): Promise<string> {
  const completion = await openrouter.chat.completions.create({
    model,
    messages: [
      {
        role: "system",
        content:
          "You are an expert at creating concise, informative summaries. Create a well-structured summary that captures the main points, key insights, and important details from the transcript. Use clear, professional language.",
      },
      {
        role: "user",
        content: `Please summarize this video transcript:\n\n${text}`,
      },
    ],
    temperature: 0.4,
  })

  return completion.choices[0].message.content || "Summary failed"
}

async function extractKeyPointsWithOpenRouter(text: string, model: string): Promise<string> {
  const completion = await openrouter.chat.completions.create({
    model,
    messages: [
      {
        role: "system",
        content:
          "You are an expert at extracting key information. Extract the most important points from the transcript and format them as a clear, bulleted list. Focus on actionable insights, main concepts, and significant details.",
      },
      {
        role: "user",
        content: `Extract the key points from this transcript:\n\n${text}`,
      },
    ],
    temperature: 0.3,
  })

  return completion.choices[0].message.content || "Key point extraction failed"
}
