import { Pool } from 'pg';
import { sql } from '@vercel/postgres';

// Create a new pool using the connection string
const pool = new Pool({
  connectionString: process.env.NEON_DATABASE_URL,
});

// Export both the pool and the Vercel SQL client
export { pool, sql };