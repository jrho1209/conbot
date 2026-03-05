import {
  pgTable,
  uuid,
  text,
  integer,
  boolean,
  timestamp,
  index,
} from 'drizzle-orm/pg-core';

// ─── Videos ───────────────────────────────────────────────────────────────────
export const videos = pgTable(
  'videos',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    theme: text('theme').notNull(),
    status: text('status').notNull().default('pending'), // pending | generating | ready | uploading | uploaded | error
    imageUrl: text('image_url'),
    audioType: text('audio_type').notNull(),
    duration: integer('duration').notNull(), // seconds
    youtubeId: text('youtube_id'),
    title: text('title'),
    description: text('description'),
    tags: text('tags').array(),
    thumbnailPath: text('thumbnail_path'),
    videoPath: text('video_path'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (t) => ({
    statusIdx: index('videos_status_idx').on(t.status),
    createdAtIdx: index('videos_created_at_idx').on(t.createdAt),
  }),
);

export type Video = typeof videos.$inferSelect;
export type NewVideo = typeof videos.$inferInsert;

// ─── Jobs ─────────────────────────────────────────────────────────────────────
export const jobs = pgTable(
  'jobs',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    videoId: uuid('video_id')
      .notNull()
      .references(() => videos.id, { onDelete: 'cascade' }),
    step: text('step').notNull(), // generate_image | loop_audio | render_video | generate_metadata | upload_youtube
    status: text('status').notNull().default('pending'), // pending | running | done | error
    error: text('error'),
    progress: integer('progress').default(0), // 0-100
    startedAt: timestamp('started_at'),
    finishedAt: timestamp('finished_at'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (t) => ({
    videoIdIdx: index('jobs_video_id_idx').on(t.videoId),
    statusIdx: index('jobs_status_idx').on(t.status),
  }),
);

export type Job = typeof jobs.$inferSelect;
export type NewJob = typeof jobs.$inferInsert;

// ─── Schedules ────────────────────────────────────────────────────────────────
export const schedules = pgTable('schedules', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  themes: text('themes').array().notNull(),
  audioType: text('audio_type').notNull().default('rain'),
  duration: integer('duration').notNull().default(28800), // 8 hours in seconds
  frequencyDays: integer('frequency_days').notNull().default(1),
  lastRun: timestamp('last_run'),
  nextRun: timestamp('next_run'),
  enabled: boolean('enabled').notNull().default(false),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export type Schedule = typeof schedules.$inferSelect;
export type NewSchedule = typeof schedules.$inferInsert;

// ─── Settings ─────────────────────────────────────────────────────────────────
export const settings = pgTable('settings', {
  key: text('key').primaryKey(),
  value: text('value').notNull(), // stored encrypted
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export type Setting = typeof settings.$inferSelect;
export type NewSetting = typeof settings.$inferInsert;
