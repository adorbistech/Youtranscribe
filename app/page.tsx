import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Mic, Globe, Sparkles, Download, Search, Chrome, Youtube, ArrowRight, LinkIcon } from "lucide-react"

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Youtube className="w-8 h-8 text-red-600" />
              <h1 className="text-2xl font-bold text-gray-900">YouTube AI Transcriber</h1>
            </div>
            <div className="flex gap-2">
              <Link href="/transcribe">
                <Button variant="outline">
                  <LinkIcon className="w-4 h-4 mr-2" />
                  Paste URL
                </Button>
              </Link>
              <Link href="/dashboard">
                <Button>
                  Open Dashboard
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20">
        <div className="container mx-auto px-4 text-center">
          <div className="max-w-4xl mx-auto">
            <Badge variant="secondary" className="mb-4">
              <Sparkles className="w-4 h-4 mr-2" />
              AI-Powered Transcription
            </Badge>
            <h1 className="text-5xl font-bold text-gray-900 mb-6">
              Transform YouTube Videos into
              <span className="text-blue-600"> Searchable Text</span>
            </h1>
            <p className="text-xl text-gray-600 mb-8 leading-relaxed">
              Automatically transcribe, translate, and summarize YouTube videos with advanced AI. Perfect for content
              creators, researchers, and anyone who wants to make video content more accessible.
            </p>
            <div className="flex gap-4 justify-center">
              <Link href="/transcribe">
                <Button size="lg" className="text-lg px-8">
                  <LinkIcon className="w-5 h-5 mr-2" />
                  Paste YouTube URL
                </Button>
              </Link>
              <Link href="/dashboard">
                <Button size="lg" variant="outline" className="text-lg px-8 bg-transparent">
                  <ArrowRight className="w-5 h-5 mr-2" />
                  View Dashboard
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Powerful Features</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Everything you need to extract maximum value from YouTube videos
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                  <Mic className="w-6 h-6 text-blue-600" />
                </div>
                <CardTitle>Smart Transcription</CardTitle>
                <CardDescription>
                  Automatically extract existing subtitles or generate high-quality transcriptions using OpenAI Whisper
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                  <Globe className="w-6 h-6 text-green-600" />
                </div>
                <CardTitle>Multi-Language Support</CardTitle>
                <CardDescription>
                  Transcribe videos in multiple languages and translate content to over 50 languages instantly
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                  <Sparkles className="w-6 h-6 text-purple-600" />
                </div>
                <CardTitle>AI Enhancement</CardTitle>
                <CardDescription>
                  Generate summaries, extract key points, and get insights using advanced AI models via OpenRouter
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mb-4">
                  <Search className="w-6 h-6 text-orange-600" />
                </div>
                <CardTitle>Search & Organize</CardTitle>
                <CardDescription>
                  Full-text search across all your transcriptions with smart filtering and organization tools
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center mb-4">
                  <Download className="w-6 h-6 text-red-600" />
                </div>
                <CardTitle>Export Options</CardTitle>
                <CardDescription>
                  Download transcriptions as text files, copy to clipboard, or integrate with your favorite tools
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center mb-4">
                  <LinkIcon className="w-6 h-6 text-indigo-600" />
                </div>
                <CardTitle>URL Processing</CardTitle>
                <CardDescription>
                  Simply paste any YouTube URL to instantly extract subtitles or generate AI transcriptions
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">How It Works</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">Get started in three simple steps</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                1
              </div>
              <h3 className="text-xl font-semibold mb-2">Paste YouTube URL</h3>
              <p className="text-gray-600">Copy any YouTube video URL and paste it into our transcription tool</p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-blue-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                2
              </div>
              <h3 className="text-xl font-semibold mb-2">Smart Processing</h3>
              <p className="text-gray-600">
                We automatically extract existing captions or generate AI transcriptions as needed
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-blue-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                3
              </div>
              <h3 className="text-xl font-semibold mb-2">Enhance & Export</h3>
              <p className="text-gray-600">
                Use AI to summarize, translate, or extract key points, then export in your preferred format
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Quick Start */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Quick Start</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">Choose your preferred way to transcribe YouTube videos</p>
          </div>

          <div className="max-w-4xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <Card className="p-6 hover:shadow-lg transition-shadow">
                <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                  <LinkIcon className="w-6 h-6 text-blue-600" />
                  Paste YouTube URL
                </h3>
                <p className="text-gray-600 mb-4">
                  The fastest way to transcribe any YouTube video. Just paste the URL and get instant results.
                </p>
                <ul className="space-y-2 text-sm text-gray-600 mb-4">
                  <li className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                    Works with any YouTube URL format
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                    Automatic subtitle extraction
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                    AI fallback for videos without captions
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                    Instant AI enhancements
                  </li>
                </ul>
                <Link href="/transcribe">
                  <Button className="w-full">
                    <LinkIcon className="w-4 h-4 mr-2" />
                    Start Transcribing
                  </Button>
                </Link>
              </Card>

              <Card className="p-6 hover:shadow-lg transition-shadow">
                <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                  <Chrome className="w-6 h-6 text-green-600" />
                  Chrome Extension
                </h3>
                <p className="text-gray-600 mb-4">
                  Install our Chrome extension for seamless integration directly on YouTube pages.
                </p>
                <ul className="space-y-2 text-sm text-gray-600 mb-4">
                  <li className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                    Transcribe button on every video
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                    One-click transcription
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                    Popup interface for quick access
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                    Coming soon to Chrome Web Store
                  </li>
                </ul>
                <Button variant="outline" className="w-full bg-transparent" disabled>
                  <Chrome className="w-4 h-4 mr-2" />
                  Extension Coming Soon
                </Button>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-blue-600 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Get Started?</h2>
          <p className="text-xl mb-8 text-blue-100">
            Transform any YouTube video into searchable, actionable text in seconds
          </p>
          <div className="flex gap-4 justify-center">
            <Link href="/transcribe">
              <Button size="lg" variant="secondary" className="text-lg px-8">
                <LinkIcon className="w-5 h-5 mr-2" />
                Paste YouTube URL
              </Button>
            </Link>
            <Link href="/dashboard">
              <Button
                size="lg"
                variant="outline"
                className="text-lg px-8 border-white text-white hover:bg-white hover:text-blue-600 bg-transparent"
              >
                <ArrowRight className="w-5 h-5 mr-2" />
                View Dashboard
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 bg-gray-900 text-gray-400">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Youtube className="w-6 h-6 text-red-600" />
              <span className="font-semibold">YouTube AI Transcriber</span>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm">Built with</span>
              <Badge variant="outline" className="border-gray-600 text-gray-400">
                <Sparkles className="w-3 h-3 mr-1" />
                OpenRouter AI
              </Badge>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
