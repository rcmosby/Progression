'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, Play } from 'lucide-react';
import { getProgram, getCustomExercises } from '@/lib/db';
import { Program, Exercise, MUSCLE_GROUP_LABELS } from '@/lib/types';
import { DEFAULT_EXERCISES } from '@/lib/exercises';
import Link from 'next/link';

export default function ProgramDetailPage() {
  const router = useRouter();
  const { id } = useParams() as { id: string };
  const [program, setProgram] = useState<Program | null>(null);
  const [customExercises, setCustomExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getProgram(id), getCustomExercises()]).then(([p, c]) => {
      setProgram(p ?? null); setCustomExercises(c); setLoading(false);
    });
  }, [id]);

  const allExercises = [...DEFAULT_EXERCISES, ...customExercises];

  if (loading) return <div className="min-h-screen bg-page flex items-center justify-center"><p className="text-dim">Loading...</p></div>;
  if (!program) return (
    <div className="min-h-screen bg-page flex flex-col items-center justify-center gap-3">
      <p className="text-dim">Program not found.</p>
      <button onClick={() => router.back()} className="text-brand text-sm">Go back</button>
    </div>
  );

  return (
    <div className="min-h-screen bg-page pb-8">
      <div className="flex items-center gap-3 px-4 pt-12 pb-4">
        <button onClick={() => router.back()} className="p-1 text-dim"><ArrowLeft size={22} /></button>
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-bold text-heading truncate">{program.name}</h1>
          <p className="text-xs text-dim">{program.durationWeeks}w · {program.daysPerWeek}x/week</p>
        </div>
        <Link href={`/workout?programId=${program.id}`}
          className="flex items-center gap-1.5 bg-brand text-white px-3 py-2 rounded-xl text-sm font-semibold">
          <Play size={14} /> Start
        </Link>
      </div>

      <div className="px-4 space-y-4">
        {program.days.map((day) => (
          <div key={day.id} className="bg-panel panel-glow rounded-2xl p-4">
            <h2 className="font-semibold text-heading mb-3">{day.name}</h2>
            {day.exercises.length === 0 ? (
              <p className="text-xs text-dim">No exercises configured.</p>
            ) : (
              <div className="space-y-2">
                {day.exercises.map((ex, idx) => {
                  const exercise = allExercises.find(e => e.id === ex.exerciseId);
                  const nextEx = day.exercises[idx + 1];
                  const isSuperset = ex.supersetGroupId && nextEx?.supersetGroupId === ex.supersetGroupId;
                  const warmupSets = ex.sets.filter(s => s.type === 'warmup');
                  const workingSets = ex.sets.filter(s => s.type === 'working');
                  return (
                    <div key={ex.id}>
                      <div className={`bg-raised rounded-xl p-3 ${isSuperset ? 'border-l-2 border-brand' : ''}`}>
                        <p className="font-medium text-sm text-heading">
                          {exercise?.name ?? <span className="text-dim">No exercise selected</span>}
                        </p>
                        {exercise && <p className="text-xs text-dim">{MUSCLE_GROUP_LABELS[exercise.muscleGroup]}</p>}
                        <div className="flex gap-3 mt-1.5 text-xs text-dim">
                          {warmupSets.length > 0 && <span>{warmupSets.length} warm-up</span>}
                          <span>{workingSets.length} × {workingSets[0]?.targetReps ?? '?'} reps</span>
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
