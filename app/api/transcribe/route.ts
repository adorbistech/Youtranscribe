import { type NextRequest, NextResponse } from "next/server"

interface TranscriptionRequest {
  videoId: string
  language?: string
  service?: "whisper" | "google" | "auto"
}

export async function POST(request: NextRequest) {
  // Add CORS headers for extension
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Accept",
  }

  try {
    const body = (await request.json()) as TranscriptionRequest
    const { videoId, language = "en", service = "auto" } = body

    console.log("=== TRANSCRIPTION REQUEST ===")
    console.log("Video ID:", videoId)
    console.log("Language:", language)
    console.log("Service:", service)
    console.log("Request URL:", request.url)
    console.log("Request method:", request.method)

    if (!videoId) {
      return NextResponse.json({ error: "Video ID is required" }, { status: 400, headers })
    }

    // Try enhanced extraction methods
    const subtitles = await extractSubtitlesWithEnhancedMethods(videoId, language)

    if (subtitles && subtitles.length > 50) {
      console.log("✅ SUCCESS: Subtitles extracted successfully")
      console.log("Length:", subtitles.length)
      console.log("Preview:", subtitles.substring(0, 200) + "...")

      return NextResponse.json(
        {
          transcript: subtitles,
          language,
          service: "youtube-cc",
          timestamp: new Date().toISOString(),
          success: true,
        },
        { headers },
      )
    }

    console.log("❌ FAILED: No subtitles found after trying all methods")

    return NextResponse.json(
      {
        error:
          "No subtitles found for this video. This video either doesn't have captions or they're not publicly available.",
        suggestion: "Try a different video with captions, or the creator needs to add subtitles to their video.",
        videoId,
        debug: "All extraction methods failed",
      },
      { status: 404, headers },
    )
  } catch (error) {
    console.error("❌ TRANSCRIPTION ERROR:", error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to process video",
        details: error instanceof Error ? error.stack : "Unknown error",
      },
      { status: 500, headers },
    )
  }
}

// Handle OPTIONS request for CORS
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Accept",
    },
  })
}

async function extractSubtitlesWithEnhancedMethods(videoId: string, preferredLanguage: string): Promise<string | null> {
  console.log("\n=== ENHANCED SUBTITLE EXTRACTION ===")
  console.log("Video ID:", videoId)
  console.log("Preferred Language:", preferredLanguage)

  // Method 1: Try YouTube's official transcript API
  console.log("\n🔍 METHOD 1: Official transcript API")
  const officialResult = await tryOfficialTranscriptAPI(videoId, preferredLanguage)
  if (officialResult) {
    console.log("✅ Method 1 SUCCESS")
    return officialResult
  }

  // Method 2: Try timedtext API with comprehensive language codes
  console.log("\n🔍 METHOD 2: Comprehensive timedtext API")
  const timedTextResult = await tryComprehensiveTimedTextAPI(videoId, preferredLanguage)
  if (timedTextResult) {
    console.log("✅ Method 2 SUCCESS")
    return timedTextResult
  }

  // Method 3: Extract from video page with multiple patterns
  console.log("\n🔍 METHOD 3: Enhanced page extraction")
  const pageResult = await tryEnhancedPageExtraction(videoId, preferredLanguage)
  if (pageResult) {
    console.log("✅ Method 3 SUCCESS")
    return pageResult
  }

  // Method 4: Try with different user agents and headers
  console.log("\n🔍 METHOD 4: Alternative headers and user agents")
  const altHeadersResult = await tryAlternativeHeaders(videoId, preferredLanguage)
  if (altHeadersResult) {
    console.log("✅ Method 4 SUCCESS")
    return altHeadersResult
  }

  console.log("❌ ALL ENHANCED METHODS FAILED")
  return null
}

