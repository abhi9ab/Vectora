/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { Pool } from 'pg';
import { ActivityTracker, EmbeddingProvider, RagDocument, RagRetrievalResult, ResearchState } from '@/types/types';
import { getEmbedding, generateMockEmbedding } from '../embeddings/embedding-service';
import { neonVectorStore } from '../vector-store/neon-vector';
import { generateCacheKey, getCacheValue, setCacheValue } from '../cache/cache-service';

const DB_VECTOR_DIMENSIONS = 1536;

export async function retrieveContextForTopic(
  topic: string,
  researchState: ResearchState,
  activityTracker: ActivityTracker,
  limit: number = 5
): Promise<RagRetrievalResult> {
  try {
    console.log(`RAG: Retrieving context for topic "${topic}"`);
    activityTracker.add('rag-retrieval', 'pending', `Retrieving relevant context for: ${topic}`);

    const cacheKey = generateCacheKey(`rag-retrieval:${topic}:${limit}`);

    const cachedResult = await getCacheValue<RagRetrievalResult>(cacheKey);
    if (cachedResult) {
      console.log(`RAG: Using cached result with ${cachedResult.documents.length} documents`);
      activityTracker.add(
        'rag-retrieval',
        'complete',
        `Retrieved ${cachedResult.documents.length} relevant documents from cache`
      );
      return cachedResult;
    }

    const embeddingProvider = researchState.embeddingProvider || 'openai';
    console.log(`RAG: Generating embedding with provider ${embeddingProvider}`);

    try {
      const embedding = await getEmbedding(topic, {
        provider: embeddingProvider,
        cacheKey: `embedding:${embeddingProvider}:${topic}`,
        dimensions: DB_VECTOR_DIMENSIONS
      });

      console.log(`RAG: Generated embedding with ${embedding.length} dimensions`);

      const documentsLimit = Math.max(limit * 2, 10);
      const documents = await neonVectorStore.similaritySearch(embedding, documentsLimit);

      console.log(`RAG: Found ${documents.length} documents from similarity search`);

      if (documents.length === 0) {
        console.log(`RAG: No results from vector search, trying keyword fallback`);

        const keywords = extractKeywords(topic);
        console.log(`RAG: Extracted keywords: ${keywords.join(', ')}`);

        if (keywords.length > 0) {
          try {
            const keywordResults = await queryDocumentsByKeywords(keywords, limit);
            console.log(`RAG: Found ${keywordResults.length} documents through keyword search`);

            if (keywordResults.length > 0) {
              const ragDocuments: RagDocument[] = keywordResults.map(doc => ({
                id: doc.id || '',
                content: doc.content,
                metadata: doc.metadata,
                similarity: 0.5
              }));

              const result: RagRetrievalResult = {
                documents: ragDocuments,
                totalTokens: estimateTokens(ragDocuments)
              };

              await setCacheValue(cacheKey, result);

              activityTracker.add(
                'rag-retrieval',
                'complete',
                `Retrieved ${ragDocuments.length} relevant documents via keyword fallback`
              );

              return result;
            }
          } catch (keywordError) {
            console.error('Error in keyword fallback search:', keywordError);
          }
        }
      }

      const ragDocuments: RagDocument[] = documents.map(doc => ({
        id: doc.id || '',
        content: doc.content,
        metadata: doc.metadata,
        similarity: doc.similarity
      }));

      console.log(`RAG: Processing ${ragDocuments.length} similar documents`);

      const result: RagRetrievalResult = {
        documents: ragDocuments.slice(0, limit),
        totalTokens: estimateTokens(ragDocuments.slice(0, limit))
      };

      await setCacheValue(cacheKey, result);

      activityTracker.add(
        'rag-retrieval',
        'complete',
        `Retrieved ${result.documents.length} relevant documents for context enhancement`
      );

      return result;

    } catch (error) {
      console.error(`RAG retrieval error:`, error);
      activityTracker.add(
        'rag-retrieval',
        'error',
        `Failed to retrieve context: ${error instanceof Error ? error.message : String(error)}`
      );

      return {
        documents: [],
        totalTokens: 0
      };
    }
  } catch (error) {
    console.error(`RAG process error:`, error);
    activityTracker.add(
      'rag-retrieval',
      'error',
      `Failed in retrieval process: ${error instanceof Error ? error.message : String(error)}`
    );

    return {
      documents: [],
      totalTokens: 0
    };
  }
}

