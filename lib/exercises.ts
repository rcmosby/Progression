import { Exercise, MuscleGroup } from './types';

const make = (id: string, name: string, muscleGroup: MuscleGroup): Exercise => ({
  id,
  name,
  muscleGroup,
  isCustom: false,
});

export const DEFAULT_EXERCISES: Exercise[] = [
  // Chest
  make('bench-press', 'Barbell Bench Press', 'chest'),
  make('incline-bench', 'Incline Barbell Bench Press', 'chest'),
  make('decline-bench', 'Decline Barbell Bench Press', 'chest'),
  make('db-bench', 'Dumbbell Bench Press', 'chest'),
  make('incline-db-bench', 'Incline Dumbbell Bench Press', 'chest'),
  make('decline-db-bench', 'Decline Dumbbell Bench Press', 'chest'),
  make('cable-fly', 'Cable Fly', 'chest'),
  make('pec-deck', 'Pec Deck Machine', 'chest'),
  make('chest-dip', 'Chest Dip', 'chest'),
  make('push-up', 'Push Up', 'chest'),
  make('incline-push-up', 'Incline Push Up', 'chest'),
  make('db-fly', 'Dumbbell Fly', 'chest'),
  make('svend-press', 'Svend Press', 'chest'),

  // Back
  make('deadlift', 'Barbell Deadlift', 'back'),
  make('pull-up', 'Pull Up', 'back'),
  make('chin-up', 'Chin Up', 'back'),
  make('bent-row', 'Barbell Bent-Over Row', 'back'),
  make('db-row', 'Dumbbell Row', 'back'),
  make('cable-row', 'Cable Seated Row', 'back'),
  make('lat-pulldown', 'Lat Pulldown', 'back'),
  make('t-bar-row', 'T-Bar Row', 'back'),
  make('pendlay-row', 'Pendlay Row', 'back'),
  make('chest-supported-row', 'Chest-Supported Row', 'back'),
  make('straight-arm-pulldown', 'Straight-Arm Pulldown', 'back'),
  make('face-pull', 'Face Pull', 'back'),
  make('rack-pull', 'Rack Pull', 'back'),
  make('hyperextension', 'Hyperextension', 'back'),

  // Shoulders
  make('ohp', 'Barbell Overhead Press', 'shoulders'),
  make('db-ohp', 'Dumbbell Shoulder Press', 'shoulders'),
  make('arnold-press', 'Arnold Press', 'shoulders'),
  make('lateral-raise', 'Lateral Raise', 'shoulders'),
  make('cable-lateral-raise', 'Cable Lateral Raise', 'shoulders'),
  make('front-raise', 'Front Raise', 'shoulders'),
  make('rear-delt-fly', 'Rear Delt Fly', 'shoulders'),
  make('upright-row', 'Upright Row', 'shoulders'),
  make('shrug', 'Barbell Shrug', 'shoulders'),
  make('db-shrug', 'Dumbbell Shrug', 'shoulders'),
  make('machine-ohp', 'Machine Shoulder Press', 'shoulders'),

  // Biceps
  make('barbell-curl', 'Barbell Curl', 'biceps'),
  make('ez-curl', 'EZ Bar Curl', 'biceps'),
  make('db-curl', 'Dumbbell Curl', 'biceps'),
  make('hammer-curl', 'Hammer Curl', 'biceps'),
  make('incline-db-curl', 'Incline Dumbbell Curl', 'biceps'),
  make('preacher-curl', 'Preacher Curl', 'biceps'),
  make('cable-curl', 'Cable Curl', 'biceps'),
  make('concentration-curl', 'Concentration Curl', 'biceps'),
  make('spider-curl', 'Spider Curl', 'biceps'),
  make('reverse-curl', 'Reverse Curl', 'biceps'),

  // Triceps
  make('close-grip-bench', 'Close Grip Bench Press', 'triceps'),
  make('skull-crusher', 'Skull Crusher', 'triceps'),
  make('tricep-dip', 'Tricep Dip', 'triceps'),
  make('tricep-pushdown', 'Tricep Pushdown', 'triceps'),
  make('overhead-tricep-ext', 'Overhead Tricep Extension', 'triceps'),
  make('db-tricep-kickback', 'Tricep Kickback', 'triceps'),
  make('cable-overhead-ext', 'Cable Overhead Tricep Extension', 'triceps'),
  make('rope-pushdown', 'Rope Pushdown', 'triceps'),
  make('diamond-push-up', 'Diamond Push Up', 'triceps'),

  // Legs
  make('squat', 'Barbell Back Squat', 'legs'),
  make('front-squat', 'Barbell Front Squat', 'legs'),
  make('leg-press', 'Leg Press', 'legs'),
  make('hack-squat', 'Hack Squat', 'legs'),
  make('romanian-deadlift', 'Romanian Deadlift', 'legs'),
  make('leg-curl', 'Leg Curl', 'legs'),
  make('leg-extension', 'Leg Extension', 'legs'),
  make('walking-lunge', 'Walking Lunge', 'legs'),
  make('bulgarian-split-squat', 'Bulgarian Split Squat', 'legs'),
  make('db-squat', 'Goblet Squat', 'legs'),
  make('sumo-deadlift', 'Sumo Deadlift', 'legs'),
  make('step-up', 'Step Up', 'legs'),
  make('sissy-squat', 'Sissy Squat', 'legs'),
  make('calf-raise', 'Standing Calf Raise', 'legs'),
  make('seated-calf-raise', 'Seated Calf Raise', 'legs'),

  // Glutes
  make('hip-thrust', 'Barbell Hip Thrust', 'glutes'),
  make('db-hip-thrust', 'Dumbbell Hip Thrust', 'glutes'),
  make('cable-kickback', 'Cable Kickback', 'glutes'),
  make('glute-bridge', 'Glute Bridge', 'glutes'),
  make('sumo-squat', 'Sumo Squat', 'glutes'),
  make('donkey-kick', 'Donkey Kick', 'glutes'),
  make('reverse-lunge', 'Reverse Lunge', 'glutes'),
  make('lateral-band-walk', 'Lateral Band Walk', 'glutes'),

  // Core
  make('plank', 'Plank', 'core'),
  make('side-plank', 'Side Plank', 'core'),
  make('crunch', 'Crunch', 'core'),
  make('cable-crunch', 'Cable Crunch', 'core'),
  make('hanging-leg-raise', 'Hanging Leg Raise', 'core'),
  make('ab-wheel', 'Ab Wheel Rollout', 'core'),
  make('russian-twist', 'Russian Twist', 'core'),
  make('bicycle-crunch', 'Bicycle Crunch', 'core'),
  make('dead-bug', 'Dead Bug', 'core'),
  make('hollow-body', 'Hollow Body Hold', 'core'),
  make('v-up', 'V-Up', 'core'),
  make('toe-touch', 'Toe Touch', 'core'),

  // Cardio
  make('treadmill', 'Treadmill', 'cardio'),
  make('elliptical', 'Elliptical', 'cardio'),
  make('rowing-machine', 'Rowing Machine', 'cardio'),
  make('stationary-bike', 'Stationary Bike', 'cardio'),
  make('stair-climber', 'Stair Climber', 'cardio'),
  make('jump-rope', 'Jump Rope', 'cardio'),
  make('battle-ropes', 'Battle Ropes', 'cardio'),
  make('sled-push', 'Sled Push', 'cardio'),

  // Full Body
  make('clean-and-press', 'Clean and Press', 'full_body'),
  make('thruster', 'Thruster', 'full_body'),
  make('burpee', 'Burpee', 'full_body'),
  make('kettlebell-swing', 'Kettlebell Swing', 'full_body'),
  make('power-clean', 'Power Clean', 'full_body'),
  make('snatch', 'Snatch', 'full_body'),
  make('turkish-get-up', 'Turkish Get Up', 'full_body'),
];

export function getExercisesByMuscleGroup(group: MuscleGroup, custom: Exercise[] = []): Exercise[] {
  const all = [...DEFAULT_EXERCISES, ...custom];
  return all.filter(e => e.muscleGroup === group).sort((a, b) => a.name.localeCompare(b.name));
}

export function getExerciseById(id: string, custom: Exercise[] = []): Exercise | undefined {
  return [...DEFAULT_EXERCISES, ...custom].find(e => e.id === id);
}
