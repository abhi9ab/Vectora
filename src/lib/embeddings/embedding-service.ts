/* eslint-disable @typescript-eslint/no-unused-vars */
import { openai, google } from "@/services/model-services";
import { EmbeddingProvider } from "@/types/types";
import { embed } from 'ai';
import { generateCacheKey, getCacheValue, setCacheValue } from '../cache/cache-service';

interface EmbeddingOptions {
  provider: EmbeddingProvider;
  cacheKey?: string;
  dimensions?: number;
}

const DEFAULT_DIMENSIONS = {
  'openai': 1536,
  'google': 768,
};

const DB_VECTOR_DIMENSIONS = 1536;

export async function getEmbedding(
  text: string,
  options: EmbeddingOptions
): Promise<number[]> {
  const { provider, cacheKey } = options;
  const targetDimensions = options.dimensions || 1536;

  const embeddingCacheKey = cacheKey || `embedding:${provider}:${generateCacheKey(text)}`;

  try {
    const cached = await getCacheValue<number[]>(embeddingCacheKey);
    if (cached) {
      console.log(`Using cached embedding for key: ${embeddingCacheKey}`);
      return cached;
    }
  } catch (error) {
    console.warn(`Cache retrieval error (continuing without cache): ${error}`);
  }

  try {
    let embedding: number[];

    if (provider === 'openai') {
      const result = await embed({
        model: openai.embedding('text-embedding-3-small'),
        value: text,
      });
      embedding = result.embedding;
    } else if (provider === 'google') {
      const result = await embed({
        model: google.textEmbeddingModel('text-embedding-004'),
        value: text,
      });
      embedding = result.embedding;
    } else {
      const result = await embed({
        model: openai.embedding('text-embedding-3-small'),
        value: text,
      });
      embedding = result.embedding;
    }

    const normalizedEmbedding = normalizeDimensions(embedding, targetDimensions);

    try {
      await setCacheValue(embeddingCacheKey, normalizedEmbedding);
    } catch (error) {
      console.warn(`Cache storage error (continuing without caching): ${error}`);
    }

    return normalizedEmbedding;
  } catch (error) {
    console.error(`Error generating embedding with ${provider}:`, error);
    throw error;
  }
}

function normalizeDimensions(embedding: number[], targetDimensions: number): number[] {
  const currentDimensions = embedding.length;

  if (currentDimensions === targetDimensions) {
    return embedding;
  }

  if (currentDimensions > targetDimensions) {
    console.log(`Truncating embedding from ${currentDimensions} to ${targetDimensions} dimensions`);
    return embedding.slice(0, targetDimensions);
  } else {
    console.log(`Padding embedding from ${currentDimensions} to ${targetDimensions} dimensions`);
    const padded = [...embedding];
    for (let i = currentDimensions; i < targetDimensions; i++) {
      padded.push(0);
    }
    return padded;
  }
}

export function generateMockEmbedding(text: string, dimensions: number = 1536): number[] {
  const seed = text.length;
  return Array(dimensions).fill(0).map((_, i) =>
    Math.sin(seed + i) * 0.5 + Math.cos(text.charCodeAt(i % text.length) * 0.01) * 0.5
  );
}