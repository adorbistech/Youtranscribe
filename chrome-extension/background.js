// Enhanced background service worker with proper error handling
console.log("YouTube AI Transcriber background script loaded")

// Declare the chrome variable
const chrome = window.chrome

// Handle extension installation
chrome.runtime.onInstalled.addListener((details) => {
  console.log("YouTube AI Transcriber installed:", details.reason)

  if (details.reason === "install") {
    // Set default settings or show welcome page
    console.log("Extension installed for the first time")
  }
})

// Handle messages with comprehensive error handling
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log("Background received message:", request)

  // Always return true for async responses to keep message port open
  const handleAsync = async () => {
    try {
      switch (request.action) {
        case "openDashboard":
          await chrome.tabs.create({
            url: "https://v0-chrome-extension-guide-livid.vercel.app/dashboard",
          })
          sendResponse({ success: true })
          break

        case "openTranscriber":
          await chrome.tabs.create({
            url: "https://v0-chrome-extension-guide-livid.vercel.app/transcribe",
          })
          sendResponse({ success: true })
          break

        case "transcribe":
          try {
            const result = await handleTranscription(request.data)
            sendResponse({ success: true, data: result })
          } catch (error) {
            console.error("Transcription failed:", error)
            sendResponse({ success: false, error: error.message })
          }
          break

        case "getVideoInfo":
          try {
            const info = await getVideoInfo(request.videoId)
            sendResponse({ success: true, data: info })
          } catch (error) {
            console.error("Video info failed:", error)
            sendResponse({ success: false, error: error.message })
          }
          break

        default:
          console.log("Unknown action:", request.action)
          sendResponse({ success: false, error: "Unknown action" })
      }
    } catch (error) {
      console.error("Background script error:", error)
      sendResponse({ success: false, error: error.message })
    }
  }

  handleAsync()
  return true // Keep message channel open for async response
})

async function handleTranscription(data) {
  const apiUrl = "https://v0-chrome-extension-guide-livid.vercel.app/api/transcribe"
  console.log("Making transcription request to:", apiUrl)
  console.log("Request data:", data)

  try {
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(data),
    })

    console.log("Response status:", response.status)
    console.log("Response headers:", Object.fromEntries(response.headers.entries()))

    if (!response.ok) {
      const errorText = await response.text()
      console.error("API Error Response:", errorText)
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    const result = await response.json()
    console.log("Transcription result:", result)
    return result
  } catch (error) {
    console.error("Transcription request failed:", error)
    throw error
  }
}

async function getVideoInfo(videoId) {
  const apiUrl = "https://v0-chrome-extension-guide-livid.vercel.app/api/video-info"
  console.log("Getting video info for:", videoId)

  try {
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({ videoId }),
    })

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    return await response.json()
  } catch (error) {
    console.error("Video info request failed:", error)
    throw error
  }
}

// Handle tab updates with better error handling
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === "complete" && tab.url?.includes("youtube.com/watch")) {
    console.log("YouTube page loaded, injecting content script")

    chrome.scripting
      .executeScript({
        target: { tabId },
        files: ["content-script.js"],
      })
      .then(() => {
        console.log("Content script injected successfully")
      })
      .catch((error) => {
        // This is normal if script is already injected
        console.log("Content script injection skipped (already present):", error.message)
      })
  }
})

// Handle extension errors
chrome.runtime.onStartup.addListener(() => {
  console.log("Extension startup")
})

// Clean up on suspend
chrome.runtime.onSuspend.addListener(() => {
  console.log("Extension suspending")
})
