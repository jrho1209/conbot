import { NextRequest } from 'next/server';
import { db } from '@/db';
import { jobs, videos } from '@/db/schema';
import { eq } from 'drizzle-orm';

/**
 * GET /api/pipeline/status/[jobId]
 * Server-Sent Events stream that pushes job progress updates to the client.
 * The jobId is actually the videoId for simplicity.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { jobId: string } },
) {
  const { jobId } = params;
  const videoId = jobId; // we use videoId as the SSE channel key

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      function send(data: object) {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
      }

      let done = false;
      let attempts = 0;
      const MAX_POLL = 720; // 12 minutes max (720 * 1s)

      while (!done && attempts < MAX_POLL) {
        try {
          const [video] = await db
            .select()
            .from(videos)
            .where(eq(videos.id, videoId))
            .limit(1);

          if (!video) {
            send({ type: 'error', error: 'Video not found' });
            break;
          }

          const [job] = await db
            .select()
            .from(jobs)
            .where(eq(jobs.videoId, videoId))
            .limit(1);

          send({
            type: 'update',
            videoStatus: video.status,
            step: job?.step,
            stepStatus: job?.status,
            progress: job?.progress ?? 0,
            error: job?.error,
            youtubeId: video.youtubeId,
          });

          if (video.status === 'uploaded' || video.status === 'error') {
            done = true;
            send({ type: 'complete', videoStatus: video.status, youtubeId: video.youtubeId });
            break;
          }
        } catch {
          send({ type: 'error', error: 'Failed to fetch status' });
          break;
        }

        // Poll every second
        await new Promise((r) => setTimeout(r, 1000));
        attempts++;
      }

      if (attempts >= MAX_POLL) {
        send({ type: 'error', error: 'Timeout waiting for pipeline to complete' });
      }

      controller.close();
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  });
}
