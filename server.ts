import express, { type Request, type Response } from 'express';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { Readable } from 'stream';
import { fileURLToPath } from 'url';
import { GoogleGenAI, Type } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadsDir = path.resolve(__dirname, 'uploads');
fs.mkdirSync(uploadsDir, { recursive: true });

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(express.json());
app.use('/uploads', express.static(uploadsDir));

// Initialize Google GenAI if key is present
const apiKey = process.env.GEMINI_API_KEY;
let aiClient: GoogleGenAI | null = null;
if (apiKey && apiKey !== 'MY_GEMINI_API_KEY') {
  try {
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  } catch (e) {
    console.warn('Failed to initialize GoogleGenAI client:', e);
  }
}

// API endpoint: Generate high-impact Ad Creative from natural language prompt
app.post('/api/generate-ad-from-prompt', async (req: Request, res: Response) => {
  const { prompt, targetGroup } = req.body;
  if (!prompt || typeof prompt !== 'string') {
    return res.status(400).json({ error: 'Ad prompt is required' });
  }

  // If Gemini API is available, generate rich structured ad creative
  if (aiClient) {
    try {
      const response = await aiClient.models.generateContent({
        model: 'gemini-4-hydrogen',
        contents: `You are an executive Ad Campaign Director for a digital streaming video platform.
The administrator provided this Ad prompt: "${prompt}".
Target category or group: "${targetGroup || 'General'}".

Generate a structured ad campaign creative matching the prompt and target group.`,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING, description: 'Short punchy Campaign Name (3-6 words)' },
              brandName: { type: Type.STRING, description: 'Brand or Advertiser Name' },
              headline: { type: Type.STRING, description: 'High-conversion Catchy Headline (4-8 words)' },
              tagline: { type: Type.STRING, description: 'Supporting descriptive pitch (10-18 words)' },
              ctaText: { type: Type.STRING, description: 'Strong action call-to-action' },
              ctaUrl: { type: Type.STRING, description: 'Promotional destination URL' },
              format: { type: Type.STRING, description: 'One of: preroll, midroll_overlay, sponsor_banner' },
              themeColor: { type: Type.STRING, description: 'One of: emerald, amber, rose, indigo, cyan, violet' },
              durationSeconds: { type: Type.INTEGER, description: 'Ad duration in seconds (e.g. 8)' },
              skipDelaySeconds: { type: Type.INTEGER, description: 'Seconds before skip button activates (e.g. 5)' },
              visualVibe: { type: Type.STRING, description: 'Aesthetic description of visual scene' },
              estimatedCpm: { type: Type.NUMBER, description: 'Estimated CPM rate in USD (e.g. 18.5)' },
              sampleVideoUrl: { type: Type.STRING, description: 'Direct mp4 URL or empty string' },
            },
            required: [
              'title',
              'brandName',
              'headline',
              'tagline',
              'ctaText',
              'ctaUrl',
              'format',
              'themeColor',
              'durationSeconds',
              'skipDelaySeconds',
              'visualVibe',
              'estimatedCpm',
            ],
          },
        },
      });

      const responseText = response.text?.trim() || '';
      try {
        const adData = JSON.parse(responseText);
        return res.json({ success: true, ad: adData, source: 'gemini' });
      } catch (parseErr) {
        console.warn('Could not parse Gemini JSON response directly, falling back to smart parser', parseErr);
      }
    } catch (apiErr) {
      console.warn('Gemini generateContent error, falling back to internal Ad Engine parser:', apiErr);
    }
  }

  // Fallback intelligent natural language parsing
  const cleanPrompt = prompt.trim();
  const lower = cleanPrompt.toLowerCase();

  let brand = 'Stream HUB Ad Network';
  let theme: 'emerald' | 'amber' | 'rose' | 'indigo' | 'cyan' | 'violet' = 'indigo';
  let format: 'preroll' | 'midroll_overlay' | 'sponsor_banner' = 'preroll';
  let cta = 'Learn More';
  let cpm = 14.50;

  if (lower.includes('crypto') || lower.includes('vpn') || lower.includes('security') || lower.includes('cyber')) {
    theme = 'cyan';
    brand = 'CyberShield Vault';
    cta = 'Protect Your Devices';
    cpm = 22.00;
  } else if (lower.includes('game') || lower.includes('esports') || lower.includes('fps') || lower.includes('rpg')) {
    theme = 'rose';
    brand = 'HyperStrike Gaming';
    cta = 'Play For Free';
    cpm = 19.80;
  } else if (lower.includes('fitness') || lower.includes('energy') || lower.includes('drink') || lower.includes('sport')) {
    theme = 'amber';
    brand = 'VoltCharge Hydro';
    cta = 'Fuel Up Today';
    cpm = 16.20;
  } else if (lower.includes('ai') || lower.includes('tech') || lower.includes('cloud') || lower.includes('code')) {
    theme = 'violet';
    brand = 'Synthetix AI Suite';
    cta = 'Deploy In Seconds';
    cpm = 25.50;
  } else if (lower.includes('fashion') || lower.includes('luxury') || lower.includes('art') || lower.includes('lifestyle')) {
    theme = 'emerald';
    brand = 'Aura Noir Atelier';
    cta = 'Explore Collection';
    cpm = 21.00;
  }

  if (lower.includes('banner')) format = 'sponsor_banner';
  else if (lower.includes('midroll') || lower.includes('overlay')) format = 'midroll_overlay';

  const generatedAd = {
    title: cleanPrompt.length > 30 ? cleanPrompt.slice(0, 30) + '...' : cleanPrompt,
    brandName: brand,
    headline: cleanPrompt.length > 50 ? cleanPrompt.slice(0, 48) + '!' : `Experience ${cleanPrompt}!`,
    tagline: `Promoted ad campaign generated specifically for your stream audience matching: "${cleanPrompt}".`,
    ctaText: cta,
    ctaUrl: 'https://streamhub.video/promo',
    format,
    themeColor: theme,
    durationSeconds: format === 'preroll' ? 10 : 6,
    skipDelaySeconds: 5,
    visualVibe: 'Cinematic high-contrast advertising creative with ambient brand gradient',
    estimatedCpm: cpm,
    sampleVideoUrl: '',
  };

  return res.json({ success: true, ad: generatedAd, source: 'engine' });
});

