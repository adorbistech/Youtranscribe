import { type NextRequest, NextResponse } from "next/server"

export async function GET() {
  return NextResponse.json({
    message: "YouTube Transcribe API",
    status: "ready",
    methods: ["POST"],
    timestamp: new Date().toISOString(),
  })
}

export async function POST(request: NextRequest) {
  console.log("🚀 TRANSCRIBE API CALLED")
  console.log("Request URL:", request.url)
  console.log("Request method:", request.method)

  // Add CORS headers
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  }

  try {
    const body = await request.json()
    console.log("📝 Request body:", body)

    const { videoId, language = "en" } = body

    if (!videoId) {
      console.log("❌ No video ID provided")
      return NextResponse.json({ error: "Video ID is required", received: body }, { status: 400, headers: corsHeaders })
    }

    console.log(`🎯 Processing video: ${videoId}`)

    // Try to extract subtitles using a working method
    const result = await extractSubtitles(videoId, language)

    if (result.success) {
      console.log("✅ SUCCESS - Subtitles found")
      return NextResponse.json(
        {
          transcript: result.transcript,
          service: result.method,
          language: result.language,
          success: true,
        },
        { headers: corsHeaders },
      )
    } else {
      console.log("❌ FAILED - No subtitles found")
      return NextResponse.json(
        {
          error: "No subtitles found for this video",
          details: result.error,
          videoId,
          debug: result.debug,
        },
        { status: 404, headers: corsHeaders },
      )
    }
  } catch (error) {
    console.error("💥 API ERROR:", error)
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500, headers: corsHeaders },
    )
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  })
}

async function extractSubtitles(videoId: string, language: string) {
  console.log(`\n🔍 EXTRACTING SUBTITLES FOR: ${videoId}`)

  // Method 1: Try the YouTube watch page approach
  try {
    console.log("📺 Method 1: YouTube watch page")
    const watchResult = await extractFromWatchPage(videoId, language)
    if (watchResult.success) {
      return watchResult
    }
  } catch (error) {
    console.log("❌ Watch page method failed:", error.message)
  }

  // Method 2: Try direct timedtext API
  try {
    console.log("🔗 Method 2: Direct timedtext API")
    const apiResult = await extractFromTimedTextAPI(videoId, language)
    if (apiResult.success) {
      return apiResult
    }
  } catch (error) {
    console.log("❌ TimedText API method failed:", error.message)
  }

  // Method 3: Try alternative endpoints
  try {
    console.log("🌐 Method 3: Alternative endpoints")
    const altResult = await extractFromAlternativeEndpoints(videoId, language)
    if (altResult.success) {
      return altResult
    }
  } catch (error) {
    console.log("❌ Alternative endpoints failed:", error.message)
  }

  return {
    success: false,
    error: "All extraction methods failed",
    debug: "No accessible subtitles found using any method",
    transcript: "",
    method: "none",
    language: language,
  }
}

