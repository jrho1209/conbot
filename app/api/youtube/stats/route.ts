import { NextRequest, NextResponse } from 'next/server';
import { getYouTubeStats } from '@/lib/youtube/upload';

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const ids = url.searchParams.get('ids');

    if (!ids) {
      return NextResponse.json({ error: 'Missing ids query param' }, { status: 400 });
    }

    const youtubeIds = ids.split(',').filter(Boolean);
    const stats = await getYouTubeStats(youtubeIds);

    return NextResponse.json({ stats });
  } catch (err) {
    console.error('[API] youtube/stats error:', err);
    return NextResponse.json({ error: 'Failed to fetch YouTube stats' }, { status: 500 });
  }
}
