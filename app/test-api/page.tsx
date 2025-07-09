"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"

export default function TestAPIPage() {
  const [results, setResults] = useState("")
  const [videoId, setVideoId] = useState("dQw4w9WgXcQ") // Rick Roll
  const [isLoading, setIsLoading] = useState(false)

  const addResult = (message: string) => {
    setResults((prev) => prev + "\n" + message)
    console.log(message)
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

      const responseText = await response.text()
      addResult(`Raw Response: ${responseText.substring(0, 500)}...`)

      try {
        const data = JSON.parse(responseText)
        addResult(`Parsed JSON: ${JSON.stringify(data, null, 2)}`)
        return { success: response.ok, data }
      } catch (parseError) {
        addResult(`JSON Parse Error: ${parseError.message}`)
        return { success: false, error: "Invalid JSON response" }
      }
    } catch (error) {
      addResult(`FETCH ERROR: ${error.message}`)
      return { success: false, error: error.message }
    }
  }

  const runTests = async () => {
    setIsLoading(true)
    setResults("🚀 Starting API tests...\n")

    try {
      // Test 1: Health check
      addResult("\n🏥 HEALTH CHECK")
      await testAPI("/api/health")

      // Test 2: Video info
      addResult("\n📺 VIDEO INFO")
      await testAPI("/api/video-info", "POST", { videoId })

      // Test 3: Transcribe
      addResult("\n🎯 TRANSCRIBE")
      const transcribeResult = await testAPI("/api/transcribe", "POST", {
        videoId,
        language: "en",
      })

      if (transcribeResult.success) {
        addResult("\n✅ TRANSCRIPTION SUCCESS!")
      } else {
        addResult("\n❌ TRANSCRIPTION FAILED")
      }
    } catch (error) {
      addResult(`\n💥 Test error: ${error.message}`)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            🧪 API Test Page
            <Badge variant="outline">Pages Router</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Test Video ID:</label>
              <Input value={videoId} onChange={(e) => setVideoId(e.target.value)} placeholder="YouTube Video ID" />
            </div>

            <div className="flex flex-col gap-2">
              <Button onClick={runTests} disabled={isLoading} className="w-full">
                {isLoading ? "Testing..." : "🚀 Run All Tests"}
              </Button>

              <Button onClick={() => setResults("")} variant="outline" className="w-full">
                🗑️ Clear Results
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <Button size="sm" variant="outline" onClick={() => testAPI("/api/health")} disabled={isLoading}>
              Health
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
              onClick={() => testAPI("/api/transcribe", "POST", { videoId, language: "en" })}
              disabled={isLoading}
            >
              Transcribe
            </Button>
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
        </CardContent>
      </Card>
    </div>
  )
}
