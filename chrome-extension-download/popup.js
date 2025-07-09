// Popup script for Chrome extension
class YouTubeTranscriberPopup {
  constructor() {
    this.currentTab = null
    this.videoId = null
    this.videoTitle = null
    this.apiBase = "https://v0-chrome-extension-guide-livid.vercel.app"
    this.currentTranscript = null

    this.init()
  }

  async init() {
    await this.getCurrentTab()
    this.setupEventListeners()
    this.checkYouTubePage()
  }

  async getCurrentTab() {
    const [tab] = await window.chrome.tabs.query({ active: true, currentWindow: true })
    this.currentTab = tab
  }

  setupEventListeners() {
    document.getElementById("transcribe-btn").addEventListener("click", () => this.handleTranscribe())
    document.getElementById("copy-btn").addEventListener("click", () => this.copyToClipboard())
    document.getElementById("download-btn").addEventListener("click", () => this.downloadTranscript())
    document.getElementById("summarize-btn").addEventListener("click", () => this.enhanceText("summarize"))
    document.getElementById("keypoints-btn").addEventListener("click", () => this.enhanceText("extract-key-points"))
    document.getElementById("translate-btn").addEventListener("click", () => this.enhanceText("translate"))
    document.getElementById("dashboard-btn").addEventListener("click", () => this.openDashboard())
    document.getElementById("open-web-btn").addEventListener("click", () => this.openWebApp())
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

    this.showMainContent()
    this.loadVideoInfo()
  }

  showNotYouTube() {
    document.getElementById("not-youtube").classList.remove("hidden")
    document.getElementById("main-content").classList.add("hidden")
  }

  showMainContent() {
    document.getElementById("not-youtube").classList.add("hidden")
    document.getElementById("main-content").classList.remove("hidden")
  }

  async loadVideoInfo() {
    try {
      document.getElementById("video-info").classList.remove("hidden")
      document.getElementById("video-title").textContent = "Loading video information..."
      document.getElementById("video-id").textContent = `Video ID: ${this.videoId}`

      // Get video info from our API
      const response = await fetch(`${this.apiBase}/api/video-info`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ videoId: this.videoId }),
      })

      if (response.ok) {
        const videoInfo = await response.json()
        this.videoTitle = videoInfo.title
        document.getElementById("video-title").textContent = videoInfo.title

        // Update caption status
        const captionStatus = document.getElementById("caption-status")
        const captionIcon = document.getElementById("caption-icon")
        const captionText = document.getElementById("caption-text")

        if (videoInfo.hasCaptions) {
          captionStatus.className = "caption-status available"
          captionIcon.textContent = "✅"
          captionText.textContent = "Captions available"
        } else {
          captionStatus.className = "caption-status unavailable"
          captionIcon.textContent = "⚠️"
          captionText.textContent = "No captions detected"
        }
      } else {
        throw new Error("Failed to get video info")
      }
    } catch (error) {
      console.error("Error loading video info:", error)
      this.videoTitle = "YouTube Video"
      document.getElementById("video-title").textContent = this.videoTitle
      document.getElementById("caption-status").classList.add("hidden")
    }
  }

  showStatus(message, type = "loading") {
    const statusArea = document.getElementById("status-area")
    const spinner = type === "loading" ? '<div class="loading-spinner"></div>' : ""
    const icon = type === "success" ? "✅" : type === "error" ? "❌" : ""
    statusArea.innerHTML = `<div class="status ${type}">${spinner}${icon}${message}</div>`
  }

  clearStatus() {
    document.getElementById("status-area").innerHTML = ""
  }

  async handleTranscribe() {
    const transcribeBtn = document.getElementById("transcribe-btn")
    const service = document.getElementById("service-select").value
    const language = document.getElementById("language-select").value

    transcribeBtn.disabled = true
    transcribeBtn.innerHTML = `<div class="loading-spinner"></div> Extracting Captions...`
    this.showStatus("Extracting captions from YouTube...", "loading")

    try {
      const response = await fetch(`${this.apiBase}/api/transcribe`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          videoId: this.videoId,
          service: service === "auto" ? "whisper" : service,
          language: language,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Transcription failed")
      }

      this.displayResult(data.transcript, data.service, data.language)
      this.showStatus("Captions extracted successfully!", "success")

      // Clear status after 3 seconds
      setTimeout(() => this.clearStatus(), 3000)
    } catch (error) {
      console.error("Transcription error:", error)
      this.showStatus(`Error: ${error.message}`, "error")
    } finally {
      transcribeBtn.disabled = false
      transcribeBtn.innerHTML = `🎯 Extract Captions`
    }
  }

  displayResult(transcript, service, language) {
    document.getElementById("result-text").value = transcript
    document.getElementById("result-area").classList.remove("hidden")

    // Update badges and stats
    document.getElementById("service-badge").textContent = service
    document.getElementById("language-badge").textContent = language
    document.getElementById("char-count").textContent = `${transcript.length} characters`

    // Store current transcript for enhancements
    this.currentTranscript = transcript
    this.currentService = service
    this.currentLanguage = language
  }

  async copyToClipboard() {
    const textarea = document.getElementById("result-text")
    const copyBtn = document.getElementById("copy-btn")

    try {
      await navigator.clipboard.writeText(textarea.value)

      const originalHTML = copyBtn.innerHTML
      copyBtn.innerHTML = `✅ Copied!`
      copyBtn.style.color = "#16a34a"

      setTimeout(() => {
        copyBtn.innerHTML = originalHTML
        copyBtn.style.color = ""
      }, 2000)
    } catch (error) {
      console.error("Failed to copy:", error)
    }
  }

  downloadTranscript() {
    const transcript = document.getElementById("result-text").value
    const blob = new Blob([transcript], { type: "text/plain" })
    const url = URL.createObjectURL(blob)

    const a = document.createElement("a")
    a.href = url
    a.download = `transcript_${this.videoId}.txt`
    a.click()

    URL.revokeObjectURL(url)
  }

  async enhanceText(action) {
    if (!this.currentTranscript) return

    const button = document.getElementById(`${action.split("-")[0]}-btn`)
    const originalHTML = button.innerHTML
    button.innerHTML = `<div class="loading-spinner"></div> Processing...`
    button.disabled = true

    this.showStatus(`Enhancing with AI (${action})...`, "loading")

    try {
      const response = await fetch(`${this.apiBase}/api/enhance`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          transcript: this.currentTranscript,
          action: action,
          targetLanguage: action === "translate" ? "es" : undefined,
          model: "deepseek/deepseek-r1-distill-qwen-14b:free",
        }),
      })

      const data = await response.json()

      if (data.error) {
        throw new Error(data.error)
      }

      document.getElementById("result-text").value = data.result
      document.getElementById("char-count").textContent = `${data.result.length} characters`
      this.currentTranscript = data.result
      this.showStatus(`Enhancement completed (${action})!`, "success")

      setTimeout(() => this.clearStatus(), 3000)
    } catch (error) {
      console.error("Enhancement error:", error)
      this.showStatus(`Enhancement failed: ${error.message}`, "error")
    } finally {
      button.innerHTML = originalHTML
      button.disabled = false
    }
  }

  openDashboard() {
    window.chrome.tabs.create({ url: `${this.apiBase}/dashboard` })
  }

  openWebApp() {
    window.chrome.tabs.create({ url: `${this.apiBase}/transcribe` })
  }
}

// Initialize popup when DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
  new YouTubeTranscriberPopup()
})
