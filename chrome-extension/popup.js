// Enhanced popup script with better error handling
class YouTubeTranscriberPopup {
  constructor() {
    this.currentTab = null
    this.videoId = null
    this.videoTitle = null
    this.apiBase = "https://v0-chrome-extension-guide-livid.vercel.app"
    this.currentTranscript = null
    this.isInitialized = false

    this.init()
  }

  async init() {
    try {
      console.log("Initializing popup...")
      await this.getCurrentTab()
      this.setupEventListeners()
      this.checkYouTubePage()
      this.isInitialized = true
      console.log("Popup initialized successfully")
    } catch (error) {
      console.error("Initialization error:", error)
      this.showStatus("Extension initialization failed", "error")
    }
  }

  async getCurrentTab() {
    try {
      const chrome = window.chrome // Declare the chrome variable
      if (!chrome?.tabs?.query) {
        throw new Error("Chrome tabs API not available")
      }

      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
      if (!tab) {
        throw new Error("No active tab found")
      }

      this.currentTab = tab
      console.log("Current tab:", tab.url)
    } catch (error) {
      console.error("Failed to get current tab:", error)
      throw error
    }
  }

  setupEventListeners() {
    const elements = {
      "transcribe-btn": () => this.handleTranscribe(),
      "copy-btn": () => this.copyToClipboard(),
      "download-btn": () => this.downloadTranscript(),
      "summarize-btn": () => this.enhanceText("summarize"),
      "keypoints-btn": () => this.enhanceText("extract-key-points"),
      "translate-btn": () => this.enhanceText("translate"),
      "dashboard-btn": () => this.openDashboard(),
      "open-web-btn": () => this.openWebApp(),
    }

    Object.entries(elements).forEach(([id, handler]) => {
      const element = document.getElementById(id)
      if (element) {
        element.addEventListener("click", handler)
        console.log(`Event listener added for ${id}`)
      } else {
        console.warn(`Element not found: ${id}`)
      }
    })
  }

  checkYouTubePage() {
    if (!this.currentTab?.url?.includes("youtube.com/watch")) {
      console.log("Not on YouTube watch page")
      this.showNotYouTube()
      return
    }

    try {
      const url = new URL(this.currentTab.url)
      this.videoId = url.searchParams.get("v")

      if (!this.videoId) {
        console.log("No video ID found in URL")
        this.showNotYouTube()
        return
      }

      console.log("Video ID extracted:", this.videoId)
      this.showMainContent()
      this.loadVideoInfo()
    } catch (error) {
      console.error("Error parsing YouTube URL:", error)
      this.showNotYouTube()
    }
  }

  showNotYouTube() {
    const notYoutube = document.getElementById("not-youtube")
    const mainContent = document.getElementById("main-content")

    if (notYoutube) notYoutube.classList.remove("hidden")
    if (mainContent) mainContent.classList.add("hidden")
  }

  showMainContent() {
    const notYoutube = document.getElementById("not-youtube")
    const mainContent = document.getElementById("main-content")

    if (notYoutube) notYoutube.classList.add("hidden")
    if (mainContent) mainContent.classList.remove("hidden")
  }

