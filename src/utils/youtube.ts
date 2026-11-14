export function getYouTubeId(url: string): string | null {
  if (!url) return null;
  const trimmed = url.trim();
  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) {
    return trimmed;
  }
  try {
    const match = trimmed.match(
      /(?:youtube\.com\/(?:watch\?(?:.*&)?v=|shorts\/|live\/|embed\/|v\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/
    );
    if (match?.[1]) return match[1];
  } catch {
    return null;
  }
  return null;
}

export function isYouTubeUrl(url: string): boolean {
  return Boolean(getYouTubeId(url));
}

export function getYouTubeWatchUrl(urlOrId: string): string | null {
  const id = getYouTubeId(urlOrId);
  return id ? `https://www.youtube.com/watch?v=${id}` : null;
}

export function getYouTubeThumbnailUrl(urlOrId: string): string | null {
  const id = getYouTubeId(urlOrId);
  return id ? `https://i.ytimg.com/vi/${id}/hqdefault.jpg` : null;
}

export function getYouTubeEmbedUrl(urlOrId: string): string | null {
  const id = getYouTubeId(urlOrId);
  if (!id) return null;
  const origin =
    typeof window !== 'undefined' && window.location?.origin
      ? `&origin=${encodeURIComponent(window.location.origin)}`
      : '';
  // Standard www.youtube.com/embed with enablejsapi=1 & origin ensures embedded playback views register directly with YouTube
  return `https://www.youtube.com/embed/${id}?autoplay=1&rel=0&enablejsapi=1&playsinline=1${origin}`;
}
