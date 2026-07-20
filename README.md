# IUBI Demo — Geovisualização & APIs

Demonstrativo interativo para **desenvolvedores** trabalharem com as APIs REST e os
recursos de geovisualização/análise espacial da plataforma **IUBI** (FITec), com um
**assistente de IA aberto** (Llama via Groq) que conhece os endpoints e gera código de
integração.

> Este demo consome as **APIs REST do IUBI diretamente** (Leaflet + gráficos
> open-source). Ele **não** depende dos pacotes privados `@fitecinovacoestecnologicas/*`
> (mfe-ui / mfe-utils), de modo que qualquer desenvolvedor pode rodá-lo sem acesso ao
> registry privado.

## Funcionalidades

- **Explorador de Mapa** — escolha um servidor GIS, descubra suas camadas
  (`/map-render/.../data/capabilities`), adicione-as a um mapa Leaflet como camadas WMS
  (`/render/map`), veja a legenda (`/render/legend`) e clique para inspecionar feições
  (`/render/feature-info`).
- **Contextos** — navegue pelos contextos salvos (WEBMAP, DASHBOARD, FORM, REPORT,
  STORY_MAP) via `/context/api/v1/contents/{type}`.
- **Estatísticas** — rode agregações (Count, Average, Max, Median, Min, StdDev, Sum,
  SumArea) sobre atributos de camadas (`/data/layers/{layer}/statistics`) e visualize em
  gráficos (Recharts), com agrupamento opcional.
- **IUBI Copilot** — chat com modelo aberto (Llama 3.1 8B por padrão) servido pela Groq
  via um proxy Express que mantém a chave no servidor. O prompt de sistema descreve toda
  a superfície das APIs IUBI.

## Stack

React 19 · Vite 6 · TypeScript · Tailwind CSS · TanStack Query · React-Leaflet · Recharts ·
Express (proxy de IA) · Groq (backend compatível com OpenAI).

## Pré-requisitos

- Node 20+ (testado com Node 22)
- Acesso de rede ao gateway das APIs IUBI (por padrão `http://100.52.200.210:32200`).
  Como esse endereço está numa rede privada (faixa Tailscale/CGNAT), rode o demo de dentro
  da rede que alcança as APIs.
- Uma chave da Groq (tier gratuito) para o assistente de IA — opcional; o resto do app
  funciona sem ela.

## Configuração

```bash
cp .env.example .env
# edite .env e defina GROQ_API_KEY (e ajuste VITE_IUBI_BASE_URL se necessário)
npm install
```

Variáveis (`.env`):

| Variável              | Descrição                                              | Padrão                              |
| --------------------- | ------------------------------------------------------ | ----------------------------------- |
| `VITE_IUBI_BASE_URL`  | Base do gateway das APIs IUBI                           | `http://100.52.200.210:32200`       |
| `GROQ_API_KEY`        | Chave da Groq para o Copilot (mantida no servidor)     | —                                   |
| `OPENAI_BASE_URL`     | Endpoint compatível com OpenAI                          | `https://api.groq.com/openai/v1`    |
| `AI_MODEL`            | Modelo aberto padrão                                    | `llama-3.1-8b-instant`              |
| `PORT`                | Porta do servidor de API/produção                      | `8787`                              |

## Rodando

**Desenvolvimento** (Vite + servidor de IA juntos):

```bash
npm run dev
# web: http://localhost:5173  (proxy /api -> servidor Express em :8787)
```

**Produção**:

```bash
npm run build
npm start          # serve dist/ + /api + /iubi em http://localhost:8787
```

## Arquitetura de rede (proxy de mesma origem)

O frontend chama `/iubi/*` (mesma origem) e o servidor Express repassa para o gateway
IUBI (`IUBI_UPSTREAM`). Isso evita **mixed-content** (uma página HTTPS não pode chamar a
API HTTP `http://100.x` diretamente) e dispensa CORS. As chamadas de IA vão por `/api/*`,
mantendo `GROQ_API_KEY` no servidor.

## Deploy no Fly.io

O `Dockerfile` builda o frontend e serve tudo (estático + `/api` + `/iubi`) pelo Express.

> Importante: o gateway IUBI (`100.52.200.210`) fica numa **rede privada** (faixa CGNAT/
> Tailscale) e **não é alcançável da internet**. Para o mapa/estatísticas/contextos
> funcionarem em produção, o servidor no Fly precisa alcançar essa rede — o container já
> traz suporte opcional a **Tailscale** (userspace). Sem isso, apenas o IUBI Copilot
> funciona publicamente.

```bash
fly launch --no-deploy         # ou use o fly.toml já incluso (app = "iubi-demo")
fly secrets set GROQ_API_KEY=...            # obrigatório para o Copilot
fly secrets set TAILSCALE_AUTHKEY=tskey-... # para alcançar o gateway IUBI (100.x)
fly deploy
```

Variáveis relevantes em produção:

| Variável             | Descrição                                                         |
| -------------------- | ---------------------------------------------------------------- |
| `IUBI_UPSTREAM`      | Gateway IUBI alcançado pelo servidor (padrão `http://100.52.200.210:32200`) |
| `TAILSCALE_AUTHKEY`  | Auth key do Tailscale; ativa a conexão à rede privada            |
| `OUTBOUND_HTTP_PROXY`| Proxy HTTP de saída p/ o gateway (setado automaticamente pelo Tailscale) |
| `GROQ_API_KEY`       | Chave da Groq (Copilot)                                           |

Quando `TAILSCALE_AUTHKEY` está presente, o `docker-entrypoint.sh` sobe o `tailscaled` em
modo userspace com um proxy HTTP local e o servidor usa esse proxy para falar com o
gateway IUBI.

## Modelo de IA — por que Llama via Groq

Para um assistente voltado a desenvolvedores, **Llama (open-weight) servido pela Groq** é a
opção aberta mais barata e viável:

- `llama-3.1-8b-instant` — rápido e barato (ideal como padrão);
- `llama-3.3-70b-versatile` — mais capaz para respostas complexas;
- também disponíveis `openai/gpt-oss-20b/120b` (open-weight) na mesma chave.

A Groq oferece tier gratuito e é compatível com a API da OpenAI, então trocar de provedor
(Together, Fireworks, DeepInfra, OpenRouter ou um endpoint self-hosted) é só ajustar
`OPENAI_BASE_URL`, `AI_MODEL` e a chave.

## Estrutura

```
server/index.js        # proxy Express -> Groq (SSE) + static em produção
src/lib/config.ts      # base das APIs / prefixos dos serviços
src/lib/iubi.ts        # cliente das APIs REST do IUBI
src/lib/types.ts       # tipos derivados dos OpenAPI
src/lib/chat.ts        # cliente SSE do /api/chat
src/lib/copilotPrompt.ts # prompt de sistema com a superfície das APIs
src/components/MapView.tsx # mapa Leaflet + camadas WMS + feature-info
src/pages/             # Home, MapExplorer, Contextos, Estatísticas, Copilot
```

## Como estender

Todas as chamadas de API ficam em `src/lib/iubi.ts`; adicione novos endpoints ali e
exponha via hooks em `src/lib/hooks.ts`. O Copilot pode ajudar a escrever a integração —
ele conhece os endpoints descritos em `src/lib/copilotPrompt.ts`.
