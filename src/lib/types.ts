// Tipos derivados dos OpenAPI dos serviços IUBI (catalog, context, map-render).

export type ConnectionType = 'CATALOG' | 'GIS_SERVER' | string;

export interface Connection {
  id: string;
  title: string;
  type: ConnectionType;
  provider: string;
  serviceUrl: string;
  httpUrl: string | null;
  discoveryUrl: string | null;
  ogcUrl: string | null;
  configJson?: Record<string, unknown>;
}

export interface BoundingBox {
  crs: string;
  // [[minLon, minLat], [maxLon, maxLat]]
  coords: [[number, number], [number, number]];
}

export interface LayerCapability {
  identifier: string;
  title: string;
  abstract: string;
  keywords: string[];
  boundingBox: BoundingBox | null;
  map: {
    type: string;
    connection_id: string;
    layers: string;
    url: string;
    style?: string;
  };
  featureInfo?: { connection_id: string; layers: string; url: string };
  legend?: { connection_id: string; layers: string; url: string };
}

export interface SchemaAttribute {
  name: string;
  type: string;
  localType: string;
  nillable: boolean;
  label: string;
}

export interface LayerSchema {
  resource_id: string;
  geometry_column: string;
  attributes: SchemaAttribute[];
}

export interface StatisticsCapabilities {
  functions: string[];
}

export interface AggregationItem {
  function: string;
  alias?: string;
}

export interface AggregationPayload {
  aggregationAttribute: string;
  aggregations: AggregationItem[];
  groupBy?: string[];
  cqlFilter?: string;
  bbox?: string;
}

export interface AggregationResult {
  message?: string;
  GroupByAttributes: string[];
  AggregationResults: Array<Array<number | string>>;
  AggregationFunctions: string[];
  AggregationAttribute: string;
}

export type ContextType = 'WEBMAP' | 'DASHBOARD' | 'FORM' | 'REPORT' | 'STORY_MAP';

export interface ContextSummary {
  id: string;
  title: string;
  description: string;
  color: string;
  type: ContextType;
  creation: string;
  lastModification: string;
  changedBy: string;
}

export interface GeoFeature {
  type: 'Feature';
  id: string;
  geometry: { type: string; coordinates: unknown };
  properties: Record<string, unknown>;
}

export interface FeatureCollection {
  type: 'FeatureCollection';
  features: GeoFeature[];
}
