import { pool } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const client = await pool.connect();
    try {
      const result = await client.query(`
        SELECT 
          id,
          topic,
          created_at as "createdAt"
        FROM reports
        ORDER BY created_at DESC
      `);
      
      return NextResponse.json(result.rows);
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Database Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch reports' }, 
      { status: 500 }
    );
  }
}