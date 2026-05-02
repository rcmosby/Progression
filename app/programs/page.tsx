'use client';

import { useEffect, useState } from 'react';
import { Plus, ChevronRight, Trash2, Calendar } from 'lucide-react';
import Link from 'next/link';
import { getPrograms, deleteProgram } from '@/lib/db';
import { Program } from '@/lib/types';
import { format } from 'date-fns';

export default function ProgramsPage() {
  const [programs, setPrograms] = useState<Program[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getPrograms().then((p) => {
      setPrograms(p.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)));
      setLoading(false);
    });
  }, []);

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete "${name}"? This cannot be undone.`)) return;
    await deleteProgram(id);
    setPrograms((prev) => prev.filter((p) => p.id !== id));
  };

  return (
    <div className="min-h-screen bg-white dark:bg-zinc-950">
      <div className="flex items-center justify-between px-4 pt-12 pb-4">
        <h1 className="text-xl font-bold text-zinc-900 dark:text-white">Programs</h1>
        <Link
          href="/programs/new"
          className="flex items-center gap-1.5 bg-blue-500 text-white px-3 py-2 rounded-xl text-sm font-semibold"
        >
          <Plus size={16} />
          New
        </Link>
      </div>

      <div className="px-4">
        {loading ? (
          <div className="text-zinc-400 text-sm text-center py-12">Loading...</div>
        ) : programs.length === 0 ? (
          <div className="text-center py-16 text-zinc-400 dark:text-zinc-600">
            <Calendar size={40} className="mx-auto mb-3 opacity-40" />
            <p className="text-sm font-medium">No programs yet.</p>
            <p className="text-xs mt-1">Tap New to create your first program.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {programs.map((program) => (
              <div
                key={program.id}
                className="bg-zinc-100 dark:bg-zinc-900 rounded-2xl p-4 flex items-center justify-between"
              >
                <Link href={`/programs/${program.id}`} className="flex-1 min-w-0">
                  <p className="font-semibold text-zinc-900 dark:text-white truncate">{program.name}</p>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                    {program.durationWeeks} week{program.durationWeeks !== 1 ? 's' : ''} ·{' '}
                    {program.daysPerWeek} day{program.daysPerWeek !== 1 ? 's' : ''}/week ·{' '}
                    {program.days.length} day{program.days.length !== 1 ? 's' : ''} configured
                  </p>
                  <p className="text-xs text-zinc-400 dark:text-zinc-600 mt-0.5">
                    Updated {format(new Date(program.updatedAt), 'MMM d, yyyy')}
                  </p>
                </Link>
                <div className="flex items-center gap-1 ml-2">
                  <Link
                    href={`/programs/${program.id}`}
                    className="p-2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
                  >
                    <ChevronRight size={18} />
                  </Link>
                  <button
                    onClick={() => handleDelete(program.id, program.name)}
                    className="p-2 text-zinc-400 hover:text-red-500"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
