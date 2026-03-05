# SleepBot — YouTube Sleep Video Automation

A full-stack Next.js dashboard for automatically generating and uploading 8-hour sleep/nature videos to YouTube. Powered by DALL-E 3, FFmpeg, OpenAI GPT-4o-mini, and the YouTube Data API v3.

## Features

- **Dashboard** — real-time stats and job activity feed
- **Video Generator** — pick theme + audio + duration, then the full pipeline runs automatically
- **Scheduler** — set daily or recurring automated uploads with theme rotation
- **Video Library** — browse all videos, view YouTube stats, filter by status
- **Settings** — securely store API keys (AES-256-GCM encrypted)

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 14 (App Router), TypeScript, Tailwind CSS |
| Database | Supabase (PostgreSQL) via Drizzle ORM |
| Job Queue | BullMQ + Redis |
| AI | OpenAI DALL-E 3 (images), GPT-4o-mini (SEO metadata) |
| Video | FFmpeg (audio looping + MP4 rendering) |
| Upload | YouTube Data API v3 (OAuth 2.0) |

## Prerequisites

- **Node.js** 18+
- **FFmpeg** installed and in your PATH (`ffmpeg -version` should work)
- **Redis** running locally or via Upstash
- **Supabase** project
- **OpenAI** API key
- **Google Cloud** project with YouTube Data API v3 enabled

## Local Setup

### 1. Clone & Install

```bash
git clone <repo-url>
cd conbot
npm install
```

### 2. Environment Variables

```bash
cp .env.example .env.local
```

Edit `.env.local`:

```env
DATABASE_URL="postgresql://..."   # Supabase Transaction Pooler connection string
REDIS_URL="redis://localhost:6379"
ENCRYPTION_KEY="your-32-char-minimum-key-for-encrypting-api-keys"
```

### 3. Supabase Database Setup

**Option A: SQL Editor (easiest)**
1. Go to your Supabase dashboard → SQL Editor
2. Paste the contents of `drizzle/migrations/0001_initial.sql`
3. Click Run

**Option B: Drizzle Migrate**
```bash
npm run db:migrate
```

### 4. Add Audio Files

Place `.mp3` files in `public/audio/` named after each audio type:
```
public/audio/
  rain.mp3
  ocean.mp3
  forest.mp3
  fire.mp3
  white_noise.mp3
  brown_noise.mp3
```

> Free sources: freesound.org, pixabay.com/music

### 5. Start Development

```bash
# Terminal 1 — Next.js dev server
npm run dev

# Terminal 2 — BullMQ pipeline worker
npm run worker
```

