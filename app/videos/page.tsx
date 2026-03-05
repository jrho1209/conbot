'use client';

import { useEffect, useState, useCallback } from 'react';
import Image from 'next/image';
import {
  Video,
  ExternalLink,
  Trash2,
  Eye,
  ThumbsUp,
  RefreshCw,
  Filter,
} from 'lucide-react';
import { StatusBadge } from '@/components/ui/badge';
import { formatDuration, formatNumber } from '@/lib/utils';
import { cn } from '@/lib/utils';

interface VideoRow {
  id: string;
  theme: string;
  status: string;
  imageUrl: string | null;
  audioType: string;
  duration: number;
  youtubeId: string | null;
  title: string | null;
  tags: string[] | null;
  createdAt: string;
}

interface YouTubeStats {
  viewCount: string;
  likeCount: string;
}

const STATUS_FILTERS = ['all', 'uploaded', 'generating', 'ready', 'error'];

export default function VideosPage() {
  const [videos, setVideos] = useState<VideoRow[]>([]);
  const [stats, setStats] = useState<Record<string, YouTubeStats>>({});
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchVideos = useCallback(async () => {
    try {
      const url =
        statusFilter === 'all'
          ? '/api/videos'
          : `/api/videos?status=${statusFilter}`;
      const res = await fetch(url);
      const data = await res.json();
      setVideos(data.videos || []);

      // Fetch YouTube stats for uploaded videos
      const uploadedIds = (data.videos || [])
        .filter((v: VideoRow) => v.youtubeId)
        .map((v: VideoRow) => v.youtubeId!)
        .join(',');

      if (uploadedIds) {
        const statsRes = await fetch(`/api/youtube/stats?ids=${uploadedIds}`);
        const statsData = await statsRes.json();
        setStats(statsData.stats || {});
      }
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    fetchVideos();
  }, [fetchVideos]);

  async function deleteVideo(id: string) {
    setDeletingId(id);
    try {
      await fetch('/api/videos', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      setVideos((prev) => prev.filter((v) => v.id !== id));
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Video Library</h2>
          <p className="text-zinc-400 text-sm mt-1">
            {videos.length} video{videos.length !== 1 ? 's' : ''}
          </p>
        </div>
        <button
          onClick={() => { setLoading(true); fetchVideos(); }}
          className="flex items-center gap-2 px-3 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-sm rounded-lg transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      {/* Status Filter */}
      <div className="flex items-center gap-2 flex-wrap">
        <Filter className="w-4 h-4 text-zinc-500" />
        {STATUS_FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => { setStatusFilter(f); setLoading(true); }}
            className={cn(
              'px-3 py-1.5 rounded-lg border text-xs font-medium capitalize transition-colors',
              statusFilter === f
                ? 'border-blue-500 bg-blue-950/30 text-white'
                : 'border-zinc-700 bg-zinc-800/60 text-zinc-400 hover:border-zinc-600',
            )}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden animate-pulse">
              <div className="h-40 bg-zinc-800" />
              <div className="p-4 space-y-2">
                <div className="h-3 bg-zinc-800 rounded w-3/4" />
                <div className="h-2 bg-zinc-800 rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : videos.length === 0 ? (
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-16 text-center">
          <Video className="w-10 h-10 text-zinc-600 mx-auto mb-3" />
          <p className="text-zinc-400 text-sm">No videos found</p>
          <p className="text-zinc-600 text-xs mt-1">
            {statusFilter !== 'all'
              ? `No ${statusFilter} videos`
              : 'Create your first video from the /create page'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {videos.map((video) => {
            const ytStats = video.youtubeId ? stats[video.youtubeId] : null;

            return (
              <div
                key={video.id}
                className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden flex flex-col hover:border-zinc-700 transition-colors"
              >
                {/* Thumbnail */}
                <div className="relative h-40 bg-zinc-800 flex items-center justify-center overflow-hidden">
                  {video.imageUrl ? (
                    <Image
                      src={video.imageUrl}
                      alt={video.title || video.theme}
                      fill
                      className="object-cover"
                      unoptimized
                    />
                  ) : (
                    <Video className="w-8 h-8 text-zinc-600" />
                  )}
                  <div className="absolute top-2 right-2">
                    <StatusBadge status={video.status} />
                  </div>
                </div>

                {/* Info */}
                <div className="p-4 flex-1 flex flex-col gap-3">
                  <div>
                    <p className="text-white text-sm font-medium line-clamp-2">
                      {video.title || `${video.theme} — ${formatDuration(video.duration)}`}
                    </p>
                    <p className="text-zinc-500 text-xs mt-1 capitalize">
                      {video.theme} · {video.audioType.replace(/_/g, ' ')} · {formatDuration(video.duration)}
                    </p>
                  </div>

                  {/* Tags */}
                  {video.tags && video.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {video.tags.slice(0, 3).map((tag) => (
                        <span
                          key={tag}
                          className="px-1.5 py-0.5 bg-zinc-800 text-zinc-400 text-xs rounded"
                        >
                          {tag}
                        </span>
                      ))}
                      {video.tags.length > 3 && (
                        <span className="text-zinc-600 text-xs">+{video.tags.length - 3}</span>
                      )}
                    </div>
                  )}

                  {/* YouTube Stats */}
                  {ytStats && (
                    <div className="flex items-center gap-4 text-xs text-zinc-400">
                      <span className="flex items-center gap-1">
                        <Eye className="w-3 h-3" />
                        {formatNumber(ytStats.viewCount)}
                      </span>
                      <span className="flex items-center gap-1">
                        <ThumbsUp className="w-3 h-3" />
                        {formatNumber(ytStats.likeCount)}
                      </span>
                    </div>
                  )}

                  {/* Footer */}
                  <div className="flex items-center justify-between mt-auto pt-2 border-t border-zinc-800">
                    <span className="text-zinc-600 text-xs">
                      {new Date(video.createdAt).toLocaleDateString()}
                    </span>
                    <div className="flex items-center gap-1">
                      {video.youtubeId && (
                        <a
                          href={`https://youtube.com/watch?v=${video.youtubeId}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1.5 rounded-md text-zinc-500 hover:text-blue-400 hover:bg-blue-950/30 transition-colors"
                          title="View on YouTube"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      )}
                      <button
                        onClick={() => deleteVideo(video.id)}
                        disabled={deletingId === video.id}
                        className="p-1.5 rounded-md text-zinc-500 hover:text-red-400 hover:bg-red-950/30 transition-colors disabled:opacity-50"
                        title="Delete video"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
