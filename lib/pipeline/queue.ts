import { Queue } from 'bullmq';
import type { ConnectionOptions } from 'bullmq';
import type { PipelineJobData } from './types';

const QUEUE_NAME = 'video-pipeline';

// BullMQ 5+ accepts { url } for connection — avoids ioredis version conflicts
const connection: ConnectionOptions = { url: process.env.REDIS_URL! } as ConnectionOptions;

let queue: Queue<PipelineJobData> | null = null;

export function getPipelineQueue(): Queue<PipelineJobData> {
  if (!queue) {
    queue = new Queue<PipelineJobData>(QUEUE_NAME, {
      connection,
      defaultJobOptions: {
        attempts: 3,
        backoff: { type: 'exponential', delay: 5000 },
        removeOnComplete: 100,
        removeOnFail: 200,
      },
    });
  }
  return queue!;
}

export async function enqueueVideo(data: PipelineJobData): Promise<string> {
  const q = getPipelineQueue();
  const job = await q.add('process-video', data, {
    jobId: `video-${data.videoId}`,
  });
  return job.id!;
}

export { QUEUE_NAME };
