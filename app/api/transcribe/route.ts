import { type NextRequest, NextResponse } from "next/server"

interface TranscriptionRequest {
  videoId: string
  language?: string
  service?: "whisper" | "google" | "auto"
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as TranscriptionRequest
    const { videoId, language = "en", service = "auto" } = body

    console.log("Transcription request:", { videoId, language, service })

    if (!videoId) {
      return NextResponse.json({ error: "Video ID is required" }, { status: 400 })
    }

    // Try to get existing subtitles first
    const subtitles = await getYouTubeSubtitles(videoId, language)

    if (subtitles && subtitles.length > 50) {
      console.log("Subtitles found:", subtitles.substring(0, 100) + "...")

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

    console.log("No subtitles found for video:", videoId)

    // If no subtitles found, return appropriate message
    return NextResponse.json(
      {
        error:
          "No subtitles found for this video. This video either doesn't have captions or they're not publicly available.",
        suggestion: "Try a different video with captions, or the creator needs to add subtitles to their video.",
        videoId,
      },
      { status: 404 },
    )
  } catch (error) {
    console.error("Transcription error:", error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to process video",
        details: error instanceof Error ? error.stack : "Unknown error",
      },
      { status: 500 },
    )
  }
}

async function getYouTubeSubtitles(videoId: string, preferredLanguage: string): Promise<string | null> {
  console.log(`Attempting to get subtitles for video ${videoId} in language ${preferredLanguage}`)

  try {
    // Method 1: Try direct API endpoints with multiple formats
    const directApiUrls = [
      `https://www.youtube.com/api/timedtext?lang=${preferredLanguage}&v=${videoId}&fmt=srv3`,
      `https://www.youtube.com/api/timedtext?lang=${preferredLanguage}&v=${videoId}&fmt=vtt`,
      `https://www.youtube.com/api/timedtext?lang=${preferredLanguage}&v=${videoId}`,
      `https://www.youtube.com/api/timedtext?lang=a.${preferredLanguage}&v=${videoId}`, // Auto-generated
    ]

    for (const url of directApiUrls) {
      try {
        console.log(`Trying direct API: ${url}`)
        const response = await fetch(url, {
          headers: {
            "User-Agent":
              "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            Accept: "text/xml,application/xml,application/xhtml+xml,text/html;q=0.9,text/plain;q=0.8,*/*;q=0.5",
            "Accept-Language": "en-US,en;q=0.5",
            Referer: "https://www.youtube.com/",
          },
        })

        if (response.ok) {
          const text = await response.text()
          console.log(`Response from ${url}:`, text.substring(0, 200))

          if (text && (text.includes("<text") || text.includes("<transcript") || text.includes("WEBVTT"))) {
            const parsed = parseSubtitleContent(text)
            if (parsed && parsed.length > 50) {
              console.log("Successfully parsed subtitles from direct API")
              return parsed
            }
          }
        }
      } catch (e) {
        console.log(`Direct API failed for ${url}:`, e)
        continue
      }
    }

    // Method 2: Extract from video page
    console.log("Trying to extract from video page...")
    const pageUrl = `https://www.youtube.com/watch?v=${videoId}`
    const pageResponse = await fetch(pageUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
        "Cache-Control": "no-cache",
      },
    })

    if (!pageResponse.ok) {
      throw new Error(`Failed to fetch video page: ${pageResponse.status}`)
    }

    const html = await pageResponse.text()
    console.log("Video page fetched, length:", html.length)

    // Look for different caption track patterns
    const captionPatterns = [
      /"captionTracks":\s*(\[.*?\])/,
      /"captions":\s*{[^}]*"playerCaptionsTracklistRenderer":\s*{[^}]*"captionTracks":\s*(\[.*?\])/,
      /playerCaptionsTracklistRenderer.*?captionTracks.*?(\[.*?\])/,
    ]

    for (const pattern of captionPatterns) {
      const match = html.match(pattern)
      if (match) {
        try {
          console.log("Found caption tracks pattern")
          const captionTracks = JSON.parse(match[1])
          console.log("Caption tracks:", captionTracks)

          // Find best matching track
          const selectedTrack =
            captionTracks.find((track: any) => track.languageCode === preferredLanguage) ||
            captionTracks.find((track: any) => track.languageCode?.startsWith(preferredLanguage.split("-")[0])) ||
            captionTracks.find((track: any) => track.languageCode === "en" || track.languageCode?.startsWith("en")) ||
            captionTracks[0]

          if (selectedTrack?.baseUrl) {
            console.log("Selected track:", selectedTrack)
            const subtitleResponse = await fetch(selectedTrack.baseUrl)
            if (subtitleResponse.ok) {
              const xmlData = await subtitleResponse.text()
              const parsed = parseSubtitleContent(xmlData)
              if (parsed && parsed.length > 50) {
                console.log("Successfully parsed subtitles from page extraction")
                return parsed
              }
            }
          }
        } catch (parseError) {
          console.error("Error parsing caption tracks:", parseError)
          continue
        }
      }
    }

    // Method 3: Try alternative language codes
    const alternativeLanguages = [
      "a." + preferredLanguage, // Auto-generated
      "a.en", // Auto-generated English
      preferredLanguage.split("-")[0], // Base language
      "en",
      "en-US",
      "en-GB", // English fallbacks
    ]

    for (const lang of alternativeLanguages) {
      const urls = [
        `https://www.youtube.com/api/timedtext?lang=${lang}&v=${videoId}&fmt=srv3`,
        `https://www.youtube.com/api/timedtext?lang=${lang}&v=${videoId}&fmt=vtt`,
        `https://www.youtube.com/api/timedtext?lang=${lang}&v=${videoId}`,
      ]

      for (const url of urls) {
        try {
          console.log(`Trying alternative language: ${url}`)
          const response = await fetch(url, {
            headers: {
              "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
              Referer: "https://www.youtube.com/",
            },
          })

          if (response.ok) {
            const text = await response.text()
            if (text && text.length > 100) {
              const parsed = parseSubtitleContent(text)
              if (parsed && parsed.length > 50) {
                console.log(`Successfully found subtitles with language: ${lang}`)
                return parsed
              }
            }
          }
        } catch (e) {
          continue
        }
      }
    }

    console.log("All subtitle extraction methods failed")
    return null
  } catch (error) {
    console.error("Error getting YouTube subtitles:", error)
    return null
  }
}

function parseSubtitleContent(content: string): string {
  try {
    console.log("Parsing subtitle content, type:", content.substring(0, 100))

    // Handle WEBVTT format
    if (content.includes("WEBVTT")) {
      const lines = content.split("\n")
      const textLines = lines.filter(
        (line) =>
          line.trim() &&
          !line.includes("WEBVTT") &&
          !line.includes("-->") &&
          !line.match(/^\d+$/) &&
          !line.match(/^\d{2}:\d{2}:\d{2}/) &&
          !line.includes("NOTE") &&
          !line.includes("STYLE"),
      )
      const result = textLines.join(" ").replace(/\s+/g, " ").trim()
      console.log("WEBVTT parsed result length:", result.length)
      return result
    }

    // Handle XML/SRT formats
    const patterns = [
      /<text[^>]*>(.*?)<\/text>/g,
      /<transcript><text[^>]*>(.*?)<\/text><\/transcript>/g,
      /<p[^>]*>(.*?)<\/p>/g,
    ]

    let allMatches: string[] = []

    for (const pattern of patterns) {
      const matches = []
      let match

      while ((match = pattern.exec(content)) !== null) {
        let text = match[1]

        // Clean up the text
        text = text
          .replace(/&amp;/g, "&")
          .replace(/&lt;/g, "<")
          .replace(/&gt;/g, ">")
          .replace(/&quot;/g, '"')
          .replace(/&#39;/g, "'")
          .replace(/&apos;/g, "'")
          .replace(/<[^>]*>/g, "") // Remove HTML tags
          .replace(/\s+/g, " ") // Normalize whitespace
          .trim()

        if (text && text.length > 2) {
          matches.push(text)
        }
      }

      if (matches.length > 0) {
        allMatches = matches
        break
      }
    }

    const result = allMatches.join(" ").trim()
    console.log("XML parsed result length:", result.length)
    return result
  } catch (error) {
    console.error("Error parsing subtitle content:", error)
    return ""
  }
}

async function saveTranscription(videoId: string, transcript: string, service: string, language: string) {
  console.log("Saving transcription:", {
    videoId,
    service,
    language,
    length: transcript.length,
  })
}
