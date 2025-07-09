// Simplified popup script for debugging
class YouTubeTranscriberPopup {
  constructor() {
    this.apiBase = "https://v0-chrome-extension-guide-livid.vercel.app"
    this.init()
  }

  async init() {
    console.log("🚀 Popup initializing...")

    // First test if our API is reachable
    await this.testAPI()

    this.setupEventListeners()
    await this.getCurrentTab()
    this.checkYouTubePage()
  }

  async testAPI() {
    try {
      console.log("🧪 Testing API connection...")
      const response = await fetch(`${this.apiBase}/api/test`)
      const data = await response.json()
      console.log("✅ API test successful:", data)
    } catch (error) {
      console.error("❌ API test failed:", error)
      this.showStatus("API connection failed - check if the server is running", "error")
    }
  }

  setupEventListeners() {
    const transcribeBtn = document.getElementById("transcribe-btn")
    if (transcribeBtn) {
      transcribeBtn.addEventListener("click", () => this.handleTranscribe())
    }
  }

  async getCurrentTab() {
    try {
      const [tab] = await window.chrome.tabs.query({ active: true, currentWindow: true })
      this.currentTab = tab
      console.log("📍 Current tab:", tab?.url)
    } catch (error) {
      console.error("Failed to get current tab:", error)
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
  }

  showNotYouTube() {
    document.getElementById("not-youtube")?.classList.remove("hidden")
    document.getElementById("main-content")?.classList.add("hidden")
  }

  showMainContent() {
    document.getElementById("not-youtube")?.classList.add("hidden")
    document.getElementById("main-content")?.classList.remove("hidden")
  }

  showStatus(message, type = "loading") {
    const statusArea = document.getElementById("status-area")
    if (statusArea) {
      const icon = type === "success" ? "✅" : type === "error" ? "❌" : "⏳"
      statusArea.innerHTML = `<div class="status ${type}">${icon} ${message}</div>`
    }
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

    this.showStatus("Testing API connection...", "loading")

    try {
      // First test the API
      console.log("🧪 Testing API before transcription...")
      const testResponse = await fetch(`${this.apiBase}/api/test`)

      if (!testResponse.ok) {
        throw new Error(`API test failed: ${testResponse.status}`)
      }

      console.log("✅ API test passed, starting transcription...")
      this.showStatus("Extracting captions...", "loading")

      // Now try transcription
      const response = await fetch(`${this.apiBase}/api/transcribe`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          videoId: this.videoId,
          language: "en",
        }),
      })

      console.log("📡 Transcription response status:", response.status)
      console.log("📡 Response headers:", Object.fromEntries(response.headers.entries()))

      const data = await response.json()
      console.log("📄 Response data:", data)

      if (response.ok && data.transcript) {
        this.displayResult(data.transcript)
        this.showStatus("Success! Captions extracted.", "success")
      } else {
        throw new Error(data.error || `HTTP ${response.status}`)
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

  displayResult(transcript) {
    const resultArea = document.getElementById("result-area")
    const resultText = document.getElementById("result-text")

    if (resultArea) resultArea.classList.remove("hidden")
    if (resultText) resultText.value = transcript

    console.log("✅ Result displayed, length:", transcript.length)
  }
}

// Initialize when DOM loads
document.addEventListener("DOMContentLoaded", () => {
  console.log("🎬 DOM loaded, starting popup...")
  new YouTubeTranscriberPopup()
})
