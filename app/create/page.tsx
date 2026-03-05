'use client';

import { useState } from 'react';
import {
  CloudRain,
  Waves,
  TreePine,
  Flame,
  Wind,
  Music,
  Sparkles,
  Play,
  CheckCircle,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { ProgressBar } from '@/components/ui/progress-bar';
import { StatusBadge } from '@/components/ui/badge';
import { STEP_LABELS } from '@/lib/pipeline/types';
import type { PipelineStep } from '@/lib/pipeline/types';
import { cn } from '@/lib/utils';

const THEMES = [
  { id: 'rain', label: 'Rain', icon: CloudRain, color: 'text-blue-400' },
  { id: 'ocean', label: 'Ocean', icon: Waves, color: 'text-cyan-400' },
  { id: 'forest', label: 'Forest', icon: TreePine, color: 'text-green-400' },
  { id: 'fire', label: 'Fireplace', icon: Flame, color: 'text-orange-400' },
  { id: 'wind', label: 'Wind', icon: Wind, color: 'text-zinc-400' },
  { id: 'custom', label: 'Custom Prompt', icon: Sparkles, color: 'text-purple-400' },
];

const AUDIO_TYPES = [
  { id: 'rain', label: 'Rain' },
  { id: 'ocean', label: 'Ocean Waves' },
  { id: 'forest', label: 'Forest Ambience' },
  { id: 'fire', label: 'Crackling Fire' },
  { id: 'white_noise', label: 'White Noise' },
  { id: 'brown_noise', label: 'Brown Noise' },
];

const DURATIONS = [
  { label: '1 Hour', seconds: 3600 },
  { label: '3 Hours', seconds: 10800 },
  { label: '8 Hours', seconds: 28800 },
];

interface SSEUpdate {
  type: string;
  videoStatus?: string;
  step?: PipelineStep;
  stepStatus?: string;
  progress?: number;
  error?: string;
  youtubeId?: string;
}

export default function CreatePage() {
  const [theme, setTheme] = useState('rain');
  const [audioType, setAudioType] = useState('rain');
  const [duration, setDuration] = useState(28800);
  const [customPrompt, setCustomPrompt] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [currentStep, setCurrentStep] = useState<PipelineStep | null>(null);
  const [stepStatus, setStepStatus] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [youtubeId, setYoutubeId] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function handleSubmit() {
    setIsRunning(true);
    setError(null);
    setDone(false);
    setYoutubeId(null);
    setProgress(0);
    setCurrentStep(null);

    try {
      // Start pipeline
      const startRes = await fetch('/api/pipeline/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          theme: theme === 'custom' ? 'custom' : theme,
          audioType,
          duration,
          customPrompt: theme === 'custom' ? customPrompt : undefined,
        }),
      });

      if (!startRes.ok) {
        const data = await startRes.json();
        throw new Error(data.error || 'Failed to start pipeline');
      }

      const { videoId: vid } = await startRes.json();

      // Listen to SSE stream
      const es = new EventSource(`/api/pipeline/status/${vid}`);

      es.onmessage = (event) => {
        const data: SSEUpdate = JSON.parse(event.data);

        if (data.type === 'update') {
          if (data.step) setCurrentStep(data.step);
          if (data.stepStatus) setStepStatus(data.stepStatus);
          if (data.progress !== undefined) setProgress(data.progress);
        } else if (data.type === 'complete') {
          setDone(true);
          setYoutubeId(data.youtubeId || null);
          setProgress(100);
          es.close();
          setIsRunning(false);
        } else if (data.type === 'error') {
          setError(data.error || 'Pipeline failed');
          es.close();
          setIsRunning(false);
        }
      };

      es.onerror = () => {
        setError('Connection to pipeline lost');
        es.close();
        setIsRunning(false);
      };
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      setIsRunning(false);
    }
  }

  const steps = Object.entries(STEP_LABELS) as [PipelineStep, string][];

  return (
    <div className="max-w-3xl space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-white">Create Sleep Video</h2>
        <p className="text-zinc-400 text-sm mt-1">
          Configure your video, then hit Generate to run the full pipeline
        </p>
      </div>

      <div className="space-y-6">
        {/* Theme Picker */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 space-y-4">
          <label className="text-white font-semibold text-sm">Select Theme</label>
          <div className="grid grid-cols-3 gap-3">
            {THEMES.map(({ id, label, icon: Icon, color }) => (
              <button
                key={id}
                onClick={() => setTheme(id)}
                disabled={isRunning}
                className={cn(
                  'flex flex-col items-center gap-2 p-4 rounded-lg border transition-all text-sm font-medium',
                  theme === id
                    ? 'border-blue-500 bg-blue-950/30 text-white'
                    : 'border-zinc-700 bg-zinc-800 text-zinc-400 hover:border-zinc-600 hover:text-white',
                  isRunning && 'opacity-50 cursor-not-allowed',
                )}
              >
                <Icon className={cn('w-5 h-5', theme === id ? color : 'text-zinc-500')} />
                {label}
              </button>
            ))}
          </div>
          {theme === 'custom' && (
            <div className="mt-2">
              <textarea
                value={customPrompt}
                onChange={(e) => setCustomPrompt(e.target.value)}
                disabled={isRunning}
                placeholder="Describe your image prompt (e.g. 'Peaceful mountain lake at sunset with mist...')"
                className="w-full bg-zinc-800 border border-zinc-700 text-white placeholder-zinc-500 rounded-lg px-4 py-3 text-sm resize-none focus:outline-none focus:border-blue-500 transition-colors"
                rows={3}
              />
            </div>
          )}
        </div>

        {/* Audio Type */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 space-y-4">
          <label className="text-white font-semibold text-sm flex items-center gap-2">
            <Music className="w-4 h-4 text-zinc-400" />
            Audio Type
          </label>
          <div className="grid grid-cols-3 gap-2">
            {AUDIO_TYPES.map(({ id, label }) => (
              <button
                key={id}
                onClick={() => setAudioType(id)}
                disabled={isRunning}
                className={cn(
                  'px-3 py-2 rounded-lg border text-sm font-medium transition-colors',
                  audioType === id
                    ? 'border-blue-500 bg-blue-950/30 text-white'
                    : 'border-zinc-700 bg-zinc-800 text-zinc-400 hover:border-zinc-600 hover:text-white',
                  isRunning && 'opacity-50 cursor-not-allowed',
                )}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Duration */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 space-y-4">
          <label className="text-white font-semibold text-sm">Duration</label>
          <div className="flex gap-3">
            {DURATIONS.map(({ label, seconds }) => (
              <button
                key={seconds}
                onClick={() => setDuration(seconds)}
                disabled={isRunning}
                className={cn(
                  'flex-1 py-2.5 rounded-lg border text-sm font-medium transition-colors',
                  duration === seconds
                    ? 'border-blue-500 bg-blue-950/30 text-white'
                    : 'border-zinc-700 bg-zinc-800 text-zinc-400 hover:border-zinc-600 hover:text-white',
                  isRunning && 'opacity-50 cursor-not-allowed',
                )}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Generate Button */}
        <button
          onClick={handleSubmit}
          disabled={isRunning || (theme === 'custom' && !customPrompt.trim())}
          className={cn(
            'w-full py-3.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all',
            isRunning || (theme === 'custom' && !customPrompt.trim())
              ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
              : 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white shadow-lg shadow-blue-900/30',
          )}
        >
          {isRunning ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Processing...
            </>
          ) : (
            <>
              <Play className="w-4 h-4" />
              Generate & Upload
            </>
          )}
        </button>
      </div>

      {/* Pipeline Progress */}
      {(isRunning || done || error) && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 space-y-5">
          <div className="flex items-center justify-between">
            <h3 className="text-white font-semibold text-sm">Pipeline Progress</h3>
            {done && <StatusBadge status="uploaded" />}
            {error && <StatusBadge status="error" />}
          </div>

          <ProgressBar value={progress} />

          {/* Steps */}
          <div className="space-y-2">
            {steps.map(([stepId, label]) => {
              const isCurrent = currentStep === stepId;
              const stepIdx = steps.findIndex(([s]) => s === stepId);
              const currentIdx = steps.findIndex(([s]) => s === currentStep);
              const isDone = currentIdx > stepIdx || (done && currentIdx >= stepIdx);

              return (
                <div
                  key={stepId}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors',
                    isCurrent && 'bg-blue-950/30 border border-blue-800/50',
                  )}
                >
                  {isDone ? (
                    <CheckCircle className="w-4 h-4 text-green-400 shrink-0" />
                  ) : isCurrent ? (
                    <Loader2 className="w-4 h-4 text-blue-400 animate-spin shrink-0" />
                  ) : (
                    <div className="w-4 h-4 rounded-full border border-zinc-700 shrink-0" />
                  )}
                  <span
                    className={cn(
                      isDone ? 'text-zinc-300' : isCurrent ? 'text-white' : 'text-zinc-500',
                    )}
                  >
                    {label}
                  </span>
                  {isCurrent && stepStatus && (
                    <StatusBadge status={stepStatus} className="ml-auto" />
                  )}
                </div>
              );
            })}
          </div>

          {/* Error */}
          {error && (
            <div className="flex items-start gap-3 bg-red-950/30 border border-red-800 rounded-lg p-4">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <p className="text-red-300 text-sm">{error}</p>
            </div>
          )}

          {/* Success */}
          {done && youtubeId && (
            <div className="flex items-center gap-3 bg-green-950/30 border border-green-800 rounded-lg p-4">
              <CheckCircle className="w-5 h-5 text-green-400 shrink-0" />
              <div>
                <p className="text-green-300 text-sm font-medium">Video uploaded successfully!</p>
                <a
                  href={`https://youtube.com/watch?v=${youtubeId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-400 text-xs hover:underline"
                >
                  View on YouTube →
                </a>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
