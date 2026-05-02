'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { getWorkout, deleteWorkout, getCustomExercises } from '@/lib/db';
import { WorkoutLog, Exercise } from '@/lib/types';
import { DEFAULT_EXERCISES } from '@/lib/exercises';
import { estimateOneRepMax, formatDuration } from '@/lib/utils';

export default function WorkoutDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [workout, setWorkout] = useState<WorkoutLog | null>(null);
  const [customExercises, setCustomExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getWorkout(id), getCustomExercises()]).then(([w, c]) => {
      setWorkout(w ?? null);
      setCustomExercises(c);
      setLoading(false);
    });
  }, [id]);

  const allExercises = [...DEFAULT_EXERCISES, ...customExercises];

  const handleDelete = async () => {
    if (!confirm('Delete this workout?')) return;
    await deleteWorkout(id);
    router.back();
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center"><p className="text-zinc-400">Loading...</p></div>;
  }

  if (!workout) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-3">
        <p className="text-zinc-400">Workout not found.</p>
        <button onClick={() => router.back()} className="text-blue-500 text-sm">Go back</button>
      </div>
    );
  }

  const duration = workout.endTime ? formatDuration(workout.startTime, workout.endTime) : null;
  const totalSets = workout.exercises.reduce((t, e) => t + e.sets.filter((s) => s.type === 'working' && s.completed).length, 0);
  const totalVolume = workout.exercises.reduce(
    (t, e) => t + e.sets.filter((s) => s.type === 'working' && s.completed).reduce((et, s) => et + s.weight * s.reps, 0), 0
  );

  return (
    <div className="min-h-screen bg-white dark:bg-zinc-950 pb-8">
      <div className="flex items-center gap-3 px-4 pt-12 pb-4">
        <button onClick={() => router.back()} className="p-1 text-zinc-500 dark:text-zinc-400">
          <ArrowLeft size={22} />
        </button>
        <div className="flex-1">
          <h1 className="text-xl font-bold text-zinc-900 dark:text-white">
            {format(new Date(workout.date + 'T12:00:00'), 'EEEE, MMMM d')}
          </h1>
          {duration && <p className="text-xs text-zinc-500 dark:text-zinc-400">{duration}</p>}
        </div>
        <button onClick={handleDelete} className="p-2 text-zinc-400 hover:text-red-500">
          <Trash2 size={18} />
        </button>
      </div>

      <div className="px-4 space-y-4">
        {/* Summary */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-zinc-100 dark:bg-zinc-900 rounded-xl p-3 text-center">
            <p className="text-lg font-bold text-blue-500">{workout.exercises.length}</p>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">Exercises</p>
          </div>
          <div className="bg-zinc-100 dark:bg-zinc-900 rounded-xl p-3 text-center">
            <p className="text-lg font-bold text-green-500">{totalSets}</p>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">Working Sets</p>
          </div>
          <div className="bg-zinc-100 dark:bg-zinc-900 rounded-xl p-3 text-center">
            <p className="text-lg font-bold text-purple-500">
              {totalVolume >= 1000 ? `${(totalVolume / 1000).toFixed(1)}k` : totalVolume.toLocaleString()}
            </p>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">lbs Volume</p>
          </div>
        </div>

        {/* Exercises */}
        {workout.exercises.map((ex) => {
          const exercise = allExercises.find((e) => e.id === ex.exerciseId);
          const workingSets = ex.sets.filter((s) => s.type === 'working' && s.completed);
          const bestSet = workingSets.length > 0
            ? workingSets.reduce((best, s) => estimateOneRepMax(s.weight, s.reps) > estimateOneRepMax(best.weight, best.reps) ? s : best)
            : null;

          return (
            <div key={ex.id} className="bg-zinc-100 dark:bg-zinc-900 rounded-2xl p-4">
              <p className="font-semibold text-zinc-900 dark:text-white mb-2">{exercise?.name ?? 'Unknown'}</p>
              {bestSet && (
                <p className="text-xs text-yellow-600 dark:text-yellow-400 mb-2">
                  Best: {bestSet.weight} lbs × {bestSet.reps} reps = {estimateOneRepMax(bestSet.weight, bestSet.reps)} lbs est. 1RM
                </p>
              )}
              <div className="space-y-1">
                <div className="grid grid-cols-4 gap-2 text-xs text-zinc-400 dark:text-zinc-500 px-1 mb-1">
                  <span>Type</span>
                  <span className="text-center">Weight</span>
                  <span className="text-center">Reps</span>
                  <span className="text-center">Done</span>
                </div>
                {ex.sets.map((s, i) => (
                  <div key={s.id} className="grid grid-cols-4 gap-2 items-center">
                    <span className={`text-xs rounded px-1.5 py-0.5 text-center font-medium ${
                      s.type === 'warmup' ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400' : 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'
                    }`}>
                      {s.type === 'warmup' ? 'W' : `S${i + 1}`}
                    </span>
                    <span className="text-sm text-zinc-800 dark:text-zinc-200 text-center">{s.weight || '—'}</span>
                    <span className="text-sm text-zinc-800 dark:text-zinc-200 text-center">{s.reps || '—'}</span>
                    <span className={`text-center text-xs ${s.completed ? 'text-green-500' : 'text-zinc-400'}`}>
                      {s.completed ? '✓' : '✗'}
                    </span>
                  </div>
                ))}
              </div>
              {ex.notes && <p className="text-xs text-zinc-400 mt-2 italic">{ex.notes}</p>}
            </div>
          );
        })}

        {workout.notes && (
          <div className="bg-zinc-100 dark:bg-zinc-900 rounded-xl p-4">
            <p className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide mb-1">Notes</p>
            <p className="text-sm text-zinc-700 dark:text-zinc-300">{workout.notes}</p>
          </div>
        )}
      </div>
    </div>
  );
}
