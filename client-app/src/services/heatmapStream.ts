import { SSE_URL } from '@/api/client';

export interface HeatmapData {
  region: string;
  timestamp: number;
  cell_data: Record<string, number>;
}

// Give up (and stop reconnecting) after this many consecutive failures so a
// permanently-down analytics service doesn't loop the browser forever.
const MAX_CONSECUTIVE_ERRORS = 5;

export function connectHeatmapStream(onUpdate: (data: HeatmapData) => void): () => void {
  const es = new EventSource(`${SSE_URL.replace(/\/$/, '')}/api/v1/analytics/heatmap`);
  let closed = false;
  let errorCount = 0;

  es.onopen = () => {
    errorCount = 0; // a successful (re)connection clears the failure streak
  };

  es.onmessage = (event) => {
    try {
      onUpdate(JSON.parse(event.data) as HeatmapData);
    } catch {
      // Ignore a malformed frame — the next tick sends a fresh snapshot.
    }
  };

  // EventSource fires onerror on every transient drop and then auto-reconnects,
  // so a plain console.error here spams the console with empty {} events on
  // normal network blips. Treat errors as expected: stay quiet while the
  // browser retries, and only surface a single warning once we give up.
  es.onerror = () => {
    if (closed) return;
    errorCount += 1;
    if (errorCount >= MAX_CONSECUTIVE_ERRORS && es.readyState === EventSource.CLOSED) {
      console.warn('[HEATMAP_STREAM] analytics stream unavailable — heatmap disabled for this session');
      closed = true;
      es.close();
    }
  };

  return () => {
    closed = true;
    es.close();
  };
}
