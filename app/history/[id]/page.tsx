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
  const { id } = useParams() as { id: string };
  const [workout, setWorkout] = useState<WorkoutLog | null>(null);
  const [customExercises, setCustomExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getWorkout(id), getCustomExercises()]).then(([w, c]) => {
      setWorkout(w ?? null); setCustomExercises(c); setLoading(false);
    });
  }, [id]);

  const allExercises = [...DEFAULT_EXERCISES, ...customExercises];

  if (loading) return <div className="min-h-screen bg-page flex items-center justify-center"><p className="text-dim">Loading...</p></div>;
  if (!workout) return (
    <div className="min-h-screen bg-page flex flex-col items-center justify-center gap-3">
      <p className="text-dim">Workout not found.</p>
      <button onClick={() => router.back()} className="text-brand text-sm">Go back</button>
    </div>
  );

  const duration = workout.endTime ? formatDuration(workout.startTime, workout.endTime) : null;
  const totalSets = workout.exercises.reduce((t, e) => t + e.sets.filter(s => s.type === 'working' && s.completed).length, 0);
  const totalVolume = workout.exercises.reduce((t, e) => t + e.sets.filter(s => s.type === 'working' && s.completed).reduce((et, s) => et + s.weight * s.reps, 0), 0);

  return (
    <div className="min-h-screen bg-page pb-8">
      <div className="flex items-center gap-3 px-4 pt-12 pb-4">
        <button onClick={() => router.back()} className="p-1 text-dim"><ArrowLeft size={22} /></button>
        <div className="flex-1">
          <h1 className="text-xl font-bold text-heading">{format(new Date(workout.date + 'T12:00:00'), 'EEEE, MMMM d')}</h1>
          {duration && <p className="text-xs text-dim">{duration}</p>}
        </div>
        <button onClick={async () => { if (!confirm('Delete this workout?')) return; await deleteWorkout(id); router.back(); }}
          className="p-2 text-dim hover:text-red-500"><Trash2 size={18} /></button>
      </div>

      <div className="px-4 space-y-4">
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-panel panel-glow rounded-xl p-3 text-center">
            <p className="text-lg font-bold text-brand">{workout.exercises.length}</p>
            <p className="text-xs text-dim">Exercises</p>
          </div>
          <div className="bg-panel panel-glow rounded-xl p-3 text-center">
            <p className="text-lg font-bold text-green-500">{totalSets}</p>
            <p className="text-xs text-dim">Working Sets</p>
          </div>
          <div className="bg-panel panel-glow rounded-xl p-3 text-center">
            <p className="text-lg font-bold text-purple-400">{totalVolume >= 1000 ? `${(totalVolume / 1000).toFixed(1)}k` : totalVolume.toLocaleString()}</p>
            <p className="text-xs text-dim">lbs Volume</p>
          </div>
        </div>

        {workout.exercises.map((ex) => {
          const exercise = allExercises.find(e => e.id === ex.exerciseId);
          const workingSets = ex.sets.filter(s => s.type === 'working' && s.completed);
          const bestSet = workingSets.length > 0
            ? workingSets.reduce((b, s) => estimateOneRepMax(s.weight, s.reps) > estimateOneRepMax(b.weight, b.reps) ? s : b)
            : null;
          return (
            <div key={ex.id} className="bg-panel panel-glow rounded-2xl p-4">
              <p className="font-semibold text-heading mb-2">{exercise?.name ?? 'Unknown'}</p>
              {bestSet && <p className="text-xs text-yellow-500 mb-2">Best: {bestSet.weight} lbs × {bestSet.reps} = {estimateOneRepMax(bestSet.weight, bestSet.reps)} lbs est. 1RM</p>}
              <div className="space-y-1">
                <div className="grid grid-cols-4 gap-2 text-xs text-dim px-1 mb-1">
                  <span>Type</span><span className="text-center">Weight</span><span className="text-center">Reps</span><span className="text-center">Done</span>
                </div>
                {ex.sets.map((s, i) => (
                  <div key={s.id} className="grid grid-cols-4 gap-2 items-center">
                    <span className={`text-xs rounded px-1.5 py-0.5 text-center font-medium ${
                      s.type === 'warmup' ? 'bg-amber-500/10 text-amber-500' : 'bg-brand/10 text-brand'
                    }`}>{s.type === 'warmup' ? 'W' : `S${i + 1}`}</span>
                    <span className="text-sm text-body text-center">{s.weight || '—'}</span>
                    <span className="text-sm text-body text-center">{s.reps || '—'}</span>
                    <span className={`text-center text-xs ${s.completed ? 'text-green-500' : 'text-dim'}`}>{s.completed ? '✓' : '✗'}</span>
                  </div>
                ))}
              </div>
              {ex.notes && <p className="text-xs text-dim mt-2 italic">{ex.notes}</p>}
            </div>
          );
        })}

        {workout.notes && (
          <div className="bg-panel panel-glow rounded-xl p-4">
            <p className="text-xs font-semibold text-dim uppercase tracking-wide mb-1">Notes</p>
            <p className="text-sm text-body">{workout.notes}</p>
          </div>
        )}
      </div>
    </div>
  );
}