// API endpoint: Direct streaming upload for any video or thumbnail file
app.post('/api/upload-media', (req: Request, res: Response) => {
  const rawName = (req.headers['x-file-name'] as string) || 'media-upload.mp4';
  const decodedName = decodeURIComponent(rawName);
  const ext = path.extname(decodedName).toLowerCase() || '.mp4';
  const baseName = path
    .basename(decodedName, ext)
    .replace(/[^a-zA-Z0-9_-]/g, '_')
    .slice(0, 48) || 'video';
  const safeName = `${Date.now()}_${baseName}${ext}`;
  const targetPath = path.join(uploadsDir, safeName);

  const MAX_BYTES = 500 * 1024 * 1024; // 500 MB
  let receivedBytes = 0;
  let aborted = false;

  const writeStream = fs.createWriteStream(targetPath);

  req.on('data', (chunk: Buffer) => {
    if (aborted) return;
    receivedBytes += chunk.length;
    if (receivedBytes > MAX_BYTES) {
      aborted = true;
      writeStream.destroy();
      fs.unlink(targetPath, () => {});
      if (!res.headersSent) {
        res.status(413).json({ error: 'File exceeds 500MB limit' });
      }
      req.destroy();
    }
  });

  req.on('error', (err) => {
    aborted = true;
    writeStream.destroy();
    fs.unlink(targetPath, () => {});
    if (!res.headersSent) {
      res.status(500).json({ error: 'Upload stream failed', detail: err.message });
    }
  });

  writeStream.on('error', (err) => {
    aborted = true;
    fs.unlink(targetPath, () => {});
    if (!res.headersSent) {
      res.status(500).json({ error: 'Failed to save uploaded media', detail: err.message });
    }
  });

  writeStream.on('finish', () => {
    if (aborted || res.headersSent) return;
    res.json({
      success: true,
      url: `/uploads/${safeName}`,
      fileName: safeName,
      size: receivedBytes,
    });
  });

  req.pipe(writeStream);
});

