// Enhanced YouTube content script
class YouTubeTranscriberContent {
  constructor() {
    this.apiBase = "https://v0-chrome-extension-guide-livid.vercel.app"
    this.init()
  }

  init() {
    this.waitForYouTubeLoad().then(() => {
      this.addTranscribeButton()
      this.observePageChanges()
    })
  }

  waitForYouTubeLoad() {
    return new Promise((resolve) => {
      const checkInterval = setInterval(() => {
        if (document.querySelector("#title h1, .ytd-video-primary-info-renderer h1")) {
          clearInterval(checkInterval)
          resolve()
        }
      }, 500)
    })
  }

  addTranscribeButton() {
    // Remove existing button
    const existing = document.querySelector(".yt-transcriber-container")
    if (existing) existing.remove()

    // Find insertion point
    const targetElement = this.findInsertionPoint()
    if (!targetElement) return

    // Create container
    const container = document.createElement("div")
    container.className = "yt-transcriber-container"
    container.innerHTML = `
      <div style="
        margin: 16px 0;
        padding: 20px;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        border-radius: 16px;
        box-shadow: 0 8px 32px rgba(102, 126, 234, 0.2);
        position: relative;
        overflow: hidden;
      ">
        <div style="display: flex; align-items: center; gap: 16px; margin-bottom: 16px; position: relative;">
          <div style="
            width: 48px;
            height: 48px;
            background: rgba(255, 255, 255, 0.2);
            border-radius: 12px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 24px;
            backdrop-filter: blur(10px);
          ">🎥</div>
          <div>
            <h3 style="
              color: white;
              font-size: 18px;
              font-weight: 700;
              margin: 0 0 4px 0;
              font-family: 'YouTube Sans', 'Roboto', sans-serif;
              text-shadow: 0 2px 4px rgba(0,0,0,0.1);
            ">AI Transcriber</h3>
            <p style="
              color: rgba(255, 255, 255, 0.9);
              font-size: 13px;
              margin: 0;
              font-family: 'YouTube Sans', 'Roboto', sans-serif;
            ">Extract captions, generate summaries, and translate content</p>
          </div>
        </div>
        
        <button id="yt-transcriber-btn" style="
          width: 100%;
          padding: 14px 24px;
          background: rgba(255, 255, 255, 0.95);
          color: #667eea;
          border: none;
          border-radius: 12px;
          font-size: 15px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          font-family: 'YouTube Sans', 'Roboto', sans-serif;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.1);
          backdrop-filter: blur(10px);
          position: relative;
          overflow: hidden;
        " 
        onmouseover="
          this.style.background='white'; 
          this.style.transform='translateY(-2px)'; 
          this.style.boxShadow='0 8px 24px rgba(0,0,0,0.15)';
        " 
        onmouseout="
          this.style.background='rgba(255, 255, 255, 0.95)'; 
          this.style.transform='translateY(0)'; 
          this.style.boxShadow='0 4px 12px rgba(0,0,0,0.1)';
        ">
          <span style="font-size: 18px;">🎯</span>
          <span>Open Transcriber</span>
        </button>
      </div>
    `

    // Add click handler
    const button = container.querySelector("#yt-transcriber-btn")
    button.addEventListener("click", () => this.openExtensionPopup())

    // Insert into page
    targetElement.appendChild(container)
  }

  findInsertionPoint() {
    const selectors = [
      "#title.ytd-video-primary-info-renderer",
      ".ytd-video-primary-info-renderer #title",
      "#container #title",
      "h1.title",
    ]

    for (const selector of selectors) {
      const element = document.querySelector(selector)
      if (element) {
        return element.parentElement || element
      }
    }

    return null
  }

  openExtensionPopup() {
    // Show a tooltip to guide users to the extension icon
    this.showExtensionTooltip()
  }

  showExtensionTooltip() {
    // Create a temporary tooltip
    const tooltip = document.createElement("div")
    tooltip.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: #1f2937;
      color: white;
      padding: 16px 20px;
      border-radius: 12px;
      font-size: 14px;
      font-weight: 500;
      z-index: 10000;
      box-shadow: 0 10px 40px rgba(0,0,0,0.3);
      animation: slideIn 0.3s ease-out;
      max-width: 300px;
      font-family: 'YouTube Sans', 'Roboto', sans-serif;
    `

    tooltip.innerHTML = `
      <div style="display: flex; align-items: center; gap: 12px;">
        <div style="font-size: 24px;">👆</div>
        <div>
          <div style="font-weight: 600; margin-bottom: 4px;">Click the extension icon</div>
          <div style="font-size: 12px; opacity: 0.8;">Look for the YouTube Transcriber icon in your browser toolbar</div>
        </div>
      </div>
    `

    // Add animation
    const style = document.createElement("style")
    style.textContent = `
      @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
      }
    `
    document.head.appendChild(style)

    document.body.appendChild(tooltip)

    // Remove tooltip after 5 seconds
    setTimeout(() => {
      tooltip.style.animation = "slideIn 0.3s ease-out reverse"
      setTimeout(() => {
        if (tooltip.parentNode) {
          tooltip.parentNode.removeChild(tooltip)
        }
        if (style.parentNode) {
          style.parentNode.removeChild(style)
        }
      }, 300)
    }, 5000)
  }

  observePageChanges() {
    const observer = new MutationObserver(() => {
      if (window.location.href.includes("youtube.com/watch") && !document.querySelector(".yt-transcriber-container")) {
        setTimeout(() => this.addTranscribeButton(), 1000)
      }
    })

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    })
  }
}

// Initialize when page loads
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => new YouTubeTranscriberContent())
} else {
  new YouTubeTranscriberContent()
}
