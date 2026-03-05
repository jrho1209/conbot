/**
 * BullMQ Worker — run this as a separate process:
 *   npm run worker
 *
 * It picks up jobs from the "video-pipeline" queue and executes
 * the full rendering pipeline.
 */
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(process.cwd(), '.env.local') });

import { Worker } from 'bullmq';
import type { ConnectionOptions } from 'bullmq';
import { runPipeline } from '../lib/pipeline/runner';
import { QUEUE_NAME } from '../lib/pipeline/queue';
import type { PipelineJobData } from '../lib/pipeline/types';

// Use URL string to avoid ioredis version conflicts with BullMQ's bundled ioredis
const connection: ConnectionOptions = { url: process.env.REDIS_URL! } as ConnectionOptions;

const worker = new Worker<PipelineJobData>(
  QUEUE_NAME,
  async (job) => {
    console.log(`[Worker] Processing job ${job.id} for video ${job.data.videoId}`);
    await runPipeline(job.data);
    console.log(`[Worker] Completed job ${job.id}`);
  },
  {
    connection,
    concurrency: 2,
  },
);

worker.on('completed', (job) => {
  console.log(`[Worker] Job ${job.id} completed`);
});

worker.on('failed', (job, err) => {
  console.error(`[Worker] Job ${job?.id} failed:`, err.message);
});

console.log('[Worker] Pipeline worker started, waiting for jobs...');
