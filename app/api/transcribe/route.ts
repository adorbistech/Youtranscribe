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
    // Method 1: Try YouTube's internal API endpoints
    const internalApiUrls = [
      `https://www.youtube.com/api/timedtext?lang=${preferredLanguage}&v=${videoId}&fmt=srv3`,
      `https://www.youtube.com/api/timedtext?lang=${preferredLanguage}&v=${videoId}&fmt=vtt`,
      `https://www.youtube.com/api/timedtext?lang=${preferredLanguage}&v=${videoId}`,
    ]

    for (const url of internalApiUrls) {
      try {
        const response = await fetch(url, {
          headers: {
            "User-Agent":
              "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            Accept:
              "text/xml,application/xml,application/xhtml+xml,text/html;q=0.9,text/plain;q=0.8,image/png,*/*;q=0.5",
            "Accept-Language": "en-US,en;q=0.5",
            "Accept-Encoding": "gzip, deflate, br",
            DNT: "1",
            Connection: "keep-alive",
            "Upgrade-Insecure-Requests": "1",
          },
        })

        if (response.ok) {
          const text = await response.text()
          if (text && (text.includes("<text") || text.includes("<transcript") || text.includes("WEBVTT"))) {
            const parsed = parseSubtitleContent(text)
            if (parsed && parsed.length > 50) {
              return parsed
            }
          }
        }
      } catch (e) {
        continue
      }
    }

    // Method 2: Extract from video page with better parsing
    const pageResponse = await fetch(`https://www.youtube.com/watch?v=${videoId}`, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
        "Accept-Encoding": "gzip, deflate, br",
        "Cache-Control": "no-cache",
        Pragma: "no-cache",
      },
    })

    if (!pageResponse.ok) {
      throw new Error(`Failed to fetch video page: ${pageResponse.status}`)
    }

    const html = await pageResponse.text()

    // Look for player response data
    const playerResponseMatch =
      html.match(/"playerResponse":"(.*?)","playerAds"/) || html.match(/var ytInitialPlayerResponse = ({.*?});/)

    if (playerResponseMatch) {
      try {
        let playerData = playerResponseMatch[1]
        if (playerResponseMatch[0].includes("playerResponse")) {
          playerData = playerData.replace(/\\"/g, '"').replace(/\\n/g, "").replace(/\\t/g, "")
        }

        const playerResponse = JSON.parse(playerData)

        if (playerResponse.captions?.playerCaptionsTracklistRenderer?.captionTracks) {
          const tracks = playerResponse.captions.playerCaptionsTracklistRenderer.captionTracks

          // Find best matching track
          const selectedTrack =
            tracks.find((track: any) => track.languageCode === preferredLanguage) ||
            tracks.find((track: any) => track.languageCode.startsWith(preferredLanguage.split("-")[0])) ||
            tracks.find((track: any) => track.languageCode === "en" || track.languageCode.startsWith("en")) ||
            tracks[0]

          if (selectedTrack?.baseUrl) {
            const subtitleResponse = await fetch(selectedTrack.baseUrl)
            if (subtitleResponse.ok) {
              const xmlData = await subtitleResponse.text()
              const parsed = parseSubtitleContent(xmlData)
              if (parsed && parsed.length > 50) {
                return parsed
              }
            }
          }
        }
      } catch (parseError) {
        console.error("Error parsing player response:", parseError)
      }
    }

    // Method 3: Look for caption tracks in different formats
    const captionPatterns = [
      /"captionTracks":\s*(\[.*?\])/,
      /"captions":\s*{[^}]*"playerCaptionsTracklistRenderer":\s*{[^}]*"captionTracks":\s*(\[.*?\])/,
    ]

    for (const pattern of captionPatterns) {
      const match = html.match(pattern)
      if (match) {
        try {
          const captionTracks = JSON.parse(match[1])

          const selectedTrack =
            captionTracks.find((track: any) => track.languageCode === preferredLanguage) ||
            captionTracks.find((track: any) => track.languageCode?.startsWith(preferredLanguage.split("-")[0])) ||
            captionTracks.find((track: any) => track.languageCode === "en" || track.languageCode?.startsWith("en")) ||
            captionTracks[0]

          if (selectedTrack?.baseUrl) {
            const subtitleResponse = await fetch(selectedTrack.baseUrl)
            if (subtitleResponse.ok) {
              const xmlData = await subtitleResponse.text()
              const parsed = parseSubtitleContent(xmlData)
              if (parsed && parsed.length > 50) {
                return parsed
              }
            }
          }
        } catch (parseError) {
          continue
        }
      }
    }

    // Method 4: Try alternative language codes
    const alternativeLanguages = [
      preferredLanguage,
      preferredLanguage.split("-")[0],
      "en",
      "en-US",
      "en-GB",
      "a." + preferredLanguage, // Auto-generated
      "a.en", // Auto-generated English
    ]

    for (const lang of alternativeLanguages) {
      const urls = [
        `https://www.youtube.com/api/timedtext?lang=${lang}&v=${videoId}&fmt=srv3`,
        `https://www.youtube.com/api/timedtext?lang=${lang}&v=${videoId}&fmt=vtt`,
        `https://www.youtube.com/api/timedtext?lang=${lang}&v=${videoId}&fmt=ttml`,
        `https://www.youtube.com/api/timedtext?lang=${lang}&v=${videoId}`,
      ]

      for (const url of urls) {
        try {
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
                return parsed
              }
            }
          }
        } catch (e) {
          continue
        }
      }
    }

    return null
  } catch (error) {
    console.error("Error getting YouTube subtitles:", error)
    return null
  }
}

function parseSubtitleContent(content: string): string {
  try {
    // Handle WEBVTT format
    if (content.includes("WEBVTT")) {
      const lines = content.split("\n")
      const textLines = lines.filter(
        (line) =>
          line.trim() &&
          !line.includes("WEBVTT") &&
          !line.includes("-->") &&
          !line.match(/^\d+$/) &&
          !line.match(/^\d{2}:\d{2}:\d{2}/),
      )
      return textLines.join(" ").replace(/\s+/g, " ").trim()
    }

    // Handle XML/SRT formats
    const patterns = [
      /<text[^>]*>(.*?)<\/text>/g,
      /<transcript><text[^>]*>(.*?)<\/text><\/transcript>/g,
      /<p[^>]*>(.*?)<\/p>/g,
      /\d+\n\d{2}:\d{2}:\d{2},\d{3} --> \d{2}:\d{2}:\d{2},\d{3}\n(.*?)(?=\n\n|\n\d+\n|$)/g,
    ]

    let allMatches: string[] = []

    for (const pattern of patterns) {
      const matches = []
      let match

      while ((match = pattern.exec(content)) !== null) {
        let text = match[1] || match[0]

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

    if (allMatches.length === 0) {
      // Try simple text extraction as fallback
      const cleanContent = content
        .replace(/<[^>]*>/g, " ")
        .replace(/&amp;/g, "&")
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/\d{2}:\d{2}:\d{2}[.,]\d{3}/g, "") // Remove timestamps
        .replace(/\d+\n/g, "") // Remove line numbers
        .replace(/-->/g, "") // Remove arrow indicators
        .replace(/\s+/g, " ")
        .trim()

      if (cleanContent && cleanContent.length > 50) {
        return cleanContent
      }
    }

    return allMatches.join(" ").trim()
  } catch (error) {
    console.error("Error parsing subtitle content:", error)
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
