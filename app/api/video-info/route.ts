import { NextResponse } from "next/server"

export async function POST(req: Request) {
  // Add CORS headers
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Accept",
  }

  try {
    const { videoId } = await req.json()

    console.log("=== VIDEO INFO REQUEST ===")
    console.log("Video ID:", videoId)

    if (!videoId) {
      return NextResponse.json({ error: "Video ID is required" }, { status: 400, headers })
    }

    const videoInfo = await getVideoInfo(videoId)
    console.log("Video info result:", videoInfo)

    return NextResponse.json(videoInfo, { headers })
  } catch (error) {
    console.error("Error getting video info:", error)
    return NextResponse.json({ error: "Failed to get video information" }, { status: 500, headers })
  }
}

// Handle OPTIONS request for CORS
export async function OPTIONS(request: Request) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Accept",
    },
  })
}

async function getVideoInfo(videoId: string) {
  try {
    console.log(`Getting video info for: ${videoId}`)

    const response = await fetch(`https://www.youtube.com/watch?v=${videoId}`, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
        "Cache-Control": "no-cache",
      },
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch video page: ${response.status}`)
    }

    const html = await response.text()
    console.log("Video page fetched, length:", html.length)

    // Extract title with multiple patterns
    let title = "YouTube Video"
    const titlePatterns = [
      /<title>(.*?)<\/title>/,
      /"title":"(.*?)"/,
      /"videoDetails":\s*{[^}]*"title":"(.*?)"/,
      /property="og:title"\s+content="(.*?)"/,
    ]

    for (const pattern of titlePatterns) {
      const titleMatch = html.match(pattern)
      if (titleMatch) {
        title = titleMatch[1]
          .replace(" - YouTube", "")
          .replace(/&amp;/g, "&")
          .replace(/&lt;/g, "<")
          .replace(/&gt;/g, ">")
          .replace(/&quot;/g, '"')
          .replace(/&#39;/g, "'")
          .replace(/\\u0026/g, "&")
          .replace(/\\"/g, '"')
          .trim()

        if (title && title.length > 3) {
          console.log("Title extracted:", title)
          break
        }
      }
    }

    // Check for captions with multiple patterns
    const captionPatterns = [
      /"captionTracks":\s*\[/,
      /"captions":\s*{[^}]*"playerCaptionsTracklistRenderer"/,
      /playerCaptionsTracklistRenderer.*?captionTracks/,
      /"hasClosedCaptions":true/,
      /"subtitlesLanguages":\s*\[/,
    ]

    let hasCaptions = false
    for (const pattern of captionPatterns) {
      if (html.match(pattern)) {
        hasCaptions = true
        console.log("Captions detected with pattern:", pattern.source)
        break
      }
    }

    // Additional caption detection
    if (!hasCaptions) {
      // Look for specific caption indicators
      const captionIndicators = ["captions", "subtitles", "closedCaptions", "timedtext", "transcript"]

      for (const indicator of captionIndicators) {
        if (html.toLowerCase().includes(indicator)) {
          hasCaptions = true
          console.log("Captions detected via indicator:", indicator)
          break
        }
      }
    }

    console.log("Caption detection result:", hasCaptions)

    return {
      title,
      videoId,
      hasCaptions,
      url: `https://www.youtube.com/watch?v=${videoId}`,
    }
  } catch (error) {
    console.error("Error extracting video info:", error)
    return {
      title: `YouTube Video ${videoId}`,
      videoId,
      hasCaptions: false,
      url: `https://www.youtube.com/watch?v=${videoId}`,
    }
  }
}