// API endpoint: Download uploaded, local, or direct remote video as attachment
app.get('/api/download-video', async (req: Request, res: Response) => {
  const rawUrl = typeof req.query.url === 'string' ? req.query.url.trim() : '';
  const rawTitle = typeof req.query.title === 'string' ? req.query.title.trim() : 'streamhub_video';

  if (!rawUrl) {
    return res.status(400).json({ error: 'Video URL is required' });
  }

  const safeBase =
    rawTitle
      .replace(/[^a-zA-Z0-9_-]+/g, '_')
      .replace(/^_+|_+$/g, '')
      .slice(0, 60) || 'streamhub_video';

  // Local uploaded file
  if (rawUrl.startsWith('/uploads/')) {
    const rel = rawUrl.slice('/uploads/'.length);
    const resolved = path.resolve(uploadsDir, rel);
    if (!resolved.startsWith(uploadsDir + path.sep) || !fs.existsSync(resolved)) {
      return res.status(404).json({ error: 'Video file not found' });
    }
    const ext = path.extname(resolved) || '.mp4';
    return res.download(resolved, `${safeBase}${ext}`);
  }

  // Local public video file
  if (rawUrl.startsWith('/videos/')) {
    const publicVideosDir = path.resolve(__dirname, 'public', 'videos');
    const rel = rawUrl.slice('/videos/'.length);
    const resolved = path.resolve(publicVideosDir, rel);
    if (!resolved.startsWith(publicVideosDir + path.sep) || !fs.existsSync(resolved)) {
      return res.status(404).json({ error: 'Video file not found' });
    }
    const ext = path.extname(resolved) || '.mp4';
    return res.download(resolved, `${safeBase}${ext}`);
  }

  // Remote direct MP4 / WebM / media URL
  try {
    const parsed = new URL(rawUrl);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return res.status(400).json({ error: 'Unsupported protocol' });
    }
    const host = parsed.hostname.toLowerCase();
    if (
      host === 'localhost' ||
      host === '127.0.0.1' ||
      host === '::1' ||
      host.startsWith('10.') ||
      host.startsWith('192.168.') ||
      host.startsWith('169.254.') ||
      /^172\.(1[6-9]|2\d|3[01])\./.test(host)
    ) {
      return res.status(403).json({ error: 'Restricted host' });
    }

    const upstream = await fetch(parsed.toString());
    if (!upstream.ok || !upstream.body) {
      return res.status(502).json({ error: 'Unable to fetch source video for download' });
    }

    const urlExt = path.extname(parsed.pathname).toLowerCase();
    const ext = /\.(mp4|webm|mov|m4v|mkv|ogv|ogg)$/.test(urlExt) ? urlExt : '.mp4';
    const contentType = upstream.headers.get('content-type') || 'video/mp4';
    const contentLength = upstream.headers.get('content-length');

    res.setHeader('Content-Disposition', `attachment; filename="${safeBase}${ext}"`);
    res.setHeader('Content-Type', contentType);
    if (contentLength) {
      res.setHeader('Content-Length', contentLength);
    }

    const nodeStream = Readable.fromWeb(upstream.body as any);
    nodeStream.on('error', () => {
      if (!res.headersSent) res.status(500).end();
      else res.end();
    });
    nodeStream.pipe(res);
  } catch {
    return res.status(400).json({ error: 'Invalid video URL' });
  }
});