async function tryOfficialTranscriptAPI(videoId: string, language: string): Promise<string | null> {
  const endpoints = [
    `https://www.youtube.com/youtubei/v1/get_transcript?key=AIzaSyAO_FJ2SlqU8Q4STEHLGCilw_Y9_11qcW8`,
    `https://www.youtube.com/api/timedtext?type=track&lang=${language}&v=${videoId}`,
    `https://www.youtube.com/api/timedtext?type=list&v=${videoId}`,
  ]

  for (const endpoint of endpoints) {
    try {
      console.log(`Trying official API: ${endpoint}`)

      const response = await fetch(endpoint, {
        method: endpoint.includes("youtubei") ? "POST" : "GET",
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          Accept: "application/json, text/xml, */*",
          "Accept-Language": "en-US,en;q=0.9",
          Referer: "https://www.youtube.com/",
          Origin: "https://www.youtube.com",
        },
        body: endpoint.includes("youtubei")
          ? JSON.stringify({
              context: {
                client: {
                  clientName: "WEB",
                  clientVersion: "2.20231201.01.00",
                },
              },
              params: videoId,
            })
          : undefined,
      })

      if (response.ok) {
        const text = await response.text()
        console.log(`Official API response length: ${text.length}`)

        if (text && text.length > 100) {
          const parsed = parseSubtitleContent(text, "auto")
          if (parsed && parsed.length > 50) {
            console.log("✅ Official API success")
            return parsed
          }
        }
      }
    } catch (error) {
      console.log(`❌ Official API error:`, error.message)
    }
  }

  return null
}

