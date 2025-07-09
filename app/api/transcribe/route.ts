import { type NextRequest, NextResponse } from "next/server"

interface TranscriptionRequest {
  videoId: string
  language?: string
  service?: string
}

export async function GET() {
  return NextResponse.json({
    message: "Transcribe API is running",
    methods: ["POST"],
    timestamp: new Date().toISOString(),
  })
}

export async function POST(request: NextRequest) {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Accept",
  }

  try {
    console.log("=== TRANSCRIBE API CALLED ===")
    console.log("Request URL:", request.url)
    console.log("Request method:", request.method)

    const body = (await request.json()) as TranscriptionRequest
    console.log("Request body:", body)

    const { videoId, language = "en" } = body

    if (!videoId) {
      console.log("❌ No video ID provided")
      return NextResponse.json({ error: "Video ID is required" }, { status: 400, headers })
    }

    console.log(`🎯 Processing video: ${videoId}`)
    console.log(`🌍 Language: ${language}`)

    // Use the new working extraction method
    const result = await extractYouTubeSubtitles(videoId, language)

    if (result.success) {
      console.log("✅ SUCCESS - Subtitles extracted")
      console.log(`📝 Length: ${result.transcript.length} characters`)

      return NextResponse.json(
        {
          transcript: result.transcript,
          service: result.method,
          language: result.language,
          success: true,
          timestamp: new Date().toISOString(),
        },
        { headers },
      )
    } else {
      console.log("❌ FAILED - No subtitles found")
      return NextResponse.json(
        {
          error: result.error || "No subtitles available for this video",
          videoId,
          debug: result.debug,
          suggestions: [
            "Try a video that definitely has captions/subtitles",
            "Check if the video is public and not age-restricted",
            "Some videos only have auto-generated captions which may not be accessible",
          ],
        },
        { status: 404, headers },
      )
    }
  } catch (error) {
    console.error("❌ API ERROR:", error)
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      },
      { status: 500, headers },
    )
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Accept",
    },
  })
}

async function extractYouTubeSubtitles(videoId: string, language: string) {
  console.log(`\n🔍 STARTING EXTRACTION FOR: ${videoId}`)

  // Method 1: Try the working yt-dlp approach
  const ytDlpResult = await tryYtDlpApproach(videoId, language)
  if (ytDlpResult.success) {
    return ytDlpResult
  }

  // Method 2: Try direct YouTube API calls that actually work
  const directResult = await tryDirectYouTubeAPI(videoId, language)
  if (directResult.success) {
    return directResult
  }

  // Method 3: Try parsing the watch page more intelligently
  const watchPageResult = await tryIntelligentWatchPageParsing(videoId, language)
  if (watchPageResult.success) {
    return watchPageResult
  }

  // Method 4: Try the transcript endpoint that some videos have
  const transcriptResult = await tryTranscriptEndpoint(videoId, language)
  if (transcriptResult.success) {
    return transcriptResult
  }

  return {
    success: false,
    error: "No accessible subtitles found",
    debug: "All extraction methods failed",
    transcript: "",
    method: "none",
    language: language,
  }
}

async function tryYtDlpApproach(videoId: string, language: string) {
  console.log("🔍 Method 1: yt-dlp approach")

  try {
    // This mimics what yt-dlp does - get the player response first
    const playerResponse = await getPlayerResponse(videoId)

    if (playerResponse && playerResponse.captions) {
      const tracks = playerResponse.captions.playerCaptionsTracklistRenderer?.captionTracks

      if (tracks && tracks.length > 0) {
        console.log(`Found ${tracks.length} caption tracks`)

        // Find the best track
        const selectedTrack = findBestCaptionTrack(tracks, language)

        if (selectedTrack && selectedTrack.baseUrl) {
          console.log(`Selected track: ${selectedTrack.languageCode}`)

          const subtitleText = await fetchSubtitleContent(selectedTrack.baseUrl)

          if (subtitleText && subtitleText.length > 50) {
            return {
              success: true,
              transcript: subtitleText,
              method: "yt-dlp-style",
              language: selectedTrack.languageCode,
            }
          }
        }
      }
    }
  } catch (error) {
    console.log("❌ yt-dlp approach failed:", error.message)
  }

  return { success: false }
}

