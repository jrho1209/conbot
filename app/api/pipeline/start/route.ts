import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { videos } from '@/db/schema';
import { enqueueVideo } from '@/lib/pipeline/queue';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { theme, audioType, duration, customPrompt } = body;

    if (!theme || !audioType || !duration) {
      return NextResponse.json(
        { error: 'Missing required fields: theme, audioType, duration' },
        { status: 400 },
      );
    }

    // Create video record
    const [video] = await db
      .insert(videos)
      .values({
        theme,
        audioType,
        duration,
        status: 'pending',
      })
      .returning();

    // Enqueue pipeline job
    const jobId = await enqueueVideo({
      videoId: video.id,
      theme,
      audioType,
      duration,
      customPrompt,
    });

    return NextResponse.json({ videoId: video.id, jobId });
  } catch (err) {
    console.error('[API] pipeline/start error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
