'use client';

import { useEffect, useState } from 'react';
import { getWorkouts, getCustomExercises } from '@/lib/db';
import { WorkoutLog, Exercise } from '@/lib/types';
import { DEFAULT_EXERCISES } from '@/lib/exercises';
import { getPersonalRecords, estimateOneRepMax } from '@/lib/utils';
import { Trophy, TrendingUp, BarChart2 } from 'lucide-react';
import { format } from 'date-fns';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const MUSCLE_LABELS: Record<string, string> = {
  chest: 'Chest', back: 'Back', shoulders: 'Shoulders', biceps: 'Biceps',
  triceps: 'Triceps', legs: 'Legs', glutes: 'Glutes', core: 'Core',
  cardio: 'Cardio', full_body: 'Full Body',
};

export default function ProgressPage() {
  const [workouts, setWorkouts] = useState<WorkoutLog[]>([]);
  const [customExercises, setCustomExercises] = useState<Exercise[]>([]);
  const [selectedExerciseId, setSelectedExerciseId] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getWorkouts(), getCustomExercises()]).then(([w, c]) => {
      setWorkouts(w.sort((a, b) => a.date.localeCompare(b.date)));
      setCustomExercises(c); setLoading(false);
    });
  }, []);

  const allExercises = [...DEFAULT_EXERCISES, ...customExercises];
  const prMap = getPersonalRecords(workouts);
  const loggedExerciseIds = new Set(workouts.flatMap(w => w.exercises.map(e => e.exerciseId)));
  const loggedExercises = allExercises.filter(e => loggedExerciseIds.has(e.id));

  const chartData = workouts.filter(w => !w.isRestDay).flatMap(w => {
    const ex = w.exercises.find(e => e.exerciseId === selectedExerciseId);
    if (!ex) return [];
    const working = ex.sets.filter(s => s.type === 'working' && s.completed && s.weight > 0);
    if (!working.length) return [];
    const best = working.reduce((b, s) => estimateOneRepMax(s.weight, s.reps) > estimateOneRepMax(b.weight, b.reps) ? s : b);
    return [{ date: format(new Date(w.date + 'T12:00:00'), 'MMM d'), weight: best.weight, reps: best.reps, e1rm: estimateOneRepMax(best.weight, best.reps) }];
  });

  const pr = prMap.get(selectedExerciseId);

  const fourWeeksAgo = new Date(); fourWeeksAgo.setDate(fourWeeksAgo.getDate() - 28);
  const volumeByMuscle = new Map<string, number>();
  workouts.filter(w => new Date(w.date) >= fourWeeksAgo && !w.isRestDay).forEach(w => {
    w.exercises.forEach(ex => {
      const exercise = allExercises.find(e => e.id === ex.exerciseId);
      if (!exercise) return;
      const vol = ex.sets.filter(s => s.type === 'working' && s.completed).reduce((s, set) => s + set.weight * set.reps, 0);
      volumeByMuscle.set(exercise.muscleGroup, (volumeByMuscle.get(exercise.muscleGroup) ?? 0) + vol);
    });
  });
  const volumeEntries = Array.from(volumeByMuscle.entries()).sort((a, b) => b[1] - a[1]);
  const maxVolume = volumeEntries[0]?.[1] ?? 1;

  const tooltipStyle = { background: 'var(--panel)', border: '1px solid var(--edge)', borderRadius: '8px', fontSize: '12px' };
  const labelStyle = { color: 'var(--body)' };

  return (
    <div className="min-h-screen bg-page">
      <div className="px-4 pt-12 pb-4">
        <h1 className="text-xl font-bold text-heading">Progress</h1>
      </div>

      {loading ? <div className="text-center py-16 text-dim">Loading...</div> : (
        <div className="px-4 space-y-6">

          {/* PRs */}
          <div>
            <h2 className="text-xs font-semibold text-dim uppercase tracking-widest mb-3 flex items-center gap-1.5">
              <Trophy size={14} /> Personal Records
            </h2>
            {prMap.size === 0 ? (
              <p className="text-sm text-dim">No records yet. Complete some workouts!</p>
            ) : (
              <div className="space-y-2">
                {Array.from(prMap.values()).sort((a, b) => b.estimatedOneRepMax - a.estimatedOneRepMax).slice(0, 10).map(pr => {
                  const ex = allExercises.find(e => e.id === pr.exerciseId);
                  return (
                    <div key={pr.exerciseId} className="bg-panel panel-glow rounded-xl px-4 py-3 flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-heading">{ex?.name ?? 'Unknown'}</p>
                        <p className="text-xs text-dim">{pr.weight} lbs × {pr.reps} · {format(new Date(pr.date + 'T12:00:00'), 'MMM d, yyyy')}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-yellow-500">{pr.estimatedOneRepMax} lbs</p>
                        <p className="text-xs text-dim">Est. 1RM</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Chart */}
          <div>
            <h2 className="text-xs font-semibold text-dim uppercase tracking-widest mb-3 flex items-center gap-1.5">
              <TrendingUp size={14} /> Lift Progress
            </h2>
            <select value={selectedExerciseId} onChange={e => setSelectedExerciseId(e.target.value)}
              className="w-full bg-panel border border-edge rounded-xl px-4 py-3 text-heading outline-none mb-3">
              <option value="">Select an exercise...</option>
              {loggedExercises.sort((a, b) => a.name.localeCompare(b.name)).map(e => (
                <option key={e.id} value={e.id}>{e.name}</option>
              ))}
            </select>

            {selectedExerciseId && chartData.length > 0 && (
              <div className="bg-panel panel-glow rounded-2xl p-4">
                {pr && <p className="text-xs text-yellow-500 mb-3">🏆 PR: {pr.weight} lbs × {pr.reps} = {pr.estimatedOneRepMax} lbs est. 1RM</p>}
                <p className="text-xs text-dim mb-2">Estimated 1RM over time</p>
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--edge)" />
                    <XAxis dataKey="date" tick={{ fontSize: 10, fill: 'var(--dim)' }} />
                    <YAxis tick={{ fontSize: 10, fill: 'var(--dim)' }} />
                    <Tooltip contentStyle={tooltipStyle} labelStyle={labelStyle} itemStyle={{ color: 'var(--brand)' }} />
                    <Line type="monotone" dataKey="e1rm" stroke="var(--brand)" strokeWidth={2} dot={{ r: 3, fill: 'var(--brand)' }} name="Est. 1RM (lbs)" />
                  </LineChart>
                </ResponsiveContainer>
                <p className="text-xs text-dim mt-3 mb-2">Weight lifted</p>
                <ResponsiveContainer width="100%" height={160}>
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--edge)" />
                    <XAxis dataKey="date" tick={{ fontSize: 10, fill: 'var(--dim)' }} />
                    <YAxis tick={{ fontSize: 10, fill: 'var(--dim)' }} />
                    <Tooltip contentStyle={tooltipStyle} labelStyle={labelStyle} itemStyle={{ color: '#34d399' }} />
                    <Line type="monotone" dataKey="weight" stroke="#34d399" strokeWidth={2} dot={{ r: 3 }} name="Weight (lbs)" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
            {selectedExerciseId && chartData.length === 0 && (
              <p className="text-sm text-dim text-center py-6">No completed sets logged yet.</p>
            )}
          </div>

          {/* Volume by muscle */}
          <div>
            <h2 className="text-xs font-semibold text-dim uppercase tracking-widest mb-3 flex items-center gap-1.5">
              <BarChart2 size={14} /> Volume by Muscle (Last 4 Weeks)
            </h2>
            {volumeEntries.length === 0 ? <p className="text-sm text-dim">No data yet.</p> : (
              <div className="bg-panel panel-glow rounded-2xl p-4 space-y-3">
                {volumeEntries.map(([muscle, vol]) => (
                  <div key={muscle}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-body font-medium">{MUSCLE_LABELS[muscle] ?? muscle}</span>
                      <span className="text-dim">{vol >= 1000 ? `${(vol / 1000).toFixed(1)}k` : vol.toLocaleString()} lbs</span>
                    </div>
                    <div className="w-full bg-raised rounded-full h-2">
                      <div className="bg-brand h-2 rounded-full transition-all" style={{ width: `${(vol / maxVolume) * 100}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