  async loadVideoInfo() {
    try {
      const videoInfo = document.getElementById("video-info")
      const videoTitle = document.getElementById("video-title")
      const videoId = document.getElementById("video-id")

      if (videoInfo) videoInfo.classList.remove("hidden")
      if (videoTitle) videoTitle.textContent = "Loading video information..."
      if (videoId) videoId.textContent = `Video ID: ${this.videoId}`

      console.log("Loading video info for:", this.videoId)

      const response = await fetch(`${this.apiBase}/api/video-info`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({ videoId: this.videoId }),
      })

      console.log("Video info response status:", response.status)

      if (response.ok) {
        const info = await response.json()
        console.log("Video info received:", info)

        this.videoTitle = info.title
        if (videoTitle) videoTitle.textContent = info.title

        // Update caption status
        this.updateCaptionStatus(info.hasCaptions)
      } else {
        const errorText = await response.text()
        console.error("Video info API error:", response.status, errorText)
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }
    } catch (error) {
      console.error("Error loading video info:", error)
      this.videoTitle = "YouTube Video"

      const videoTitle = document.getElementById("video-title")
      if (videoTitle) videoTitle.textContent = this.videoTitle

      const captionStatus = document.getElementById("caption-status")
      if (captionStatus) captionStatus.classList.add("hidden")
    }
  }

  updateCaptionStatus(hasCaptions) {
    const captionStatus = document.getElementById("caption-status")
    const captionIcon = document.getElementById("caption-icon")
    const captionText = document.getElementById("caption-text")

    if (!captionStatus || !captionIcon || !captionText) return

    if (hasCaptions) {
      captionStatus.className = "caption-status available"
      captionIcon.textContent = "✅"
      captionText.textContent = "Captions available"
    } else {
      captionStatus.className = "caption-status unavailable"
      captionIcon.textContent = "⚠️"
      captionText.textContent = "No captions detected"
    }
  }

  showStatus(message, type = "loading") {
    const statusArea = document.getElementById("status-area")
    if (!statusArea) return

    const spinner = type === "loading" ? '<div class="loading-spinner"></div>' : ""
    const icon = type === "success" ? "✅" : type === "error" ? "❌" : ""
    statusArea.innerHTML = `<div class="status ${type}">${spinner}${icon}${message}</div>`
  }

  clearStatus() {
    const statusArea = document.getElementById("status-area")
    if (statusArea) statusArea.innerHTML = ""
  }

  async handleTranscribe() {
    if (!this.isInitialized) {
      this.showStatus("Extension not ready, please wait...", "error")
      return
    }

    const transcribeBtn = document.getElementById("transcribe-btn")
    const serviceSelect = document.getElementById("service-select")
    const languageSelect = document.getElementById("language-select")

    if (!transcribeBtn || !serviceSelect || !languageSelect) {
      this.showStatus("UI elements not found", "error")
      return
    }

    const service = serviceSelect.value
    const language = languageSelect.value

    transcribeBtn.disabled = true
    transcribeBtn.innerHTML = `<div class="loading-spinner"></div> Extracting Captions...`
    this.showStatus("Extracting captions from YouTube...", "loading")

    try {
      console.log("Starting transcription:", { videoId: this.videoId, service, language })

      const response = await fetch(`${this.apiBase}/api/transcribe`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          videoId: this.videoId,
          service: service === "auto" ? "whisper" : service,
          language: language,
        }),
      })

      console.log("Transcription response status:", response.status)
      console.log("Response headers:", Object.fromEntries(response.headers.entries()))

      const data = await response.json()
      console.log("Transcription response data:", data)

      if (!response.ok) {
        throw new Error(data.error || `HTTP ${response.status}: ${response.statusText}`)
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
    const resultText = document.getElementById("result-text")
    const resultArea = document.getElementById("result-area")
    const serviceBadge = document.getElementById("service-badge")
    const languageBadge = document.getElementById("language-badge")
    const charCount = document.getElementById("char-count")

    if (resultText) resultText.value = transcript
    if (resultArea) resultArea.classList.remove("hidden")
    if (serviceBadge) serviceBadge.textContent = service
    if (languageBadge) languageBadge.textContent = language
    if (charCount) charCount.textContent = `${transcript.length} characters`

    // Store current transcript for enhancements
    this.currentTranscript = transcript
    this.currentService = service
    this.currentLanguage = language

    console.log("Result displayed successfully")
  }

  async copyToClipboard() {
    const textarea = document.getElementById("result-text")
    const copyBtn = document.getElementById("copy-btn")

    if (!textarea || !copyBtn) return

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
      // Fallback for older browsers
      textarea.select()
      document.execCommand("copy")
    }
  }

  downloadTranscript() {
    const textarea = document.getElementById("result-text")
    if (!textarea || !this.videoId) return

    const transcript = textarea.value
    const blob = new Blob([transcript], { type: "text/plain" })
    const url = URL.createObjectURL(blob)

    const a = document.createElement("a")
    a.href = url
    a.download = `transcript_${this.videoId}.txt`
    a.click()

    URL.revokeObjectURL(url)
  }

  async enhanceText(action) {
    if (!this.currentTranscript) {
      this.showStatus("No transcript to enhance", "error")
      return
    }

    const button = document.getElementById(`${action.split("-")[0]}-btn`)
    if (!button) return

    const originalHTML = button.innerHTML
    button.innerHTML = `<div class="loading-spinner"></div> Processing...`
    button.disabled = true

    this.showStatus(`Enhancing with AI (${action})...`, "loading")

    try {
      const response = await fetch(`${this.apiBase}/api/enhance`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          transcript: this.currentTranscript,
          action: action,
          targetLanguage: action === "translate" ? "es" : undefined,
          model: "deepseek/deepseek-r1-distill-qwen-14b:free",
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || `HTTP ${response.status}: ${response.statusText}`)
      }

      const resultText = document.getElementById("result-text")
      const charCount = document.getElementById("char-count")

      if (resultText) resultText.value = data.result
      if (charCount) charCount.textContent = `${data.result.length} characters`

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
    if (window.chrome?.tabs?.create) {
      window.chrome.tabs.create({ url: `${this.apiBase}/dashboard` })
    } else {
      window.open(`${this.apiBase}/dashboard`, "_blank")
    }
  }

  openWebApp() {
    if (window.chrome?.tabs?.create) {
      window.chrome.tabs.create({ url: `${this.apiBase}/transcribe` })
    } else {
      window.open(`${this.apiBase}/transcribe`, "_blank")
    }
  }
}

// Initialize popup when DOM is loaded with error handling
document.addEventListener("DOMContentLoaded", () => {
  try {
    console.log("DOM loaded, initializing popup...")
    new YouTubeTranscriberPopup()
  } catch (error) {
    console.error("Failed to initialize popup:", error)

    // Show error in UI if possible
    const statusArea = document.getElementById("status-area")
    if (statusArea) {
      statusArea.innerHTML = `<div class="status error">❌ Extension failed to initialize: ${error.message}</div>`
    }
  }
})
