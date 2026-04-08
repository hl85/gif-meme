const impressionCache = new Set<string>();

export function trackImpression(url: string): void {
  if (!url || impressionCache.has(url)) {
    return;
  }

  impressionCache.add(url);
  fireBeacon(url);
}

export function trackClick(url: string): void {
  if (!url) {
    return;
  }

  fireBeacon(url);
}

export function resetTracker(): void {
  impressionCache.clear();
}

function fireBeacon(url: string): void {
  try {
    const img = new Image();
    img.src = url;
  } catch (error) {
    console.error('Failed to fire beacon:', error);
  }
}