// API endpoint: Resolve YouTube video metadata (title, channel, thumbnail, duration, live view count)
app.get('/api/youtube-info', async (req: Request, res: Response) => {
  const rawUrl = typeof req.query.url === 'string' ? req.query.url.trim() : '';
  if (!rawUrl) {
    return res.status(400).json({ error: 'YouTube URL is required' });
  }

  const idMatch = /^[a-zA-Z0-9_-]{11}$/.test(rawUrl)
    ? [rawUrl, rawUrl]
    : rawUrl.match(
        /(?:youtube\.com\/(?:watch\?(?:.*&)?v=|shorts\/|live\/|embed\/|v\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/
      );
  const videoId = idMatch?.[1];
  if (!videoId) {
    return res.status(400).json({ error: 'Could not find a valid YouTube video ID in that link' });
  }

  const watchUrl = `https://www.youtube.com/watch?v=${videoId}`;
  const fallbackThumb = `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;

  let title = '';
  let authorName = '';
  let thumbnailUrl = fallbackThumb;
  let viewCount: number | null = null;
  let durationSeconds: number | null = null;

  try {
    const oembedRes = await fetch(
      `https://www.youtube.com/oembed?url=${encodeURIComponent(watchUrl)}&format=json`,
      { signal: AbortSignal.timeout(4000) }
    );
    if (oembedRes.ok) {
      const data = (await oembedRes.json()) as {
        title?: string;
        author_name?: string;
        thumbnail_url?: string;
      };
      title = data.title || '';
      authorName = data.author_name || '';
      thumbnailUrl = data.thumbnail_url || fallbackThumb;
    }
  } catch {
    // Fallback to watch page or basic metadata below
  }

  try {
    const pageRes = await fetch(watchUrl, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
        'Accept-Language': 'en-US,en;q=0.9',
      },
      signal: AbortSignal.timeout(4000),
    });
    if (pageRes.ok) {
      const html = await pageRes.text();
      const viewsMatch = html.match(/"viewCount":"(\d+)"/);
      if (viewsMatch?.[1]) {
        viewCount = parseInt(viewsMatch[1], 10);
      }
      const lenMatch = html.match(/"lengthSeconds":"(\d+)"/);
      if (lenMatch?.[1]) {
        durationSeconds = parseInt(lenMatch[1], 10);
      }
      if (!title) {
        const titleMatch = html.match(/<meta name="title" content="([^"]+)"/);
        if (titleMatch?.[1]) title = titleMatch[1];
      }
    }
  } catch {
    // Optional enrichment only
  }

  return res.json({
    success: true,
    videoId,
    watchUrl,
    title: title || `YouTube Video (${videoId})`,
    authorName: authorName || 'YouTube Creator',
    thumbnailUrl,
    viewCount,
    durationSeconds,
  });
});

// Cached USD exchange rates for global-to-RWF currency conversion
const FALLBACK_RATES: Record<string, number> = {
  USD: 1,
  RWF: 1385,
  KES: 129.2,
  UGX: 3690,
  TZS: 2660,
  BIF: 2940,
  CDF: 2850,
  NGN: 1650,
  GHS: 16.1,
  ZAR: 18.1,
  GBP: 0.79,
  EUR: 0.92,
  CAD: 1.4,
  INR: 84.4,
  AED: 3.67,
  AUD: 1.54,
};

let cachedExchangeRates: {
  rates: Record<string, number>;
  fetchedAt: number;
  source: 'live' | 'fallback';
} | null = null;

app.get('/api/exchange-rates', async (_req: Request, res: Response) => {
  const now = Date.now();
  if (cachedExchangeRates && now - cachedExchangeRates.fetchedAt < 60 * 60 * 1000) {
    return res.json({ success: true, base: 'USD', ...cachedExchangeRates });
  }

  try {
    const upstream = await fetch('https://open.er-api.com/v6/latest/USD', {
      signal: AbortSignal.timeout(4000),
    });
    if (upstream.ok) {
      const data = (await upstream.json()) as {
        result?: string;
        rates?: Record<string, number>;
      };
      if (data.result === 'success' && data.rates?.RWF) {
        const merged = { ...FALLBACK_RATES, ...data.rates };
        cachedExchangeRates = { rates: merged, fetchedAt: now, source: 'live' };
        return res.json({ success: true, base: 'USD', ...cachedExchangeRates });
      }
    }
  } catch {
    // Use reliable fallback rates if external rate service is unreachable
  }

  cachedExchangeRates = { rates: FALLBACK_RATES, fetchedAt: now, source: 'fallback' };
  return res.json({ success: true, base: 'USD', ...cachedExchangeRates });
});

// Mount Vite or serve static
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer } = await import('vite');
    const vite = await createServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running at http://0.0.0.0:${PORT}`);
  });
}

startServer();
