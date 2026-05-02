'use client';

import { useTheme } from '@/components/ThemeProvider';
import { Moon, Sun, Dumbbell, Trash2, ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function SettingsPage() {
  const { theme, toggle } = useTheme();
  const router = useRouter();
  const [clearing, setClearing] = useState(false);

  const clearAllData = async () => {
    if (!confirm('Delete ALL data? This cannot be undone. Programs, workouts, and body metrics will be permanently deleted.')) return;
    if (!confirm('Are you absolutely sure? This will wipe everything.')) return;
    setClearing(true);
    const { deleteDB } = await import('idb');
    await deleteDB('progression-db');
    alert('All data cleared. The app will reload.');
    window.location.href = '/';
  };

  return (
    <div className="min-h-screen bg-white dark:bg-zinc-950">
      <div className="flex items-center gap-3 px-4 pt-12 pb-4">
        <button onClick={() => router.back()} className="p-1 text-zinc-500 dark:text-zinc-400">
          <ArrowLeft size={22} />
        </button>
        <h1 className="text-xl font-bold text-zinc-900 dark:text-white">Settings</h1>
      </div>

      <div className="px-4 space-y-3">
        {/* App info */}
        <div className="flex items-center gap-3 bg-zinc-100 dark:bg-zinc-900 rounded-2xl p-4">
          <div className="w-10 h-10 bg-blue-500 rounded-xl flex items-center justify-center">
            <Dumbbell size={20} className="text-white" />
          </div>
          <div>
            <p className="font-bold text-zinc-900 dark:text-white tracking-widest">PROGRESSION</p>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">v1.0.0 · Offline-first workout tracker</p>
          </div>
        </div>

        {/* Dark Mode */}
        <div className="bg-zinc-100 dark:bg-zinc-900 rounded-2xl px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {theme === 'dark' ? <Moon size={18} className="text-blue-400" /> : <Sun size={18} className="text-yellow-500" />}
            <div>
              <p className="text-sm font-medium text-zinc-900 dark:text-white">Dark Mode</p>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">Currently {theme}</p>
            </div>
          </div>
          <button
            onClick={toggle}
            className={`w-12 h-6 rounded-full transition-colors relative ${
              theme === 'dark' ? 'bg-blue-500' : 'bg-zinc-300'
            }`}
          >
            <div
              className={`w-5 h-5 rounded-full bg-white absolute top-0.5 transition-transform ${
                theme === 'dark' ? 'translate-x-6' : 'translate-x-0.5'
              }`}
            />
          </button>
        </div>

        {/* Install PWA hint */}
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-2xl px-4 py-3">
          <p className="text-sm font-medium text-blue-800 dark:text-blue-300">Install on your phone</p>
          <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
            On iOS: tap the Share button in Safari, then "Add to Home Screen".{'\n'}
            On Android: tap the menu in Chrome, then "Add to Home Screen" or "Install App".
          </p>
        </div>

        {/* Data */}
        <div className="bg-zinc-100 dark:bg-zinc-900 rounded-2xl px-4 py-3">
          <p className="text-sm font-medium text-zinc-900 dark:text-white mb-1">Data Storage</p>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            All data is stored locally on your device. It works fully offline and is never sent to a server.
            If you clear your browser data, your workout history will be lost.
          </p>
        </div>

        {/* Danger zone */}
        <div className="bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800 rounded-2xl px-4 py-3">
          <p className="text-sm font-semibold text-red-600 dark:text-red-400 mb-2">Danger Zone</p>
          <button
            onClick={clearAllData}
            disabled={clearing}
            className="flex items-center gap-2 text-sm text-red-600 dark:text-red-400 font-medium disabled:opacity-50"
          >
            <Trash2 size={15} />
            {clearing ? 'Clearing...' : 'Clear all data'}
          </button>
        </div>
      </div>
    </div>
  );
}
