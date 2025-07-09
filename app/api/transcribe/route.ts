import { NextResponse } from "next/server"
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

interface TranscriptionRequest {
  videoId: string
  language?: string
  service?: "whisper" | "google" | "azure"
}

interface TranscriptionResponse {
  transcript: string
  confidence?: number
  language: string
  duration?: number
  service: string
  timestamp: string
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as TranscriptionRequest
    const { videoId, language = "en", service = "whisper" } = body

    if (!videoId) {
      return NextResponse.json({ error: "Video ID is required" }, { status: 400 })
    }

    // First try to get existing subtitles
    const existingSubtitles = await getExistingSubtitles(videoId, language)
    if (existingSubtitles) {
      await saveTranscription(videoId, existingSubtitles, "youtube-cc", language)
      return NextResponse.json({
        transcript: existingSubtitles,
        language,
        service: "youtube-cc",
        timestamp: new Date().toISOString(),
      })
    }

    // Fall back to AI transcription (simulated for demo)
    const transcript = await simulateAITranscription(videoId, service, language)
    await saveTranscription(videoId, transcript, service, language)

    return NextResponse.json({
      transcript,
      language,
      service,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("Transcription error:", error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Transcription failed",
      },
      { status: 500 },
    )
  }
}

async function getExistingSubtitles(videoId: string, language: string): Promise<string | null> {
  try {
    // Try to fetch YouTube page and extract subtitle information
    const response = await fetch(`https://www.youtube.com/watch?v=${videoId}`, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
      },
    })

    if (!response.ok) {
      return null
    }

    const html = await response.text()

    // Look for caption tracks in the page HTML
    const captionRegex = /"captionTracks":(\[.*?\])/
    const match = html.match(captionRegex)

    if (match) {
      try {
        const captionTracks = JSON.parse(match[1])
        const track =
          captionTracks.find(
            (t: any) => t.languageCode === language || t.languageCode.startsWith(language.split("-")[0]),
          ) || captionTracks[0]

        if (track && track.baseUrl) {
          const subtitleResponse = await fetch(track.baseUrl)
          const xmlData = await subtitleResponse.text()
          return parseSubtitleXML(xmlData)
        }
      } catch (parseError) {
        console.error("Error parsing caption tracks:", parseError)
      }
    }

    return null
  } catch (error) {
    console.error("Error getting existing subtitles:", error)
    return null
  }
}

function parseSubtitleXML(xml: string): string {
  // Parse YouTube's subtitle XML format
  const textRegex = /<text[^>]*>(.*?)<\/text>/g
  const matches = []
  let match

  while ((match = textRegex.exec(xml)) !== null) {
    const text = match[1]
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/<[^>]*>/g, "") // Remove any remaining HTML tags
    matches.push(text.trim())
  }

  return matches.filter(Boolean).join(" ")
}

async function simulateAITranscription(videoId: string, service: string, language: string): Promise<string> {
  // In a real implementation, this would:
  // 1. Download the audio from YouTube using ytdl-core or similar
  // 2. Send it to the chosen transcription service
  // 3. Return the transcribed text

  // For demo purposes, we'll simulate different responses based on the service
  const demoTranscripts = {
    whisper: `This is a simulated OpenAI Whisper transcription for video ${videoId}. In a real implementation, this would contain the actual transcribed audio content from the YouTube video. The transcription would be highly accurate and include proper punctuation and formatting.`,
    google: `This is a simulated Google Speech-to-Text transcription for video ${videoId}. The actual implementation would process the video's audio track and return the spoken content as text with high accuracy.`,
    azure: `This is a simulated Azure Speech Services transcription for video ${videoId}. The real service would provide detailed transcription with speaker identification and confidence scores.`,
  }

  // Simulate processing delay
  await new Promise((resolve) => setTimeout(resolve, 2000))

  return demoTranscripts[service as keyof typeof demoTranscripts] || demoTranscripts.whisper
}

async function saveTranscription(videoId: string, transcript: string, service: string, language: string) {
  // In a real implementation, this would save to a database
  console.log("Saving transcription:", { videoId, service, language, length: transcript.length })
}
