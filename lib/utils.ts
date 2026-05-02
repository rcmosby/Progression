import { WorkoutLog, WorkoutSetLog, PersonalRecord } from './types';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay, subMonths, addMonths } from 'date-fns';

// Epley formula: 1RM = weight * (1 + reps/30)
export function estimateOneRepMax(weight: number, reps: number): number {
  if (reps === 1) return weight;
  return Math.round(weight * (1 + reps / 30));
}

// Suggest next weight based on recent history (2.5% increase if all sets completed)
export function suggestNextWeight(recentSets: WorkoutSetLog[]): number | null {
  const workingSets = recentSets.filter(s => s.type === 'working' && s.completed);
  if (workingSets.length === 0) return null;
  const avgWeight = workingSets.reduce((sum, s) => sum + s.weight, 0) / workingSets.length;
  // Round to nearest 2.5
  return Math.round((avgWeight * 1.025) / 2.5) * 2.5;
}

export function formatWeight(weight: number): string {
  return weight % 1 === 0 ? `${weight}` : `${weight.toFixed(1)}`;
}

export function getPersonalRecords(workouts: WorkoutLog[]): Map<string, PersonalRecord> {
  const records = new Map<string, PersonalRecord>();
  for (const workout of workouts) {
    for (const exercise of workout.exercises) {
      for (const set of exercise.sets) {
        if (set.type !== 'working' || !set.completed || set.weight === 0) continue;
        const e1rm = estimateOneRepMax(set.weight, set.reps);
        const existing = records.get(exercise.exerciseId);
        if (!existing || e1rm > existing.estimatedOneRepMax) {
          records.set(exercise.exerciseId, {
            exerciseId: exercise.exerciseId,
            date: workout.date,
            weight: set.weight,
            reps: set.reps,
            estimatedOneRepMax: e1rm,
          });
        }
      }
    }
  }
  return records;
}

export function isNewPersonalRecord(
  exerciseId: string,
  weight: number,
  reps: number,
  existingRecords: Map<string, PersonalRecord>
): boolean {
  const e1rm = estimateOneRepMax(weight, reps);
  const existing = existingRecords.get(exerciseId);
  return !existing || e1rm > existing.estimatedOneRepMax;
}

export function getCalendarDays(year: number, month: number) {
  const start = startOfMonth(new Date(year, month));
  const end = endOfMonth(new Date(year, month));
  const days = eachDayOfInterval({ start, end });
  const startPadding = getDay(start); // 0=Sun
  return { days, startPadding };
}

export function getWorkoutStreak(workouts: WorkoutLog[]): number {
  const sorted = [...workouts].sort((a, b) => b.date.localeCompare(a.date));
  if (sorted.length === 0) return 0;

  let streak = 0;
  const today = format(new Date(), 'yyyy-MM-dd');
  let current = today;

  for (const workout of sorted) {
    if (workout.date === current || (streak === 0 && workout.date <= current)) {
      streak++;
      const d = new Date(workout.date);
      d.setDate(d.getDate() - 1);
      current = format(d, 'yyyy-MM-dd');
    } else {
      break;
    }
  }
  return streak;
}

export function getWeeklyVolume(workouts: WorkoutLog[]): Map<string, number> {
  const volume = new Map<string, number>();
  for (const workout of workouts) {
    for (const exercise of workout.exercises) {
      const prev = volume.get(exercise.exerciseId) ?? 0;
      const sets = exercise.sets.filter(s => s.type === 'working' && s.completed);
      const vol = sets.reduce((sum, s) => sum + s.weight * s.reps, 0);
      volume.set(exercise.exerciseId, prev + vol);
    }
  }
  return volume;
}

export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function formatDuration(startTime: string, endTime?: string): string {
  const start = new Date(startTime);
  const end = endTime ? new Date(endTime) : new Date();
  const diffMs = end.getTime() - start.getTime();
  const mins = Math.floor(diffMs / 60000);
  const hours = Math.floor(mins / 60);
  const remainingMins = mins % 60;
  if (hours > 0) return `${hours}h ${remainingMins}m`;
  return `${mins}m`;
}
