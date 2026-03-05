/**
 * Core pipeline runner — executed inside the BullMQ worker.
 * Each step writes progress to the database (jobs table) so the
 * SSE endpoint can forward it to the browser.
 */
import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import path from 'path';
import OpenAI from 'openai';
import { db } from '@/db';
import { videos, jobs } from '@/db/schema';
import { eq } from 'drizzle-orm';
import type { PipelineJobData, PipelineStep } from './types';
import { uploadToYouTube } from '../youtube/upload';
import { getSettingValue } from '../settings';

const execAsync = promisify(exec);

const TMP_DIR = path.join(process.cwd(), 'tmp');

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function ensureTmp() {
  await fs.mkdir(TMP_DIR, { recursive: true });
}

async function updateStep(
  videoId: string,
  step: PipelineStep,
  status: 'running' | 'done' | 'error',
  progress = 0,
  error?: string,
) {
  // Upsert job row
  const existing = await db
    .select()
    .from(jobs)
    .where(eq(jobs.videoId, videoId))
    .limit(1);

  if (existing.length === 0) {
    await db.insert(jobs).values({
      videoId,
      step,
      status,
      progress,
      error,
      startedAt: status === 'running' ? new Date() : undefined,
      finishedAt: status === 'done' || status === 'error' ? new Date() : undefined,
    });
  } else {
    await db
      .update(jobs)
      .set({
        step,
        status,
        progress,
        error,
        startedAt: status === 'running' ? new Date() : existing[0].startedAt,
        finishedAt:
          status === 'done' || status === 'error' ? new Date() : undefined,
      })
      .where(eq(jobs.videoId, videoId));
  }

  await db
    .update(videos)
    .set({ status: status === 'error' ? 'error' : 'generating', updatedAt: new Date() })
    .where(eq(videos.id, videoId));
}

// ─── Step 1: Generate thumbnail via DALL-E ────────────────────────────────────

async function generateImage(
  videoId: string,
  theme: string,
  customPrompt?: string,
): Promise<string> {
  await updateStep(videoId, 'generate_image', 'running', 10);

  const openaiKey = await getSettingValue('openai_api_key');
  const client = new OpenAI({ apiKey: openaiKey });

  const prompt =
    customPrompt ||
    `Serene ${theme} landscape for a sleep video thumbnail. Calming, high quality, cinematic.`;

  const response = await client.images.generate({
    model: 'dall-e-3',
    prompt,
    n: 1,
    size: '1792x1024',
    quality: 'hd',
  });

  const imageUrl = response.data![0].url!;

  // Download image locally
  const imgPath = path.join(TMP_DIR, `${videoId}-thumb.jpg`);
  const imgResponse = await fetch(imageUrl);
  const buffer = Buffer.from(await imgResponse.arrayBuffer());
  await fs.writeFile(imgPath, buffer);

  await db
    .update(videos)
    .set({ imageUrl, thumbnailPath: imgPath, updatedAt: new Date() })
    .where(eq(videos.id, videoId));

  await updateStep(videoId, 'generate_image', 'done', 20);
  return imgPath;
}

// ─── Step 2: Loop audio to target duration ────────────────────────────────────

async function loopAudio(videoId: string, audioType: string, duration: number): Promise<string> {
  await updateStep(videoId, 'loop_audio', 'running', 30);

  const sourceAudio = path.join(process.cwd(), 'public', 'audio', `${audioType}.mp3`);
  const outputAudio = path.join(TMP_DIR, `${videoId}-audio.mp3`);

  // Check if source exists; if not, use a silent track fallback
  try {
    await fs.access(sourceAudio);
  } catch {
    // Generate silent audio as fallback
    await execAsync(
      `ffmpeg -y -f lavfi -i anullsrc=r=44100:cl=stereo -t ${duration} ${outputAudio}`,
    );
    await updateStep(videoId, 'loop_audio', 'done', 40);
    return outputAudio;
  }

  // Loop audio to fill duration seconds
  await execAsync(
    `ffmpeg -y -stream_loop -1 -i "${sourceAudio}" -t ${duration} -c copy "${outputAudio}"`,
  );

  await updateStep(videoId, 'loop_audio', 'done', 40);
  return outputAudio;
}

