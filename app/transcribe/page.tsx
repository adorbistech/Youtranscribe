"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Loader2, Copy, Download, Youtube, Sparkles, Globe, FileText, ArrowLeft } from "lucide-react"
import Link from "next/link"

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
  const [result, setResult] = useState<TranscriptionResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [availableModels, setAvailableModels] = useState<any[]>([])
  const [selectedModel, setSelectedModel] = useState("deepseek/deepseek-r1-distill-qwen-14b:free")

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
      const response = await fetch("/api/transcribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          videoId,
          service: selectedService === "auto" ? "whisper" : selectedService,
          language: selectedLanguage,
        }),
      })

      const data = await response.json()

      if (data.error) {
        throw new Error(data.error)
      }

      setResult({
        transcript: data.transcript,
        service: data.service,
        language: data.language,
        videoId,
        videoTitle: `YouTube Video ${videoId}`,
      })

      // Save to history
      await fetch("/api/history", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          videoId,
          title: `YouTube Video ${videoId}`,
          transcript: data.transcript,
          service: data.service,
          language: data.language,
        }),
      })
    } catch (error) {
      console.error("Transcription error:", error)
      setError(error instanceof Error ? error.message : "Transcription failed")
    } finally {
      setIsLoading(false)
    }
  }

  const copyToClipboard = () => {
    if (result) {
      navigator.clipboard.writeText(result.transcript)
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

  const enhanceTranscript = async (action: string, targetLanguage?: string) => {
    if (!result) return

    setIsLoading(true)
    try {
      const response = await fetch("/api/enhance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          transcript: result.transcript,
          action,
          targetLanguage,
          model: selectedModel,
        }),
      })

      const data = await response.json()

      if (data.error) {
        throw new Error(data.error)
      }

      setResult((prev) => (prev ? { ...prev, transcript: data.result } : null))
    } catch (error) {
      console.error("Enhancement error:", error)
      setError("Enhancement failed")
    } finally {
      setIsLoading(false)
    }
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
          <p className="text-gray-600">Paste any YouTube URL to extract subtitles or generate AI transcriptions</p>
        </div>

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
                  placeholder="https://www.youtube.com/watch?v=..."
                  value={youtubeUrl}
                  onChange={(e) => setYoutubeUrl(e.target.value)}
                  className="w-full"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Supports youtube.com/watch, youtu.be, and youtube.com/embed URLs
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Service</label>
                  <Select value={selectedService} onValueChange={setSelectedService}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="auto">Auto (CC first, then AI)</SelectItem>
                      <SelectItem value="whisper">OpenAI Whisper</SelectItem>
                      <SelectItem value="google">Google Speech</SelectItem>
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

              <Button onClick={handleTranscribe} disabled={isLoading} className="w-full">
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Youtube className="w-4 h-4 mr-2" />
                    Transcribe Video
                  </>
                )}
              </Button>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">{error}</div>
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
                  </div>

                  <Textarea
                    value={result.transcript}
                    readOnly
                    className="min-h-64 text-sm"
                    placeholder="Transcription will appear here..."
                  />

                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={copyToClipboard}>
                      <Copy className="w-4 h-4 mr-1" />
                      Copy
                    </Button>
                    <Button size="sm" variant="outline" onClick={downloadTranscript}>
                      <Download className="w-4 h-4 mr-1" />
                      Download
                    </Button>
                  </div>

                  <div className="border-t pt-4">
                    <h4 className="font-medium mb-3 flex items-center gap-2">
                      <Sparkles className="w-4 h-4" />
                      AI Enhancements
                    </h4>
                    <div className="grid grid-cols-2 gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => enhanceTranscript("summarize")}
                        disabled={isLoading}
                      >
                        📝 Summarize
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => enhanceTranscript("extract-key-points")}
                        disabled={isLoading}
                      >
                        🎯 Key Points
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => enhanceTranscript("translate", "es")}
                        disabled={isLoading}
                      >
                        <Globe className="w-4 h-4 mr-1" />
                        Spanish
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => enhanceTranscript("translate", "fr")}
                        disabled={isLoading}
                      >
                        <Globe className="w-4 h-4 mr-1" />
                        French
                      </Button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center text-gray-500 py-12">
                  <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Enter a YouTube URL and click "Transcribe Video" to get started</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* How it works */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>How It Works</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                  <span className="text-blue-600 font-bold">1</span>
                </div>
                <h3 className="font-medium mb-2">Extract URL</h3>
                <p className="text-sm text-gray-600">
                  We extract the video ID from your YouTube URL and check for existing subtitles
                </p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                  <span className="text-green-600 font-bold">2</span>
                </div>
                <h3 className="font-medium mb-2">Smart Processing</h3>
                <p className="text-sm text-gray-600">
                  First try existing captions, then fall back to AI transcription if needed
                </p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                  <span className="text-purple-600 font-bold">3</span>
                </div>
                <h3 className="font-medium mb-2">AI Enhancement</h3>
                <p className="text-sm text-gray-600">
                  Use AI to summarize, translate, or extract key insights from the transcript
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
