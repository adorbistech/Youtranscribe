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
                padding: 16px;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                border-radius: 12px;
                box-shadow: 0 4px 12px rgba(102, 126, 234, 0.15);
            ">
                <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 12px;">
                    <div style="
                        width: 40px;
                        height: 40px;
                        background: rgba(255, 255, 255, 0.2);
                        border-radius: 10px;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        font-size: 20px;
                    ">🎥</div>
                    <div>
                        <h3 style="
                            color: white;
                            font-size: 16px;
                            font-weight: 600;
                            margin: 0;
                            font-family: 'YouTube Sans', 'Roboto', sans-serif;
                        ">AI Transcriber</h3>
                        <p style="
                            color: rgba(255, 255, 255, 0.8);
                            font-size: 12px;
                            margin: 0;
                            font-family: 'YouTube Sans', 'Roboto', sans-serif;
                        ">Get transcript, summary, and translations</p>
                    </div>
                </div>
                
                <button id="yt-transcriber-btn" style="
                    width: 100%;
                    padding: 12px 20px;
                    background: rgba(255, 255, 255, 0.9);
                    color: #667eea;
                    border: none;
                    border-radius: 8px;
                    font-size: 14px;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.2s ease;
                    font-family: 'YouTube Sans', 'Roboto', sans-serif;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 8px;
                " onmouseover="this.style.background='white'; this.style.transform='translateY(-1px)'" 
                   onmouseout="this.style.background='rgba(255, 255, 255, 0.9)'; this.style.transform='translateY(0)'">
                    <span>🎯</span>
                    <span>Open Transcriber</span>
                </button>
                
                <div id="yt-transcriber-result" style="display: none; margin-top: 16px;">
                    <textarea style="
                        width: 100%;
                        min-height: 120px;
                        padding: 12px;
                        border: none;
                        border-radius: 8px;
                        font-size: 13px;
                        line-height: 1.5;
                        resize: vertical;
                        font-family: 'YouTube Sans', 'Roboto', sans-serif;
                        background: rgba(255, 255, 255, 0.95);
                    " readonly placeholder="Transcription will appear here..."></textarea>
                    
                    <div style="display: flex; gap: 8px; margin-top: 8px;">
                        <button onclick="this.parentElement.previousElementSibling.select(); document.execCommand('copy'); this.textContent='✅ Copied!'; setTimeout(() => this.textContent='📋 Copy', 1000)" style="
                            flex: 1;
                            padding: 8px 12px;
                            background: rgba(255, 255, 255, 0.9);
                            color: #667eea;
                            border: none;
                            border-radius: 6px;
                            font-size: 12px;
                            font-weight: 500;
                            cursor: pointer;
                            font-family: 'YouTube Sans', 'Roboto', sans-serif;
                        ">📋 Copy</button>
                        
                        <button onclick="
                            const text = this.parentElement.previousElementSibling.value;
                            const blob = new Blob([text], {type: 'text/plain'});
                            const url = URL.createObjectURL(blob);
                            const a = document.createElement('a');
                            a.href = url;
                            a.download = 'transcript.txt';
                            a.click();
                            URL.revokeObjectURL(url);
                        " style="
                            flex: 1;
                            padding: 8px 12px;
                            background: rgba(255, 255, 255, 0.9);
                            color: #667eea;
                            border: none;
                            border-radius: 6px;
                            font-size: 12px;
                            font-weight: 500;
                            cursor: pointer;
                            font-family: 'YouTube Sans', 'Roboto', sans-serif;
                        ">💾 Download</button>
                    </div>
                </div>
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
    // This will trigger the user to click the extension icon
    alert("👆 Click the YouTube AI Transcriber extension icon in your browser toolbar to start transcribing!")
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