// ─── Step 3: Render MP4 (static image + audio) ───────────────────────────────

async function renderVideo(
  videoId: string,
  imagePath: string,
  audioPath: string,
  duration: number,
): Promise<string> {
  await updateStep(videoId, 'render_video', 'running', 50);

  const outputVideo = path.join(TMP_DIR, `${videoId}-video.mp4`);

  await execAsync(
    `ffmpeg -y -loop 1 -i "${imagePath}" -i "${audioPath}" ` +
      `-c:v libx264 -tune stillimage -c:a aac -b:a 192k ` +
      `-pix_fmt yuv420p -t ${duration} -shortest "${outputVideo}"`,
  );

  await db
    .update(videos)
    .set({ videoPath: outputVideo, status: 'ready', updatedAt: new Date() })
    .where(eq(videos.id, videoId));

  await updateStep(videoId, 'render_video', 'done', 65);
  return outputVideo;
}

// ─── Step 4: Generate SEO metadata via GPT ───────────────────────────────────

async function generateMetadata(
  videoId: string,
  theme: string,
  duration: number,
): Promise<{ title: string; description: string; tags: string[] }> {
  await updateStep(videoId, 'generate_metadata', 'running', 70);

  const openaiKey = await getSettingValue('openai_api_key');
  const client = new OpenAI({ apiKey: openaiKey });

  const hours = Math.round(duration / 3600);

  const response = await client.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      {
        role: 'system',
        content:
          'You are a YouTube SEO expert specializing in sleep and relaxation content. Always respond with valid JSON only.',
      },
      {
        role: 'user',
        content: `Generate an SEO-optimized YouTube title, description, and tags for a ${hours}-hour ${theme} sleep video.
Return JSON with this exact shape:
{
  "title": "string (max 100 chars, include duration and theme)",
  "description": "string (400-500 chars, SEO rich, mention sleep benefits, timestamps every hour)",
  "tags": ["array", "of", "10-15", "relevant", "tags"]
}`,
      },
    ],
    response_format: { type: 'json_object' },
  });

  const parsed = JSON.parse(response.choices[0].message.content!);

  await db
    .update(videos)
    .set({
      title: parsed.title,
      description: parsed.description,
      tags: parsed.tags,
      updatedAt: new Date(),
    })
    .where(eq(videos.id, videoId));

  await updateStep(videoId, 'generate_metadata', 'done', 80);
  return parsed;
}

// ─── Step 5: Upload to YouTube ────────────────────────────────────────────────

async function uploadYouTube(
  videoId: string,
  videoPath: string,
  thumbnailPath: string,
  metadata: { title: string; description: string; tags: string[] },
): Promise<string> {
  await updateStep(videoId, 'upload_youtube', 'running', 85);

  const youtubeId = await uploadToYouTube({
    videoPath,
    thumbnailPath,
    title: metadata.title,
    description: metadata.description,
    tags: metadata.tags,
  });

  await db
    .update(videos)
    .set({ youtubeId, status: 'uploaded', updatedAt: new Date() })
    .where(eq(videos.id, videoId));

  await updateStep(videoId, 'upload_youtube', 'done', 100);
  return youtubeId;
}

// ─── Main pipeline runner ─────────────────────────────────────────────────────

export async function runPipeline(data: PipelineJobData): Promise<void> {
  const { videoId, theme, audioType, duration, customPrompt } = data;

  await ensureTmp();

  try {
    const imagePath = await generateImage(videoId, theme, customPrompt);
    const audioPath = await loopAudio(videoId, audioType, duration);
    const videoPath = await renderVideo(videoId, imagePath, audioPath, duration);
    const metadata = await generateMetadata(videoId, theme, duration);
    await uploadYouTube(videoId, videoPath, imagePath, metadata);

    // Cleanup temp files
    await Promise.allSettled([
      fs.unlink(audioPath),
      fs.unlink(videoPath),
    ]);
  } catch (err) {
    await db
      .update(videos)
      .set({ status: 'error', updatedAt: new Date() })
      .where(eq(videos.id, videoId));
    throw err;
  }
}
