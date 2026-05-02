'use client';

import { useTheme, COLOR_THEMES } from '@/components/ThemeProvider';
import { Moon, Sun, Dumbbell, Trash2, ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function SettingsPage() {
  const { mode, colorTheme, toggleMode, setColorTheme } = useTheme();
  const router = useRouter();
  const [clearing, setClearing] = useState(false);

  const clearAllData = async () => {
    if (!confirm('Delete ALL data? This cannot be undone.')) return;
    if (!confirm('Are you absolutely sure?')) return;
    setClearing(true);
    const { deleteDB } = await import('idb');
    await deleteDB('progression-db');
    alert('All data cleared. The app will reload.');
    window.location.href = '/';
  };

  return (
    <div className="min-h-screen bg-page">
      <div className="flex items-center gap-3 px-4 pt-12 pb-4">
        <button onClick={() => router.back()} className="p-1 text-dim"><ArrowLeft size={22} /></button>
        <h1 className="text-xl font-bold text-heading">Settings</h1>
      </div>

      <div className="px-4 space-y-4">
        {/* App info */}
        <div className="flex items-center gap-3 bg-panel panel-glow rounded-2xl p-4">
          <div className="w-10 h-10 bg-brand rounded-xl flex items-center justify-center">
            <Dumbbell size={20} className="text-white" />
          </div>
          <div>
            <p className="font-black text-heading tracking-widest">PROGRESSION</p>
            <p className="text-xs text-dim">v1.0.0 · Offline-first workout tracker</p>
          </div>
        </div>

        {/* Theme picker */}
        <div className="bg-panel panel-glow rounded-2xl p-4">
          <p className="text-xs font-semibold text-dim uppercase tracking-widest mb-3">Visual Theme</p>
          <div className="grid grid-cols-3 gap-2">
            {COLOR_THEMES.map(t => (
              <button key={t.id} onClick={() => setColorTheme(t.id)}
                className={`relative flex flex-col items-center gap-2 py-3 px-2 rounded-xl border-2 transition-all ${
                  colorTheme === t.id ? 'border-brand' : 'border-edge'
                }`}>
                <div className="w-7 h-7 rounded-full shadow-lg" style={{ backgroundColor: t.accent }} />
                <span className={`text-xs font-bold tracking-widest ${colorTheme === t.id ? 'text-heading' : 'text-dim'}`}>
                  {t.label}
                </span>
                {colorTheme === t.id && (
                  <div className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-brand" />
                )}
              </button>
            ))}
          </div>
          <p className="text-xs text-dim mt-3">
            <span className="font-semibold text-heading">CARBON</span> — cold blue · <span className="font-semibold text-heading">EMBER</span> — hot orange · <span className="font-semibold text-heading">AURORA</span> — violet glow
          </p>
        </div>

        {/* Dark / Light toggle */}
        <div className="bg-panel panel-glow rounded-2xl px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {mode === 'dark' ? <Moon size={18} className="text-brand" /> : <Sun size={18} className="text-yellow-500" />}
            <div>
              <p className="text-sm font-medium text-heading">Dark Mode</p>
              <p className="text-xs text-dim">Currently {mode}</p>
            </div>
          </div>
          <button onClick={toggleMode}
            className={`w-12 h-6 rounded-full transition-colors relative ${mode === 'dark' ? 'bg-brand' : 'bg-edge'}`}>
            <div className={`w-5 h-5 rounded-full bg-white absolute top-0.5 transition-transform shadow ${
              mode === 'dark' ? 'translate-x-6' : 'translate-x-0.5'
            }`} />
          </button>
        </div>

        {/* Install hint */}
        <div className="bg-brand/10 border border-brand/20 rounded-2xl px-4 py-3">
          <p className="text-sm font-medium text-heading">Install on your phone</p>
          <p className="text-xs text-body mt-1">
            iOS Safari: Share → Add to Home Screen.{'\n'}
            Android Chrome: Menu → Add to Home Screen / Install App.
          </p>
        </div>

        {/* Storage info */}
        <div className="bg-panel panel-glow rounded-2xl px-4 py-3">
          <p className="text-sm font-medium text-heading mb-1">Data Storage</p>
          <p className="text-xs text-dim">
            All data is stored locally on your device. Works fully offline. Never sent to a server.
          </p>
        </div>

        {/* Danger zone */}
        <div className="bg-red-500/5 border border-red-500/20 rounded-2xl px-4 py-3">
          <p className="text-sm font-semibold text-red-500 mb-2">Danger Zone</p>
          <button onClick={clearAllData} disabled={clearing}
            className="flex items-center gap-2 text-sm text-red-500 font-medium disabled:opacity-50">
            <Trash2 size={15} />{clearing ? 'Clearing...' : 'Clear all data'}
          </button>
        </div>
      </div>
    </div>
  );
}
