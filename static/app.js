/* ============================================================================
   StreamViz — Frontend Logic
   Replaces React state, hooks, and event handlers.
   ============================================================================ */

// ---------------------------------------------------------------------------
// STATE
// ---------------------------------------------------------------------------
const VIDEOS  = window.__SAMPLE_VIDEOS__ || [];
let currentTab = 'samples';
let isLoading  = false;

// DOM refs (cached once on load)
let $player, $playBtn, $playBtnText, $videoSelect, $customUrl;
let $metricTime, $metricDuration, $metricRanges, $metricBuffered;

// ---------------------------------------------------------------------------
// INIT
// ---------------------------------------------------------------------------
document.addEventListener('DOMContentLoaded', () => {
  $player         = document.getElementById('player');
  $playBtn        = document.getElementById('playBtn');
  $playBtnText    = document.getElementById('playBtnText');
  $videoSelect    = document.getElementById('videoSelect');
  $customUrl      = document.getElementById('customUrl');

  $metricTime     = document.getElementById('metricTime');
  $metricDuration = document.getElementById('metricDuration');
  $metricRanges   = document.getElementById('metricRanges');
  $metricBuffered = document.getElementById('metricBuffered');

  // Set initial poster
  updatePoster();

  // Bind video events for live metrics
  $player.addEventListener('timeupdate', updateMetrics);
  $player.addEventListener('progress',   updateMetrics);
  $player.addEventListener('loadedmetadata', updateMetrics);
  $player.addEventListener('error', (e) => console.error('Video error:', e));

  // Custom URL validation — enable/disable play button
  $customUrl.addEventListener('input', validatePlayButton);
});

// ---------------------------------------------------------------------------
// TAB SWITCHING
// ---------------------------------------------------------------------------
function switchTab(tab) {
  currentTab = tab;

  // Toggle tab triggers
  document.querySelectorAll('.tabs-trigger').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.tab === tab);
  });

  // Toggle tab content panels
  document.getElementById('tab-samples').classList.toggle('active', tab === 'samples');
  document.getElementById('tab-custom').classList.toggle('active', tab === 'custom');

  // Reset custom URL when switching away
  if (tab !== 'custom' && $customUrl) {
    $customUrl.value = '';
  }

  // Update poster when switching to samples
  if (tab === 'samples') {
    updatePoster();
  } else {
    $player.removeAttribute('poster');
  }

  validatePlayButton();
}

// ---------------------------------------------------------------------------
// SAMPLE CHANGE
// ---------------------------------------------------------------------------
function onSampleChange() {
  updatePoster();
}

function updatePoster() {
  const idx = parseInt($videoSelect.value, 10);
  const video = VIDEOS[idx];
  if (!video) return;

  const thumb = video.thumb || getThumbUrl(video.title);
  $player.poster = thumb;
}

function getThumbUrl(title) {
  const seed = title.toLowerCase().replace(/[^a-z0-9]/g, '');
  return `https://picsum.photos/seed=${seed}/480/270.jpg`;
}

// ---------------------------------------------------------------------------
// PLAY VIDEO
// ---------------------------------------------------------------------------
async function playVideo() {
  if (isLoading) return;

  let url;

  if (currentTab === 'samples') {
    const idx = parseInt($videoSelect.value, 10);
    const video = VIDEOS[idx];
    if (!video) return;
    url = video.url;
  } else {
    url = ($customUrl.value || '').trim();
    if (!url) return;

    // Attempt resolve for YouTube or unknown URLs
    setLoading(true);
    try {
      const res = await fetch('/api/resolve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      });
      const data = await res.json();
      if (data.success && data.url) {
        url = data.url;
      } else if (data.url) {
        url = data.url;
      }
      // If resolve fails, we still try the original URL through the proxy
    } catch (err) {
      console.warn('Resolve failed, using original URL:', err);
    }
  }

  setLoading(true);

  // Load through the stream proxy
  $player.pause();
  $player.src = `/api/stream?url=${encodeURIComponent(url)}`;
  $player.load();

  setLoading(false);
}

// ---------------------------------------------------------------------------
// LOADING STATE
// ---------------------------------------------------------------------------
function setLoading(loading) {
  isLoading = loading;
  $playBtn.disabled = loading;
  $playBtnText.textContent = loading ? 'Loading...' : 'Play Video';
  document.body.classList.toggle('loading', loading);
}

// ---------------------------------------------------------------------------
// VALIDATE PLAY BUTTON
// ---------------------------------------------------------------------------
function validatePlayButton() {
  if (!$playBtn) return;
  if (currentTab === 'custom') {
    $playBtn.disabled = isLoading || !($customUrl.value || '').trim();
  } else {
    $playBtn.disabled = isLoading;
  }
}

// ---------------------------------------------------------------------------
// LIVE METRICS — mirrors the React useEffect in stream-viz-dashboard.tsx
// ---------------------------------------------------------------------------
function updateMetrics() {
  if (!$player) return;

  const ct     = $player.currentTime || 0;
  const dur    = $player.duration || 0;
  const bufLen = $player.buffered.length;

  let bufferedPercent = 0;
  if (bufLen > 0 && dur > 0) {
    bufferedPercent = ($player.buffered.end(bufLen - 1) / dur) * 100;
  }

  $metricTime.textContent     = ct.toFixed(1) + 's';
  $metricDuration.textContent = (isNaN(dur) ? 0 : dur).toFixed(1) + 's';
  $metricRanges.textContent   = bufLen;
  $metricBuffered.textContent = bufferedPercent.toFixed(0) + '%';
}
