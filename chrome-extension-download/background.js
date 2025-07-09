// Background service worker for Chrome extension

// Declare the chrome variable
const chrome = window.chrome

// Handle extension installation
chrome.runtime.onInstalled.addListener(() => {
  console.log("YouTube AI Transcriber installed successfully!")
})

// Handle messages from content script or popup with proper error handling
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log("Background received message:", request)

  try {
    switch (request.action) {
      case "openDashboard":
        chrome.tabs.create({
          url: "https://v0-chrome-extension-guide-livid.vercel.app/dashboard",
        })
        sendResponse({ success: true })
        break

      case "openTranscriber":
        chrome.tabs.create({
          url: "https://v0-chrome-extension-guide-livid.vercel.app/transcribe",
        })
        sendResponse({ success: true })
        break

      case "transcribe":
        // Handle transcription request
        handleTranscription(request.data)
          .then((result) => sendResponse({ success: true, data: result }))
          .catch((error) => sendResponse({ success: false, error: error.message }))
        return true // Keep message channel open for async response

      default:
        console.log("Unknown action:", request.action)
        sendResponse({ success: false, error: "Unknown action" })
    }
  } catch (error) {
    console.error("Background script error:", error)
    sendResponse({ success: false, error: error.message })
  }
})

async function handleTranscription(data) {
  try {
    const response = await fetch("https://v0-chrome-extension-guide-livid.vercel.app/api/transcribe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    })

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    return await response.json()
  } catch (error) {
    console.error("Transcription error:", error)
    throw error
  }
}

// Handle tab updates to ensure content script is injected
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === "complete" && tab.url?.includes("youtube.com/watch")) {
    // Inject content script if needed
    chrome.scripting
      .executeScript({
        target: { tabId },
        files: ["content-script.js"],
      })
      .catch((error) => {
        console.log("Content script injection failed (this is normal if already injected):", error)
      })
  }
})
