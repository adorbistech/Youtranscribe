"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"

export default function APITestPage() {
  const [testResults, setTestResults] = useState<string>("")
  const [videoId, setVideoId] = useState("dQw4w9WgXcQ") // Rick Roll - known to have captions
  const [isLoading, setIsLoading] = useState(false)

  const testAPI = async (endpoint: string, method = "GET", body?: any) => {
    try {
      setIsLoading(true)
      const response = await fetch(endpoint, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: body ? JSON.stringify(body) : undefined,
      })

      const data = await response.json()

      setTestResults(
        (prev) =>
          prev +
          `\n\n=== ${method} ${endpoint} ===\n` +
          `Status: ${response.status}\n` +
          `Response: ${JSON.stringify(data, null, 2)}`,
      )
    } catch (error) {
      setTestResults((prev) => prev + `\n\nERROR testing ${endpoint}: ${error.message}`)
    } finally {
      setIsLoading(false)
    }
  }

  const runAllTests = async () => {
    setTestResults("Starting API tests with new youtube-simple endpoint...\n")

    // Test 1: Health check
    await testAPI("/api/youtube-simple")

    // Test 2: Video info
    await testAPI("/api/youtube-simple", "POST", { videoId, action: "video-info" })

    // Test 3: Transcribe
    await testAPI("/api/youtube-simple", "POST", { videoId, action: "transcribe", language: "en" })

    // Test 4: Try different video
    await testAPI("/api/youtube-simple", "POST", { videoId: "jNQXAC9IVRw", action: "video-info" })
    await testAPI("/api/youtube-simple", "POST", { videoId: "jNQXAC9IVRw", action: "transcribe", language: "en" })
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Card>
        <CardHeader>
          <CardTitle>🧪 API Testing Dashboard - New youtube-simple Endpoint</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Test Video ID:</label>
            <Input value={videoId} onChange={(e) => setVideoId(e.target.value)} placeholder="YouTube Video ID" />
          </div>

          <div className="flex gap-2">
            <Button onClick={runAllTests} disabled={isLoading}>
              {isLoading ? "Testing..." : "🚀 Run All Tests"}
            </Button>
            <Button variant="outline" onClick={() => setTestResults("")}>
              Clear Results
            </Button>
            <Button variant="outline" onClick={() => window.open("/api/youtube-simple", "_blank")}>
              Test Health Direct
            </Button>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Test Results:</label>
            <Textarea
              value={testResults}
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
