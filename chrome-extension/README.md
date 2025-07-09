# YouTube AI Transcriber - Chrome Extension

## 🚀 Installation Instructions

### Method 1: Load Unpacked Extension (Developer Mode)

1. **Download the Extension Files**
   - Download all files from the `chrome-extension` folder
   - Save them to a folder on your computer (e.g., `youtube-transcriber-extension`)

2. **Enable Developer Mode in Chrome**
   - Open Chrome and go to `chrome://extensions/`
   - Toggle "Developer mode" ON (top-right corner)

3. **Load the Extension**
   - Click "Load unpacked" button
   - Select the folder containing the extension files
   - The extension should now appear in your extensions list

4. **Pin the Extension**
   - Click the puzzle piece icon in Chrome toolbar
   - Find "YouTube AI Transcriber" and click the pin icon
   - The extension icon will now be visible in your toolbar

### Method 2: Package and Install

1. **Create Extension Package**
   - Go to `chrome://extensions/`
   - Click "Pack extension"
   - Select the extension folder
   - This creates a `.crx` file

2. **Install the Package**
   - Drag the `.crx` file to the Chrome extensions page
   - Click "Add extension" when prompted

## 📁 Required Files

Make sure you have all these files in your extension folder:

\`\`\`
chrome-extension/
├── manifest.json          # Extension configuration
├── popup.html            # Extension popup interface
├── popup.js              # Popup functionality
├── content-script.js     # YouTube page integration
├── background.js         # Background service worker
└── icons/               # Extension icons (optional)
    ├── icon16.png
    ├── icon48.png
    └── icon128.png
\`\`\`

## 🎯 How to Use

1. **Navigate to YouTube**
   - Go to any YouTube video page
   - You'll see a purple "AI Transcriber" box below the video title

2. **Start Transcribing**
   - Click the extension icon in your Chrome toolbar
   - Or click "Open Transcriber" in the purple box on the page
   - Select your preferred transcription service and language
   - Click "Start Transcription"

3. **Use AI Features**
   - Once transcribed, use the enhancement buttons:
     - 📝 Summarize - Get a concise summary
     - 🎯 Key Points - Extract main points
     - 🌍 Translate - Translate to other languages
     - 📊 Dashboard - View all transcriptions

## 🔧 Configuration

The extension connects to: `https://v0-chrome-extension-guide-livid.vercel.app`

If you deploy your own version, update the `apiBase` URL in:
- `popup.js` (line 8)
- `content-script.js` (line 4)

## 🛠️ Troubleshooting

**Extension not loading?**
- Make sure all files are in the same folder
- Check that Developer mode is enabled
- Refresh the extensions page

**Not working on YouTube?**
- Refresh the YouTube page after installing
- Make sure the extension has permission for youtube.com
- Check the browser console for errors

**API errors?**
- Verify the Vercel app is deployed and working
- Check your internet connection
- Try refreshing the page

## 🎨 Customization

You can customize the extension by editing:
- `popup.html` - Change the interface design
- `popup.js` - Modify functionality and API calls
- `content-script.js` - Adjust the YouTube page integration
- `manifest.json` - Update permissions and metadata

## 📝 Notes

- The extension requires an active internet connection
- Transcription quality depends on video audio quality
- Some videos may not have extractable subtitles
- AI enhancements require API credits (free tier available)
\`\`\`

Finally, let me update the home page to include proper download instructions:

```typescriptreact file="app/page.tsx"
[v0-no-op-code-block-prefix]import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Mic, Globe, Sparkles, Download, Search, Zap, Chrome, Youtube, ArrowRight } from 'lucide-react'

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
            <Link href="/dashboard">
              <Button>
                Open Dashboard
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
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
              <Link href="/dashboard">
                <Button size="lg" className="text-lg px-8">
                  Get Started
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </Link>
              <Button
                size="lg"
                variant="outline"
                className="text-lg px-8 bg-transparent"
                onClick={() => window.open('https://github.com/your-repo/youtube-transcriber-extension/archive/main.zip', '_blank')}
              >
                <Chrome className="w-5 h-5 mr-2" />
                Download Extension
              </Button>
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
                  <Zap className="w-6 h-6 text-indigo-600" />
                </div>
                <CardTitle>Chrome Extension</CardTitle>
                <CardDescription>
                  Seamlessly integrated Chrome extension that adds transcription buttons directly to YouTube pages
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
              <h3 className="text-xl font-semibold mb-2">Install Extension</h3>
              <p className="text-gray-600">Add our Chrome extension to your browser for seamless YouTube integration</p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-blue-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                2
              </div>
              <h3 className="text-xl font-semibold mb-2">Transcribe Videos</h3>
              <p className="text-gray-600">
                Click the transcribe button on any YouTube video to generate accurate transcriptions
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

      {/* Installation Guide */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Easy Installation</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">Get the Chrome extension up and running in minutes</p>
          </div>

          <div className="max-w-4xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <Card className="p-6">
                <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                  <Chrome className="w-6 h-6 text-blue-600" />
                  Chrome Extension
                </h3>
                <ol className="space-y-3 text-sm text-gray-600">
                  <li className="flex gap-3">
                    <span className="bg-blue-100 text-blue-600 rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">1</span>
                    <span>Download the extension files</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="bg-blue-100 text-blue-600 rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">2</span>
                    <span>Go to chrome://extensions/ and enable Developer mode</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="bg-blue-100 text-blue-600 rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">3</span>
                    <span>Click "Load unpacked" and select the extension folder</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="bg-blue-100 text-blue-600 rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">4</span>
                    <span>Pin the extension and start transcribing!</span>
                  </li>
                </ol>
                <Button className="w-full mt-4" onClick={() => window.open('/chrome-extension.zip', '_blank')}>
                  <Download className="w-4 h-4 mr-2" />
                  Download Extension
                </Button>
              </Card>

              <Card className="p-6">
                <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                  <Globe className="w-6 h-6 text-green-600" />
                  Web Dashboard
                </h3>
                <p className="text-gray-600 mb-4">
                  Access your transcription history and manage all your content from the web dashboard.
                </p>
                <ul className="space-y-2 text-sm text-gray-600 mb-4">
                  <li className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                    Search through all transcriptions
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                    AI-powered enhancements
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                    Export and download options
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                    No installation required
                  </li>
                </ul>
                <Link href="/dashboard">
                  <Button variant="outline" className="w-full bg-transparent">
                    <ArrowRight className="w-4 h-4 mr-2" />
                    Open Dashboard
                  </Button>
                </Link>
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
            Join thousands of users who are already transforming their YouTube experience
          </p>
          <div className="flex gap-4 justify-center">
            <Link href="/dashboard">
              <Button size="lg" variant="secondary" className="text-lg px-8">
                Open Dashboard
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
            <Button
              size="lg"
              variant="outline"
              className="text-lg px-8 border-white text-white hover:bg-white hover:text-blue-600 bg-transparent"
            >
              <Chrome className="w-5 h-5 mr-2" />
              Get Extension
            </Button>
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
