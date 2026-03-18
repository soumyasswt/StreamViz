'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { sampleVideos, type SampleVideo } from '@/lib/sample-videos';
import { getThumbUrl } from '@/lib/thumb-placeholder';
import { 
  Card, CardContent, CardDescription, CardHeader, CardTitle 
} from '@/components/ui/card';
import { 
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue 
} from '@/components/ui/select';
import { 
  Input 
} from '@/components/ui/input';
import { 
  Tabs, TabsList, TabsTrigger, TabsContent 
} from '@/components/ui/tabs';

export interface Metrics {
  currentTime: number;
  duration: number;
  buffered: Array<{ start: number; end: number }>;
  bufferedPercent: number;
}

export default function StreamVizDashboard() {
  const [selectedVideo, setSelectedVideo] = useState<SampleVideo>(sampleVideos[0]);
  const [customUrl, setCustomUrl] = useState('');
  const [useCustom, setUseCustom] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [metrics, setMetrics] = useState<Metrics>({
    currentTime: 0,
    duration: 0,
    buffered: [],
    bufferedPercent: 0,
  });

  const loadVideo = async () => {
    if (!videoRef.current) return;
    
    const urlToPlay = useCustom ? customUrl : selectedVideo.url;
    if (!urlToPlay) return;
    
    setIsLoading(true);
    videoRef.current.pause();
    videoRef.current.src = `/api/stream?url=${encodeURIComponent(urlToPlay)}`;
    videoRef.current.load();
    
    setIsLoading(false);
  };

// ================================
  // METRICS UPDATE
  // ================================
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const updateMetrics = () => {
      const bufferedRanges = [];
      for (let i = 0; i < video.buffered.length; i++) {
        bufferedRanges.push({
          start: video.buffered.start(i),
          end: video.buffered.end(i),
        });
      }

      const bufferedPercent = video.buffered.length > 0 
        ? ((video.buffered.end(video.buffered.length - 1) / video.duration) * 100 || 0)
        : 0;

      setMetrics({
        currentTime: video.currentTime,
        duration: video.duration || 0,
        buffered: bufferedRanges,
        bufferedPercent,
      });
    };

    video.addEventListener('timeupdate', updateMetrics);
    video.addEventListener('progress', updateMetrics);
    video.addEventListener('loadedmetadata', updateMetrics);
    video.addEventListener('error', (e) => console.error('Video error:', e));

    return () => {
      video.removeEventListener('timeupdate', updateMetrics);
      video.removeEventListener('progress', updateMetrics);
      video.removeEventListener('loadedmetadata', updateMetrics);
      video.removeEventListener('error', updateMetrics);
    };
  }, []);

  return (
    <div className="container mx-auto p-6 max-w-6xl space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Streaming Video Dashboard</CardTitle>
          <CardDescription>Play samples or paste your own MP4 URL!</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={useCustom ? 'custom' : 'samples'} onValueChange={(val) => {
            setUseCustom(val === 'custom');
            if (val !== 'custom') setCustomUrl('');
          }} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="samples">Samples</TabsTrigger>
              <TabsTrigger value="custom">Custom URL</TabsTrigger>
            </TabsList>
            
            <TabsContent value="samples" className="space-y-4 mt-4">
              <Select value={selectedVideo.title} onValueChange={(title) => {
                const video = sampleVideos.find(v => v.title === title);
                if (video) setSelectedVideo(video);
              }}>
                <SelectTrigger>
                  <SelectValue placeholder="Pick a sample" />
                </SelectTrigger>
                <SelectContent>
                  {sampleVideos.map((video) => (
                    <SelectItem key={video.title} value={video.title}>
                      {video.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </TabsContent>

            <TabsContent value="custom" className="space-y-4 mt-4">
              <Input 
                placeholder="Paste MP4 URL here (e.g. https://commondatastorage.../BigBuckBunny.mp4)" 
                value={customUrl}
                onChange={(e) => setCustomUrl(e.target.value)}
              />
            </TabsContent>

            <div className="space-y-4 mt-6">
              <button 
                onClick={loadVideo} 
                disabled={isLoading || (useCustom && !customUrl.trim())}
                className="w-full bg-blue-500 hover:bg-blue-600 text-white font-medium py-3 px-6 rounded-lg shadow-md disabled:opacity-50 transition-all duration-200"
              >
                {isLoading ? 'Loading...' : '▶️ Play Video'}
              </button>

              <video 
                ref={videoRef} 
                controls 
                className="w-full aspect-video rounded-xl shadow-xl ring-2 ring-gray-200/50"
                preload="metadata"
            poster={useCustom ? undefined : (selectedVideo.thumb || getThumbUrl(selectedVideo.title))}
              />

              <Card className="p-6 bg-gradient-to-r from-blue-50 to-indigo-50">
                <h3 className="font-bold text-lg mb-3 flex items-center gap-2">
                  📊 Live Metrics
                </h3>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                  <div className="space-y-1">
                    <div>Current Time</div>
                    <div className="font-mono text-lg font-bold text-blue-600">{metrics.currentTime.toFixed(1)}s</div>
                  </div>
                  <div className="space-y-1">
                    <div>Duration</div>
                    <div className="font-mono text-lg font-bold">{metrics.duration.toFixed(1)}s</div>
                  </div>
                  <div className="space-y-1">
                    <div>Buffer Ranges</div>
                    <div className="font-mono text-lg font-bold">{metrics.buffered.length}</div>
                  </div>
                  <div className="space-y-1">
                    <div>Buffered</div>
                    <div className="font-mono text-lg font-bold text-green-600">{metrics.bufferedPercent.toFixed(0)}%</div>
                  </div>
                </div>
              </Card>
            </div>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}

