# StreamViz


An educational dashboard to demonstrate how real-time video streaming platforms work.

## Tech Stack

- **Backend**: Python 3 + Flask
- **Frontend**: HTML + CSS + JavaScript (vanilla)
- **Video Proxy**: Range-aware streaming proxy
- **YouTube Support**: yt-dlp (optional)
- **AI Troubleshooting**: Google Generative AI / Gemini (optional)


## Setup

```bash
# Install dependencies
pip install -r requirements.txt

# (Optional) Set AI troubleshooting API key
set GOOGLE_API_KEY=your_key_here      # Windows
export GOOGLE_API_KEY=your_key_here   # macOS/Linux

# Run the server
python app.py
```

Open [http://localhost:9002](http://localhost:9002) in your browser.

## Deployment

### Vercel
1. Install Vercel CLI: `npm i -g vercel`
2. Run `vercel` in the project root.
3. Add your `GOOGLE_API_KEY` in the Vercel Dashboard under Environment Variables.

### Render
1. Create a new **Web Service** on Render.
2. Connect your repository.
3. **Environment**: `Python 3`
4. **Build Command**: `pip install -r requirements.txt`
5. **Start Command**: `gunicorn app:app`
6. Add `GOOGLE_API_KEY` to your Environment Variables.

## Features

- **Sample Videos**: 13 pre-loaded public domain videos (Big Buck Bunny, Sintel, etc.)
- **Custom URL**: Paste any direct MP4 URL to stream
- **YouTube Support**: Paste a YouTube URL and it will be resolved via yt-dlp
- **Live Metrics**: Real-time display of playback position, duration, buffer ranges, and buffered percentage
- **Stream Proxy**: Backend proxy with HTTP Range request support for proper seeking/buffering
- **AI Troubleshooting**: Optional Gemini-powered analysis when video loading fails
