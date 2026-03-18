# **App Name**: StreamViz

## Core Features:

- Video Link Input: Allows users to paste various types of links (direct MP4, webpage, cloud share) for video streaming analysis.
- Universal Video Link Resolver: Backend component to resolve input URLs and extract the actual playable MP4 video source link using advanced scraping and `yt-dlp` where applicable.
- HTTP Range Streaming Proxy: A backend proxy that receives byte range requests from the frontend, forwards them to the resolved video URL, and streams partial content back to handle CORS and partial downloads.
- Media Source Extensions Player: Frontend video player built with vanilla JavaScript and the Media Source Extensions (MSE) API for fine-grained control over chunk buffering and playback.
- Adaptive Buffer Management: Implements the '4-chunk lead' for proactive buffering and the '10% retention rule' for memory optimization by dynamically appending and removing video segments in the SourceBuffer.
- Real-time Streaming Metrics Dashboard: Displays critical streaming parameters including current playback time, buffered range, count of loaded chunks, and a visual timeline of the video buffer.
- AI Link Extraction Troubleshooting Tool: An AI tool that provides intelligent analysis and suggestions when video link resolution fails, helping the user understand potential issues or guiding them to alternative methods.

## Style Guidelines:

- Primary color: A commanding digital blue (#2B79F0) for clarity and technological focus, reflecting data analysis in a dark interface.
- Background color: A deep, almost-black blue-grey (#1A1D20) to enhance readability of data and reduce eye strain in a dashboard environment.
- Accent color: A vibrant sky blue/light cyan (#18C8EE) for highlights, call-to-action elements, and distinguishing data points on graphs.
- Headline and body text font: 'Inter', a grotesque-style sans-serif for its modern, machined, and objective aesthetic, ensuring clear readability for metrics and technical content.
- Utilize clean, sharp, and geometric line icons to align with the technical dashboard aesthetic and ensure clarity of function.
- A structured multi-panel dashboard layout, designed for efficient display of video playback, streaming controls, and real-time buffer metrics without visual clutter.
- Implement subtle, data-driven animations for elements such as buffer bar progression, chunk loading indicators, and metric updates to enhance the real-time monitoring experience.