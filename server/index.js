import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import fs from 'node:fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Minimal .env loader (no extra dependency). Only fills missing vars.
function loadEnv() {
  const envPath = path.join(__dirname, '..', '.env');
  if (!fs.existsSync(envPath)) return;
  for (const line of fs.readFileSync(envPath, 'utf8').split('\n')) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (!m) continue;
    const [, key, rawVal] = m;
    if (process.env[key] !== undefined) continue;
    process.env[key] = rawVal.replace(/^["']|["']$/g, '');
  }
}
loadEnv();

const PORT = process.env.PORT || 8787;
const OPENAI_BASE_URL = process.env.OPENAI_BASE_URL || 'https://api.groq.com/openai/v1';
const DEFAULT_MODEL = process.env.AI_MODEL || 'llama-3.1-8b-instant';
const API_KEY = process.env.GROQ_API_KEY || process.env.OPENAI_API_KEY || '';

const app = express();
app.use(express.json({ limit: '1mb' }));

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, model: DEFAULT_MODEL, aiConfigured: Boolean(API_KEY) });
});

// AI Copilot proxy. Streams Server-Sent Events from the OpenAI-compatible backend.
app.post('/api/chat', async (req, res) => {
  if (!API_KEY) {
    res.status(503).json({
      error:
        'Assistente de IA não configurado. Defina GROQ_API_KEY no arquivo .env (veja .env.example).',
    });
    return;
  }

  const { messages, model } = req.body ?? {};
  if (!Array.isArray(messages) || messages.length === 0) {
    res.status(400).json({ error: 'messages é obrigatório' });
    return;
  }

  try {
    const upstream = await fetch(`${OPENAI_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${API_KEY}`,
      },
      body: JSON.stringify({
        model: model || DEFAULT_MODEL,
        messages,
        temperature: 0.2,
        max_tokens: 1500,
        stream: true,
      }),
    });

    if (!upstream.ok || !upstream.body) {
      const detail = await upstream.text().catch(() => '');
      res.status(upstream.status || 502).json({
        error: `Falha no backend de IA (${upstream.status}).`,
        detail: detail.slice(0, 500),
      });
      return;
    }

    res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    const reader = upstream.body.getReader();
    const decoder = new TextDecoder();
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      res.write(decoder.decode(value, { stream: true }));
    }
    res.end();
  } catch (err) {
    if (!res.headersSent) {
      res.status(502).json({ error: 'Erro ao contatar o backend de IA.', detail: String(err) });
    } else {
      res.end();
    }
  }
});

// Serve the built frontend in production.
const distDir = path.join(__dirname, '..', 'dist');
if (fs.existsSync(distDir)) {
  app.use(express.static(distDir));
  app.get('*', (_req, res) => res.sendFile(path.join(distDir, 'index.html')));
}

app.listen(PORT, () => {
  console.log(`[iubi-demo] API/servidor em http://localhost:${PORT}`);
  console.log(`[iubi-demo] IA: ${API_KEY ? DEFAULT_MODEL : 'NÃO configurada (defina GROQ_API_KEY)'}`);
});
