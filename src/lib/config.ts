// Base do gateway de APIs do IUBI. Por padrão usa o proxy de mesma origem
// (/iubi) servido pelo backend Express, evitando mixed-content (HTTPS->HTTP)
// e CORS. Pode apontar direto para o gateway via VITE_IUBI_BASE_URL.
export const IUBI_BASE_URL: string = import.meta.env.VITE_IUBI_BASE_URL ?? '/iubi';

export const SERVICES = {
  catalog: `${IUBI_BASE_URL}/catalog/v1`,
  context: `${IUBI_BASE_URL}/context/api/v1`,
  mapRender: `${IUBI_BASE_URL}/map-render/v1`,
  ogc: `${IUBI_BASE_URL}/ogc/v1`,
} as const;
