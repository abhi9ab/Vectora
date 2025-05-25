import { pool } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { topic, content } = await request.json();
    const client = await pool.connect();

    try {
      const result = await client.query(
        `INSERT INTO reports (topic, content)
         VALUES ($1, $2)
         RETURNING id`,
        [topic, content]
      );
      
      return NextResponse.json({ 
        success: true, 
        id: result.rows[0].id 
      });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Database Error:', error);
    return NextResponse.json(
      { error: 'Failed to save report' },
      { status: 500 }
    );
  }
}