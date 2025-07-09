// Background service worker for Chrome extension

// Declare the chrome variable
const chrome = window.chrome

// Handle extension installation
chrome.runtime.onInstalled.addListener(() => {
  console.log("YouTube AI Transcriber installed successfully!")
})

// Handle messages from content script or popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  switch (request.action) {
    case "openDashboard":
      chrome.tabs.create({
        url: "https://v0-chrome-extension-guide-livid.vercel.app/dashboard",
      })
      break

    case "openTranscriber":
      chrome.tabs.create({
        url: "https://v0-chrome-extension-guide-livid.vercel.app/transcribe",
      })
      break

    default:
      console.log("Unknown action:", request.action)
  }
})

// Handle tab updates to ensure content script is injected
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === "complete" && tab.url?.includes("youtube.com/watch")) {
    // Inject content script if needed
    chrome.scripting
      .executeScript({
        target: { tabId },
        files: ["content-script.js"],
      })
      .catch(console.error)
  }
})
