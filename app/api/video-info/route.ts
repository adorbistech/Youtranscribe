import { NextResponse } from "next/server"

export async function POST(req: Request) {
  try {
    const { videoId } = await req.json()

    if (!videoId) {
      return NextResponse.json({ error: "Video ID is required" }, { status: 400 })
    }

    const videoInfo = await getVideoInfo(videoId)
    return NextResponse.json(videoInfo)
  } catch (error) {
    console.error("Error getting video info:", error)
    return NextResponse.json({ error: "Failed to get video information" }, { status: 500 })
  }
}

async function getVideoInfo(videoId: string) {
  try {
    const response = await fetch(`https://www.youtube.com/watch?v=${videoId}`, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
      },
    })

    if (!response.ok) {
      throw new Error("Failed to fetch video page")
    }

    const html = await response.text()

    // Extract title
    const titleMatch = html.match(/<title>(.*?)<\/title>/)
    let title = "YouTube Video"
    if (titleMatch) {
      title = titleMatch[1]
        .replace(" - YouTube", "")
        .replace(/&amp;/g, "&")
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .trim()
    }

    // Try to extract more info from JSON-LD or other structured data
    const jsonLdMatch = html.match(/<script type="application\/ld\+json"[^>]*>(.*?)<\/script>/s)
    if (jsonLdMatch) {
      try {
        const jsonData = JSON.parse(jsonLdMatch[1])
        if (jsonData.name) {
          title = jsonData.name
        }
      } catch (e) {
        // Ignore JSON parsing errors
      }
    }

    // Check if video has captions
    const hasCaptions = html.includes('"captionTracks"') || html.includes("captions")

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
