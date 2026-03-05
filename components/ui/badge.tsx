import { cn } from '@/lib/utils';

type BadgeVariant = 'pending' | 'generating' | 'ready' | 'uploading' | 'uploaded' | 'error' | 'running' | 'done';

const variantStyles: Record<BadgeVariant, string> = {
  pending: 'bg-zinc-800 text-zinc-400 border-zinc-700',
  generating: 'bg-blue-950 text-blue-400 border-blue-800 animate-pulse',
  running: 'bg-blue-950 text-blue-400 border-blue-800 animate-pulse',
  ready: 'bg-emerald-950 text-emerald-400 border-emerald-800',
  done: 'bg-emerald-950 text-emerald-400 border-emerald-800',
  uploading: 'bg-purple-950 text-purple-400 border-purple-800 animate-pulse',
  uploaded: 'bg-green-950 text-green-400 border-green-700',
  error: 'bg-red-950 text-red-400 border-red-800',
};

interface BadgeProps {
  status: string;
  className?: string;
}

export function StatusBadge({ status, className }: BadgeProps) {
  const variant = (status as BadgeVariant) in variantStyles ? (status as BadgeVariant) : 'pending';
  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border',
        variantStyles[variant],
        className,
      )}
    >
      {status}
    </span>
  );
}
