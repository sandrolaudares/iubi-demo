// Cliente do endpoint /api/chat (SSE do backend OpenAI-compatível via Groq).

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface StreamChatOptions {
  messages: ChatMessage[];
  model?: string;
  signal?: AbortSignal;
  onToken: (chunk: string) => void;
}

export async function streamChat({
  messages,
  model,
  signal,
  onToken,
}: StreamChatOptions): Promise<void> {
  const res = await fetch('/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messages, model }),
    signal,
  });

  if (!res.ok || !res.body) {
    let msg = `Falha na requisição de IA (${res.status}).`;
    try {
      const data = await res.json();
      if (data?.error) msg = data.error;
    } catch {
      /* ignore */
    }
    throw new Error(msg);
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    const lines = buffer.split('\n');
    buffer = lines.pop() ?? '';
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed.startsWith('data:')) continue;
      const payload = trimmed.slice(5).trim();
      if (payload === '[DONE]') return;
      try {
        const json = JSON.parse(payload);
        const token = json?.choices?.[0]?.delta?.content;
        if (token) onToken(token);
      } catch {
        /* fragmento parcial — ignorar */
      }
    }
  }
}

export interface AiHealth {
  ok: boolean;
  model: string;
  aiConfigured: boolean;
  iubiUpstream?: string;
  outboundProxy?: boolean;
}

export async function getAiHealth(): Promise<AiHealth> {
  const res = await fetch('/api/health');
  if (!res.ok) throw new Error('health check falhou');
  return (await res.json()) as AiHealth;
}
