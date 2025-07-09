// Background service worker for Chrome extension

declare const chrome: any

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  switch (request.action) {
    case "transcribe":
      handleTranscription(request.data)
        .then((result) => sendResponse({ success: true, data: result }))
        .catch((error) => sendResponse({ success: false, error: error.message }))
      return true // Required for async response

    case "enhance":
      handleEnhancement(request.data)
        .then((result) => sendResponse({ success: true, data: result }))
        .catch((error) => sendResponse({ success: false, error: error.message }))
      return true

    case "saveHistory":
      saveToHistory(request.data)
        .then(() => sendResponse({ success: true }))
        .catch((error) => sendResponse({ success: false, error: error.message }))
      return true
  }
})

async function handleTranscription(data: { videoId: string; service: string; language: string }) {
  const response = await fetch("https://your-vercel-app.vercel.app/api/transcribe", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  })

  if (!response.ok) {
    throw new Error("Transcription failed")
  }

  return await response.json()
}

async function handleEnhancement(data: { transcript: string; action: string; targetLanguage?: string }) {
  const response = await fetch("https://your-vercel-app.vercel.app/api/enhance", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  })

  if (!response.ok) {
    throw new Error("Enhancement failed")
  }

  return await response.json()
}

async function saveToHistory(data: any) {
  // Save to local storage and sync with server
  const history = await chrome.storage.local.get(["transcriptionHistory"])
  const updatedHistory = [data, ...(history.transcriptionHistory || [])]

  await chrome.storage.local.set({ transcriptionHistory: updatedHistory })

  // Also save to server
  try {
    await fetch("https://your-vercel-app.vercel.app/api/history", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    })
  } catch (error) {
    console.error("Failed to sync with server:", error)
  }
}

// Handle extension installation
chrome.runtime.onInstalled.addListener(() => {
  console.log("YouTube AI Transcriber installed")
})

// Handle tab updates to inject content script if needed
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === "complete" && tab.url?.includes("youtube.com/watch")) {
    chrome.scripting
      .executeScript({
        target: { tabId },
        files: ["content-script.js"],
      })
      .catch(console.error)
  }
})
