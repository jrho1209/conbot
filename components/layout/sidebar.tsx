'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Video,
  Calendar,
  Library,
  Settings,
  Zap,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/create', label: 'Create Video', icon: Video },
  { href: '/schedule', label: 'Schedule', icon: Calendar },
  { href: '/videos', label: 'Video Library', icon: Library },
  { href: '/settings', label: 'Settings', icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed inset-y-0 left-0 w-64 bg-zinc-950 border-r border-zinc-800 flex flex-col z-10">
      {/* Logo */}
      <div className="flex items-center gap-3 px-6 py-5 border-b border-zinc-800">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center">
          <Zap className="w-4 h-4 text-white" />
        </div>
        <div>
          <span className="font-bold text-white text-sm">SleepBot</span>
          <p className="text-xs text-zinc-500">YouTube Automation</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                active
                  ? 'bg-zinc-800 text-white'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-800/60',
              )}
            >
              <Icon
                className={cn('w-4 h-4', active ? 'text-blue-400' : 'text-zinc-500')}
              />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-6 py-4 border-t border-zinc-800">
        <p className="text-xs text-zinc-600">v1.0.0 — Dark Mode</p>
      </div>
    </aside>
  );
}
