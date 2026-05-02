export type MuscleGroup =
  | 'chest'
  | 'back'
  | 'shoulders'
  | 'biceps'
  | 'triceps'
  | 'legs'
  | 'glutes'
  | 'core'
  | 'cardio'
  | 'full_body';

export const MUSCLE_GROUP_LABELS: Record<MuscleGroup, string> = {
  chest: 'Chest',
  back: 'Back',
  shoulders: 'Shoulders',
  biceps: 'Biceps',
  triceps: 'Triceps',
  legs: 'Legs',
  glutes: 'Glutes',
  core: 'Core',
  cardio: 'Cardio',
  full_body: 'Full Body',
};

export interface Exercise {
  id: string;
  name: string;
  muscleGroup: MuscleGroup;
  isCustom: boolean;
}

export interface ProgramSet {
  id: string;
  type: 'warmup' | 'working';
  targetReps: number;
  targetWeight?: number;
}

export interface ProgramExercise {
  id: string;
  exerciseId: string;
  sets: ProgramSet[];
  restSeconds: number;
  notes?: string;
  supersetGroupId?: string;
}

export interface ProgramDay {
  id: string;
  name: string;
  dayNumber: number;
  exercises: ProgramExercise[];
}

export interface Program {
  id: string;
  name: string;
  durationWeeks: number;
  daysPerWeek: number;
  days: ProgramDay[];
  createdAt: string;
  updatedAt: string;
}

export interface WorkoutSetLog {
  id: string;
  type: 'warmup' | 'working';
  reps: number;
  weight: number;
  completed: boolean;
  rpe?: number;
}

export interface WorkoutExerciseLog {
  id: string;
  exerciseId: string;
  sets: WorkoutSetLog[];
  notes?: string;
}

export interface WorkoutLog {
  id: string;
  date: string;
  startTime: string;
  endTime?: string;
  programId?: string;
  programDayId?: string;
  exercises: WorkoutExerciseLog[];
  notes?: string;
  isRestDay?: boolean;
}

export interface BodyMetric {
  id: string;
  date: string;
  weightLbs?: number;
  bodyFatPercentage?: number;
  skeletalMuscleMassLbs?: number;
  bodyWaterLbs?: number;
  notes?: string;
}

export interface PersonalRecord {
  exerciseId: string;
  date: string;
  weight: number;
  reps: number;
  estimatedOneRepMax: number;
}
