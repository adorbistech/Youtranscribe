// Updated popup script for youtube-simple API
class YouTubeTranscriberPopup {
  constructor() {
    this.apiBase = "https://v0-chrome-extension-guide-livid.vercel.app"
    this.currentTab = null
    this.videoId = null
    this.chrome = window.chrome
    this.init()
  }

  async init() {
    console.log("🚀 Popup initializing...")

    try {
      await this.getCurrentTab()
      this.setupEventListeners()
      this.checkYouTubePage()

      // Test API connection
      await this.testAPIConnection()
    } catch (error) {
      console.error("❌ Initialization failed:", error)
      this.showStatus("Extension failed to initialize", "error")
    }
  }

  async testAPIConnection() {
    try {
      console.log("🧪 Testing API connection...")
      const response = await fetch(`${this.apiBase}/api/youtube-simple`)

      if (response.ok) {
        const data = await response.json()
        console.log("✅ API connection successful:", data)
        this.showStatus("API connected successfully", "success")
        setTimeout(() => this.clearStatus(), 2000)
      } else {
        throw new Error(`API test failed: ${response.status}`)
      }
    } catch (error) {
      console.error("❌ API connection failed:", error)
      this.showStatus("API connection failed - server may be down", "error")
    }
  }

  async getCurrentTab() {
    const [tab] = await this.chrome.tabs.query({ active: true, currentWindow: true })
    this.currentTab = tab
    console.log("📍 Current tab:", tab?.url)
  }

  setupEventListeners() {
    const transcribeBtn = document.getElementById("transcribe-btn")
    if (transcribeBtn) {
      transcribeBtn.addEventListener("click", () => this.handleTranscribe())
    }

    const copyBtn = document.getElementById("copy-btn")
    if (copyBtn) {
      copyBtn.addEventListener("click", () => this.copyToClipboard())
    }

    const downloadBtn = document.getElementById("download-btn")
    if (downloadBtn) {
      downloadBtn.addEventListener("click", () => this.downloadTranscript())
    }
  }

  checkYouTubePage() {
    if (!this.currentTab?.url?.includes("youtube.com/watch")) {
      this.showNotYouTube()
      return
    }

    const url = new URL(this.currentTab.url)
    this.videoId = url.searchParams.get("v")

    if (!this.videoId) {
      this.showNotYouTube()
      return
    }

    console.log("🎥 Video ID:", this.videoId)
    this.showMainContent()
    this.loadVideoInfo()
  }

  showNotYouTube() {
    document.getElementById("not-youtube")?.classList.remove("hidden")
    document.getElementById("main-content")?.classList.add("hidden")
  }

  showMainContent() {
    document.getElementById("not-youtube")?.classList.add("hidden")
    document.getElementById("main-content")?.classList.remove("hidden")
  }

  async loadVideoInfo() {
    try {
      document.getElementById("video-info")?.classList.remove("hidden")

      const titleEl = document.getElementById("video-title")
      if (titleEl) titleEl.textContent = "Loading video info..."

      const response = await fetch(`${this.apiBase}/api/youtube-simple`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          videoId: this.videoId,
          action: "video-info",
        }),
      })

      if (response.ok) {
        const info = await response.json()
        console.log("📺 Video info:", info)

        if (titleEl) titleEl.textContent = info.title

        const captionStatus = document.getElementById("caption-status")
        const captionIcon = document.getElementById("caption-icon")
        const captionText = document.getElementById("caption-text")

        if (captionStatus && captionIcon && captionText) {
          if (info.hasCaptions) {
            captionStatus.className = "caption-status available"
            captionIcon.textContent = "✅"
            captionText.textContent = "Captions available"
          } else {
            captionStatus.className = "caption-status unavailable"
            captionIcon.textContent = "⚠️"
            captionText.textContent = "No captions detected"
          }
        }
      }
    } catch (error) {
      console.error("❌ Failed to load video info:", error)
    }
  }

  showStatus(message, type = "loading") {
    const statusArea = document.getElementById("status-area")
    if (statusArea) {
      const icon = type === "success" ? "✅" : type === "error" ? "❌" : "⏳"
      statusArea.innerHTML = `<div class="status ${type}">${icon} ${message}</div>`
    }
  }

  clearStatus() {
    const statusArea = document.getElementById("status-area")
    if (statusArea) statusArea.innerHTML = ""
  }

  async handleTranscribe() {
    if (!this.videoId) {
      this.showStatus("No video ID found", "error")
      return
    }

    const transcribeBtn = document.getElementById("transcribe-btn")
    if (transcribeBtn) {
      transcribeBtn.disabled = true
      transcribeBtn.textContent = "Extracting..."
    }

    this.showStatus("Extracting captions...", "loading")

    try {
      console.log("🎯 Starting transcription for:", this.videoId)

      const response = await fetch(`${this.apiBase}/api/youtube-simple`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          videoId: this.videoId,
          language: "en",
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

      if (data.transcript) {
        this.displayResult(data.transcript, data.service, data.language)
        this.showStatus("Captions extracted successfully!", "success")
        setTimeout(() => this.clearStatus(), 3000)
      } else {
        throw new Error("No transcript in response")
      }
    } catch (error) {
      console.error("❌ Transcription failed:", error)
      this.showStatus(`Error: ${error.message}`, "error")
    } finally {
      if (transcribeBtn) {
        transcribeBtn.disabled = false
        transcribeBtn.textContent = "🎯 Extract Captions"
      }
    }
  }

  displayResult(transcript, service, language) {
    const resultArea = document.getElementById("result-area")
    const resultText = document.getElementById("result-text")
    const serviceBadge = document.getElementById("service-badge")
    const languageBadge = document.getElementById("language-badge")
    const charCount = document.getElementById("char-count")

    if (resultArea) resultArea.classList.remove("hidden")
    if (resultText) resultText.value = transcript
    if (serviceBadge) serviceBadge.textContent = service
    if (languageBadge) languageBadge.textContent = language
    if (charCount) charCount.textContent = `${transcript.length} characters`

    this.currentTranscript = transcript
    console.log("✅ Result displayed, length:", transcript.length)
  }

  async copyToClipboard() {
    const textarea = document.getElementById("result-text")
    const copyBtn = document.getElementById("copy-btn")

    if (!textarea || !copyBtn) return

    try {
      await navigator.clipboard.writeText(textarea.value)

      const originalText = copyBtn.textContent
      copyBtn.textContent = "✅ Copied!"
      setTimeout(() => {
        copyBtn.textContent = originalText
      }, 2000)
    } catch (error) {
      console.error("Copy failed:", error)
    }
  }

  downloadTranscript() {
    const textarea = document.getElementById("result-text")
    if (!textarea || !this.videoId) return

    const blob = new Blob([textarea.value], { type: "text/plain" })
    const url = URL.createObjectURL(blob)

    const a = document.createElement("a")
    a.href = url
    a.download = `transcript_${this.videoId}.txt`
    a.click()

    URL.revokeObjectURL(url)
  }
}

// Initialize when DOM loads
document.addEventListener("DOMContentLoaded", () => {
  console.log("🎬 DOM loaded, starting popup...")
  new YouTubeTranscriberPopup()
})
