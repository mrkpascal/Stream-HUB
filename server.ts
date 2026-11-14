import express, { type Request, type Response } from 'express';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
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

  let brand = 'Pascal Ad Network';
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
    ctaUrl: 'https://pascalhub.stream/promo',
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
