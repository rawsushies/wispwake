import express from 'express';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function getGenAIClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not configured. Please check Settings > Secrets in AI Studio.');
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '25mb' }));

  // Health check endpoint
  app.get('/api/health', (_req, res) => {
    res.json({
      status: 'ok',
      hasApiKey: Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'MY_GEMINI_API_KEY'),
    });
  });

  // High-quality image generation endpoint using gemini-3-pro-image (supports 1K, 2K, 4K)
  app.post('/api/art/generate-pro', async (req, res) => {
    try {
      const { prompt, imageSize = '1K', aspectRatio = '16:9' } = req.body;
      if (!prompt || typeof prompt !== 'string') {
        res.status(400).json({ error: 'A text prompt is required.' });
        return;
      }

      const validSizes = ['1K', '2K', '4K'];
      const selectedSize = validSizes.includes(imageSize) ? imageSize : '1K';
      const validRatios = ['1:1', '3:4', '4:3', '9:16', '16:9'];
      const selectedRatio = validRatios.includes(aspectRatio) ? aspectRatio : '16:9';

      const ai = getGenAIClient();
      const fullPrompt = `${prompt.trim()} — Hand-painted 2D fantasy illustration in the Veilgrove visual style of Wispwake, rich organic brushwork, palette of Night Ink (#121B2B), Deep Dusk (#1D2D43), Veil Teal (#294D4D), Moss Green (#57725B), Wake Mint (#8FE7C7), and Sap Gold (#F1C878).`;

      const response = await ai.models.generateContent({
        model: 'gemini-3-pro-image',
        contents: {
          parts: [{ text: fullPrompt }],
        },
        config: {
          imageConfig: {
            aspectRatio: selectedRatio,
            imageSize: selectedSize,
          },
        },
      });

      let imageUrl: string | null = null;
      let accompanyingText = '';

      for (const part of response.candidates?.[0]?.content?.parts ?? []) {
        if (part.inlineData?.data) {
          const mime = part.inlineData.mimeType ?? 'image/png';
          imageUrl = `data:${mime};base64,${part.inlineData.data}`;
        } else if (part.text) {
          accompanyingText += part.text;
        }
      }

      if (!imageUrl) {
        res.status(502).json({
          error: 'No image data returned by gemini-3-pro-image. Ensure a billing-enabled API key is attached in Settings > Secrets.',
        });
        return;
      }

      res.json({
        imageUrl,
        model: 'gemini-3-pro-image',
        imageSize: selectedSize,
        aspectRatio: selectedRatio,
        notes: accompanyingText,
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to generate high-resolution artwork.';
      console.error('Error in /api/art/generate-pro:', message);
      res.status(500).json({ error: message });
    }
  });

  // Create or edit images using gemini-nano-banana-2.1
  app.post('/api/art/nano-edit', async (req, res) => {
    try {
      const { prompt, base64Image, mimeType = 'image/jpeg', aspectRatio = '16:9', imageSize = '1K' } = req.body;
      if (!prompt || typeof prompt !== 'string') {
        res.status(400).json({ error: 'A text prompt or edit instruction is required.' });
        return;
      }

      const ai = getGenAIClient();
      const parts: Array<{ text?: string; inlineData?: { data: string; mimeType: string } }> = [];

      if (base64Image && typeof base64Image === 'string') {
        const cleanedBase64 = base64Image.includes(',') ? base64Image.split(',')[1] : base64Image;
        parts.push({
          inlineData: {
            data: cleanedBase64,
            mimeType: mimeType || 'image/jpeg',
          },
        });
      }

      parts.push({
        text: `${prompt.trim()} — Maintain the cohesive hand-painted 2D Veilgrove storybook art direction of Wispwake.`,
      });

      const validSizes = ['1K', '2K', '4K'];
      const selectedSize = validSizes.includes(imageSize) ? imageSize : '1K';
      const validRatios = ['1:1', '3:4', '4:3', '9:16', '16:9'];
      const selectedRatio = validRatios.includes(aspectRatio) ? aspectRatio : '16:9';

      const response = await ai.models.generateContent({
        model: 'gemini-nano-banana-2.1',
        contents: { parts },
        config: {
          imageConfig: {
            aspectRatio: selectedRatio,
            imageSize: selectedSize,
          },
        },
      });

      let imageUrl: string | null = null;
      let accompanyingText = '';

      for (const part of response.candidates?.[0]?.content?.parts ?? []) {
        if (part.inlineData?.data) {
          const mime = part.inlineData.mimeType ?? 'image/png';
          imageUrl = `data:${mime};base64,${part.inlineData.data}`;
        } else if (part.text) {
          accompanyingText += part.text;
        }
      }

      if (!imageUrl) {
        res.status(502).json({
          error: 'No image data returned by gemini-nano-banana-2.1. Ensure a valid API key is selected in Settings > Secrets.',
        });
        return;
      }

      res.json({
        imageUrl,
        model: 'gemini-nano-banana-2.1',
        imageSize: selectedSize,
        aspectRatio: selectedRatio,
        notes: accompanyingText,
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to create or edit image with gemini-nano-banana-2.1.';
      console.error('Error in /api/art/nano-edit:', message);
      res.status(500).json({ error: message });
    }
  });

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Wispwake server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
