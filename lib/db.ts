'use client';

import { openDB, IDBPDatabase } from 'idb';
import { Program, WorkoutLog, Exercise, BodyMetric } from './types';

const DB_NAME = 'progression-db';
const DB_VERSION = 1;

let dbInstance: IDBPDatabase | null = null;

async function getDb() {
  if (dbInstance) return dbInstance;
  dbInstance = await openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains('programs')) {
        db.createObjectStore('programs', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('workouts')) {
        const store = db.createObjectStore('workouts', { keyPath: 'id' });
        store.createIndex('date', 'date');
      }
      if (!db.objectStoreNames.contains('exercises')) {
        db.createObjectStore('exercises', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('bodyMetrics')) {
        const store = db.createObjectStore('bodyMetrics', { keyPath: 'id' });
        store.createIndex('date', 'date');
      }
    },
  });
  return dbInstance;
}

// Programs
export async function getPrograms(): Promise<Program[]> {
  const db = await getDb();
  return db.getAll('programs');
}
export async function getProgram(id: string): Promise<Program | undefined> {
  const db = await getDb();
  return db.get('programs', id);
}
export async function saveProgram(program: Program): Promise<void> {
  const db = await getDb();
  await db.put('programs', program);
}
export async function deleteProgram(id: string): Promise<void> {
  const db = await getDb();
  await db.delete('programs', id);
}

// Workouts
export async function getWorkouts(): Promise<WorkoutLog[]> {
  const db = await getDb();
  return db.getAll('workouts');
}
export async function getWorkoutsByDateRange(start: string, end: string): Promise<WorkoutLog[]> {
  const db = await getDb();
  return db.getAllFromIndex('workouts', 'date', IDBKeyRange.bound(start, end));
}
export async function getWorkout(id: string): Promise<WorkoutLog | undefined> {
  const db = await getDb();
  return db.get('workouts', id);
}
export async function saveWorkout(workout: WorkoutLog): Promise<void> {
  const db = await getDb();
  await db.put('workouts', workout);
}
export async function deleteWorkout(id: string): Promise<void> {
  const db = await getDb();
  await db.delete('workouts', id);
}

// Custom Exercises
export async function getCustomExercises(): Promise<Exercise[]> {
  const db = await getDb();
  return db.getAll('exercises');
}
export async function saveCustomExercise(exercise: Exercise): Promise<void> {
  const db = await getDb();
  await db.put('exercises', exercise);
}
export async function deleteCustomExercise(id: string): Promise<void> {
  const db = await getDb();
  await db.delete('exercises', id);
}

// Body Metrics
export async function getBodyMetrics(): Promise<BodyMetric[]> {
  const db = await getDb();
  const all = await db.getAll('bodyMetrics');
  return all.sort((a, b) => b.date.localeCompare(a.date));
}
export async function saveBodyMetric(metric: BodyMetric): Promise<void> {
  const db = await getDb();
  await db.put('bodyMetrics', metric);
}
export async function deleteBodyMetric(id: string): Promise<void> {
  const db = await getDb();
  await db.delete('bodyMetrics', id);
}
