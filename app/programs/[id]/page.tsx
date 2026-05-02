'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, Play, Pencil } from 'lucide-react';
import { getProgram } from '@/lib/db';
import { Program } from '@/lib/types';
import { DEFAULT_EXERCISES } from '@/lib/exercises';
import { getCustomExercises } from '@/lib/db';
import { Exercise, MUSCLE_GROUP_LABELS } from '@/lib/types';
import Link from 'next/link';

export default function ProgramDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [program, setProgram] = useState<Program | null>(null);
  const [customExercises, setCustomExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getProgram(id), getCustomExercises()]).then(([p, c]) => {
      setProgram(p ?? null);
      setCustomExercises(c);
      setLoading(false);
    });
  }, [id]);

  const allExercises = [...DEFAULT_EXERCISES, ...customExercises];

  if (loading) {
    return (
      <div className="min-h-screen bg-white dark:bg-zinc-950 flex items-center justify-center">
        <p className="text-zinc-400">Loading...</p>
      </div>
    );
  }

  if (!program) {
    return (
      <div className="min-h-screen bg-white dark:bg-zinc-950 flex flex-col items-center justify-center gap-3">
        <p className="text-zinc-400">Program not found.</p>
        <button onClick={() => router.back()} className="text-blue-500 text-sm">
          Go back
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-zinc-950 pb-8">
      <div className="flex items-center gap-3 px-4 pt-12 pb-4">
        <button onClick={() => router.back()} className="p-1 text-zinc-500 dark:text-zinc-400">
          <ArrowLeft size={22} />
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-bold text-zinc-900 dark:text-white truncate">{program.name}</h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            {program.durationWeeks}w · {program.daysPerWeek}x/week
          </p>
        </div>
        <Link
          href={`/workout?programId=${program.id}`}
          className="flex items-center gap-1.5 bg-blue-500 text-white px-3 py-2 rounded-xl text-sm font-semibold"
        >
          <Play size={14} />
          Start
        </Link>
      </div>

      <div className="px-4 space-y-4">
        {program.days.map((day) => (
          <div key={day.id} className="bg-zinc-100 dark:bg-zinc-900 rounded-2xl p-4">
            <h2 className="font-semibold text-zinc-900 dark:text-white mb-3">{day.name}</h2>
            {day.exercises.length === 0 ? (
              <p className="text-xs text-zinc-400">No exercises configured.</p>
            ) : (
              <div className="space-y-2">
                {day.exercises.map((ex, idx) => {
                  const exercise = allExercises.find((e) => e.id === ex.exerciseId);
                  const nextEx = day.exercises[idx + 1];
                  const isSuperset =
                    ex.supersetGroupId && nextEx?.supersetGroupId === ex.supersetGroupId;

                  const warmupSets = ex.sets.filter((s) => s.type === 'warmup');
                  const workingSets = ex.sets.filter((s) => s.type === 'working');

                  return (
                    <div key={ex.id}>
                      {isSuperset && idx === day.exercises.findIndex(e => e.supersetGroupId === ex.supersetGroupId) && (
                        <span className="text-xs text-purple-500 font-semibold">SUPERSET</span>
                      )}
                      <div className={`bg-white dark:bg-zinc-800 rounded-xl p-3 ${isSuperset ? 'border-l-2 border-purple-500' : ''}`}>
                        <p className="font-medium text-sm text-zinc-900 dark:text-white">
                          {exercise?.name ?? <span className="text-zinc-400">No exercise selected</span>}
                        </p>
                        {exercise && (
                          <p className="text-xs text-zinc-400 dark:text-zinc-500">
                            {MUSCLE_GROUP_LABELS[exercise.muscleGroup]}
                          </p>
                        )}
                        <div className="flex gap-3 mt-1.5 text-xs text-zinc-500 dark:text-zinc-400">
                          {warmupSets.length > 0 && (
                            <span>{warmupSets.length} warm-up set{warmupSets.length !== 1 ? 's' : ''}</span>
                          )}
                          <span>
                            {workingSets.length} × {workingSets[0]?.targetReps ?? '?'} reps
                          </span>
                          <span>Rest: {ex.restSeconds < 60 ? `${ex.restSeconds}s` : `${ex.restSeconds / 60}m`}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
