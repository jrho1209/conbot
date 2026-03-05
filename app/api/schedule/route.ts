import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { schedules } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';
import { addDays } from 'date-fns';

export async function GET() {
  try {
    const rows = await db.select().from(schedules).orderBy(desc(schedules.createdAt));
    return NextResponse.json({ schedules: rows });
  } catch (err) {
    console.error('[API] schedule GET error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, themes, audioType, duration, frequencyDays } = body;

    if (!name || !themes?.length || !frequencyDays) {
      return NextResponse.json(
        { error: 'Missing required fields: name, themes, frequencyDays' },
        { status: 400 },
      );
    }

    const nextRun = addDays(new Date(), 0); // start immediately

    const [schedule] = await db
      .insert(schedules)
      .values({
        name,
        themes,
        audioType: audioType || 'rain',
        duration: duration || 28800,
        frequencyDays,
        nextRun,
        enabled: true,
      })
      .returning();

    return NextResponse.json({ schedule });
  } catch (err) {
    console.error('[API] schedule POST error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, enabled, ...rest } = body;

    if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });

    const [updated] = await db
      .update(schedules)
      .set({ enabled, ...rest, updatedAt: new Date() })
      .where(eq(schedules.id, id))
      .returning();

    return NextResponse.json({ schedule: updated });
  } catch (err) {
    console.error('[API] schedule PATCH error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { id } = await req.json();
    if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });
    await db.delete(schedules).where(eq(schedules.id, id));
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[API] schedule DELETE error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
