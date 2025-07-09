"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ArrowLeft, Chrome, Download, CheckCircle, AlertCircle, FileDown, ExternalLink } from "lucide-react"

export default function ExtensionGuidePage() {
  const downloadExtension = () => {
    const link = document.createElement("a")
    link.href = "/chrome-extension.zip"
    link.download = "youtube-transcriber-extension.zip"
    link.click()
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
            <Chrome className="w-8 h-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-gray-900">Chrome Extension Installation Guide</h1>
          </div>
          <p className="text-gray-600">Step-by-step instructions to install the YouTube AI Transcriber extension</p>
        </div>

        {/* Download Section */}
        <Card className="mb-8 bg-gradient-to-r from-blue-50 to-purple-50 border-2 border-blue-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileDown className="w-6 h-6 text-blue-600" />
              Step 1: Download Extension
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-4">
              First, download the extension files as a ZIP archive. This contains all the necessary files for the Chrome
              extension.
            </p>
            <Button onClick={downloadExtension} size="lg" className="bg-blue-600 hover:bg-blue-700">
              <Download className="w-5 h-5 mr-2" />
              Download Extension ZIP
            </Button>
          </CardContent>
        </Card>

        {/* Installation Steps */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <span className="bg-blue-100 text-blue-600 rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold">
                    2
                  </span>
                  Extract Files
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li>• Extract the downloaded ZIP file to a folder</li>
                  <li>• Create a folder like "youtube-transcriber-extension"</li>
                  <li>• Make sure all files are in the same folder</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <span className="bg-blue-100 text-blue-600 rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold">
                    3
                  </span>
                  Open Chrome Extensions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li>• Open Chrome browser</li>
                  <li>
                    • Go to <code className="bg-gray-100 px-2 py-1 rounded">chrome://extensions/</code>
                  </li>
                  <li>• Or click Menu → More Tools → Extensions</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <span className="bg-blue-100 text-blue-600 rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold">
                    4
                  </span>
                  Enable Developer Mode
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li>• Look for "Developer mode" toggle in top-right</li>
                  <li>• Click to enable it</li>
                  <li>• New buttons will appear</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <span className="bg-blue-100 text-blue-600 rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold">
                    5
                  </span>
                  Load Extension
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li>• Click "Load unpacked" button</li>
                  <li>• Select your extension folder</li>
                  <li>• Extension should appear in the list</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <span className="bg-blue-100 text-blue-600 rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold">
                    6
                  </span>
                  Pin Extension
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li>• Click the puzzle piece icon in Chrome toolbar</li>
                  <li>• Find "YouTube AI Transcriber"</li>
                  <li>• Click the pin icon to keep it visible</li>
                </ul>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            {/* Usage Instructions */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                  How to Use
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold mb-2">Method 1: Extension Popup</h4>
                    <ul className="space-y-1 text-sm text-gray-600">
                      <li>• Go to any YouTube video</li>
                      <li>• Click the extension icon in toolbar</li>
                      <li>• Click "Extract Captions"</li>
                    </ul>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-2">Method 2: On-Page Button</h4>
                    <ul className="space-y-1 text-sm text-gray-600">
                      <li>• Purple "AI Transcriber" box appears below video</li>
                      <li>• Click "Open Transcriber"</li>
                      <li>• Follow tooltip to extension icon</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Features */}
            <Card>
              <CardHeader>
                <CardTitle>✨ Extension Features</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    Real caption extraction from YouTube
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    AI-powered summaries and translations
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    One-click copy and download
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    Multi-language support
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    Dashboard integration
                  </li>
                </ul>
              </CardContent>
            </Card>

            {/* Troubleshooting */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertCircle className="w-6 h-6 text-orange-600" />
                  Troubleshooting
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div>
                    <h4 className="font-semibold text-sm">Extension not loading?</h4>
                    <p className="text-xs text-gray-600">
                      Make sure Developer mode is enabled and all files are in the same folder
                    </p>
                  </div>

                  <div>
                    <h4 className="font-semibold text-sm">Not working on YouTube?</h4>
                    <p className="text-xs text-gray-600">Refresh the YouTube page after installing the extension</p>
                  </div>

                  <div>
                    <h4 className="font-semibold text-sm">No captions found?</h4>
                    <p className="text-xs text-gray-600">
                      The video might not have captions available. Try a different video.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Alternative */}
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>Alternative:</strong> If you prefer not to install the extension, you can use our{" "}
                <Link href="/transcribe" className="text-blue-600 hover:underline">
                  web-based transcriber
                </Link>{" "}
                by pasting YouTube URLs directly.
              </AlertDescription>
            </Alert>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-12 text-center space-y-4">
          <div className="flex gap-4 justify-center">
            <Button onClick={downloadExtension} size="lg">
              <Download className="w-5 h-5 mr-2" />
              Download Extension
            </Button>
            <Button variant="outline" asChild>
              <Link href="/transcribe">
                <ExternalLink className="w-5 h-5 mr-2" />
                Try Web Version
              </Link>
            </Button>
          </div>

          <p className="text-sm text-gray-500">
            Need help? The extension includes detailed README files with additional instructions.
          </p>
        </div>
      </div>
    </div>
  )
}
