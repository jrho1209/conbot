import { NextResponse } from 'next/server';
import { db } from '@/db';
import { videos, jobs } from '@/db/schema';
import { desc, eq, count } from 'drizzle-orm';

export async function GET() {
  try {
    const [totalResult] = await db.select({ count: count() }).from(videos);
    const [uploadedResult] = await db
      .select({ count: count() })
      .from(videos)
      .where(eq(videos.status, 'uploaded'));
    const [generatingResult] = await db
      .select({ count: count() })
      .from(videos)
      .where(eq(videos.status, 'generating'));

    const recentJobs = await db
      .select()
      .from(jobs)
      .orderBy(desc(jobs.createdAt))
      .limit(10);

    const recentVideos = await db
      .select()
      .from(videos)
      .orderBy(desc(videos.createdAt))
      .limit(5);

    return NextResponse.json({
      stats: {
        total: totalResult.count,
        uploaded: uploadedResult.count,
        generating: generatingResult.count,
      },
      recentJobs,
      recentVideos,
    });
  } catch (err) {
    console.error('[API] dashboard/stats error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
