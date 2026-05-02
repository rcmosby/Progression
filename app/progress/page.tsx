'use client';

import { useEffect, useState } from 'react';
import { getWorkouts, getCustomExercises } from '@/lib/db';
import { WorkoutLog, Exercise } from '@/lib/types';
import { DEFAULT_EXERCISES } from '@/lib/exercises';
import { getPersonalRecords, estimateOneRepMax } from '@/lib/utils';
import { Trophy, TrendingUp, BarChart2 } from 'lucide-react';
import { format } from 'date-fns';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';

export default function ProgressPage() {
  const [workouts, setWorkouts] = useState<WorkoutLog[]>([]);
  const [customExercises, setCustomExercises] = useState<Exercise[]>([]);
  const [selectedExerciseId, setSelectedExerciseId] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getWorkouts(), getCustomExercises()]).then(([w, c]) => {
      setWorkouts(w.sort((a, b) => a.date.localeCompare(b.date)));
      setCustomExercises(c);
      setLoading(false);
    });
  }, []);

  const allExercises = [...DEFAULT_EXERCISES, ...customExercises];
  const prMap = getPersonalRecords(workouts);

  // Get exercises that have been logged at least once
  const loggedExerciseIds = new Set(workouts.flatMap((w) => w.exercises.map((e) => e.exerciseId)));
  const loggedExercises = allExercises.filter((e) => loggedExerciseIds.has(e.id));

  // Chart data for selected exercise
  const chartData = workouts
    .filter((w) => !w.isRestDay)
    .flatMap((w) => {
      const ex = w.exercises.find((e) => e.exerciseId === selectedExerciseId);
      if (!ex) return [];
      const workingSets = ex.sets.filter((s) => s.type === 'working' && s.completed && s.weight > 0);
      if (workingSets.length === 0) return [];
      const best = workingSets.reduce((best, s) => {
        const e1rm = estimateOneRepMax(s.weight, s.reps);
        return e1rm > estimateOneRepMax(best.weight, best.reps) ? s : best;
      });
      return [{
        date: format(new Date(w.date + 'T12:00:00'), 'MMM d'),
        weight: best.weight,
        reps: best.reps,
        e1rm: estimateOneRepMax(best.weight, best.reps),
      }];
    });

  const selectedExercise = allExercises.find((e) => e.id === selectedExerciseId);
  const pr = prMap.get(selectedExerciseId);

  // Volume by muscle group (last 4 weeks)
  const fourWeeksAgo = new Date();
  fourWeeksAgo.setDate(fourWeeksAgo.getDate() - 28);
  const recentWorkouts = workouts.filter((w) => new Date(w.date) >= fourWeeksAgo && !w.isRestDay);

  const volumeByMuscle = new Map<string, number>();
  for (const w of recentWorkouts) {
    for (const ex of w.exercises) {
      const exercise = allExercises.find((e) => e.id === ex.exerciseId);
      if (!exercise) continue;
      const vol = ex.sets
        .filter((s) => s.type === 'working' && s.completed)
        .reduce((sum, s) => sum + s.weight * s.reps, 0);
      const key = exercise.muscleGroup;
      volumeByMuscle.set(key, (volumeByMuscle.get(key) ?? 0) + vol);
    }
  }
  const volumeEntries = Array.from(volumeByMuscle.entries())
    .sort((a, b) => b[1] - a[1]);
  const maxVolume = volumeEntries[0]?.[1] ?? 1;

  const MUSCLE_LABELS: Record<string, string> = {
    chest: 'Chest', back: 'Back', shoulders: 'Shoulders', biceps: 'Biceps',
    triceps: 'Triceps', legs: 'Legs', glutes: 'Glutes', core: 'Core',
    cardio: 'Cardio', full_body: 'Full Body',
  };

  return (
    <div className="min-h-screen bg-white dark:bg-zinc-950">
      <div className="px-4 pt-12 pb-4">
        <h1 className="text-xl font-bold text-zinc-900 dark:text-white">Progress</h1>
      </div>

      {loading ? (
        <div className="text-center py-16 text-zinc-400">Loading...</div>
      ) : (
        <div className="px-4 space-y-6">
          {/* Personal Records */}
          <div>
            <h2 className="text-sm font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide mb-3 flex items-center gap-1.5">
              <Trophy size={14} /> Personal Records
            </h2>
            {prMap.size === 0 ? (
              <p className="text-sm text-zinc-400 dark:text-zinc-600">No records yet. Complete some workouts!</p>
            ) : (
              <div className="space-y-2">
                {Array.from(prMap.values())
                  .sort((a, b) => b.estimatedOneRepMax - a.estimatedOneRepMax)
                  .slice(0, 10)
                  .map((pr) => {
                    const ex = allExercises.find((e) => e.id === pr.exerciseId);
                    return (
                      <div key={pr.exerciseId} className="bg-zinc-100 dark:bg-zinc-900 rounded-xl px-4 py-3 flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-zinc-900 dark:text-white">{ex?.name ?? 'Unknown'}</p>
                          <p className="text-xs text-zinc-500 dark:text-zinc-400">
                            {pr.weight} lbs × {pr.reps} reps · {format(new Date(pr.date + 'T12:00:00'), 'MMM d, yyyy')}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-bold text-yellow-500">{pr.estimatedOneRepMax} lbs</p>
                          <p className="text-xs text-zinc-400">Est. 1RM</p>
                        </div>
                      </div>
                    );
                  })}
              </div>
            )}
          </div>

          {/* Exercise Chart */}
          <div>
            <h2 className="text-sm font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide mb-3 flex items-center gap-1.5">
              <TrendingUp size={14} /> Lift Progress
            </h2>
            <select
              value={selectedExerciseId}
              onChange={(e) => setSelectedExerciseId(e.target.value)}
              className="w-full bg-zinc-100 dark:bg-zinc-900 rounded-xl px-4 py-3 text-zinc-900 dark:text-white outline-none mb-3"
            >
              <option value="">Select an exercise...</option>
              {loggedExercises
                .sort((a, b) => a.name.localeCompare(b.name))
                .map((e) => (
                  <option key={e.id} value={e.id}>{e.name}</option>
                ))}
            </select>

            {selectedExerciseId && chartData.length > 0 && (
              <div className="bg-zinc-100 dark:bg-zinc-900 rounded-2xl p-4">
                {pr && (
                  <p className="text-xs text-yellow-600 dark:text-yellow-400 mb-3">
                    🏆 PR: {pr.weight} lbs × {pr.reps} reps = {pr.estimatedOneRepMax} lbs est. 1RM
                  </p>
                )}
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-2">Estimated 1RM over time</p>
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#3f3f46" />
                    <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#71717a' }} />
                    <YAxis tick={{ fontSize: 10, fill: '#71717a' }} />
                    <Tooltip
                      contentStyle={{ background: '#18181b', border: 'none', borderRadius: '8px', fontSize: '12px' }}
                      labelStyle={{ color: '#a1a1aa' }}
                      itemStyle={{ color: '#60a5fa' }}
                    />
                    <Line type="monotone" dataKey="e1rm" stroke="#3b82f6" strokeWidth={2} dot={{ r: 3 }} name="Est. 1RM (lbs)" />
                  </LineChart>
                </ResponsiveContainer>

                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-3 mb-2">Weight lifted</p>
                <ResponsiveContainer width="100%" height={160}>
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#3f3f46" />
                    <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#71717a' }} />
                    <YAxis tick={{ fontSize: 10, fill: '#71717a' }} />
                    <Tooltip
                      contentStyle={{ background: '#18181b', border: 'none', borderRadius: '8px', fontSize: '12px' }}
                      labelStyle={{ color: '#a1a1aa' }}
                      itemStyle={{ color: '#34d399' }}
                    />
                    <Line type="monotone" dataKey="weight" stroke="#34d399" strokeWidth={2} dot={{ r: 3 }} name="Weight (lbs)" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}

            {selectedExerciseId && chartData.length === 0 && (
              <p className="text-sm text-zinc-400 text-center py-6">No completed working sets logged for this exercise yet.</p>
            )}
          </div>

          {/* Volume by Muscle Group */}
          <div>
            <h2 className="text-sm font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide mb-3 flex items-center gap-1.5">
              <BarChart2 size={14} /> Volume by Muscle (Last 4 Weeks)
            </h2>
            {volumeEntries.length === 0 ? (
              <p className="text-sm text-zinc-400 dark:text-zinc-600">No data yet.</p>
            ) : (
              <div className="bg-zinc-100 dark:bg-zinc-900 rounded-2xl p-4 space-y-3">
                {volumeEntries.map(([muscle, vol]) => (
                  <div key={muscle}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-zinc-700 dark:text-zinc-300 font-medium">{MUSCLE_LABELS[muscle] ?? muscle}</span>
                      <span className="text-zinc-500 dark:text-zinc-400">
                        {vol >= 1000 ? `${(vol / 1000).toFixed(1)}k` : vol.toLocaleString()} lbs
                      </span>
                    </div>
                    <div className="w-full bg-zinc-200 dark:bg-zinc-800 rounded-full h-2">
                      <div
                        className="bg-blue-500 h-2 rounded-full transition-all"
                        style={{ width: `${(vol / maxVolume) * 100}%` }}
                      />
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
