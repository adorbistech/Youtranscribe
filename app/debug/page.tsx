"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"

export default function DebugPage() {
  const [results, setResults] = useState("")
  const [videoId, setVideoId] = useState("dQw4w9WgXcQ") // Rick Roll - has captions
  const [isLoading, setIsLoading] = useState(false)

  const addResult = (message: string) => {
    setResults((prev) => prev + "\n" + message)
  }

  const testAPI = async (endpoint: string, method = "GET", body?: any) => {
    try {
      addResult(`\n=== Testing ${method} ${endpoint} ===`)

      const response = await fetch(endpoint, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: body ? JSON.stringify(body) : undefined,
      })

      addResult(`Status: ${response.status} ${response.statusText}`)
      addResult(`Headers: ${JSON.stringify(Object.fromEntries(response.headers.entries()), null, 2)}`)

      const data = await response.json()
      addResult(`Response: ${JSON.stringify(data, null, 2)}`)

      return { success: response.ok, data }
    } catch (error) {
      addResult(`ERROR: ${error.message}`)
      return { success: false, error: error.message }
    }
  }

  const runFullTest = async () => {
    setIsLoading(true)
    setResults("🚀 Starting comprehensive API tests...\n")

    try {
      // Test 1: Health check
      addResult("\n🏥 HEALTH CHECK")
      await testAPI("/api/health")

      // Test 2: Transcribe GET
      addResult("\n📡 TRANSCRIBE API (GET)")
      await testAPI("/api/transcribe")

      // Test 3: Video info
      addResult("\n📺 VIDEO INFO")
      await testAPI("/api/video-info", "POST", { videoId })

      // Test 4: Transcribe POST
      addResult("\n🎯 TRANSCRIBE API (POST)")
      const transcribeResult = await testAPI("/api/transcribe", "POST", {
        videoId,
        language: "en",
      })

      if (transcribeResult.success) {
        addResult("\n✅ TRANSCRIPTION SUCCESS!")
        addResult(`Transcript length: ${transcribeResult.data.transcript?.length || 0}`)
        addResult(`Method: ${transcribeResult.data.service}`)
      } else {
        addResult("\n❌ TRANSCRIPTION FAILED")
      }
    } catch (error) {
      addResult(`\n💥 Test suite error: ${error.message}`)
    } finally {
      setIsLoading(false)
    }
  }

  const testSpecificVideo = async () => {
    setIsLoading(true)
    addResult(`\n🎬 Testing specific video: ${videoId}`)

    await testAPI("/api/transcribe", "POST", { videoId, language: "en" })
    setIsLoading(false)
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            🔧 API Debug Dashboard
            <Badge variant="outline">Development</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Test Video ID:</label>
              <Input value={videoId} onChange={(e) => setVideoId(e.target.value)} placeholder="YouTube Video ID" />
              <p className="text-xs text-gray-500 mt-1">Default: dQw4w9WgXcQ (Rick Roll - known to have captions)</p>
            </div>

            <div className="flex flex-col gap-2">
              <Button onClick={runFullTest} disabled={isLoading} className="w-full">
                {isLoading ? "Testing..." : "🚀 Run Full Test Suite"}
              </Button>

              <Button
                onClick={testSpecificVideo}
                disabled={isLoading}
                variant="outline"
                className="w-full bg-transparent"
              >
                🎬 Test Specific Video
              </Button>

              <Button onClick={() => setResults("")} variant="outline" className="w-full">
                🗑️ Clear Results
              </Button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Test Results:</label>
            <Textarea
              value={results}
              readOnly
              className="min-h-96 font-mono text-xs"
              placeholder="Test results will appear here..."
            />
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            <Button size="sm" variant="outline" onClick={() => testAPI("/api/health")} disabled={isLoading}>
              Health
            </Button>
            <Button size="sm" variant="outline" onClick={() => testAPI("/api/transcribe")} disabled={isLoading}>
              Transcribe GET
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => testAPI("/api/video-info", "POST", { videoId })}
              disabled={isLoading}
            >
              Video Info
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => window.open(`https://www.youtube.com/watch?v=${videoId}`, "_blank")}
            >
              View Video
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
