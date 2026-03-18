# Make Project Functioning: Video Playback Fix

Status: [In Progress]

## Breakdown Steps

### 1. [✅] Create sample-videos data file
- Path: `src/lib/sample-videos.ts`
- Extract Movies from mediaJSON

### 2. [✅] Fix API proxy headers
- Path: `src/app/api/stream/route.ts`
- Forward Range, add CORS, precise headers

### 3. [✅] Simplify dashboard to native video
- Path: `src/components/stream-viz-dashboard.tsx`
- Video list select, direct <video src>, metrics events
- Tailwind styling

### 4. [ ] Test playback
- `npm run dev`
- Select Big Buck Bunny → Play/Seek works, metrics update

### 5. [ ] [Complete] Verify all samples

## Commands
- Dev server: `npm run dev` (:9002)
- Test URL: http://localhost:9002/api/stream?url=https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4

