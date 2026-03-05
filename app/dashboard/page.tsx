'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Video, Upload, Clock, Plus, ChevronRight, Loader2 } from 'lucide-react';
import { StatusBadge } from '@/components/ui/badge';
import { formatDuration } from '@/lib/utils';

interface Stats {
  total: number;
  uploaded: number;
  generating: number;
}

interface RecentJob {
  id: string;
  videoId: string;
  step: string;
  status: string;
  progress: number;
  createdAt: string;
}

interface RecentVideo {
  id: string;
  theme: string;
  status: string;
  duration: number;
  title: string | null;
  createdAt: string;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [recentJobs, setRecentJobs] = useState<RecentJob[]>([]);
  const [recentVideos, setRecentVideos] = useState<RecentVideo[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      try {
        const res = await fetch('/api/dashboard/stats');
        const data = await res.json();
        setStats(data.stats);
        setRecentJobs(data.recentJobs || []);
        setRecentVideos(data.recentVideos || []);
      } catch {
        // silently fail
      } finally {
        setLoading(false);
      }
    }
    fetchStats();
    const interval = setInterval(fetchStats, 10000);
    return () => clearInterval(interval);
  }, []);

  const statCards = [
    {
      label: 'Total Videos',
      value: stats?.total ?? 0,
      icon: Video,
      color: 'text-blue-400',
      bg: 'bg-blue-950/40',
    },
    {
      label: 'Uploaded',
      value: stats?.uploaded ?? 0,
      icon: Upload,
      color: 'text-green-400',
      bg: 'bg-green-950/40',
    },
    {
      label: 'Generating',
      value: stats?.generating ?? 0,
      icon: Loader2,
      color: 'text-purple-400',
      bg: 'bg-purple-950/40',
    },
  ];

  return (
    <div className="space-y-8">
      {/* Hero CTA */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Overview</h2>
          <p className="text-zinc-400 text-sm mt-1">Your YouTube automation at a glance</p>
        </div>
        <Link
          href="/create"
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-lg transition-colors"
        >
          <Plus className="w-4 h-4" />
          New Video
        </Link>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {statCards.map(({ label, value, icon: Icon, color, bg }) => (
          <div
            key={label}
            className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 flex items-center gap-4"
          >
            <div className={`w-10 h-10 rounded-lg ${bg} flex items-center justify-center`}>
              <Icon className={`w-5 h-5 ${color}`} />
            </div>
            <div>
              <p className="text-zinc-400 text-xs">{label}</p>
              <p className="text-white text-2xl font-bold">
                {loading ? (
                  <span className="inline-block w-8 h-6 bg-zinc-800 rounded animate-pulse" />
                ) : (
                  value
                )}
              </p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Videos */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800">
            <h3 className="text-white font-semibold text-sm">Recent Videos</h3>
            <Link
              href="/videos"
              className="text-xs text-zinc-400 hover:text-white flex items-center gap-1 transition-colors"
            >
              View all <ChevronRight className="w-3 h-3" />
            </Link>
          </div>
          {loading ? (
            <div className="divide-y divide-zinc-800">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="px-5 py-3 flex items-center gap-3">
                  <div className="w-10 h-10 bg-zinc-800 rounded animate-pulse" />
                  <div className="flex-1 space-y-1.5">
                    <div className="h-3 bg-zinc-800 rounded animate-pulse w-3/4" />
                    <div className="h-2 bg-zinc-800 rounded animate-pulse w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : recentVideos.length === 0 ? (
            <div className="px-5 py-10 text-center text-zinc-500 text-sm">
              No videos yet.{' '}
              <Link href="/create" className="text-blue-400 hover:underline">
                Create your first one
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-zinc-800">
              {recentVideos.map((v) => (
                <div key={v.id} className="px-5 py-3 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-zinc-800 flex items-center justify-center text-zinc-400">
                    <Video className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm truncate">
                      {v.title || `${v.theme} — ${formatDuration(v.duration)}`}
                    </p>
                    <p className="text-zinc-500 text-xs">
                      {new Date(v.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <StatusBadge status={v.status} />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Job Activity */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800">
            <h3 className="text-white font-semibold text-sm">Job Activity</h3>
            <Clock className="w-4 h-4 text-zinc-500" />
          </div>
          {loading ? (
            <div className="divide-y divide-zinc-800">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="px-5 py-3 flex items-center gap-3">
                  <div className="flex-1 space-y-1.5">
                    <div className="h-3 bg-zinc-800 rounded animate-pulse w-2/3" />
                    <div className="h-2 bg-zinc-800 rounded animate-pulse w-1/3" />
                  </div>
                </div>
              ))}
            </div>
          ) : recentJobs.length === 0 ? (
            <div className="px-5 py-10 text-center text-zinc-500 text-sm">
              No job activity yet
            </div>
          ) : (
            <div className="divide-y divide-zinc-800">
              {recentJobs.map((job) => (
                <div key={job.id} className="px-5 py-3 flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm">
                      {job.step.replace(/_/g, ' ')}
                    </p>
                    <p className="text-zinc-500 text-xs">
                      {new Date(job.createdAt).toLocaleTimeString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="text-xs text-zinc-400">{job.progress}%</div>
                    <StatusBadge status={job.status} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
