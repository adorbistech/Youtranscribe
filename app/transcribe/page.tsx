"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Loader2,
  Copy,
  Download,
  Youtube,
  Sparkles,
  FileText,
  ArrowLeft,
  CheckCircle,
  AlertCircle,
  Info,
  ExternalLink,
  RefreshCw,
} from "lucide-react"
import Link from "next/link"

interface VideoInfo {
  title: string
  videoId: string
  hasCaptions: boolean
  url: string
}

interface TranscriptionResult {
  transcript: string
  service: string
  language: string
  videoTitle?: string
  videoId?: string
}

export default function TranscribePage() {
  const [youtubeUrl, setYoutubeUrl] = useState("")
  const [selectedService, setSelectedService] = useState("auto")
  const [selectedLanguage, setSelectedLanguage] = useState("en")
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingInfo, setIsLoadingInfo] = useState(false)
  const [result, setResult] = useState<TranscriptionResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [videoInfo, setVideoInfo] = useState<VideoInfo | null>(null)
  const [copySuccess, setCopySuccess] = useState(false)
  const [apiStatus, setApiStatus] = useState<string>("unknown")

  const extractVideoId = (url: string): string | null => {
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
      /youtube\.com\/watch\?.*v=([^&\n?#]+)/,
    ]

    for (const pattern of patterns) {
      const match = url.match(pattern)
      if (match) return match[1]
    }
    return null
  }

  const testAPI = async () => {
    try {
      console.log("🧪 Testing API...")
      setApiStatus("testing")

      const response = await fetch("/api/youtube-simple", {
        method: "GET",
      })

      console.log("📡 API test response:", response.status)

      if (response.ok) {
        const data = await response.json()
        console.log("✅ API test successful:", data)
        setApiStatus("healthy")
      } else {
        console.error("❌ API test failed:", response.status)
        setApiStatus("error")
      }
    } catch (error) {
      console.error("❌ API test error:", error)
      setApiStatus("error")
    }
  }

  const handleUrlChange = async (url: string) => {
    setYoutubeUrl(url)
    setError(null)
    setVideoInfo(null)

    const videoId = extractVideoId(url)
    if (videoId && url.trim().length > 10) {
      setIsLoadingInfo(true)
      try {
        console.log("🔍 Getting video info for:", videoId)

        const response = await fetch("/api/youtube-simple", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify({
            videoId,
            action: "video-info",
          }),
        })

        console.log("📡 Video info response:", response.status)

        if (response.ok) {
          const info = await response.json()
          console.log("📺 Video info:", info)
          setVideoInfo(info)
        } else {
          const errorText = await response.text()
          console.error("❌ Video info error:", errorText)
        }
      } catch (error) {
        console.error("Failed to get video info:", error)
      } finally {
        setIsLoadingInfo(false)
      }
    }
  }

  const handleTranscribe = async () => {
    if (!youtubeUrl.trim()) {
      setError("Please enter a YouTube URL")
      return
    }

    const videoId = extractVideoId(youtubeUrl)
    if (!videoId) {
      setError("Invalid YouTube URL. Please enter a valid YouTube video URL.")
      return
    }

    setIsLoading(true)
    setError(null)
    setResult(null)

    try {
      console.log("🎯 Making transcription request for:", videoId)

      const response = await fetch("/api/youtube-simple", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          videoId,
          language: selectedLanguage,
          action: "transcribe",
        }),
      })

      console.log("📡 Response status:", response.status)
      console.log("📡 Response headers:", Object.fromEntries(response.headers.entries()))

      if (!response.ok) {
        const errorText = await response.text()
        console.error("❌ Error response:", errorText)

        try {
          const errorData = JSON.parse(errorText)
          throw new Error(errorData.error || `HTTP ${response.status}`)
        } catch (parseError) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`)
        }
      }

      const data = await response.json()
      console.log("📄 Response data:", data)

      setResult({
        transcript: data.transcript,
        service: data.service,
        language: data.language,
        videoId,
        videoTitle: videoInfo?.title || `YouTube Video ${videoId}`,
      })

      // Save to history
      await fetch("/api/history", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          videoId,
          title: videoInfo?.title || `YouTube Video ${videoId}`,
          transcript: data.transcript,
          service: data.service,
          language: data.language,
        }),
      }).catch(console.error)
    } catch (error) {
      console.error("Transcription error:", error)
      setError(error instanceof Error ? error.message : "Transcription failed")
    } finally {
      setIsLoading(false)
    }
  }

  const copyToClipboard = async () => {
    if (result) {
      try {
        await navigator.clipboard.writeText(result.transcript)
        setCopySuccess(true)
        setTimeout(() => setCopySuccess(false), 2000)
      } catch (error) {
        console.error("Failed to copy:", error)
      }
    }
  }

  const downloadTranscript = () => {
    if (result) {
      const blob = new Blob([result.transcript], { type: "text/plain" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `transcript_${result.videoId}.txt`
      a.click()
      URL.revokeObjectURL(url)
    }
  }

  const loadRickRoll = () => {
    setYoutubeUrl("https://www.youtube.com/watch?v=dQw4w9WgXcQ")
    handleUrlChange("https://www.youtube.com/watch?v=dQw4w9WgXcQ")
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link href="/" className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-4">
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Link>
          <div className="flex items-center gap-3 mb-2">
            <Youtube className="w-8 h-8 text-red-600" />
            <h1 className="text-3xl font-bold text-gray-900">YouTube Transcriber</h1>
          </div>
          <p className="text-gray-600">Extract subtitles and captions from any YouTube video</p>
        </div>

        {/* API Status */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">API Status:</span>
                <Badge
                  variant={apiStatus === "healthy" ? "default" : apiStatus === "error" ? "destructive" : "secondary"}
                >
                  {apiStatus === "healthy"
                    ? "✅ Healthy"
                    : apiStatus === "error"
                      ? "❌ Error"
                      : apiStatus === "testing"
                        ? "🔄 Testing"
                        : "❓ Unknown"}
                </Badge>
              </div>
              <Button size="sm" variant="outline" onClick={testAPI} disabled={apiStatus === "testing"}>
                {apiStatus === "testing" ? (
                  <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                ) : (
                  <RefreshCw className="w-4 h-4 mr-1" />
                )}
                Test API
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Input Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Transcribe YouTube Video
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">YouTube URL</label>
                <Input
                  placeholder="https://www.youtube.com/watch?v=dQw4w9WgXcQ"
                  value={youtubeUrl}
                  onChange={(e) => handleUrlChange(e.target.value)}
                  className="w-full"
                />
                <div className="flex items-center gap-2 mt-2">
                  <p className="text-xs text-gray-500">Try the Rick Roll video (known to have captions)</p>
                  <Button size="sm" variant="outline" onClick={loadRickRoll}>
                    Load Rick Roll
                  </Button>
                </div>
              </div>

              {/* Video Info */}
              {isLoadingInfo && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Loading video information...
                </div>
              )}

              {videoInfo && (
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    <div className="space-y-1">
                      <div className="font-medium">{videoInfo.title}</div>
                      <div className="flex items-center gap-2 text-sm">
                        {videoInfo.hasCaptions ? (
                          <span className="flex items-center gap-1 text-green-600">
                            <CheckCircle className="w-3 h-3" />
                            Captions available
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-orange-600">
                            <AlertCircle className="w-3 h-3" />
                            No captions detected
                          </span>
                        )}
                      </div>
                    </div>
                  </AlertDescription>
                </Alert>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Service</label>
                  <Select value={selectedService} onValueChange={setSelectedService}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="auto">Auto (Extract Captions)</SelectItem>
                      <SelectItem value="whisper" disabled>
                        OpenAI Whisper (Coming Soon)
                      </SelectItem>
                      <SelectItem value="google" disabled>
                        Google Speech (Coming Soon)
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Language</label>
                  <Select value={selectedLanguage} onValueChange={setSelectedLanguage}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="es">Spanish</SelectItem>
                      <SelectItem value="fr">French</SelectItem>
                      <SelectItem value="de">German</SelectItem>
                      <SelectItem value="it">Italian</SelectItem>
                      <SelectItem value="pt">Portuguese</SelectItem>
                      <SelectItem value="ru">Russian</SelectItem>
                      <SelectItem value="ja">Japanese</SelectItem>
                      <SelectItem value="ko">Korean</SelectItem>
                      <SelectItem value="zh">Chinese</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Button onClick={handleTranscribe} disabled={isLoading || !youtubeUrl.trim()} className="w-full">
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Extracting Captions...
                  </>
                ) : (
                  <>
                    <Youtube className="w-4 h-4 mr-2" />
                    Extract Captions
                  </>
                )}
              </Button>

              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>

          {/* Result Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="w-5 h-5" />
                Transcription Result
              </CardTitle>
            </CardHeader>
            <CardContent>
              {result ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Badge variant="secondary">{result.service}</Badge>
                    <Badge variant="outline">{result.language}</Badge>
                    <span className="text-sm text-gray-500">{result.transcript.length} characters</span>
                  </div>

                  <Textarea
                    value={result.transcript}
                    readOnly
                    className="min-h-64 text-sm"
                    placeholder="Transcription will appear here..."
                  />

                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={copyToClipboard}
                      className={copySuccess ? "text-green-600" : ""}
                    >
                      {copySuccess ? (
                        <>
                          <CheckCircle className="w-4 h-4 mr-1" />
                          Copied!
                        </>
                      ) : (
                        <>
                          <Copy className="w-4 h-4 mr-1" />
                          Copy
                        </>
                      )}
                    </Button>
                    <Button size="sm" variant="outline" onClick={downloadTranscript}>
                      <Download className="w-4 h-4 mr-1" />
                      Download
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="text-center text-gray-500 py-12">
                  <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Enter a YouTube URL and click "Extract Captions" to get started</p>
                  <p className="text-sm mt-2">Try the Rick Roll video for testing!</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Debug Section */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>🧪 Debug & Testing</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              <Button size="sm" variant="outline" onClick={() => window.open("/api/youtube-simple", "_blank")}>
                <ExternalLink className="w-4 h-4 mr-1" />
                Test API Direct
              </Button>
              <Button size="sm" variant="outline" onClick={loadRickRoll}>
                Load Rick Roll
              </Button>
              <Button size="sm" variant="outline" onClick={testAPI}>
                Test Connection
              </Button>
              <Button size="sm" variant="outline" onClick={() => window.open("/dashboard", "_blank")}>
                Dashboard
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