Open [http://localhost:3000](http://localhost:3000) — it redirects to `/dashboard`.

## YouTube OAuth Setup

### Step 1: Google Cloud Console
1. Create/open a project at console.cloud.google.com
2. Enable **YouTube Data API v3**
3. Go to **Credentials** → **Create Credentials** → **OAuth 2.0 Client ID** (type: Desktop App)
4. Copy the Client ID and Client Secret

### Step 2: Get Refresh Token
```bash
# Add these to .env.local temporarily
YOUTUBE_CLIENT_ID="your-client-id"
YOUTUBE_CLIENT_SECRET="your-client-secret"

npm run youtube:token
```
Follow the browser prompt, authorize, paste the code, and copy the printed refresh token.

### Step 3: Save to Settings
Go to `http://localhost:3000/settings` and enter all four values:
- OpenAI API Key
- YouTube Client ID
- YouTube Client Secret
- YouTube Refresh Token

## npm Scripts

| Script | Description |
|---|---|
| `npm run dev` | Start Next.js dev server |
| `npm run worker` | Start BullMQ pipeline worker (required for video generation) |
| `npm run build` | Production build |
| `npm run db:migrate` | Run Drizzle migrations against Supabase |
| `npm run db:generate` | Generate new migration from schema changes |
| `npm run db:studio` | Open Drizzle Studio (visual DB editor) |
| `npm run youtube:token` | Interactive YouTube OAuth refresh token generator |

## Project Structure

```
conbot/
├── app/
│   ├── api/
│   │   ├── dashboard/stats/     GET  — stats for dashboard overview
│   │   ├── pipeline/
│   │   │   ├── start/           POST — kick off full video pipeline
│   │   │   └── status/[jobId]/  GET  — SSE stream of pipeline progress
│   │   ├── videos/              GET/DELETE — video library
│   │   ├── schedule/            GET/POST/PATCH/DELETE — automation schedules
│   │   ├── settings/            GET/POST — encrypted API key management
│   │   └── youtube/stats/       GET  — fetch view/like counts from YouTube
│   ├── dashboard/page.tsx        Overview with stats cards
│   ├── create/page.tsx           Video generator with live progress
│   ├── schedule/page.tsx         Automation schedule manager
│   ├── videos/page.tsx           Video library with filtering
│   └── settings/page.tsx         API key configuration
├── components/
│   ├── layout/sidebar.tsx        Navigation sidebar
│   ├── layout/header.tsx         Top header bar
│   └── ui/
│       ├── badge.tsx             Status badge component
│       └── progress-bar.tsx      Animated progress bar
├── db/
│   ├── schema.ts                 Drizzle ORM table definitions
│   ├── index.ts                  DB client singleton
│   └── migrate.ts                Migration runner script
├── lib/
│   ├── pipeline/
│   │   ├── types.ts              Shared pipeline step types
│   │   ├── queue.ts              BullMQ queue setup
│   │   └── runner.ts             Full 5-step pipeline logic
│   ├── youtube/upload.ts         YouTube upload + stats fetcher
│   ├── settings.ts               AES-256-GCM key encryption
│   └── utils.ts                  cn(), formatDuration(), formatNumber()
├── workers/
│   └── pipeline.worker.ts        BullMQ worker process entry point
├── scripts/
│   └── get-youtube-token.ts      One-time YouTube OAuth token generator
├── drizzle/migrations/
│   └── 0001_initial.sql          Database schema SQL
├── public/audio/                 Place .mp3 audio files here
└── tmp/                          Temp render files (auto-created, gitignored)
```

## Pipeline Steps

When you click **Generate & Upload**, these 5 steps run in sequence:

| Step | What Happens |
|---|---|
| 1. Generate Thumbnail | DALL-E 3 generates a 1792×1024 HD image from your theme/prompt |
| 2. Loop Audio | FFmpeg loops the source MP3 to fill the target duration (1h/3h/8h) |
| 3. Render Video | FFmpeg combines static image + looped audio into an H.264 MP4 |
| 4. Generate Metadata | GPT-4o-mini creates SEO title, description (400-500 chars), and 12+ tags |
| 5. Upload to YouTube | YouTube Data API v3 uploads the video and sets the thumbnail |

Real-time progress is streamed back via **Server-Sent Events (SSE)** and shown in the UI.

## Database Schema

| Table | Purpose |
|---|---|
| `videos` | All video records with status, YouTube ID, title, tags |
| `jobs` | Per-video pipeline step tracking (step, status, progress, error) |
| `schedules` | Automation schedules with themes, frequency, next_run |
| `settings` | Encrypted API key storage |

## Production Deployment

### Recommended Stack
- **Vercel** — host the Next.js app (serverless functions for API routes)
- **Upstash Redis** — serverless Redis for BullMQ
- **Supabase** — managed PostgreSQL
- **Railway / Fly.io** — persistent process for the BullMQ worker

### Notes
- The BullMQ worker must run as a **persistent process**, not serverless
- FFmpeg must be available in the worker's environment
- Set all variables from `.env.example` in your hosting provider's dashboard
- The `tmp/` directory is used for render artifacts and is cleaned up after upload

## Security

- API keys are encrypted with **AES-256-GCM** before database storage
- The `ENCRYPTION_KEY` env variable is the root secret — keep it safe
- The `/api/settings` GET endpoint only returns **masked** values (last 4 chars visible)
- YouTube uses OAuth 2.0 refresh tokens — access tokens are never stored
