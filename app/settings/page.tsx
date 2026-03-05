'use client';

import { useEffect, useState } from 'react';
import { Key, Save, Eye, EyeOff, CheckCircle, AlertCircle, Loader2, ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SettingField {
  key: string;
  label: string;
  placeholder: string;
  hint: string;
  docsUrl?: string;
}

const SETTING_FIELDS: SettingField[] = [
  {
    key: 'openai_api_key',
    label: 'OpenAI API Key',
    placeholder: 'sk-...',
    hint: 'Used for DALL-E image generation and GPT-4o-mini SEO metadata',
    docsUrl: 'https://platform.openai.com/api-keys',
  },
  {
    key: 'youtube_client_id',
    label: 'YouTube OAuth Client ID',
    placeholder: 'xxxx.apps.googleusercontent.com',
    hint: 'From Google Cloud Console → Credentials → OAuth 2.0 Client ID',
    docsUrl: 'https://console.cloud.google.com/apis/credentials',
  },
  {
    key: 'youtube_client_secret',
    label: 'YouTube OAuth Client Secret',
    placeholder: 'GOCSPX-...',
    hint: 'From Google Cloud Console → Credentials → OAuth 2.0 Client Secret',
  },
  {
    key: 'youtube_refresh_token',
    label: 'YouTube Refresh Token',
    placeholder: '1//...',
    hint: 'Generate via OAuth flow. See README for instructions.',
  },
  {
    key: 'replicate_api_key',
    label: 'Replicate API Key (Optional)',
    placeholder: 'r8_...',
    hint: 'For future image models via Replicate (optional)',
    docsUrl: 'https://replicate.com/account/api-tokens',
  },
];

export default function SettingsPage() {
  const [values, setValues] = useState<Record<string, string>>({});
  const [masked, setMasked] = useState<Record<string, string>>({});
  const [showKeys, setShowKeys] = useState<Record<string, boolean>>({});
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/settings');
        const data = await res.json();
        setMasked(data.settings || {});
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  function handleChange(key: string, value: string) {
    setValues((prev) => ({ ...prev, [key]: value }));
    setSaved(false);
  }

  function toggleShow(key: string) {
    setShowKeys((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  async function handleSave() {
    const payload: Record<string, string> = {};
    for (const [k, v] of Object.entries(values)) {
      if (v.trim()) payload[k] = v.trim();
    }

    if (Object.keys(payload).length === 0) {
      setError('No changes to save');
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error('Failed to save');
      setSaved(true);
      setValues({});
      // Reload masked values
      const fresh = await fetch('/api/settings');
      const data = await fresh.json();
      setMasked(data.settings || {});
    } catch {
      setError('Failed to save settings');
    } finally {
      setSaving(false);
    }
  }

  const hasChanges = Object.values(values).some((v) => v.trim());

  return (
    <div className="max-w-2xl space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-white">Settings</h2>
        <p className="text-zinc-400 text-sm mt-1">
          API keys are encrypted with AES-256-GCM before storage
        </p>
      </div>

      {/* Info Banner */}
      <div className="bg-blue-950/30 border border-blue-800/50 rounded-xl p-4 flex items-start gap-3">
        <Key className="w-4 h-4 text-blue-400 mt-0.5 shrink-0" />
        <p className="text-blue-300 text-sm">
          All keys are encrypted at rest using AES-256-GCM. Only enter non-empty values to update a key.
          Existing keys are shown masked.
        </p>
      </div>

      {/* Settings Fields */}
      <div className="space-y-4">
        {loading ? (
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 h-24 animate-pulse" />
            ))}
          </div>
        ) : (
          SETTING_FIELDS.map((field) => {
            const existingMasked = masked[field.key];
            const currentValue = values[field.key] ?? '';
            const isVisible = showKeys[field.key];

            return (
              <div key={field.key} className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-white text-sm font-medium">{field.label}</label>
                    {field.docsUrl && (
                      <a
                        href={field.docsUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="ml-2 text-xs text-blue-400 hover:underline inline-flex items-center gap-1"
                      >
                        Docs <ExternalLink className="w-2.5 h-2.5" />
                      </a>
                    )}
                  </div>
                  {existingMasked && (
                    <span className="text-xs px-2 py-0.5 bg-green-950 text-green-400 border border-green-800 rounded-full">
                      Saved
                    </span>
                  )}
                </div>
                <p className="text-zinc-500 text-xs">{field.hint}</p>

                {/* Show existing masked value */}
                {existingMasked && !currentValue && (
                  <div className="flex items-center gap-2 px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg">
                    <span className="text-zinc-400 text-sm font-mono flex-1">
                      {existingMasked}
                    </span>
                    <span className="text-zinc-600 text-xs">current</span>
                  </div>
                )}

                {/* Input for new value */}
                <div className="relative">
                  <input
                    type={isVisible ? 'text' : 'password'}
                    value={currentValue}
                    onChange={(e) => handleChange(field.key, e.target.value)}
                    placeholder={existingMasked ? 'Enter new value to update...' : field.placeholder}
                    className="w-full bg-zinc-800 border border-zinc-700 text-white placeholder-zinc-600 rounded-lg px-4 py-2.5 pr-10 text-sm font-mono focus:outline-none focus:border-blue-500 transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => toggleShow(field.key)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300"
                  >
                    {isVisible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Save */}
      {error && (
        <div className="flex items-center gap-2 text-red-400 text-sm bg-red-950/30 border border-red-800 rounded-lg px-4 py-3">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {error}
        </div>
      )}

      {saved && (
        <div className="flex items-center gap-2 text-green-400 text-sm bg-green-950/30 border border-green-800 rounded-lg px-4 py-3">
          <CheckCircle className="w-4 h-4 shrink-0" />
          Settings saved successfully
        </div>
      )}

      <button
        onClick={handleSave}
        disabled={saving || !hasChanges}
        className={cn(
          'flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all',
          saving || !hasChanges
            ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
            : 'bg-blue-600 hover:bg-blue-500 text-white',
        )}
      >
        {saving ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <Save className="w-4 h-4" />
        )}
        Save Settings
      </button>

      {/* YouTube OAuth Guide */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 space-y-3">
        <h3 className="text-white font-semibold text-sm">Getting a YouTube Refresh Token</h3>
        <ol className="space-y-2 text-zinc-400 text-sm list-decimal list-inside">
          <li>Go to Google Cloud Console and enable the YouTube Data API v3</li>
          <li>Create OAuth 2.0 credentials (type: Desktop App)</li>
          <li>
            Download the credentials JSON and run:{' '}
            <code className="bg-zinc-800 px-2 py-0.5 rounded text-zinc-300 text-xs">
              npx ts-node scripts/get-youtube-token.ts
            </code>
          </li>
          <li>Authorize in your browser, paste the code, and copy the refresh token here</li>
        </ol>
      </div>
    </div>
  );
}
