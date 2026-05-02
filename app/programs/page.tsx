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
    if (!confirm(`Delete "${name}"?`)) return;
    await deleteProgram(id);
    setPrograms((prev) => prev.filter((p) => p.id !== id));
  };

  return (
    <div className="min-h-screen bg-page">
      <div className="flex items-center justify-between px-4 pt-12 pb-4">
        <h1 className="text-xl font-bold text-heading">Programs</h1>
        <Link href="/programs/new"
          className="flex items-center gap-1.5 bg-brand text-white px-3 py-2 rounded-xl text-sm font-semibold">
          <Plus size={16} /> New
        </Link>
      </div>

      <div className="px-4">
        {loading ? (
          <div className="text-dim text-sm text-center py-12">Loading...</div>
        ) : programs.length === 0 ? (
          <div className="text-center py-16 text-dim">
            <Calendar size={40} className="mx-auto mb-3 opacity-40" />
            <p className="text-sm font-medium">No programs yet.</p>
            <p className="text-xs mt-1">Tap New to create your first program.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {programs.map((program) => (
              <div key={program.id} className="bg-panel panel-glow rounded-2xl p-4 flex items-center justify-between">
                <Link href={`/programs/${program.id}`} className="flex-1 min-w-0">
                  <p className="font-semibold text-heading truncate">{program.name}</p>
                  <p className="text-xs text-dim mt-0.5">
                    {program.durationWeeks}w · {program.daysPerWeek}x/week · {program.days.length} day{program.days.length !== 1 ? 's' : ''} configured
                  </p>
                  <p className="text-xs text-dim mt-0.5">
                    Updated {format(new Date(program.updatedAt), 'MMM d, yyyy')}
                  </p>
                </Link>
                <div className="flex items-center gap-1 ml-2">
                  <Link href={`/programs/${program.id}`} className="p-2 text-dim hover:text-body">
                    <ChevronRight size={18} />
                  </Link>
                  <button onClick={() => handleDelete(program.id, program.name)} className="p-2 text-dim hover:text-red-500">
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
