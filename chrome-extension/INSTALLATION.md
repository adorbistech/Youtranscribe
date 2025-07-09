# YouTube AI Transcriber - Chrome Extension Installation

## 📦 Quick Installation

### Step 1: Download Extension Files
1. Download all files from the `chrome-extension` folder
2. Create a new folder on your computer called `youtube-transcriber-extension`
3. Place all downloaded files in this folder

### Step 2: Install in Chrome
1. Open Chrome and go to `chrome://extensions/`
2. Enable "Developer mode" (toggle in top-right corner)
3. Click "Load unpacked"
4. Select your `youtube-transcriber-extension` folder
5. The extension should now appear in your extensions list

### Step 3: Pin the Extension
1. Click the puzzle piece icon (🧩) in Chrome toolbar
2. Find "YouTube AI Transcriber" and click the pin icon (📌)
3. The extension icon will now be visible in your toolbar

## 🎯 How to Use

### Method 1: Extension Popup
1. Go to any YouTube video
2. Click the YouTube AI Transcriber icon in your toolbar
3. Click "Extract Captions" to get the transcript
4. Use AI features to enhance the content

### Method 2: On-Page Button
1. Go to any YouTube video
2. Look for the purple "AI Transcriber" box below the video title
3. Click "Open Transcriber" to access the extension popup
4. Follow the tooltip to click the extension icon

### Method 3: Web App
1. Click "🌐 Open Web App" in the extension popup
2. Or visit: https://v0-chrome-extension-guide-livid.vercel.app/transcribe
3. Paste any YouTube URL directly

## ✨ Features

- **🎥 Real Caption Extraction** - Gets actual YouTube subtitles
- **🤖 AI Enhancements** - Summarize, translate, extract key points
- **📋 Easy Copy/Download** - One-click copy to clipboard or download as file
- **🌍 Multi-Language** - Support for 10+ languages
- **📊 Dashboard** - View and manage all your transcriptions
- **🎯 Smart Detection** - Shows if video has captions available

## 🔧 Troubleshooting

### Extension not loading?
- Make sure Developer mode is enabled
- Check that all files are in the same folder
- Try refreshing the extensions page

### Not working on YouTube?
- Refresh the YouTube page after installing
- Make sure you're on a video page (youtube.com/watch?v=...)
- Check browser console for any errors

### No captions found?
- The video might not have captions/subtitles
- Try a different video with CC available
- Some videos have auto-generated captions that may not be accessible

### API errors?
- Check your internet connection
- The Vercel app might be temporarily unavailable
- Try again in a few minutes

## 🎨 Customization

You can customize the extension by editing these files:
- `popup.html` - Change the popup interface
- `popup.js` - Modify functionality
- `content-script.js` - Adjust YouTube page integration
- `content-styles.css` - Update styling
- `manifest.json` - Change permissions or metadata

## 🚀 Publishing to Chrome Web Store

To publish this extension:
1. Create a Chrome Web Store developer account
2. Package the extension files into a ZIP
3. Upload to the Chrome Web Store
4. Fill out the store listing details
5. Submit for review

## 📝 Notes

- Extension requires internet connection
- Works best with videos that have captions
- AI features require API access
- Some videos may not have extractable subtitles
- Free tier available for AI enhancements

## 🆘 Support

If you need help:
1. Check this installation guide
2. Look at browser console for errors
3. Try the web app version as alternative
4. Report issues on the project repository
