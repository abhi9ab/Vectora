import { z } from "zod";

export interface ImageData {
  base64: string;
  name: string;
  type: string;
}

export interface VisualizationOptions {
  enabled: boolean;
  type: 'mermaid' | 'chartjs' | 'd3' | 'all';
}

export interface ResearchFindings {
  summary: string;
  source: string;
}

export interface ResearchState {
  topic: string;
  completedSteps: number;
  tokenUsed: number;
  findings: ResearchFindings[];
  processedUrl: Set<string>;
  clerificationsText: string;
  provider: ModelProvider;
  embeddingProvider?: EmbeddingProvider;
  useRAG?: boolean;
  images?: ImageData[];
  visualizations?: VisualizationOptions;
}

export interface ModelCallOptions<T> {
  model: string;
  prompt: string;
  system?: string;
  schema?: z.ZodType<T>;
  activityType?: Activity["type"];
  provider?: ModelProvider;
  structuredOutput?: boolean;
  images?: ImageData[];
}

export interface SearchResult {
  title: string;
  url: string;
  content: string
}

export interface Activity {
  type: 'search' | 'extract' | 'analyze' | 'generate' | 'planning' | 'image-analysis' | 'rag-retrieval' | 'rag-storage';
  status: 'pending' | 'complete' | 'warning' | 'error' | 'info';
  message: string;
  timestamp?: number;
}

export type ActivityTracker = {
  add: (type: Activity['type'], status: Activity['status'], message: Activity['message']) => void;
}

export interface Source {
  url: string;
  title: string
}

export interface RagDocument {
  id: string;
  content: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  metadata: Record<string, any>;
  similarity?: number;
}

export interface RagRetrievalResult {
  documents: RagDocument[];
  totalTokens: number;
}

export interface Author {
  authorId?: string;
  name: string;
  affiliations?: string[];
}

export interface PaperNode {
  id: string;
  title: string;
  authors: Author[];
  year: number;
  citationCount: number;
  category: string;
  abstract?: string;
  venue?: string;
  doi?: string;
  url?: string;
  // D3 simulation properties
  x?: number;
  y?: number;
  fx?: number | null;
  fy?: number | null;
}

export interface PaperLink {
  source: string | PaperNode;
  target: string | PaperNode;
  type: 'citation' | 'similarity' | 'co-authorship';
  weight: number;
  contexts?: string[];
}

export interface GraphData {
  nodes: PaperNode[];
  links: PaperLink[];
}

// D3 simulation node type
export interface D3Node extends d3.SimulationNodeDatum {
  id: string;
  title: string;
  authors: Author[];
  year: number;
  citationCount: number;
  category: string;
  abstract?: string;
  venue?: string;
}

// D3 link type
export interface D3Link extends d3.SimulationLinkDatum<D3Node> {
  type: 'citation' | 'similarity' | 'co-authorship';
  weight: number;
}

export interface SemanticScholarPaper {
  paperId: string;
  title: string;
  abstract?: string;
  venue?: string;
  year?: number;
  authors: Array<{
    authorId?: string;
    name: string;
  }>;
  citationCount: number;
  referenceCount: number;
  citations?: Array<{
    paperId: string;
    title: string;
  }>;
  references?: Array<{
    paperId: string;
    title: string;
  }>;
}

export interface SemanticScholarSearchResponse {
  data: SemanticScholarPaper[];
  total: number;
  offset: number;
  next?: number;
}

export interface GraphConfig {
  width: number;
  height: number;
  nodeSize: {
    min: number;
    max: number;
  };
  linkDistance: number;
  chargeStrength: number;
  colors: {
    [category: string]: string;
  };
}

export type ModelProvider = 'groq' | 'google' | 'hybrid' | 'openai';
export type EmbeddingProvider = 'openai' | 'google';