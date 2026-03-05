export type PipelineStep =
  | 'generate_image'
  | 'loop_audio'
  | 'render_video'
  | 'generate_metadata'
  | 'upload_youtube';

export type StepStatus = 'pending' | 'running' | 'done' | 'error';

export interface PipelineJobData {
  videoId: string;
  theme: string;
  audioType: string;
  duration: number; // seconds
  customPrompt?: string;
}

export interface SSEEvent {
  type: 'step_update' | 'progress' | 'complete' | 'error';
  step?: PipelineStep;
  status?: StepStatus;
  progress?: number;
  message?: string;
  videoId?: string;
  youtubeId?: string;
  error?: string;
}

export const PIPELINE_STEPS: PipelineStep[] = [
  'generate_image',
  'loop_audio',
  'render_video',
  'generate_metadata',
  'upload_youtube',
];

export const STEP_LABELS: Record<PipelineStep, string> = {
  generate_image: 'Generate Thumbnail',
  loop_audio: 'Loop Audio',
  render_video: 'Render Video',
  generate_metadata: 'Generate SEO Metadata',
  upload_youtube: 'Upload to YouTube',
};