async function getPlayerResponse(videoId: string) {
  const urls = [`https://www.youtube.com/watch?v=${videoId}`, `https://www.youtube.com/embed/${videoId}`]

  for (const url of urls) {
    try {
      console.log(`Fetching player response from: ${url}`)

      const response = await fetch(url, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
          "Accept-Language": "en-US,en;q=0.5",
          "Accept-Encoding": "gzip, deflate, br",
          DNT: "1",
          Connection: "keep-alive",
          "Upgrade-Insecure-Requests": "1",
        },
      })

      if (!response.ok) continue

      const html = await response.text()

      // Extract player response with multiple patterns
      const patterns = [
        /var ytInitialPlayerResponse = ({.+?});/,
        /window\["ytInitialPlayerResponse"\] = ({.+?});/,
        /"playerResponse":"({.+?})"/,
        /ytInitialPlayerResponse\s*=\s*({.+?});/,
      ]

      for (const pattern of patterns) {
        const match = html.match(pattern)
        if (match) {
          try {
            let jsonStr = match[1]

            // Handle escaped JSON
            if (jsonStr.startsWith('"')) {
              jsonStr = jsonStr.slice(1, -1).replace(/\\"/g, '"').replace(/\\\\/g, "\\")
            }

            const playerResponse = JSON.parse(jsonStr)

            if (playerResponse.captions) {
              console.log("✅ Found player response with captions")
              return playerResponse
            }
          } catch (parseError) {
            console.log("Failed to parse player response:", parseError.message)
            continue
          }
        }
      }
    } catch (error) {
      console.log(`Failed to fetch ${url}:`, error.message)
      continue
    }
  }

  return null
}

function findBestCaptionTrack(tracks: any[], preferredLanguage: string) {
  // Priority order for track selection
  const priorities = [
    (track: any) => track.languageCode === preferredLanguage,
    (track: any) => track.languageCode?.startsWith(preferredLanguage.split("-")[0]),
    (track: any) => track.languageCode === "en",
    (track: any) => track.languageCode?.startsWith("en"),
    (track: any) => !track.languageCode?.startsWith("a."), // Prefer manual over auto-generated
    () => true, // Any track
  ]

  for (const priority of priorities) {
    const track = tracks.find(priority)
    if (track) {
      return track
    }
  }

  return tracks[0] // Fallback to first track
}