function extractKeywords(topic: string): string[] {
  const text = topic.toLowerCase();
  const words = text.split(/\s+/);

  const stopWords = new Set(['the', 'and', 'of', 'to', 'in', 'a', 'for', 'with', 'on', 'at', 'from', 'by', 'about']);
  const keywords = words.filter(word => {
    return word.length > 3 && !stopWords.has(word);
  });

  return keywords;
}

async function queryDocumentsByKeywords(keywords: string[], limit: number): Promise<any[]> {
  try {
    const pool = new Pool({
      connectionString: process.env.NEON_DATABASE_URL,
      ssl: { rejectUnauthorized: true }
    });

    const query = `
      SELECT id, content, metadata, 0.5 as similarity
      FROM documents
      WHERE ${keywords.map((keyword, i) => `content ILIKE $${i + 1}`).join(' OR ')}
      OR ${keywords.map((keyword, i) => `metadata::text ILIKE $${keywords.length + i + 1}`).join(' OR ')}
      LIMIT $${keywords.length * 2 + 1}
    `;

    const params = [
      ...keywords.map(keyword => `%${keyword}%`),  
      ...keywords.map(keyword => `%${keyword}%`), 
      limit
    ];

    const result = await pool.query(query, params);
    await pool.end();

    return result.rows;
  } catch (error) {
    console.error('Error querying documents by keywords:', error);
    return [];
  }
}

export async function storeResearchFindings(
  researchState: ResearchState,
  activityTracker: ActivityTracker
): Promise<void> {
  try {
    if (!researchState.findings.length || !researchState.topic) {
      return;
    }

    activityTracker.add(
      'rag-storage',
      'pending',
      `Storing ${researchState.findings.length} research findings for future retrieval`
    );

    const embeddingProvider = researchState.embeddingProvider || 'openai';

    for (const finding of researchState.findings) {
      const document = {
        content: finding.summary,
        metadata: {
          source: finding.source,
          topic: researchState.topic,
          timestamp: new Date().toISOString()
        }
      };

      try {
        let embedding;
        try {
          embedding = await getEmbedding(document.content, {
            provider: embeddingProvider,
            cacheKey: `embedding:${embeddingProvider}:${generateCacheKey(document.content)}`,
            dimensions: DB_VECTOR_DIMENSIONS
          });
        } catch (embeddingError) {
          console.warn(`Failed to generate embedding: ${embeddingError}. Using mock embedding.`);
          embedding = generateMockEmbedding(document.content, DB_VECTOR_DIMENSIONS);
        }

        if (embedding.length !== DB_VECTOR_DIMENSIONS) {
          console.warn(`Embedding dimensions mismatch: got ${embedding.length}, expected ${DB_VECTOR_DIMENSIONS}.`);
          console.warn('Normalizing dimensions...');

          if (embedding.length > DB_VECTOR_DIMENSIONS) {
            embedding = embedding.slice(0, DB_VECTOR_DIMENSIONS);
          } else {
            embedding = [...embedding, ...Array(DB_VECTOR_DIMENSIONS - embedding.length).fill(0)];
          }
        }

        await neonVectorStore.addDocuments([{
          ...document,
          embedding
        }]);

        activityTracker.add(
          'rag-storage',
          'info',
          `Stored finding from ${finding.source}`
        );
      } catch (error) {
        activityTracker.add(
          'rag-storage',
          'warning',
          `Failed to store finding from ${finding.source}: ${error instanceof Error ? error.message : String(error)}`
        );
      }
    }

    activityTracker.add(
      'rag-storage',
      'complete',
      `Successfully stored research findings in the vector database`
    );
  } catch (error) {
    activityTracker.add(
      'rag-storage',
      'error',
      `Failed to store research findings: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

function estimateTokens(documents: RagDocument[]): number {
  const totalChars = documents.reduce((sum, doc) => sum + doc.content.length, 0);
  return Math.ceil(totalChars / 4);
}