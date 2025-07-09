import { NextResponse } from "next/server"

interface TranscriptionRequest {
  videoId: string
  language?: string
  service?: "whisper" | "google" | "auto"
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as TranscriptionRequest
    const { videoId, language = "en", service = "auto" } = body

    if (!videoId) {
      return NextResponse.json({ error: "Video ID is required" }, { status: 400 })
    }

    // Try to get existing subtitles first
    const subtitles = await getYouTubeSubtitles(videoId, language)

    if (subtitles) {
      // Save to history
      await saveTranscription(videoId, subtitles, "youtube-cc", language)

      return NextResponse.json({
        transcript: subtitles,
        language,
        service: "youtube-cc",
        timestamp: new Date().toISOString(),
        success: true,
      })
    }

    // If no subtitles found, return appropriate message
    return NextResponse.json(
      {
        error:
          "No subtitles found for this video. This video either doesn't have captions or they're not publicly available.",
        suggestion: "Try a different video with captions, or the creator needs to add subtitles to their video.",
      },
      { status: 404 },
    )
  } catch (error) {
    console.error("Transcription error:", error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to process video",
      },
      { status: 500 },
    )
  }
}

async function getYouTubeSubtitles(videoId: string, preferredLanguage: string): Promise<string | null> {
  try {
    // Method 1: Try to get subtitles using YouTube's transcript API approach
    const transcriptUrl = `https://www.youtube.com/api/timedtext?lang=${preferredLanguage}&v=${videoId}`

    try {
      const response = await fetch(transcriptUrl, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
        },
      })

      if (response.ok) {
        const xmlText = await response.text()
        if (xmlText && xmlText.includes("<text")) {
          return parseSubtitleXML(xmlText)
        }
      }
    } catch (e) {
      console.log("Direct transcript API failed, trying alternative method")
    }

    // Method 2: Try to extract from video page
    const pageUrl = `https://www.youtube.com/watch?v=${videoId}`
    const pageResponse = await fetch(pageUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.5",
        "Accept-Encoding": "gzip, deflate, br",
        Connection: "keep-alive",
        "Upgrade-Insecure-Requests": "1",
      },
    })

    if (!pageResponse.ok) {
      throw new Error(`Failed to fetch video page: ${pageResponse.status}`)
    }

    const html = await pageResponse.text()

    // Look for caption tracks in the page
    const captionRegex = /"captionTracks":\s*(\[.*?\])/
    const match = html.match(captionRegex)

    if (match) {
      try {
        const captionTracks = JSON.parse(match[1])

        // Find the best matching caption track
        let selectedTrack = captionTracks.find((track: any) => track.languageCode === preferredLanguage)

        // Fallback to English if preferred language not found
        if (!selectedTrack) {
          selectedTrack = captionTracks.find(
            (track: any) => track.languageCode === "en" || track.languageCode.startsWith("en"),
          )
        }

        // Use first available track if no English found
        if (!selectedTrack && captionTracks.length > 0) {
          selectedTrack = captionTracks[0]
        }

        if (selectedTrack && selectedTrack.baseUrl) {
          const subtitleResponse = await fetch(selectedTrack.baseUrl)
          if (subtitleResponse.ok) {
            const xmlData = await subtitleResponse.text()
            return parseSubtitleXML(xmlData)
          }
        }
      } catch (parseError) {
        console.error("Error parsing caption tracks:", parseError)
      }
    }

    // Method 3: Try common subtitle URLs
    const commonLanguages = [preferredLanguage, "en", "en-US", "en-GB"]

    for (const lang of commonLanguages) {
      try {
        const urls = [
          `https://www.youtube.com/api/timedtext?lang=${lang}&v=${videoId}`,
          `https://www.youtube.com/api/timedtext?lang=${lang}&v=${videoId}&fmt=srv3`,
          `https://video.google.com/timedtext?lang=${lang}&v=${videoId}`,
        ]

        for (const url of urls) {
          try {
            const response = await fetch(url)
            if (response.ok) {
              const text = await response.text()
              if (text && (text.includes("<text") || text.includes("<transcript"))) {
                return parseSubtitleXML(text)
              }
            }
          } catch (e) {
            continue
          }
        }
      } catch (e) {
        continue
      }
    }

    return null
  } catch (error) {
    console.error("Error getting YouTube subtitles:", error)
    return null
  }
}

function parseSubtitleXML(xml: string): string {
  try {
    // Handle different XML formats
    const patterns = [
      /<text[^>]*>(.*?)<\/text>/g,
      /<transcript><text[^>]*>(.*?)<\/text><\/transcript>/g,
      /<p[^>]*>(.*?)<\/p>/g,
    ]

    let allMatches: string[] = []

    for (const pattern of patterns) {
      const matches = []
      let match

      while ((match = pattern.exec(xml)) !== null) {
        const text = match[1]
          .replace(/&amp;/g, "&")
          .replace(/&lt;/g, "<")
          .replace(/&gt;/g, ">")
          .replace(/&quot;/g, '"')
          .replace(/&#39;/g, "'")
          .replace(/&apos;/g, "'")
          .replace(/<[^>]*>/g, "") // Remove HTML tags
          .replace(/\s+/g, " ") // Normalize whitespace
          .trim()

        if (text && text.length > 0) {
          matches.push(text)
        }
      }

      if (matches.length > 0) {
        allMatches = matches
        break
      }
    }

    if (allMatches.length === 0) {
      // Try simple text extraction
      const cleanXml = xml
        .replace(/<[^>]*>/g, " ")
        .replace(/&amp;/g, "&")
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/\s+/g, " ")
        .trim()

      if (cleanXml && cleanXml.length > 10) {
        return cleanXml
      }
    }

    return allMatches.join(" ").trim()
  } catch (error) {
    console.error("Error parsing subtitle XML:", error)
    return ""
  }
}

async function saveTranscription(videoId: string, transcript: string, service: string, language: string) {
  // This would save to a database in a real implementation
  console.log("Saving transcription:", {
    videoId,
    service,
    language,
    length: transcript.length,
    preview: transcript.substring(0, 100) + "...",
  })
}