async function tryComprehensiveTimedTextAPI(videoId: string, language: string): Promise<string | null> {
  const formats = ["srv3", "vtt", "ttml", "json3", "srt"]
  const languageCodes = [
    language,
    language.split("-")[0],
    `a.${language}`, // Auto-generated
    `a.${language.split("-")[0]}`,
    "en",
    "en-US",
    "en-GB",
    "a.en", // Auto-generated English
  ]

  for (const lang of languageCodes) {
    for (const fmt of formats) {
      try {
        const url = `https://www.youtube.com/api/timedtext?lang=${lang}&v=${videoId}&fmt=${fmt}&tlang=${language}`
        console.log(`Trying comprehensive: ${url}`)

        const response = await fetch(url, {
          headers: {
            "User-Agent":
              "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            Accept: "text/xml,application/xml,application/xhtml+xml,text/html;q=0.9,text/plain;q=0.8,*/*;q=0.5",
            "Accept-Language": "en-US,en;q=0.5",
            Referer: "https://www.youtube.com/",
            Origin: "https://www.youtube.com",
            "Cache-Control": "no-cache",
          },
        })

        if (response.ok) {
          const text = await response.text()
          console.log(`Response for ${lang}/${fmt}: ${text.length} chars`)

          if (text && text.length > 100 && !text.includes('<?xml version="1.0" encoding="utf-8" ?><transcript/>')) {
            const parsed = parseSubtitleContent(text, fmt)
            if (parsed && parsed.length > 50) {
              console.log(`✅ Comprehensive success with ${lang}/${fmt}`)
              return parsed
            }
          }
        }
      } catch (error) {
        console.log(`❌ Error with ${lang}/${fmt}:`, error.message)
      }
    }
  }

  return null
}

async function tryEnhancedPageExtraction(videoId: string, language: string): Promise<string | null> {
  try {
    const pageUrl = `https://www.youtube.com/watch?v=${videoId}&hl=${language}`
    console.log(`Fetching enhanced page: ${pageUrl}`)

    const response = await fetch(pageUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
        "Accept-Language": `${language},en;q=0.9`,
        "Cache-Control": "no-cache",
        "Sec-Fetch-Dest": "document",
        "Sec-Fetch-Mode": "navigate",
        "Sec-Fetch-Site": "none",
        "Upgrade-Insecure-Requests": "1",
      },
    })

    if (!response.ok) {
      console.log(`❌ Failed to fetch page: ${response.status}`)
      return null
    }

    const html = await response.text()
    console.log(`Enhanced page HTML length: ${html.length}`)

    // Multiple extraction patterns
    const patterns = [
      // Player response patterns
      /var ytInitialPlayerResponse = ({.*?});/s,
      /"playerResponse":"(.*?)","playerAds"/s,
      /ytInitialPlayerResponse\s*=\s*({.*?});/s,
      /window\["ytInitialPlayerResponse"\]\s*=\s*({.*?});/s,

      // Direct caption track patterns
      /"captionTracks":\s*(\[.*?\])/s,
      /"captions":\s*{[^}]*"playerCaptionsTracklistRenderer":\s*{[^}]*"captionTracks":\s*(\[.*?\])/s,

      // Alternative patterns
      /playerCaptionsTracklistRenderer.*?captionTracks.*?(\[.*?\])/s,
    ]

    for (const pattern of patterns) {
      const match = html.match(pattern)
      if (match) {
        try {
          let playerData = match[1]

          // Handle escaped JSON
          if (match[0].includes('"playerResponse"')) {
            playerData = playerData.replace(/\\"/g, '"').replace(/\\\\/g, "\\")
          }

          let parsedData
          if (playerData.startsWith("[")) {
            // Direct caption tracks array
            parsedData = { captions: { playerCaptionsTracklistRenderer: { captionTracks: JSON.parse(playerData) } } }
          } else {
            // Full player response
            parsedData = JSON.parse(playerData)
          }

          console.log("Found player response data")

          const tracks = parsedData.captions?.playerCaptionsTracklistRenderer?.captionTracks
          if (tracks && tracks.length > 0) {
            console.log(`Found ${tracks.length} caption tracks:`)

            tracks.forEach((track, i) => {
              console.log(
                `Track ${i}: ${track.languageCode} - ${track.name?.simpleText || track.name?.runs?.[0]?.text || "No name"}`,
              )
            })

            // Find best matching track with priority
            const selectedTrack =
              tracks.find((track) => track.languageCode === language) ||
              tracks.find((track) => track.languageCode?.startsWith(language.split("-")[0])) ||
              tracks.find((track) => track.languageCode === "en" || track.languageCode?.startsWith("en")) ||
              tracks.find((track) => track.languageCode?.startsWith("a.")) || // Auto-generated
              tracks[0]

            if (selectedTrack?.baseUrl) {
              console.log(`Selected track: ${selectedTrack.languageCode}`)
              console.log(`Base URL: ${selectedTrack.baseUrl}`)

              const subtitleResponse = await fetch(selectedTrack.baseUrl, {
                headers: {
                  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
                  Referer: "https://www.youtube.com/",
                },
              })

              if (subtitleResponse.ok) {
                const xmlData = await subtitleResponse.text()
                console.log(`Subtitle data length: ${xmlData.length}`)

                const parsed = parseSubtitleContent(xmlData, "xml")
                if (parsed && parsed.length > 50) {
                  console.log("✅ Enhanced page extraction success")
                  return parsed
                }
              }
            }
          }
        } catch (parseError) {
          console.log("❌ Error parsing player response:", parseError.message)
          continue
        }
      }
    }

    return null
  } catch (error) {
    console.log("❌ Enhanced page extraction error:", error.message)
    return null
  }
}

async function tryAlternativeHeaders(videoId: string, language: string): Promise<string | null> {
  const userAgents = [
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/121.0",
  ]

  const endpoints = [
    `https://www.youtube.com/api/timedtext?lang=${language}&v=${videoId}&fmt=srv3`,
    `https://www.youtube.com/api/timedtext?lang=a.${language}&v=${videoId}&fmt=srv3`,
    `https://www.youtube.com/api/timedtext?lang=en&v=${videoId}&fmt=srv3`,
    `https://video.google.com/timedtext?lang=${language}&v=${videoId}`,
  ]

  for (const userAgent of userAgents) {
    for (const endpoint of endpoints) {
      try {
        console.log(`Trying alternative headers: ${endpoint}`)

        const response = await fetch(endpoint, {
          headers: {
            "User-Agent": userAgent,
            Accept: "text/xml,application/xml,*/*",
            "Accept-Language": `${language},en;q=0.9`,
            Referer: "https://www.youtube.com/",
            Origin: "https://www.youtube.com",
            "Sec-Fetch-Dest": "empty",
            "Sec-Fetch-Mode": "cors",
            "Sec-Fetch-Site": "same-origin",
          },
        })

        if (response.ok) {
          const text = await response.text()
          if (text && text.length > 100) {
            const parsed = parseSubtitleContent(text, "srv3")
            if (parsed && parsed.length > 50) {
              console.log("✅ Alternative headers success")
              return parsed
            }
          }
        }
      } catch (error) {
        console.log(`❌ Alternative headers error:`, error.message)
      }
    }
  }

  return null
}