async function extractFromWatchPage(videoId: string, language: string) {
  const url = `https://www.youtube.com/watch?v=${videoId}`
  console.log(`Fetching: ${url}`)

  const response = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
      "Accept-Language": "en-US,en;q=0.5",
      "Cache-Control": "no-cache",
    },
  })

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`)
  }

  const html = await response.text()
  console.log(`HTML length: ${html.length}`)

  // Look for player response in the HTML
  const playerResponseMatch = html.match(/var ytInitialPlayerResponse = ({.+?});/)

  if (!playerResponseMatch) {
    console.log("❌ No player response found")
    return { success: false }
  }

  try {
    const playerResponse = JSON.parse(playerResponseMatch[1])
    console.log("✅ Player response parsed")

    const captions = playerResponse.captions?.playerCaptionsTracklistRenderer?.captionTracks

    if (!captions || captions.length === 0) {
      console.log("❌ No caption tracks found")
      return { success: false }
    }

    console.log(`📋 Found ${captions.length} caption tracks`)

    // Find the best caption track
    const selectedTrack =
      captions.find((track) => track.languageCode === language) ||
      captions.find((track) => track.languageCode?.startsWith(language.split("-")[0])) ||
      captions.find((track) => track.languageCode === "en") ||
      captions[0]

    if (!selectedTrack?.baseUrl) {
      console.log("❌ No suitable caption track found")
      return { success: false }
    }

    console.log(`🎯 Selected track: ${selectedTrack.languageCode}`)
    console.log(`🔗 Base URL: ${selectedTrack.baseUrl}`)

    // Fetch the subtitle content
    const subtitleResponse = await fetch(selectedTrack.baseUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        Referer: "https://www.youtube.com/",
      },
    })

    if (!subtitleResponse.ok) {
      throw new Error(`Subtitle fetch failed: ${subtitleResponse.status}`)
    }

    const subtitleXML = await subtitleResponse.text()
    console.log(`📄 Subtitle XML length: ${subtitleXML.length}`)

    const transcript = parseSubtitleXML(subtitleXML)

    if (transcript && transcript.length > 50) {
      console.log(`✅ Transcript extracted: ${transcript.length} characters`)
      return {
        success: true,
        transcript: transcript,
        method: "watch-page",
        language: selectedTrack.languageCode,
      }
    }

    return { success: false }
  } catch (parseError) {
    console.log("❌ Failed to parse player response:", parseError.message)
    return { success: false }
  }
}

async function extractFromTimedTextAPI(videoId: string, language: string) {
  const urls = [
    `https://www.youtube.com/api/timedtext?v=${videoId}&lang=${language}&fmt=srv3`,
    `https://www.youtube.com/api/timedtext?v=${videoId}&lang=en&fmt=srv3`,
    `https://www.youtube.com/api/timedtext?v=${videoId}&lang=a.${language}&fmt=srv3`,
    `https://www.youtube.com/api/timedtext?v=${videoId}&lang=a.en&fmt=srv3`,
  ]

  for (const url of urls) {
    try {
      console.log(`Trying: ${url}`)

      const response = await fetch(url, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
          Referer: "https://www.youtube.com/",
        },
      })

      if (response.ok) {
        const content = await response.text()
        console.log(`Response length: ${content.length}`)

        if (content && content.length > 100 && !content.includes("<transcript/>")) {
          const transcript = parseSubtitleXML(content)

          if (transcript && transcript.length > 50) {
            return {
              success: true,
              transcript: transcript,
              method: "timedtext-api",
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

async function extractFromAlternativeEndpoints(videoId: string, language: string) {
  // Try some alternative approaches that might work
  const endpoints = [
    `https://video.google.com/timedtext?lang=${language}&v=${videoId}`,
    `https://www.youtube.com/api/timedtext?type=track&lang=${language}&v=${videoId}`,
  ]

  for (const endpoint of endpoints) {
    try {
      console.log(`Trying alternative: ${endpoint}`)

      const response = await fetch(endpoint, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
          Referer: "https://www.youtube.com/",
        },
      })

      if (response.ok) {
        const content = await response.text()

        if (content && content.length > 100) {
          const transcript = parseSubtitleXML(content)

          if (transcript && transcript.length > 50) {
            return {
              success: true,
              transcript: transcript,
              method: "alternative-endpoint",
              language: language,
            }
          }
        }
      }
    } catch (error) {
      console.log(`Alternative endpoint failed:`, error.message)
    }
  }

  return { success: false }
}

function parseSubtitleXML(xmlContent: string): string {
  try {
    // Extract text content from XML
    const textMatches = xmlContent.match(/<text[^>]*>([^<]+)<\/text>/g)

    if (!textMatches) {
      console.log("❌ No text matches found in XML")
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
    console.log(`📝 Parsed ${texts.length} text segments, total: ${result.length} chars`)

    return result
  } catch (error) {
    console.log("❌ Failed to parse XML:", error.message)
    return ""
  }
}
