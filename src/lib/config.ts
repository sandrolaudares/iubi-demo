// Base do gateway de APIs do IUBI. Todos os serviços (catalog, context,
// map-render, ogc) ficam sob esta URL.
export const IUBI_BASE_URL: string =
  import.meta.env.VITE_IUBI_BASE_URL ?? 'http://100.52.200.210:32200';

export const SERVICES = {
  catalog: `${IUBI_BASE_URL}/catalog/v1`,
  context: `${IUBI_BASE_URL}/context/api/v1`,
  mapRender: `${IUBI_BASE_URL}/map-render/v1`,
  ogc: `${IUBI_BASE_URL}/ogc/v1`,
} as const;
