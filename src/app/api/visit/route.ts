import { NextResponse } from 'next/server';
import { kv } from '@vercel/kv';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  try {
    // Increment the visitor count
    const visits = await kv.incr('portfolio_visitors');
    
    // We add the base offset of 14204 to maintain our aesthetic counter level
    const displayVisits = (visits || 0) + 14204;
    
    return new NextResponse(JSON.stringify({ visits: displayVisits }), {
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
    return new NextResponse(JSON.stringify({ visits: 14212 + Math.floor(Math.random() * 3) }), {
      status: 200,
      headers: {
        'Cache-Control': 'no-store',
      },
    });
  }
}