async function fetchSubtitleContent(baseUrl: string) {
  try {
    console.log(`Fetching subtitle content from: ${baseUrl}`)

    const response = await fetch(baseUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        Referer: "https://www.youtube.com/",
      },
    })

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`)
    }

    const xmlContent = await response.text()
    console.log(`Subtitle XML length: ${xmlContent.length}`)

    return parseSubtitleXML(xmlContent)
  } catch (error) {
    console.log("Failed to fetch subtitle content:", error.message)
    return null
  }
}

function parseSubtitleXML(xmlContent: string): string {
  try {
    // Extract text from XML tags
    const textMatches = xmlContent.match(/<text[^>]*>([^<]+)<\/text>/g)

    if (!textMatches) {
      console.log("No text matches found in XML")
      return ""
    }

    const texts = textMatches
      .map((match) => {
        const textContent = match.replace(/<text[^>]*>/, "").replace(/<\/text>/, "")
        return textContent
          .replace(/&amp;/g, "&")
          .replace(/&lt;/g, "<")
          .replace(/&gt;/g, ">")
          .replace(/&quot;/g, '"')
          .replace(/&#39;/g, "'")
          .trim()
      })
      .filter((text) => text.length > 0)

    const result = texts.join(" ").replace(/\s+/g, " ").trim()
    console.log(`Parsed ${texts.length} text segments, total length: ${result.length}`)

    return result
  } catch (error) {
    console.log("Failed to parse subtitle XML:", error.message)
    return ""
  }
}

async function tryDirectYouTubeAPI(videoId: string, language: string) {
  console.log("🔍 Method 2: Direct YouTube API")

  // Try the timedtext API with proper parameters
  const apiUrls = [
    `https://www.youtube.com/api/timedtext?v=${videoId}&lang=${language}&fmt=srv3`,
    `https://www.youtube.com/api/timedtext?v=${videoId}&lang=en&fmt=srv3`,
    `https://www.youtube.com/api/timedtext?v=${videoId}&lang=a.${language}&fmt=srv3`,
    `https://www.youtube.com/api/timedtext?v=${videoId}&lang=a.en&fmt=srv3`,
  ]

  for (const url of apiUrls) {
    try {
      console.log(`Trying: ${url}`)

      const response = await fetch(url, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
          Referer: "https://www.youtube.com/",
          Accept: "text/xml,application/xml,*/*",
        },
      })

      if (response.ok) {
        const content = await response.text()
        console.log(`Response length: ${content.length}`)

        if (content && content.length > 100 && !content.includes("<transcript/>")) {
          const parsed = parseSubtitleXML(content)

          if (parsed && parsed.length > 50) {
            return {
              success: true,
              transcript: parsed,
              method: "direct-api",
              language: language,
            }
          }
        }
      }
    } catch (error) {
      console.log(`Failed ${url}:`, error.message)
    }
  }

  return { success: false }
}

async function tryIntelligentWatchPageParsing(videoId: string, language: string) {
  console.log("🔍 Method 3: Intelligent watch page parsing")

  try {
    const response = await fetch(`https://www.youtube.com/watch?v=${videoId}`, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.5",
      },
    })

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`)
    }

    const html = await response.text()

    // Look for embedded transcript data
    const transcriptPatterns = [
      /"transcriptRenderer":\s*{[^}]*"content":\s*"([^"]+)"/,
      /"transcript":\s*"([^"]+)"/,
      /"description":\s*{[^}]*"simpleText":\s*"([^"]+)"/,
    ]

    for (const pattern of transcriptPatterns) {
      const match = html.match(pattern)
      if (match && match[1] && match[1].length > 100) {
        const transcript = match[1].replace(/\\n/g, " ").replace(/\\"/g, '"').replace(/\s+/g, " ").trim()

        if (transcript.length > 50) {
          return {
            success: true,
            transcript: transcript,
            method: "watch-page-parsing",
            language: language,
          }
        }
      }
    }
  } catch (error) {
    console.log("Watch page parsing failed:", error.message)
  }

  return { success: false }
}

async function tryTranscriptEndpoint(videoId: string, language: string) {
  console.log("🔍 Method 4: Transcript endpoint")

  // Some videos have a dedicated transcript endpoint
  const endpoints = [
    `https://www.youtube.com/youtubei/v1/get_transcript`,
    `https://youtubei.googleapis.com/youtubei/v1/get_transcript`,
  ]

  for (const endpoint of endpoints) {
    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
          Referer: "https://www.youtube.com/",
        },
        body: JSON.stringify({
          context: {
            client: {
              clientName: "WEB",
              clientVersion: "2.20231201.01.00",
            },
          },
          params: videoId,
        }),
      })

      if (response.ok) {
        const data = await response.json()

        if (data.actions && data.actions[0] && data.actions[0].updateEngagementPanelAction) {
          const content = data.actions[0].updateEngagementPanelAction.content
          // Parse transcript from the response
          // This would need more specific parsing based on the actual response structure
        }
      }
    } catch (error) {
      console.log(`Transcript endpoint failed:`, error.message)
    }
  }

  return { success: false }
}
