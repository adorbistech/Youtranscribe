// Popup script for Chrome extension
class YouTubeTranscriberPopup {
  constructor() {
    this.currentTab = null
    this.videoId = null
    this.videoTitle = null
    this.apiBase = "https://v0-chrome-extension-guide-livid.vercel.app"

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
      // Try to get video title from the page
      const [result] = await window.chrome.scripting.executeScript({
        target: { tabId: this.currentTab.id },
        function: () => {
          const titleElement = document.querySelector(
            "h1.ytd-video-primary-info-renderer, h1.title, .ytd-video-primary-info-renderer h1",
          )
          return titleElement ? titleElement.textContent.trim() : "YouTube Video"
        },
      })

      this.videoTitle = result.result || "YouTube Video"

      document.getElementById("video-title").textContent = this.videoTitle
      document.getElementById("video-id").textContent = `Video ID: ${this.videoId}`
      document.getElementById("video-info").classList.remove("hidden")
    } catch (error) {
      console.error("Error loading video info:", error)
      this.videoTitle = "YouTube Video"
      document.getElementById("video-title").textContent = this.videoTitle
      document.getElementById("video-id").textContent = `Video ID: ${this.videoId}`
      document.getElementById("video-info").classList.remove("hidden")
    }
  }

  showStatus(message, type = "loading") {
    const statusArea = document.getElementById("status-area")
    const spinner = type === "loading" ? '<div class="loading-spinner"></div>' : ""
    statusArea.innerHTML = `<div class="status ${type}">${spinner}${message}</div>`
  }

  clearStatus() {
    document.getElementById("status-area").innerHTML = ""
  }

  async handleTranscribe() {
    const transcribeBtn = document.getElementById("transcribe-btn")
    const service = document.getElementById("service-select").value
    const language = document.getElementById("language-select").value

    transcribeBtn.disabled = true
    transcribeBtn.textContent = "🔄 Processing..."
    this.showStatus("Starting transcription...", "loading")

    try {
      // First try to extract existing subtitles
      if (service === "auto") {
        this.showStatus("Checking for existing subtitles...", "loading")
        const subtitles = await this.extractExistingSubtitles()

        if (subtitles) {
          this.displayResult(subtitles, "youtube-cc")
          this.showStatus("Transcription completed using existing subtitles!", "success")
          return
        }
      }

      // Fall back to API transcription
      this.showStatus("Generating transcription with AI...", "loading")
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

      if (data.error) {
        throw new Error(data.error)
      }

      this.displayResult(data.transcript, data.service)
      this.showStatus("Transcription completed successfully!", "success")

      // Save to history
      this.saveToHistory(data)
    } catch (error) {
      console.error("Transcription error:", error)
      this.showStatus(`Error: ${error.message}`, "error")
    } finally {
      transcribeBtn.disabled = false
      transcribeBtn.textContent = "🎯 Start Transcription"
    }
  }

  async extractExistingSubtitles() {
    try {
      const [result] = await window.chrome.scripting.executeScript({
        target: { tabId: this.currentTab.id },
        function: () => {
          return new Promise((resolve) => {
            // Try to find and enable captions
            const ccButton = document.querySelector(".ytp-subtitles-button")
            if (ccButton && ccButton.getAttribute("aria-pressed") === "false") {
              ccButton.click()
            }

            // Wait for captions to appear
            setTimeout(() => {
              const captions = document.querySelectorAll(".captions-text span, .ytp-caption-segment")
              if (captions.length > 0) {
                const text = Array.from(captions)
                  .map((el) => el.textContent)
                  .filter(Boolean)
                  .join(" ")
                resolve(text)
              } else {
                resolve(null)
              }
            }, 2000)
          })
        },
      })

      return result.result
    } catch (error) {
      console.error("Error extracting subtitles:", error)
      return null
    }
  }

  displayResult(transcript, service) {
    document.getElementById("result-text").value = transcript
    document.getElementById("result-area").classList.remove("hidden")

    // Store current transcript for enhancements
    this.currentTranscript = transcript
    this.currentService = service
  }

  copyToClipboard() {
    const textarea = document.getElementById("result-text")
    textarea.select()
    document.execCommand("copy")

    const copyBtn = document.getElementById("copy-btn")
    const originalText = copyBtn.textContent
    copyBtn.textContent = "✅ Copied!"
    setTimeout(() => {
      copyBtn.textContent = originalText
    }, 1000)
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
    const originalText = button.textContent
    button.textContent = "🔄 Processing..."
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
      this.currentTranscript = data.result
      this.showStatus(`Enhancement completed (${action})!`, "success")
    } catch (error) {
      console.error("Enhancement error:", error)
      this.showStatus(`Enhancement failed: ${error.message}`, "error")
    } finally {
      button.textContent = originalText
      button.disabled = false
    }
  }

  openDashboard() {
    window.chrome.tabs.create({ url: `${this.apiBase}/dashboard` })
  }

  async saveToHistory(transcriptionData) {
    try {
      await fetch(`${this.apiBase}/api/history`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          videoId: this.videoId,
          title: this.videoTitle,
          transcript: transcriptionData.transcript,
          service: transcriptionData.service,
          language: transcriptionData.language,
        }),
      })
    } catch (error) {
      console.error("Failed to save to history:", error)
    }
  }
}

// Initialize popup when DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
  new YouTubeTranscriberPopup()
})
