import { pool } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> | { id: string } }
) {
  const { id } = await context.params;

  try {
    const client = await pool.connect();
    try {
      const result = await client.query(
        `SELECT content, topic FROM reports WHERE id = $1`,
        [id]
      );

      if (result.rows.length === 0) {
        return NextResponse.json(
          { error: 'Report not found' },
          { status: 404 }
        );
      }

      return NextResponse.json({
        content: result.rows[0].content,
        topic: result.rows[0].topic
      });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Database Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch report' },
      { status: 500 }
    );
  }
}