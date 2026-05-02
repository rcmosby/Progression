'use client';

import { create } from 'zustand';
import { WorkoutLog, WorkoutExerciseLog, WorkoutSetLog } from './types';
import { generateId } from './utils';

interface ActiveWorkoutStore {
  activeWorkout: WorkoutLog | null;
  restTimerSeconds: number;
  restTimerActive: boolean;
  restTimerExerciseId: string | null;

  startWorkout: (workout: WorkoutLog) => void;
  endWorkout: (endTime: string) => void;
  clearWorkout: () => void;

  addExercise: (exercise: WorkoutExerciseLog) => void;
  removeExercise: (exerciseId: string) => void;

  addSet: (exerciseId: string, set: WorkoutSetLog) => void;
  updateSet: (exerciseId: string, setId: string, updates: Partial<WorkoutSetLog>) => void;
  removeSet: (exerciseId: string, setId: string) => void;
  toggleSetComplete: (exerciseId: string, setId: string) => void;

  updateExerciseNotes: (exerciseId: string, notes: string) => void;
  updateWorkoutNotes: (notes: string) => void;

  startRestTimer: (seconds: number, exerciseId: string) => void;
  tickRestTimer: () => void;
  stopRestTimer: () => void;
}

export const useActiveWorkoutStore = create<ActiveWorkoutStore>((set, get) => ({
  activeWorkout: null,
  restTimerSeconds: 0,
  restTimerActive: false,
  restTimerExerciseId: null,

  startWorkout: (workout) => set({ activeWorkout: workout }),

  endWorkout: (endTime) =>
    set((state) => ({
      activeWorkout: state.activeWorkout ? { ...state.activeWorkout, endTime } : null,
    })),

  clearWorkout: () => set({ activeWorkout: null, restTimerActive: false, restTimerSeconds: 0 }),

  addExercise: (exercise) =>
    set((state) => ({
      activeWorkout: state.activeWorkout
        ? { ...state.activeWorkout, exercises: [...state.activeWorkout.exercises, exercise] }
        : null,
    })),

  removeExercise: (logExerciseId) =>
    set((state) => ({
      activeWorkout: state.activeWorkout
        ? {
            ...state.activeWorkout,
            exercises: state.activeWorkout.exercises.filter((e) => e.id !== logExerciseId),
          }
        : null,
    })),

  addSet: (logExerciseId, newSet) =>
    set((state) => ({
      activeWorkout: state.activeWorkout
        ? {
            ...state.activeWorkout,
            exercises: state.activeWorkout.exercises.map((e) =>
              e.id === logExerciseId ? { ...e, sets: [...e.sets, newSet] } : e
            ),
          }
        : null,
    })),

  updateSet: (logExerciseId, setId, updates) =>
    set((state) => ({
      activeWorkout: state.activeWorkout
        ? {
            ...state.activeWorkout,
            exercises: state.activeWorkout.exercises.map((e) =>
              e.id === logExerciseId
                ? { ...e, sets: e.sets.map((s) => (s.id === setId ? { ...s, ...updates } : s)) }
                : e
            ),
          }
        : null,
    })),

  removeSet: (logExerciseId, setId) =>
    set((state) => ({
      activeWorkout: state.activeWorkout
        ? {
            ...state.activeWorkout,
            exercises: state.activeWorkout.exercises.map((e) =>
              e.id === logExerciseId ? { ...e, sets: e.sets.filter((s) => s.id !== setId) } : e
            ),
          }
        : null,
    })),

  toggleSetComplete: (logExerciseId, setId) =>
    set((state) => ({
      activeWorkout: state.activeWorkout
        ? {
            ...state.activeWorkout,
            exercises: state.activeWorkout.exercises.map((e) =>
              e.id === logExerciseId
                ? {
                    ...e,
                    sets: e.sets.map((s) =>
                      s.id === setId ? { ...s, completed: !s.completed } : s
                    ),
                  }
                : e
            ),
          }
        : null,
    })),

  updateExerciseNotes: (logExerciseId, notes) =>
    set((state) => ({
      activeWorkout: state.activeWorkout
        ? {
            ...state.activeWorkout,
            exercises: state.activeWorkout.exercises.map((e) =>
              e.id === logExerciseId ? { ...e, notes } : e
            ),
          }
        : null,
    })),

  updateWorkoutNotes: (notes) =>
    set((state) => ({
      activeWorkout: state.activeWorkout ? { ...state.activeWorkout, notes } : null,
    })),

  startRestTimer: (seconds, exerciseId) =>
    set({ restTimerSeconds: seconds, restTimerActive: true, restTimerExerciseId: exerciseId }),

  tickRestTimer: () =>
    set((state) => {
      if (state.restTimerSeconds <= 1) {
        return { restTimerSeconds: 0, restTimerActive: false, restTimerExerciseId: null };
      }
      return { restTimerSeconds: state.restTimerSeconds - 1 };
    }),

  stopRestTimer: () => set({ restTimerSeconds: 0, restTimerActive: false, restTimerExerciseId: null }),
}));
