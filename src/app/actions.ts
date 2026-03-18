'use server';

import {
  troubleshootLinkExtraction,
  AiLinkExtractionTroubleshooterOutput,
} from '@/ai/flows/ai-link-extraction-troubleshooter';
import ytdl from 'ytdl-core';

export type ResolveResult = {
  success: true;
  url: string;
  totalSize?: number; // Size is now optional, as it may be discovered by the client.
  codecs?: string;
} | {
  success: false;
  error: string;
};

export async function resolveVideoUrl(url: string): Promise<ResolveResult> {
  try {
    if (!url || (!url.startsWith('http://') && !url.startsWith('https://'))) {
      return { success: false, error: 'Invalid URL provided.' };
    }

    if (ytdl.validateURL(url)) {
      try {
        const info = await ytdl.getInfo(url);
        
        const filterAndSort = (mime: string, hasAudio?: boolean) =>
          info.formats.filter(f => 
            f.mimeType?.includes(mime) && 
            (hasAudio === undefined || f.hasAudio === hasAudio) &&
            f.height // Ensure there is a video track
          ).sort((a, b) => (b.height || 0) - (a.height || 0));

        let formats = filterAndSort('video/mp4', true); // mp4 with audio

        if (formats.length === 0) {
          formats = filterAndSort('video/mp4', false); // mp4 video-only
        }
        
        if (formats.length === 0) {
            formats = filterAndSort('video/webm', true); // webm with audio
        }

        if (formats.length === 0) {
            formats = filterAndSort('video/webm', false); // webm video-only
        }

        if (formats.length === 0) {
          return { success: false, error: 'No suitable MP4 or WebM video format was found for this YouTube video.' };
        }

        const bestFormat = formats[0];
        const totalSize = bestFormat.contentLength ? parseInt(bestFormat.contentLength, 10) : undefined;
        return { success: true, url: bestFormat.url, totalSize, codecs: bestFormat.mimeType };

      } catch(e: any) {
         console.error('ytdl-core error:', e);
         if (e.message?.includes('private video')) {
             return { success: false, error: 'Video is private and cannot be accessed.' };
         }
         if (e.message?.includes('age-restricted')) {
             return { success: false, error: 'This is an age-restricted video and cannot be accessed without authentication.' };
         }
         return { success: false, error: `Video extraction failed. Reason: ${e.message || 'Unknown ytdl-core error'}` };
      }
    }

    // Fallback for direct MP4 links
    const headResponse = await fetch(url, { method: 'HEAD', redirect: 'follow' });

    if (!headResponse.ok) {
        const getResponse = await fetch(url, { redirect: 'follow' });
        if(!getResponse.ok) {
            return { success: false, error: `Failed to fetch URL. Status: ${getResponse.status}` };
        }
        
        const contentType = getResponse.headers.get('content-type');
        if (contentType?.includes('video/mp4')) {
            const totalSize = getResponse.headers.get('content-length') ? parseInt(getResponse.headers.get('content-length')!, 10) : undefined;
            return { success: true, url: getResponse.url, totalSize, codecs: contentType };
        }
        
        if (contentType?.includes('text/html')) {
            const html = await getResponse.text();
            const videoSrcMatch = html.match(/<(?:video|source)[^>]+src="([^"]+\.mp4)"/i);
            if (videoSrcMatch?.[1]) {
                const videoUrl = new URL(videoSrcMatch[1], getResponse.url).toString();
                const videoHead = await fetch(videoUrl, { method: 'HEAD' });
                if (videoHead.ok) {
                  const totalSize = videoHead.headers.get('content-length') ? parseInt(videoHead.headers.get('content-length')!, 10) : undefined;
                  const codecs = videoHead.headers.get('content-type') || undefined;
                  return { success: true, url: videoUrl, totalSize, codecs };
                }
            }
            return { success: false, error: 'No direct MP4 video found on the page.' };
        }
        
        return { success: false, error: `Unsupported content type: ${contentType}` };
    }

    const contentType = headResponse.headers.get('content-type');
    if (contentType?.includes('video/mp4')) {
      const totalSize = headResponse.headers.get('content-length') ? parseInt(headResponse.headers.get('content-length')!, 10) : undefined;
      return { success: true, url: headResponse.url, totalSize, codecs: contentType };
    }
    
    return { success: false, error: `URL is not a direct MP4 link. Content-Type: ${contentType}` };

  } catch (e: any) {
    console.error('Error resolving URL:', e);
    return { success: false, error: e.message || 'An unknown error occurred during URL resolution.' };
  }
}

export async function getAiTroubleshooting(
  failedUrl: string,
  errorMessage: string
): Promise<AiLinkExtractionTroubleshooterOutput> {
  try {
    const result = await troubleshootLinkExtraction({
      failedUrl,
      errorMessage,
      additionalContext:
        'The user is trying to stream a video using a custom MSE player in a Next.js application. A backend proxy handles range requests. The resolver tried direct HEAD/GET requests, simple HTML scraping, and ytdl-core for YouTube links.',
    });
    return result;
  } catch (e) {
    console.error('AI Troubleshooting Error:', e);
    return {
      analysis:
        'The AI analysis tool failed to run. This might be due to a configuration issue or a problem with the AI service.',
      suggestions: ['Please check the server logs for more details.', 'Verify that the Genkit AI flow is correctly configured and deployed.'],
      potentialIssues: ['UNKNOWN_ISSUE'],
    };
  }
}
