"""
StreamViz — Educational Streaming Video Dashboard
Python (Flask) backend replacing the original Next.js/TypeScript stack.
"""

from flask import Flask, request, Response, render_template, jsonify
import requests as http_requests
import subprocess
import json
import os
import re

app = Flask(__name__)

# =============================================================================
# SAMPLE VIDEOS (migrated from src/lib/sample-videos.ts)
# =============================================================================
SAMPLE_VIDEOS = [
    {
        "title": "Big Buck Bunny",
        "description": "Big Buck Bunny tells the story of a giant rabbit with a heart bigger than himself.",
        "subtitle": "By Blender Foundation",
        "thumb": "",
        "url": "http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
    },
    {
        "title": "Elephant Dream",
        "description": "The first Blender Open Movie from 2006",
        "subtitle": "By Blender Foundation",
        "thumb": "",
        "url": "http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4",
    },
    {
        "title": "For Bigger Blazes",
        "description": "HBO GO now works with Chromecast — the easiest way to enjoy online video on your TV.",
        "subtitle": "By Google",
        "thumb": "",
        "url": "http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
    },
    {
        "title": "For Bigger Escape",
        "description": "Introducing Chromecast. The easiest way to enjoy online video and music on your TV.",
        "subtitle": "By Google",
        "thumb": "",
        "url": "http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4",
    },
    {
        "title": "For Bigger Fun",
        "description": "Introducing Chromecast. The easiest way to enjoy online video and music on your TV. For $35.",
        "subtitle": "By Google",
        "thumb": "",
        "url": "http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4",
    },
    {
        "title": "For Bigger Joyrides",
        "description": "Introducing Chromecast — for the times that call for bigger joyrides.",
        "subtitle": "By Google",
        "thumb": "",
        "url": "http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4",
    },
    {
        "title": "For Bigger Meltdowns",
        "description": "Introducing Chromecast — for when you want to make Buster's big meltdowns even bigger.",
        "subtitle": "By Google",
        "thumb": "",
        "url": "http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4",
    },
    {
        "title": "Sintel",
        "description": "Sintel is an independently produced short film by the Blender Foundation.",
        "subtitle": "By Blender Foundation",
        "thumb": "",
        "url": "http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4",
    },
    {
        "title": "Subaru Outback On Street And Dirt",
        "description": "Smoking Tire takes the all-new Subaru Outback to the highest point we can find.",
        "subtitle": "By Garage419",
        "thumb": "",
        "url": "http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/SubaruOutbackOnStreetAndDirt.mp4",
    },
    {
        "title": "Tears of Steel",
        "description": "Tears of Steel was realized with crowd-funding by users of Blender.",
        "subtitle": "By Blender Foundation",
        "thumb": "",
        "url": "http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4",
    },
    {
        "title": "Volkswagen GTI Review",
        "description": "The Smoking Tire heads out to test the most requested car of 2010.",
        "subtitle": "By Garage419",
        "thumb": "",
        "url": "http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/VolkswagenGTIReview.mp4",
    },
    {
        "title": "We Are Going On Bullrun",
        "description": "The Smoking Tire is going on the 2010 Bullrun Live Rally.",
        "subtitle": "By Garage419",
        "thumb": "",
        "url": "http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/WeAreGoingOnBullrun.mp4",
    },
    {
        "title": "What Car Can You Get For A Grand?",
        "description": "How far can $1,000 go when looking for a car?",
        "subtitle": "By Garage419",
        "thumb": "",
        "url": "http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/WhatCarCanYouGetForAGrand.mp4",
    },
]


def _get_thumb_url(title: str) -> str:
    """Picsum placeholder seeded by title (mirrors thumb-placeholder.ts)."""
    seed = re.sub(r"[^a-z0-9]", "", title.lower())
    return f"https://picsum.photos/seed={seed}/480/270.jpg"


# =============================================================================
# ROUTES
# =============================================================================


@app.route("/")
def index():
    """Serve the main dashboard page."""
    return render_template("index.html", videos=SAMPLE_VIDEOS)


@app.route("/api/videos")
def api_videos():
    """JSON endpoint returning the list of sample videos (for JS fetch)."""
    enriched = []
    for v in SAMPLE_VIDEOS:
        enriched.append({
            **v,
            "thumb": v["thumb"] or _get_thumb_url(v["title"]),
        })
    return jsonify(enriched)


# =============================================================================
# STREAM PROXY — mirrors src/app/api/stream/route.ts
# Supports HTTP Range requests for proper seeking/buffering.
# =============================================================================


@app.route("/api/stream")
def stream():
    video_url = request.args.get("url")
    if not video_url:
        return jsonify({"error": "Missing video URL"}), 400

    # Forward headers — especially Range for partial content
    proxy_headers = {
        "User-Agent": "Mozilla/5.0 (compatible; StreamVizProxy/1.0)",
    }
    if "Range" in request.headers:
        proxy_headers["Range"] = request.headers["Range"]

    try:
        upstream = http_requests.get(
            video_url,
            headers=proxy_headers,
            stream=True,
            timeout=30,
        )
    except http_requests.RequestException as exc:
        return jsonify({"error": f"Upstream fetch failed: {exc}"}), 502

    if upstream.status_code not in (200, 206):
        return jsonify({
            "error": f"Upstream returned {upstream.status_code}",
        }), upstream.status_code

    def generate():
        for chunk in upstream.iter_content(chunk_size=65536):
            if chunk:
                yield chunk

    resp_headers = {
        "Content-Type": upstream.headers.get("Content-Type", "video/mp4"),
        "Accept-Ranges": "bytes",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Range",
        "Access-Control-Expose-Headers": "Content-Range, Content-Length",
        "Cache-Control": "no-cache, no-store, must-revalidate",
    }

    for hdr in ("Content-Length", "Content-Range"):
        if hdr in upstream.headers:
            resp_headers[hdr] = upstream.headers[hdr]

    return Response(
        generate(),
        status=upstream.status_code,
        headers=resp_headers,
    )


