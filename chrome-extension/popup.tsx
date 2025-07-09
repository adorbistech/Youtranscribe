"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Loader2, Copy, Download, ImportIcon as Translate, FileText, Sparkles } from "lucide-react"
import { chrome } from "global" // Declare the chrome variable

interface TranscriptionState {
  transcript: string
  isLoading: boolean
  error: string | null
  service: string
  language: string
  availableModels: any[]
  selectedModel: string
}

export default function ExtensionPopup() {
  const [state, setState] = useState<TranscriptionState>({
    transcript: "",
    isLoading: false,
    error: null,
    service: "",
    language: "en",
    availableModels: [],
    selectedModel: "deepseek/deepseek-r1-distill-qwen-14b:free",
  })

  const [selectedService, setSelectedService] = useState("whisper")
  const [selectedLanguage, setSelectedLanguage] = useState("en")
  const [currentVideoId, setCurrentVideoId] = useState<string | null>(null)

  useEffect(() => {
    // Get current YouTube video ID
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const tab = tabs[0]
      if (tab.url?.includes("youtube.com/watch")) {
        const url = new URL(tab.url)
        const videoId = url.searchParams.get("v")
        setCurrentVideoId(videoId)
      }
    })
  }, [])

  useEffect(() => {
    fetchAvailableModels()
  }, [])

  const fetchAvailableModels = async () => {
    try {
      const response = await fetch("https://your-vercel-app.vercel.app/api/models")
      const models = await response.json()
      setState((prev) => ({ ...prev, availableModels: models }))
    } catch (error) {
      console.error("Failed to fetch models:", error)
    }
  }

  const handleTranscribe = async () => {
    if (!currentVideoId) {
      setState((prev) => ({ ...prev, error: "No YouTube video detected" }))
      return
    }

    setState((prev) => ({ ...prev, isLoading: true, error: null }))

    try {
      const response = await fetch("https://your-vercel-app.vercel.app/api/transcribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          videoId: currentVideoId,
          service: selectedService,
          language: selectedLanguage,
        }),
      })

      const data = await response.json()

      if (data.error) {
        throw new Error(data.error)
      }

      setState((prev) => ({
        ...prev,
        transcript: data.transcript,
        service: data.service,
        language: data.language,
        isLoading: false,
      }))
    } catch (error) {
      setState((prev) => ({
        ...prev,
        error: error instanceof Error ? error.message : "Transcription failed",
        isLoading: false,
      }))
    }
  }

  const handleEnhance = async (action: "translate" | "summarize" | "extract-key-points", targetLanguage?: string) => {
    if (!state.transcript) return

    setState((prev) => ({ ...prev, isLoading: true }))

    try {
      const response = await fetch("https://your-vercel-app.vercel.app/api/enhance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          transcript: state.transcript,
          action,
          targetLanguage,
          model: state.selectedModel,
        }),
      })

      const data = await response.json()
      setState((prev) => ({ ...prev, transcript: data.result, isLoading: false }))
    } catch (error) {
      setState((prev) => ({
        ...prev,
        error: "Enhancement failed",
        isLoading: false,
      }))
    }
  }

  const copyToClipboard = () => {
    navigator.clipboard.writeText(state.transcript)
  }

  const downloadAsFile = () => {
    const blob = new Blob([state.transcript], { type: "text/plain" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `transcript_${currentVideoId}.txt`
    a.click()
  }

  return (
    <div className="w-96 p-4 bg-white">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            YouTube Transcriber
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {!currentVideoId ? (
            <div className="text-center text-gray-500 py-4">Navigate to a YouTube video to start transcribing</div>
          ) : (
            <>
              <div className="flex gap-2">
                <Select value={selectedService} onValueChange={setSelectedService}>
                  <SelectTrigger className="flex-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="whisper">OpenAI Whisper</SelectItem>
                    <SelectItem value="google">Google Speech</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={selectedLanguage} onValueChange={setSelectedLanguage}>
                  <SelectTrigger className="flex-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="en">English</SelectItem>
                    <SelectItem value="es">Spanish</SelectItem>
                    <SelectItem value="fr">French</SelectItem>
                    <SelectItem value="de">German</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">AI Model:</label>
                <Select
                  value={state.selectedModel}
                  onValueChange={(value) => setState((prev) => ({ ...prev, selectedModel: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {state.availableModels.map((model) => (
                      <SelectItem key={model.id} value={model.id}>
                        <div className="flex items-center justify-between w-full">
                          <span className="truncate">{model.name}</span>
                          {model.isFree && (
                            <Badge variant="secondary" className="ml-2 text-xs">
                              Free
                            </Badge>
                          )}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Button onClick={handleTranscribe} disabled={state.isLoading} className="w-full">
                {state.isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  "Transcribe Video"
                )}
              </Button>

              {state.error && <div className="text-red-500 text-sm bg-red-50 p-2 rounded">{state.error}</div>}

              {state.transcript && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">{state.service}</Badge>
                    <Badge variant="outline">{state.language}</Badge>
                  </div>

                  <Textarea
                    value={state.transcript}
                    readOnly
                    className="min-h-32 text-sm"
                    placeholder="Transcription will appear here..."
                  />

                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={copyToClipboard}>
                      <Copy className="w-4 h-4 mr-1" />
                      Copy
                    </Button>
                    <Button size="sm" variant="outline" onClick={downloadAsFile}>
                      <Download className="w-4 h-4 mr-1" />
                      Download
                    </Button>
                  </div>

                  <div className="border-t pt-3">
                    <div className="text-sm font-medium mb-2">AI Enhancements:</div>
                    <div className="flex gap-2 flex-wrap">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEnhance("summarize")}
                        disabled={state.isLoading}
                      >
                        <Sparkles className="w-4 h-4 mr-1" />
                        Summarize
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEnhance("extract-key-points")}
                        disabled={state.isLoading}
                      >
                        Key Points
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEnhance("translate", "es")}
                        disabled={state.isLoading}
                      >
                        <Translate className="w-4 h-4 mr-1" />
                        Translate
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
