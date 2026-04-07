import { NextResponse } from 'next/server';
import { kv } from '@vercel/kv';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  try {
    // Increment the visitor count from zero
    const visits = await kv.incr('portfolio_visits_fresh');
    
    return new NextResponse(JSON.stringify({ visits }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    });
  } catch (err) {
    console.warn("KV Store Error:", err);
    // Fallback if KV is down
    return new NextResponse(JSON.stringify({ visits: 0 }), {
      status: 200,
      headers: {
        'Cache-Control': 'no-store',
      },
    });
  }
}
