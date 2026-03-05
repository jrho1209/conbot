'use client';

import { useEffect, useState } from 'react';
import {
  Calendar,
  Plus,
  Trash2,
  Power,
  PowerOff,
  Loader2,
  AlertCircle,
  CheckCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const THEME_OPTIONS = ['rain', 'ocean', 'forest', 'fire', 'wind'];
const AUDIO_TYPES = ['rain', 'ocean', 'forest', 'fire', 'white_noise', 'brown_noise'];

interface Schedule {
  id: string;
  name: string;
  themes: string[];
  audioType: string;
  duration: number;
  frequencyDays: number;
  lastRun: string | null;
  nextRun: string | null;
  enabled: boolean;
  createdAt: string;
}

export default function SchedulePage() {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Form state
  const [name, setName] = useState('');
  const [selectedThemes, setSelectedThemes] = useState<string[]>(['rain']);
  const [audioType, setAudioType] = useState('rain');
  const [duration, setDuration] = useState(28800);
  const [frequencyDays, setFrequencyDays] = useState(1);

  async function fetchSchedules() {
    try {
      const res = await fetch('/api/schedule');
      const data = await res.json();
      setSchedules(data.schedules || []);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchSchedules();
  }, []);

  async function handleCreate() {
    if (!name.trim() || selectedThemes.length === 0) {
      setFormError('Name and at least one theme are required');
      return;
    }
    setSaving(true);
    setFormError(null);
    try {
      const res = await fetch('/api/schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, themes: selectedThemes, audioType, duration, frequencyDays }),
      });
      if (!res.ok) throw new Error('Failed to save');
      const data = await res.json();
      setSchedules((prev) => [data.schedule, ...prev]);
      setShowForm(false);
      setName('');
      setSelectedThemes(['rain']);
    } catch {
      setFormError('Failed to create schedule');
    } finally {
      setSaving(false);
    }
  }

  async function toggleEnabled(id: string, enabled: boolean) {
    const res = await fetch('/api/schedule', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, enabled: !enabled }),
    });
    if (res.ok) {
      setSchedules((prev) =>
        prev.map((s) => (s.id === id ? { ...s, enabled: !enabled } : s)),
      );
    }
  }

  async function deleteSchedule(id: string) {
    const res = await fetch('/api/schedule', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    });
    if (res.ok) {
      setSchedules((prev) => prev.filter((s) => s.id !== id));
    }
  }

  function toggleTheme(t: string) {
    setSelectedThemes((prev) =>
      prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t],
    );
  }

  return (
    <div className="max-w-3xl space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Schedule</h2>
          <p className="text-zinc-400 text-sm mt-1">Automate recurring video creation and uploads</p>
        </div>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-lg transition-colors"
        >
          <Plus className="w-4 h-4" />
          New Schedule
        </button>
      </div>

      {/* Create Form */}
      {showForm && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 space-y-5">
          <h3 className="text-white font-semibold text-sm">New Automation Schedule</h3>

          {formError && (
            <div className="flex items-center gap-2 text-red-400 text-sm bg-red-950/30 border border-red-800 rounded-lg px-4 py-3">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {formError}
            </div>
          )}

          <div>
            <label className="text-zinc-400 text-xs mb-2 block">Schedule Name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Daily Rain Videos"
              className="w-full bg-zinc-800 border border-zinc-700 text-white placeholder-zinc-500 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500 transition-colors"
            />
          </div>

          <div>
            <label className="text-zinc-400 text-xs mb-2 block">Themes to Rotate</label>
            <div className="flex flex-wrap gap-2">
              {THEME_OPTIONS.map((t) => (
                <button
                  key={t}
                  onClick={() => toggleTheme(t)}
                  className={cn(
                    'px-3 py-1.5 rounded-lg border text-sm font-medium transition-colors capitalize',
                    selectedThemes.includes(t)
                      ? 'border-blue-500 bg-blue-950/30 text-white'
                      : 'border-zinc-700 bg-zinc-800 text-zinc-400 hover:border-zinc-600',
                  )}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-zinc-400 text-xs mb-2 block">Audio Type</label>
              <select
                value={audioType}
                onChange={(e) => setAudioType(e.target.value)}
                className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-blue-500"
              >
                {AUDIO_TYPES.map((a) => (
                  <option key={a} value={a}>
                    {a.replace(/_/g, ' ')}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-zinc-400 text-xs mb-2 block">Duration</label>
              <select
                value={duration}
                onChange={(e) => setDuration(Number(e.target.value))}
                className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-blue-500"
              >
                <option value={3600}>1 Hour</option>
                <option value={10800}>3 Hours</option>
                <option value={28800}>8 Hours</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-zinc-400 text-xs mb-2 block">Frequency</label>
            <div className="flex gap-2">
              {[1, 2, 3, 7, 14].map((days) => (
                <button
                  key={days}
                  onClick={() => setFrequencyDays(days)}
                  className={cn(
                    'flex-1 py-2 rounded-lg border text-sm font-medium transition-colors',
                    frequencyDays === days
                      ? 'border-blue-500 bg-blue-950/30 text-white'
                      : 'border-zinc-700 bg-zinc-800 text-zinc-400 hover:border-zinc-600',
                  )}
                >
                  {days === 1 ? 'Daily' : `${days}d`}
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              onClick={handleCreate}
              disabled={saving}
              className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
              Create Schedule
            </button>
            <button
              onClick={() => setShowForm(false)}
              className="px-4 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-sm font-medium rounded-lg transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Schedule List */}
      <div className="space-y-3">
        {loading ? (
          <div className="space-y-3">
            {[...Array(2)].map((_, i) => (
              <div key={i} className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 h-24 animate-pulse" />
            ))}
          </div>
        ) : schedules.length === 0 ? (
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-10 text-center">
            <Calendar className="w-8 h-8 text-zinc-600 mx-auto mb-3" />
            <p className="text-zinc-400 text-sm">No schedules yet</p>
            <p className="text-zinc-600 text-xs mt-1">Create one to automate your uploads</p>
          </div>
        ) : (
          schedules.map((s) => (
            <div
              key={s.id}
              className={cn(
                'bg-zinc-900 border rounded-xl p-5',
                s.enabled ? 'border-zinc-700' : 'border-zinc-800 opacity-60',
              )}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-2 flex-1 min-w-0">
                  <div className="flex items-center gap-3">
                    <h4 className="text-white font-semibold text-sm">{s.name}</h4>
                    <span
                      className={cn(
                        'text-xs px-2 py-0.5 rounded-full font-medium',
                        s.enabled
                          ? 'bg-green-950 text-green-400 border border-green-800'
                          : 'bg-zinc-800 text-zinc-500 border border-zinc-700',
                      )}
                    >
                      {s.enabled ? 'Active' : 'Paused'}
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-1.5">
                    {s.themes.map((t) => (
                      <span
                        key={t}
                        className="px-2 py-0.5 bg-zinc-800 text-zinc-300 text-xs rounded-md capitalize"
                      >
                        {t}
                      </span>
                    ))}
                  </div>

                  <div className="flex items-center gap-4 text-xs text-zinc-500">
                    <span>Every {s.frequencyDays === 1 ? 'day' : `${s.frequencyDays} days`}</span>
                    <span>{Math.round(s.duration / 3600)}h videos</span>
                    {s.nextRun && (
                      <span>Next: {new Date(s.nextRun).toLocaleDateString()}</span>
                    )}
                    {s.lastRun && (
                      <span>Last: {new Date(s.lastRun).toLocaleDateString()}</span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => toggleEnabled(s.id, s.enabled)}
                    className={cn(
                      'p-2 rounded-lg transition-colors',
                      s.enabled
                        ? 'text-green-400 bg-green-950/40 hover:bg-green-950'
                        : 'text-zinc-400 bg-zinc-800 hover:bg-zinc-700',
                    )}
                    title={s.enabled ? 'Pause schedule' : 'Enable schedule'}
                  >
                    {s.enabled ? <Power className="w-4 h-4" /> : <PowerOff className="w-4 h-4" />}
                  </button>
                  <button
                    onClick={() => deleteSchedule(s.id)}
                    className="p-2 rounded-lg text-zinc-500 hover:text-red-400 hover:bg-red-950/30 transition-colors"
                    title="Delete schedule"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
