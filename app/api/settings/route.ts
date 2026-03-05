import { NextRequest, NextResponse } from 'next/server';
import { getAllSettings, upsertSetting } from '@/lib/settings';

const ALLOWED_KEYS = [
  'openai_api_key',
  'youtube_client_id',
  'youtube_client_secret',
  'youtube_refresh_token',
  'replicate_api_key',
];

export async function GET() {
  try {
    const all = await getAllSettings();
    // Mask values for display — only show last 4 chars
    const masked: Record<string, string> = {};
    for (const [k, v] of Object.entries(all)) {
      masked[k] = v ? `${'*'.repeat(Math.max(0, v.length - 4))}${v.slice(-4)}` : '';
    }
    return NextResponse.json({ settings: masked });
  } catch (err) {
    console.error('[API] settings GET error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    for (const [key, value] of Object.entries(body)) {
      if (!ALLOWED_KEYS.includes(key)) continue;
      if (typeof value !== 'string' || !value.trim()) continue;
      await upsertSetting(key, value.trim());
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[API] settings POST error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
