'use client';

import { useEffect, useState } from 'react';
import { format, addMonths, subMonths } from 'date-fns';
import { ChevronLeft, ChevronRight, Flame, Settings, Moon, Sun } from 'lucide-react';
import { getWorkouts } from '@/lib/db';
import { WorkoutLog } from '@/lib/types';
import { getCalendarDays, getWorkoutStreak } from '@/lib/utils';
import { useTheme } from '@/components/ThemeProvider';
import Link from 'next/link';

export default function HomePage() {
  const [workouts, setWorkouts] = useState<WorkoutLog[]>([]);
  const [viewDate, setViewDate] = useState(new Date());
  const [loading, setLoading] = useState(true);
  const { theme, toggle } = useTheme();

  useEffect(() => {
    getWorkouts().then((w) => {
      setWorkouts(w);
      setLoading(false);
    });
  }, []);

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const { days, startPadding } = getCalendarDays(year, month);

  const workoutDates = new Set(workouts.filter((w) => !w.isRestDay).map((w) => w.date));
  const restDates = new Set(workouts.filter((w) => w.isRestDay).map((w) => w.date));

  const streak = getWorkoutStreak(workouts);
  const today = format(new Date(), 'yyyy-MM-dd');

  const last7 = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return format(d, 'yyyy-MM-dd');
  });
  const recentWorkoutCount = last7.filter((d) => workoutDates.has(d)).length;

  const weeklyWorkouts = workouts.filter((w) => last7.includes(w.date) && !w.isRestDay);
  const weeklyVolume = weeklyWorkouts.reduce(
    (total, w) =>
      total +
      w.exercises.reduce(
        (et, e) =>
          et +
          e.sets
            .filter((s) => s.type === 'working' && s.completed)
            .reduce((st, s) => st + s.weight * s.reps, 0),
        0
      ),
    0
  );

  return (
    <div className="min-h-screen bg-white dark:bg-zinc-950">
      <div className="flex items-center justify-between px-4 pt-12 pb-4">
        <h1 className="text-2xl font-bold tracking-widest text-zinc-900 dark:text-white">PROGRESSION</h1>
        <div className="flex items-center gap-2">
          <button
            onClick={toggle}
            className="p-2 rounded-full text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
          >
            {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
          </button>
          <Link
            href="/settings"
            className="p-2 rounded-full text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
          >
            <Settings size={20} />
          </Link>
        </div>
      </div>

      <div className="px-4 mb-4 grid grid-cols-3 gap-3">
        <div className="bg-zinc-100 dark:bg-zinc-900 rounded-2xl p-3 flex flex-col items-center gap-1">
          <div className="flex items-center gap-1 text-orange-500">
            <Flame size={18} />
            <span className="text-2xl font-bold">{streak}</span>
          </div>
          <span className="text-xs text-zinc-500 dark:text-zinc-400">Day Streak</span>
        </div>
        <div className="bg-zinc-100 dark:bg-zinc-900 rounded-2xl p-3 flex flex-col items-center gap-1">
          <span className="text-2xl font-bold text-blue-500">{recentWorkoutCount}</span>
          <span className="text-xs text-zinc-500 dark:text-zinc-400 text-center">
            Workouts<br />This Week
          </span>
        </div>
        <div className="bg-zinc-100 dark:bg-zinc-900 rounded-2xl p-3 flex flex-col items-center gap-1">
          <span className="text-xl font-bold text-green-500">
            {weeklyVolume >= 1000
              ? `${(weeklyVolume / 1000).toFixed(1)}k`
              : weeklyVolume.toLocaleString()}
          </span>
          <span className="text-xs text-zinc-500 dark:text-zinc-400 text-center">
            lbs Volume<br />This Week
          </span>
        </div>
      </div>

      <div className="px-4 mb-6">
        <div className="bg-zinc-100 dark:bg-zinc-900 rounded-2xl p-4">
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => setViewDate(subMonths(viewDate, 1))}
              className="p-1 rounded-lg hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-400"
            >
              <ChevronLeft size={20} />
            </button>
            <h2 className="text-base font-semibold text-zinc-800 dark:text-zinc-200">
              {format(viewDate, 'MMMM yyyy')}
            </h2>
            <button
              onClick={() => setViewDate(addMonths(viewDate, 1))}
              className="p-1 rounded-lg hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-400"
            >
              <ChevronRight size={20} />
            </button>
          </div>

          <div className="grid grid-cols-7 mb-1">
            {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
              <div key={i} className="text-center text-xs font-medium text-zinc-400 dark:text-zinc-500 py-1">
                {d}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-y-1">
            {Array.from({ length: startPadding }).map((_, i) => (
              <div key={`pad-${i}`} />
            ))}
            {days.map((day) => {
              const dateStr = format(day, 'yyyy-MM-dd');
              const isToday = dateStr === today;
              const hasWorkout = workoutDates.has(dateStr);
              const isRest = restDates.has(dateStr);
              const isFuture = dateStr > today;

              return (
                <div key={dateStr} className="flex items-center justify-center py-0.5">
                  <div
                    className={`w-8 h-8 flex items-center justify-center rounded-full text-sm font-medium transition-colors
                      ${isToday && !hasWorkout && !isRest ? 'ring-2 ring-blue-500 text-blue-500' : ''}
                      ${hasWorkout ? 'bg-blue-500 text-white' : ''}
                      ${isRest ? 'bg-zinc-300 dark:bg-zinc-700 text-zinc-500' : ''}
                      ${!hasWorkout && !isRest && !isToday ? 'text-zinc-700 dark:text-zinc-300' : ''}
                      ${isFuture ? 'opacity-30' : ''}
                    `}
                  >
                    {format(day, 'd')}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex items-center gap-4 mt-3 justify-center">
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-full bg-blue-500" />
              <span className="text-xs text-zinc-500 dark:text-zinc-400">Workout</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-full bg-zinc-300 dark:bg-zinc-700" />
              <span className="text-xs text-zinc-500 dark:text-zinc-400">Rest / Skip</span>
            </div>
          </div>
        </div>
      </div>

      <div className="px-4">
        <h3 className="text-sm font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide mb-3">
          Recent Workouts
        </h3>
        {loading ? (
          <div className="text-zinc-400 text-sm text-center py-8">Loading...</div>
        ) : workouts.filter((w) => !w.isRestDay).length === 0 ? (
          <div className="text-center py-8 text-zinc-400 dark:text-zinc-600">
            <p className="text-sm">No workouts logged yet.</p>
            <p className="text-xs mt-1">Head to Workout to start tracking.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {workouts
              .filter((w) => !w.isRestDay)
              .sort((a, b) => b.date.localeCompare(a.date))
              .slice(0, 5)
              .map((w) => (
                <Link
                  key={w.id}
                  href={`/history/${w.id}`}
                  className="bg-zinc-100 dark:bg-zinc-900 rounded-xl p-3 flex items-center justify-between"
                >
                  <div>
                    <p className="text-sm font-medium text-zinc-800 dark:text-zinc-200">
                      {format(new Date(w.date + 'T12:00:00'), 'EEE, MMM d')}
                    </p>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">
                      {w.exercises.length} exercise{w.exercises.length !== 1 ? 's' : ''}{' · '}
                      {w.exercises.reduce(
                        (t, e) => t + e.sets.filter((s) => s.type === 'working' && s.completed).length,
                        0
                      )}{' '}
                      sets
                    </p>
                  </div>
                  <ChevronRight size={16} className="text-zinc-400" />
                </Link>
              ))}
          </div>
        )}
      </div>
    </div>
  );
}