# =============================================================================
# RESOLVE VIDEO URL — mirrors resolveVideoUrl() in actions.ts
# YouTube URLs → yt-dlp, otherwise validates as direct MP4.
# =============================================================================


@app.route("/api/resolve", methods=["POST"])
def resolve():
    data = request.get_json(silent=True) or {}
    url = data.get("url", "").strip()

    if not url or not (url.startswith("http://") or url.startswith("https://")):
        return jsonify({"success": False, "error": "Invalid URL provided."}), 400

    # Check if it's a YouTube URL
    yt_patterns = ("youtube.com/watch", "youtu.be/", "youtube.com/shorts/")
    is_youtube = any(p in url for p in yt_patterns)

    if is_youtube:
        try:
            result = subprocess.run(
                [
                    "yt-dlp",
                    "--no-warnings",
                    "-f", "best[ext=mp4]/best",
                    "-g",
                    url,
                ],
                capture_output=True,
                text=True,
                timeout=30,
            )
            if result.returncode == 0 and result.stdout.strip():
                direct_url = result.stdout.strip().split("\n")[0]
                return jsonify({"success": True, "url": direct_url})
            else:
                err = result.stderr.strip() or "yt-dlp returned no output"
                return jsonify({"success": False, "error": f"YouTube extraction failed: {err}"})
        except FileNotFoundError:
            return jsonify({"success": False, "error": "yt-dlp is not installed on the server."})
        except subprocess.TimeoutExpired:
            return jsonify({"success": False, "error": "YouTube extraction timed out."})
        except Exception as exc:
            return jsonify({"success": False, "error": str(exc)})

    # Direct URL — validate with HEAD request
    try:
        head = http_requests.head(url, allow_redirects=True, timeout=10)
        ct = head.headers.get("Content-Type", "")

        if "video/" in ct:
            return jsonify({"success": True, "url": head.url, "codecs": ct})

        # If HEAD fails / isn't video, try GET to check content type
        if not head.ok:
            get_resp = http_requests.get(url, allow_redirects=True, timeout=10, stream=True)
            ct = get_resp.headers.get("Content-Type", "")
            if "video/" in ct:
                return jsonify({"success": True, "url": get_resp.url, "codecs": ct})
            get_resp.close()

        return jsonify({
            "success": False,
            "error": f"URL is not a direct video link. Content-Type: {ct}",
        })
    except Exception as exc:
        return jsonify({"success": False, "error": str(exc)})


# =============================================================================
# AI TROUBLESHOOT — mirrors getAiTroubleshooting() in actions.ts
# Uses google-generativeai (Gemini).
# =============================================================================


@app.route("/api/troubleshoot", methods=["POST"])
def troubleshoot():
    api_key = os.getenv("GOOGLE_API_KEY")
    if not api_key:
        return jsonify({
            "analysis": "AI troubleshooting is not configured (missing GOOGLE_API_KEY).",
            "suggestions": ["Set the GOOGLE_API_KEY environment variable and restart."],
            "potentialIssues": ["UNKNOWN_ISSUE"],
        })

    try:
        import google.generativeai as genai

        genai.configure(api_key=api_key)
        model = genai.GenerativeModel("gemini-2.0-flash")

        data = request.get_json(silent=True) or {}
        failed_url = data.get("failedUrl", "")
        error_message = data.get("errorMessage", "")

        prompt = f"""You are an expert AI assistant specialized in troubleshooting video link extraction failures.
Analyze why the following video URL failed to resolve into a playable MP4 stream.

URL: {failed_url}
Error Message: {error_message}

Consider: DRM, authentication, CORS, Range request support, geo-restrictions, expired links,
embed-only content, malformed URLs, scraping failures, and network issues.

Return a JSON object with:
- "analysis": detailed explanation string
- "suggestions": array of actionable suggestion strings
- "potentialIssues": array from [DRM_PROTECTED, AUTHENTICATION_REQUIRED, CORS_BLOCKED, NO_RANGE_SUPPORT, GEO_RESTRICTED, TEMPORARY_LINK_EXPIRED, EMBED_ONLY, INVALID_URL_FORMAT, WEBPAGE_SCRAPING_FAILED, UNKNOWN_ISSUE]
"""
        response = model.generate_content(prompt)
        text = response.text.strip()

        # Try to parse JSON from the response
        json_match = re.search(r"\{[\s\S]*\}", text)
        if json_match:
            return jsonify(json.loads(json_match.group()))

        return jsonify({
            "analysis": text,
            "suggestions": [],
            "potentialIssues": ["UNKNOWN_ISSUE"],
        })

    except Exception as exc:
        return jsonify({
            "analysis": f"AI analysis failed: {exc}",
            "suggestions": ["Check server logs for details.", "Verify GOOGLE_API_KEY is valid."],
            "potentialIssues": ["UNKNOWN_ISSUE"],
        })


# =============================================================================
# ENTRYPOINT
# =============================================================================

if __name__ == "__main__":
    app.run(debug=True, host="0.0.0.0", port=9002)