function parseSubtitleContent(content: string, format: string): string {
  try {
    console.log(`\n📝 PARSING CONTENT (${format})`)
    console.log(`Content length: ${content.length}`)
    console.log(`Content preview: ${content.substring(0, 300)}`)

    // Auto-detect format if not specified
    if (format === "auto") {
      if (content.includes("WEBVTT")) format = "vtt"
      else if (content.startsWith("{") || content.includes('"events"')) format = "json3"
      else if (content.includes("<transcript>") || content.includes("<text")) format = "srv3"
      else format = "xml"
    }

    // Handle different formats
    switch (format) {
      case "vtt":
        return parseWebVTT(content)
      case "json3":
        return parseJSON3(content)
      case "srv3":
        return parseSRV3(content)
      default:
        return parseXML(content)
    }
  } catch (error) {
    console.error("❌ Parse error:", error)
    return ""
  }
}

function parseWebVTT(content: string): string {
  const lines = content.split("\n")
  const textLines = lines.filter(
    (line) =>
      line.trim() &&
      !line.includes("WEBVTT") &&
      !line.includes("-->") &&
      !line.match(/^\d+$/) &&
      !line.match(/^\d{2}:\d{2}:\d{2}/) &&
      !line.includes("NOTE") &&
      !line.includes("STYLE") &&
      !line.includes("Kind:") &&
      !line.includes("Language:") &&
      !line.match(/^STYLE/) &&
      !line.match(/^NOTE/),
  )

  const result = textLines
    .join(" ")
    .replace(/\s+/g, " ")
    .replace(/<[^>]*>/g, "") // Remove HTML tags
    .trim()

  console.log(`WebVTT parsed length: ${result.length}`)
  return result
}

function parseJSON3(content: string): string {
  try {
    const data = JSON.parse(content)
    const events = data.events || []
    const texts = events
      .filter((event) => event.segs)
      .flatMap((event) => event.segs)
      .filter((seg) => seg.utf8)
      .map((seg) => seg.utf8.trim())
      .filter((text) => text.length > 0)

    const result = texts.join(" ").replace(/\s+/g, " ").trim()
    console.log(`JSON3 parsed length: ${result.length}`)
    return result
  } catch (error) {
    console.log("❌ JSON3 parse error:", error)
    return ""
  }
}

function parseSRV3(content: string): string {
  const textRegex = /<text[^>]*>(.*?)<\/text>/g
  const matches = []
  let match

  while ((match = textRegex.exec(content)) !== null) {
    const text = match[1]
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&apos;/g, "'")
      .replace(/<[^>]*>/g, "")
      .replace(/\s+/g, " ")
      .trim()

    if (text && text.length > 2) {
      matches.push(text)
    }
  }

  const result = matches.join(" ").trim()
  console.log(`SRV3 parsed length: ${result.length}`)
  return result
}

function parseXML(content: string): string {
  const patterns = [
    /<text[^>]*>(.*?)<\/text>/g,
    /<p[^>]*>(.*?)<\/p>/g,
    /<span[^>]*>(.*?)<\/span>/g,
    /<div[^>]*>(.*?)<\/div>/g,
  ]

  for (const pattern of patterns) {
    const matches = []
    let match

    while ((match = pattern.exec(content)) !== null) {
      const text = match[1]
        .replace(/&amp;/g, "&")
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/&apos;/g, "'")
        .replace(/<[^>]*>/g, "")
        .replace(/\s+/g, " ")
        .trim()

      if (text && text.length > 2) {
        matches.push(text)
      }
    }

    if (matches.length > 0) {
      const result = matches.join(" ").trim()
      console.log(`XML parsed length: ${result.length}`)
      return result
    }
  }

  return ""
}
