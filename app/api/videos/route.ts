import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { videos } from '@/db/schema';
import { desc, eq } from 'drizzle-orm';

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const status = url.searchParams.get('status');

    const rows = status
      ? await db
          .select()
          .from(videos)
          .where(eq(videos.status, status))
          .orderBy(desc(videos.createdAt))
      : await db.select().from(videos).orderBy(desc(videos.createdAt));

    return NextResponse.json({ videos: rows });
  } catch (err) {
    console.error('[API] videos GET error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { id } = await req.json();
    if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });
    await db.delete(videos).where(eq(videos.id, id));
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[API] videos DELETE error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
