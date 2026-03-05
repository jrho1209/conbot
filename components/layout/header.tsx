'use client';

import { usePathname } from 'next/navigation';

const titles: Record<string, { title: string; description: string }> = {
  '/dashboard': { title: 'Dashboard', description: 'Overview of your automation activity' },
  '/create': { title: 'Create Video', description: 'Generate and upload a new sleep video' },
  '/schedule': { title: 'Schedule', description: 'Automate recurring video uploads' },
  '/videos': { title: 'Video Library', description: 'All generated videos and their status' },
  '/settings': { title: 'Settings', description: 'Configure API keys and preferences' },
};

export function Header() {
  const pathname = usePathname();
  const info = Object.entries(titles).find(([key]) => pathname.startsWith(key))?.[1] || {
    title: 'SleepBot',
    description: 'YouTube Sleep Video Automation',
  };

  return (
    <header className="h-16 border-b border-zinc-800 flex items-center px-6 bg-zinc-950/80 backdrop-blur sticky top-0 z-10">
      <div>
        <h1 className="text-white font-semibold text-sm">{info.title}</h1>
        <p className="text-zinc-500 text-xs">{info.description}</p>
      </div>
    </header>
  );
}
