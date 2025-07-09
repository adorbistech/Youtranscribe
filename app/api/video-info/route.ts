import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  }

  try {
    const { videoId } = await request.json()

    if (!videoId) {
      return NextResponse.json({ error: "Video ID is required" }, { status: 400, headers: corsHeaders })
    }

    console.log(`Getting video info for: ${videoId}`)

    const videoInfo = await getVideoInfo(videoId)

    return NextResponse.json(videoInfo, { headers: corsHeaders })
  } catch (error) {
    console.error("Video info error:", error)
    return NextResponse.json({ error: "Failed to get video info" }, { status: 500, headers: corsHeaders })
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  })
}

async function getVideoInfo(videoId: string) {
  try {
    const response = await fetch(`https://www.youtube.com/watch?v=${videoId}`, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      },
    })

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`)
    }

    const html = await response.text()

    // Extract title
    let title = "YouTube Video"
    const titleMatch = html.match(/<title>(.*?)<\/title>/)
    if (titleMatch) {
      title = titleMatch[1].replace(" - YouTube", "").trim()
    }

    // Check for captions
    const hasCaptions = html.includes('"captionTracks"') || html.includes("playerCaptionsTracklistRenderer")

    return {
      title,
      videoId,
      hasCaptions,
      url: `https://www.youtube.com/watch?v=${videoId}`,
    }
  } catch (error) {
    return {
      title: `YouTube Video ${videoId}`,
      videoId,
      hasCaptions: false,
      url: `https://www.youtube.com/watch?v=${videoId}`,
    }
  }
}
