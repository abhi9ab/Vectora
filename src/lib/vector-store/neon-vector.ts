/* eslint-disable @typescript-eslint/no-explicit-any */
import { Pool } from 'pg';
import { v4 as uuidv4 } from 'uuid';
import * as dotenv from 'dotenv';

dotenv.config();

const connectionString = process.env.NEON_DATABASE_URL;
if (!connectionString) {
  console.error('NEON_DATABASE_URL is not defined in environment variables');
}

const pool = new Pool({
  connectionString,
  ssl: {
    rejectUnauthorized: true
  }
});

export interface Document {
  [x: string]: any;
  id?: string;
  content: string;
  metadata: Record<string, any>;
  embedding?: number[];
}

export class NeonVectorStore {
  private initialized = false;

  async initialize() {
    if (this.initialized) return;

    console.log("Initializing NeonVectorStore...");
    console.log(`Connection string (partial): ${connectionString?.substring(0, 20)}...`);

    const client = await pool.connect();
    try {
      await client.query('CREATE EXTENSION IF NOT EXISTS vector');

      await client.query(`
        CREATE TABLE IF NOT EXISTS documents (
          id TEXT PRIMARY KEY,
          content TEXT NOT NULL,
          metadata JSONB NOT NULL,
          embedding VECTOR(1536),
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        )
      `);

      await client.query(`
        CREATE INDEX IF NOT EXISTS documents_embedding_idx 
        ON documents 
        USING ivfflat (embedding vector_cosine_ops) 
        WITH (lists = 100)
      `);

      this.initialized = true;
      console.log("NeonVectorStore initialized successfully");
    } catch (error) {
      console.error('Failed to initialize vector store:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  async addDocuments(documents: Document[]): Promise<string[]> {
    await this.initialize();

    const ids: string[] = [];
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      for (const doc of documents) {
        const id = doc.id || uuidv4();
        ids.push(id);

        let embeddingParam = null;
        if (doc.embedding && Array.isArray(doc.embedding)) {
          embeddingParam = `[${doc.embedding.join(',')}]`;
        }

        await client.query(
          `INSERT INTO documents (id, content, metadata, embedding)
           VALUES ($1, $2, $3, $4::vector)
           ON CONFLICT (id) DO UPDATE
           SET content = $2, metadata = $3, embedding = $4::vector`,
          [id, doc.content, JSON.stringify(doc.metadata), embeddingParam]
        );
      }

      await client.query('COMMIT');
      return ids;
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Failed to add documents:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  async similaritySearch(embedding: number[], limit: number = 5): Promise<Document[]> {
    await this.initialize();

    const embeddingString = `[${embedding.join(',')}]`;

    const client = await pool.connect();
    try {
      const countResult = await client.query(
        'SELECT COUNT(*) FROM documents WHERE embedding IS NOT NULL'
      );

      const documentCount = parseInt(countResult.rows[0].count);
      console.log(`Vector DB has ${documentCount} documents with embeddings`);

      if (documentCount === 0) {
        console.warn('No documents with embeddings found in the database!');
        return [];
      }

      const result = await client.query(
        `SELECT id, content, metadata, 
                1 - (embedding <=> $1::vector) as similarity
         FROM documents
         WHERE embedding IS NOT NULL
         ORDER BY embedding <=> $1::vector
         LIMIT $2`,
        [embeddingString, limit]
      );

      console.log(`Similarity search returned ${result.rows.length} results`);

      result.rows.forEach((row, i) => {
        console.log(`Result ${i + 1}: similarity=${row.similarity.toFixed(4)}, topic=${row.metadata.topic || 'unknown'}`);
      });

      return result.rows.map(row => ({
        id: row.id,
        content: row.content,
        metadata: row.metadata,
        similarity: row.similarity
      }));
    } catch (error) {
      console.error('Failed to perform similarity search:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  async getDocumentById(id: string): Promise<Document | null> {
    await this.initialize();

    const client = await pool.connect();
    try {
      const result = await client.query(
        'SELECT id, content, metadata FROM documents WHERE id = $1',
        [id]
      );

      if (result.rows.length === 0) return null;

      return {
        id: result.rows[0].id,
        content: result.rows[0].content,
        metadata: result.rows[0].metadata
      };
    } catch (error) {
      console.error('Failed to get document by ID:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  async deleteDocumentById(id: string): Promise<boolean> {
    await this.initialize();

    const client = await pool.connect();
    try {
      const result = await client.query(
        'DELETE FROM documents WHERE id = $1 RETURNING id',
        [id]
      );

      return result.rows.length > 0;
    } catch (error) {
      console.error('Failed to delete document:', error);
      throw error;
    } finally {
      client.release();
    }
  }
}

export const neonVectorStore = new NeonVectorStore();