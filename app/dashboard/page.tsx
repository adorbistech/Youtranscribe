"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Search, Download, Trash2, Eye, Calendar, Clock, Globe, Mic, FileText, Sparkles } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface TranscriptionRecord {
  id: string
  videoId: string
  title: string
  transcript: string
  service: string
  language: string
  timestamp: string
  duration?: number
  model?: string
  enhancementHistory?: Array<{
    action: string
    model: string
    timestamp: string
  }>
}

export default function Dashboard() {
  const [transcriptions, setTranscriptions] = useState<TranscriptionRecord[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedTranscription, setSelectedTranscription] = useState<TranscriptionRecord | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [availableModels, setAvailableModels] = useState<any[]>([])
  const [selectedModel, setSelectedModel] = useState("deepseek/deepseek-r1-distill-qwen-14b:free")

  useEffect(() => {
    fetchTranscriptions()
    fetchAvailableModels()
  }, [])

  const fetchTranscriptions = async () => {
    try {
      const res = await fetch("/api/history")
      if (!res.ok || !res.headers.get("content-type")?.includes("application/json")) {
        throw new Error("History not available")
      }
      const data = await res.json()
      setTranscriptions(data)
    } catch (error) {
      console.error("Failed to fetch transcriptions:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const fetchAvailableModels = async () => {
    try {
      const res = await fetch("/api/models")
      if (!res.ok || !res.headers.get("content-type")?.includes("application/json")) {
        throw new Error("Model list not available")
      }
      const models = await res.json()
      setAvailableModels(models)
      // pre-select the first model if current one isn’t in the list
      if (models.length && !models.find((m: any) => m.id === selectedModel)) {
        setSelectedModel(models[0].id)
      }
    } catch (err) {
      console.warn("Using fallback model list:", err)
      // Minimal fallback so UI keeps working
      setAvailableModels([
        { id: "deepseek/deepseek-r1-distill-qwen-14b:free", name: "DeepSeek-R1 (Free)", isFree: true },
      ])
    }
  }

  const deleteTranscription = async (id: string) => {
    try {
      await fetch(`/api/history?id=${id}`, { method: "DELETE" })
      setTranscriptions((prev) => prev.filter((t) => t.id !== id))
      if (selectedTranscription?.id === id) {
        setSelectedTranscription(null)
      }
    } catch (error) {
      console.error("Failed to delete transcription:", error)
    }
  }

  const downloadTranscription = (transcription: TranscriptionRecord) => {
    const blob = new Blob([transcription.transcript], { type: "text/plain" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `${transcription.title.replace(/[^a-z0-9]/gi, "_")}.txt`
    a.click()
    URL.revokeObjectURL(url)
  }

  const filteredTranscriptions = transcriptions.filter(
    (t) =>
      t.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.transcript.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const formatDate = (timestamp: string) => {
    return new Date(timestamp).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const formatDuration = (seconds?: number) => {
    if (!seconds) return "Unknown"
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`
  }

  const enhanceTranscription = async (action: string, targetLanguage?: string) => {
    if (!selectedTranscription) return

    try {
      const response = await fetch("/api/enhance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          transcript: selectedTranscription.transcript,
          action,
          targetLanguage,
          model: selectedModel,
        }),
      })

      const data = await response.json()

      // Update the selected transcription with enhanced content
      setSelectedTranscription((prev) =>
        prev
          ? {
              ...prev,
              transcript: data.result,
              enhancementHistory: [
                ...(prev.enhancementHistory || []),
                {
                  action,
                  model: selectedModel,
                  timestamp: new Date().toISOString(),
                },
              ],
            }
          : null,
      )
    } catch (error) {
      console.error("Enhancement failed:", error)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading transcriptions...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">YouTube Transcription Dashboard</h1>
          <p className="text-gray-600">Manage and search through your video transcriptions</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Transcription List */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Transcriptions ({filteredTranscriptions.length})
                </CardTitle>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Search transcriptions..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="max-h-96 overflow-y-auto">
                  {filteredTranscriptions.length === 0 ? (
                    <div className="p-4 text-center text-gray-500">
                      {searchTerm ? "No matching transcriptions found" : "No transcriptions yet"}
                    </div>
                  ) : (
                    filteredTranscriptions.map((transcription) => (
                      <div
                        key={transcription.id}
                        className={`p-4 border-b cursor-pointer hover:bg-gray-50 transition-colors ${
                          selectedTranscription?.id === transcription.id ? "bg-blue-50 border-blue-200" : ""
                        }`}
                        onClick={() => setSelectedTranscription(transcription)}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <h3 className="font-medium text-sm line-clamp-2">{transcription.title}</h3>
                          <div className="flex gap-1 ml-2">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={(e) => {
                                e.stopPropagation()
                                downloadTranscription(transcription)
                              }}
                            >
                              <Download className="w-3 h-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={(e) => {
                                e.stopPropagation()
                                deleteTranscription(transcription.id)
                              }}
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant="secondary" className="text-xs">
                            <Mic className="w-3 h-3 mr-1" />
                            {transcription.service}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            <Globe className="w-3 h-3 mr-1" />
                            {transcription.language}
                          </Badge>
                        </div>

                        <div className="flex items-center gap-4 text-xs text-gray-500">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {formatDate(transcription.timestamp)}
                          </span>
                          {transcription.duration && (
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {formatDuration(transcription.duration)}
                            </span>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Transcription Viewer */}
          <div className="lg:col-span-2">
            {selectedTranscription ? (
              <Card>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="mb-2">{selectedTranscription.title}</CardTitle>
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="secondary">
                          <Mic className="w-3 h-3 mr-1" />
                          {selectedTranscription.service}
                        </Badge>
                        <Badge variant="outline">
                          <Globe className="w-3 h-3 mr-1" />
                          {selectedTranscription.language}
                        </Badge>
                        <span className="text-sm text-gray-500">{formatDate(selectedTranscription.timestamp)}</span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => downloadTranscription(selectedTranscription)}>
                        <Download className="w-4 h-4 mr-1" />
                        Download
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          window.open(`https://youtube.com/watch?v=${selectedTranscription.videoId}`, "_blank")
                        }
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        View Video
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <Textarea value={selectedTranscription.transcript} readOnly className="min-h-64 mb-4" />

                  <div className="border-t pt-4">
                    <h4 className="font-medium mb-3 flex items-center gap-2">
                      <Sparkles className="w-4 h-4" />
                      AI Enhancements
                    </h4>

                    <div className="mb-3">
                      <Select value={selectedModel} onValueChange={setSelectedModel}>
                        <SelectTrigger className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {availableModels.map((model) => (
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

                    <div className="flex gap-2 flex-wrap">
                      <Button size="sm" variant="outline" onClick={() => enhanceTranscription("summarize")}>
                        Summarize
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => enhanceTranscription("extract-key-points")}>
                        Extract Key Points
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => enhanceTranscription("translate", "es")}>
                        Translate to Spanish
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => enhanceTranscription("translate", "fr")}>
                        Translate to French
                      </Button>
                    </div>

                    {selectedTranscription?.enhancementHistory &&
                      selectedTranscription.enhancementHistory.length > 0 && (
                        <div className="mt-4 p-3 bg-gray-50 rounded">
                          <h5 className="text-sm font-medium mb-2">Enhancement History:</h5>
                          {selectedTranscription.enhancementHistory.map((enhancement, index) => (
                            <div key={index} className="text-xs text-gray-600 mb-1">
                              {enhancement.action} using {enhancement.model} - {formatDate(enhancement.timestamp)}
                            </div>
                          ))}
                        </div>
                      )}
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="flex items-center justify-center h-96">
                  <div className="text-center text-gray-500">
                    <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>Select a transcription to view details</p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
