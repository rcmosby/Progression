'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import {
  Plus, Check, X, ChevronDown, ChevronUp, Timer, Trophy, Moon,
  StopCircle, StickyNote, Trash2
} from 'lucide-react';
import { format } from 'date-fns';
import {
  getProgram, getWorkouts, saveWorkout, getCustomExercises, saveCustomExercise,
} from '@/lib/db';
import { Program, WorkoutLog, WorkoutExerciseLog, WorkoutSetLog, MuscleGroup, Exercise, MUSCLE_GROUP_LABELS } from '@/lib/types';
import { DEFAULT_EXERCISES } from '@/lib/exercises';
import { generateId, estimateOneRepMax, getPersonalRecords, isNewPersonalRecord, formatDuration, suggestNextWeight } from '@/lib/utils';
import { useActiveWorkoutStore } from '@/lib/store';

function WorkoutPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const programId = searchParams.get('programId');

  const {
    activeWorkout, startWorkout, endWorkout, clearWorkout,
    addExercise, removeExercise,
    addSet, updateSet, removeSet, toggleSetComplete,
    updateExerciseNotes, updateWorkoutNotes,
    restTimerSeconds, restTimerActive, startRestTimer, tickRestTimer, stopRestTimer,
  } = useActiveWorkoutStore();

  const [programs, setPrograms] = useState<Program[]>([]);
  const [selectedProgramId, setSelectedProgramId] = useState(programId ?? '');
  const [selectedDayId, setSelectedDayId] = useState('');
  const [customExercises, setCustomExercises] = useState<Exercise[]>([]);
  const [allWorkouts, setAllWorkouts] = useState<WorkoutLog[]>([]);
  const [prMap, setPrMap] = useState(new Map());
  const [newPRs, setNewPRs] = useState<Set<string>>(new Set());
  const [elapsed, setElapsed] = useState('');
  const [showNotes, setShowNotes] = useState<Set<string>>(new Set());
  const [addExerciseModal, setAddExerciseModal] = useState(false);
  const [modalMuscle, setModalMuscle] = useState<MuscleGroup | ''>('');
  const [modalExerciseId, setModalExerciseId] = useState('');
  const [customName, setCustomName] = useState('');
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [expandedExercises, setExpandedExercises] = useState<Set<string>>(new Set());
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const elapsedRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const MUSCLE_GROUPS = Object.keys(MUSCLE_GROUP_LABELS) as MuscleGroup[];

  useEffect(() => {
    Promise.all([getCustomExercises(), getWorkouts()]).then(([c, w]) => {
      setCustomExercises(c);
      setAllWorkouts(w);
      setPrMap(getPersonalRecords(w));
    });
  }, []);

  // Rest timer tick
  useEffect(() => {
    if (restTimerActive) {
      timerRef.current = setInterval(() => tickRestTimer(), 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [restTimerActive]);

  // Elapsed timer
  useEffect(() => {
    if (activeWorkout) {
      elapsedRef.current = setInterval(() => {
        setElapsed(formatDuration(activeWorkout.startTime));
      }, 1000);
      setElapsed(formatDuration(activeWorkout.startTime));
    } else {
      if (elapsedRef.current) clearInterval(elapsedRef.current);
    }
    return () => { if (elapsedRef.current) clearInterval(elapsedRef.current); };
  }, [activeWorkout?.startTime]);

  const allExercises = [...DEFAULT_EXERCISES, ...customExercises];

  const selectedProgram = programs.find((p) => p.id === selectedProgramId);

  const startFromProgram = async () => {
    if (!selectedProgramId || !selectedDayId) return;
    const program = await getProgram(selectedProgramId);
    if (!program) return;
    const day = program.days.find((d) => d.id === selectedDayId);
    if (!day) return;

    const exercises: WorkoutExerciseLog[] = day.exercises.map((ex) => ({
      id: generateId(),
      exerciseId: ex.exerciseId,
      notes: ex.notes,
      sets: ex.sets.map((s) => ({
        id: generateId(),
        type: s.type,
        reps: s.targetReps,
        weight: 0,
        completed: false,
      })),
    }));

    const workout: WorkoutLog = {
      id: generateId(),
      date: format(new Date(), 'yyyy-MM-dd'),
      startTime: new Date().toISOString(),
      programId: program.id,
      programDayId: day.id,
      exercises,
      notes: '',
    };

    setExpandedExercises(new Set(exercises.map((e) => e.id)));
    startWorkout(workout);
  };

  const startEmpty = () => {
    const workout: WorkoutLog = {
      id: generateId(),
      date: format(new Date(), 'yyyy-MM-dd'),
      startTime: new Date().toISOString(),
      exercises: [],
      notes: '',
    };
    startWorkout(workout);
  };

  const logRestDay = async () => {
    const workout: WorkoutLog = {
      id: generateId(),
      date: format(new Date(), 'yyyy-MM-dd'),
      startTime: new Date().toISOString(),
      endTime: new Date().toISOString(),
      exercises: [],
      notes: '',
      isRestDay: true,
    };
    await saveWorkout(workout);
    alert('Rest day logged. Your streak is safe!');
    router.push('/');
  };

  const finishWorkout = async () => {
    if (!activeWorkout) return;
    if (!confirm('Finish and save this workout?')) return;
    const endTime = new Date().toISOString();
    endWorkout(endTime);
    const final = { ...activeWorkout, endTime };
    await saveWorkout(final);
    clearWorkout();
    router.push('/');
  };

  const discardWorkout = () => {
    if (!confirm('Discard this workout? All data will be lost.')) return;
    clearWorkout();
  };

  const handleSetComplete = (logExerciseId: string, setId: string, set: WorkoutSetLog) => {
    toggleSetComplete(logExerciseId, setId);
    if (!set.completed && set.type === 'working' && set.weight > 0 && set.reps > 0) {
      const exerciseLog = activeWorkout?.exercises.find((e) => e.id === logExerciseId);
      if (exerciseLog && isNewPersonalRecord(exerciseLog.exerciseId, set.weight, set.reps, prMap)) {
        setNewPRs((prev) => new Set(prev).add(exerciseLog.exerciseId));
        setTimeout(() => setNewPRs((prev) => { const n = new Set(prev); n.delete(exerciseLog.exerciseId); return n; }), 4000);
      }
      const ex = activeWorkout?.exercises.find((e) => e.id === logExerciseId);
      if (ex) {
        const restSecs = 90;
        startRestTimer(restSecs, logExerciseId);
      }
    }
  };

  const openAddExercise = () => {
    setModalMuscle('');
    setModalExerciseId('');
    setCustomName('');
    setShowCustomInput(false);
    setAddExerciseModal(true);
  };

  const confirmAddExercise = async () => {
    let exerciseId = modalExerciseId;
    if (showCustomInput && customName.trim() && modalMuscle) {
      const ex: Exercise = {
        id: `custom-${generateId()}`,
        name: customName.trim(),
        muscleGroup: modalMuscle,
        isCustom: true,
      };
      await saveCustomExercise(ex);
      setCustomExercises((prev) => [...prev, ex]);
      exerciseId = ex.id;
    }
    if (!exerciseId) return;
    const newEx: WorkoutExerciseLog = {
      id: generateId(),
      exerciseId,
      sets: [{ id: generateId(), type: 'working', reps: 0, weight: 0, completed: false }],
    };
    addExercise(newEx);
    setExpandedExercises((prev) => new Set(prev).add(newEx.id));
    setAddExerciseModal(false);
  };

  const toggleExpanded = (id: string) => {
    setExpandedExercises((prev) => {
      const n = new Set(prev);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });
  };

  // Pre-workout screen
  if (!activeWorkout) {
    return (
      <div className="min-h-screen bg-white dark:bg-zinc-950 px-4 pt-12">
        <h1 className="text-xl font-bold text-zinc-900 dark:text-white mb-6">Start Workout</h1>

        <div className="space-y-3 mb-6">
          <button
            onClick={startEmpty}
            className="w-full bg-blue-500 text-white py-4 rounded-2xl font-semibold text-base"
          >
            Empty Workout
          </button>
          <button
            onClick={logRestDay}
            className="w-full bg-zinc-100 dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 py-4 rounded-2xl font-semibold text-base flex items-center justify-center gap-2"
          >
            <Moon size={18} />
            Log Rest Day
          </button>
        </div>

        <LoadProgramSection
          onStart={startFromProgram}
          selectedProgramId={selectedProgramId}
          setSelectedProgramId={setSelectedProgramId}
          selectedDayId={selectedDayId}
          setSelectedDayId={setSelectedDayId}
          programs={programs}
          setPrograms={setPrograms}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-zinc-950">
      {/* Active workout header */}
      <div className="sticky top-0 z-40 bg-white dark:bg-zinc-950 border-b border-zinc-100 dark:border-zinc-900 px-4 py-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">Workout in progress</p>
            <p className="text-sm font-semibold text-zinc-900 dark:text-white">{elapsed}</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={discardWorkout}
              className="px-3 py-1.5 rounded-xl bg-zinc-100 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 text-xs font-medium flex items-center gap-1"
            >
              <Trash2 size={13} /> Discard
            </button>
            <button
              onClick={finishWorkout}
              className="px-3 py-1.5 rounded-xl bg-blue-500 text-white text-xs font-semibold flex items-center gap-1"
            >
              <StopCircle size={13} /> Finish
            </button>
          </div>
        </div>

        {/* Rest Timer */}
        {restTimerActive && (
          <div className="mt-2 flex items-center justify-between bg-zinc-100 dark:bg-zinc-900 rounded-xl px-3 py-2">
            <div className="flex items-center gap-2">
              <Timer size={16} className="text-blue-500" />
              <span className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">
                Rest: {restTimerSeconds}s
              </span>
            </div>
            <button onClick={stopRestTimer} className="text-xs text-zinc-500">Skip</button>
          </div>
        )}
      </div>

      {/* PR Banner */}
      {newPRs.size > 0 && (
        <div className="mx-4 mt-3 bg-yellow-400/10 border border-yellow-400/30 rounded-xl px-3 py-2 flex items-center gap-2">
          <Trophy size={16} className="text-yellow-500" />
          <span className="text-sm font-semibold text-yellow-600 dark:text-yellow-400">
            New Personal Record! 🎉
          </span>
        </div>
      )}

      <div className="px-4 pt-3 pb-4 space-y-3">
        {activeWorkout.exercises.map((ex) => {
          const exercise = allExercises.find((e) => e.id === ex.exerciseId);
          const isExpanded = expandedExercises.has(ex.id);
          const showNote = showNotes.has(ex.id);
          const isPR = newPRs.has(ex.exerciseId);

          // Find last workout data for this exercise to suggest weight
          const lastSets = allWorkouts
            .flatMap((w) => w.exercises.filter((e) => e.exerciseId === ex.exerciseId))
            .flatMap((e) => e.sets);
          const suggestion = suggestNextWeight(lastSets);

          const workingSets = ex.sets.filter((s) => s.type === 'working');
          const warmupSets = ex.sets.filter((s) => s.type === 'warmup');

          return (
            <div key={ex.id} className={`bg-zinc-100 dark:bg-zinc-900 rounded-2xl overflow-hidden ${isPR ? 'ring-2 ring-yellow-400' : ''}`}>
              {/* Exercise header */}
              <button
                className="w-full flex items-center justify-between px-4 py-3"
                onClick={() => toggleExpanded(ex.id)}
              >
                <div className="text-left">
                  <p className="font-semibold text-zinc-900 dark:text-white text-sm">
                    {exercise?.name ?? 'Unknown Exercise'}
                  </p>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    {warmupSets.length > 0 && `${warmupSets.length} warm · `}
                    {workingSets.length} working · {ex.sets.filter((s) => s.completed).length} done
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {isPR && <Trophy size={16} className="text-yellow-500" />}
                  <button
                    onClick={(e) => { e.stopPropagation(); removeExercise(ex.id); }}
                    className="p-1 text-zinc-400 hover:text-red-500"
                  >
                    <X size={15} />
                  </button>
                  {isExpanded ? <ChevronUp size={16} className="text-zinc-400" /> : <ChevronDown size={16} className="text-zinc-400" />}
                </div>
              </button>

              {isExpanded && (
                <div className="px-4 pb-3">
                  {suggestion && (
                    <p className="text-xs text-green-600 dark:text-green-400 mb-2">
                      Suggested: {suggestion} lbs (based on last session)
                    </p>
                  )}

                  {/* Sets table header */}
                  <div className="grid grid-cols-5 gap-1 text-xs text-zinc-400 dark:text-zinc-500 mb-1 px-1">
                    <span>Type</span>
                    <span className="text-center col-span-2">Weight (lbs)</span>
                    <span className="text-center">Reps</span>
                    <span className="text-center">Done</span>
                  </div>

                  {ex.sets.map((s) => (
                    <div key={s.id} className="grid grid-cols-5 gap-1 items-center mb-1.5">
                      <span
                        className={`text-xs font-medium rounded px-1 py-0.5 text-center ${
                          s.type === 'warmup'
                            ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400'
                            : 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'
                        }`}
                      >
                        {s.type === 'warmup' ? 'W' : 'S'}
                      </span>
                      <input
                        type="number"
                        min={0}
                        value={s.weight || ''}
                        onChange={(e) => updateSet(ex.id, s.id, { weight: Number(e.target.value) })}
                        placeholder="0"
                        className="col-span-2 bg-white dark:bg-zinc-800 rounded-lg px-2 py-1.5 text-sm text-center text-zinc-900 dark:text-white outline-none focus:ring-1 focus:ring-blue-500"
                      />
                      <input
                        type="number"
                        min={0}
                        value={s.reps || ''}
                        onChange={(e) => updateSet(ex.id, s.id, { reps: Number(e.target.value) })}
                        placeholder="0"
                        className="bg-white dark:bg-zinc-800 rounded-lg px-2 py-1.5 text-sm text-center text-zinc-900 dark:text-white outline-none focus:ring-1 focus:ring-blue-500"
                      />
                      <button
                        onClick={() => handleSetComplete(ex.id, s.id, s)}
                        className={`flex items-center justify-center rounded-lg py-1.5 transition-colors ${
                          s.completed
                            ? 'bg-green-500 text-white'
                            : 'bg-white dark:bg-zinc-800 text-zinc-400 border border-zinc-200 dark:border-zinc-700'
                        }`}
                      >
                        <Check size={15} />
                      </button>
                    </div>
                  ))}

                  {/* 1RM estimates for working sets */}
                  {ex.sets
                    .filter((s) => s.type === 'working' && s.completed && s.weight > 0 && s.reps > 0)
                    .slice(-1)
                    .map((s) => (
                      <p key={s.id} className="text-xs text-purple-600 dark:text-purple-400 mt-1">
                        Est. 1RM: {estimateOneRepMax(s.weight, s.reps)} lbs
                      </p>
                    ))}

                  {/* Add set buttons */}
                  <div className="flex gap-3 mt-2">
                    <button
                      onClick={() => addSet(ex.id, { id: generateId(), type: 'warmup', reps: 10, weight: 0, completed: false })}
                      className="text-xs text-amber-500 font-medium"
                    >
                      + Warm-up
                    </button>
                    <button
                      onClick={() => addSet(ex.id, { id: generateId(), type: 'working', reps: 0, weight: 0, completed: false })}
                      className="text-xs text-blue-500 font-medium"
                    >
                      + Set
                    </button>
                    <button
                      onClick={() => setShowNotes((prev) => { const n = new Set(prev); n.has(ex.id) ? n.delete(ex.id) : n.add(ex.id); return n; })}
                      className="text-xs text-zinc-400 font-medium flex items-center gap-0.5"
                    >
                      <StickyNote size={11} /> Note
                    </button>
                  </div>

                  {showNote && (
                    <textarea
                      value={ex.notes ?? ''}
                      onChange={(e) => updateExerciseNotes(ex.id, e.target.value)}
                      placeholder="Exercise notes..."
                      rows={2}
                      className="mt-2 w-full bg-white dark:bg-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-800 dark:text-zinc-200 placeholder-zinc-400 outline-none resize-none"
                    />
                  )}
                </div>
              )}
            </div>
          );
        })}

        {/* Add Exercise */}
        <button
          onClick={openAddExercise}
          className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl border-2 border-dashed border-zinc-200 dark:border-zinc-800 text-zinc-500 dark:text-zinc-500 text-sm font-medium"
        >
          <Plus size={18} />
          Add Exercise
        </button>

        {/* Workout Notes */}
        <div>
          <p className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide mb-1">Workout Notes</p>
          <textarea
            value={activeWorkout.notes ?? ''}
            onChange={(e) => updateWorkoutNotes(e.target.value)}
            placeholder="How did the workout feel? Any notes..."
            rows={3}
            className="w-full bg-zinc-100 dark:bg-zinc-900 rounded-xl px-3 py-2 text-sm text-zinc-800 dark:text-zinc-200 placeholder-zinc-400 outline-none resize-none"
          />
        </div>
      </div>

      {/* Add Exercise Modal */}
      {addExerciseModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-end">
          <div className="w-full bg-white dark:bg-zinc-900 rounded-t-2xl p-5 space-y-3 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-zinc-900 dark:text-white">Add Exercise</h3>
              <button onClick={() => setAddExerciseModal(false)}>
                <X size={20} className="text-zinc-500" />
              </button>
            </div>

            <select
              value={modalMuscle}
              onChange={(e) => { setModalMuscle(e.target.value as MuscleGroup); setModalExerciseId(''); setShowCustomInput(false); }}
              className="w-full bg-zinc-100 dark:bg-zinc-800 rounded-xl px-4 py-3 text-zinc-900 dark:text-white outline-none"
            >
              <option value="">Select muscle group...</option>
              {MUSCLE_GROUPS.map((g) => (
                <option key={g} value={g}>{MUSCLE_GROUP_LABELS[g]}</option>
              ))}
            </select>

            {modalMuscle && !showCustomInput && (
              <select
                value={modalExerciseId}
                onChange={(e) => {
                  if (e.target.value === '__custom__') {
                    setShowCustomInput(true);
                    setModalExerciseId('');
                  } else {
                    setModalExerciseId(e.target.value);
                  }
                }}
                className="w-full bg-zinc-100 dark:bg-zinc-800 rounded-xl px-4 py-3 text-zinc-900 dark:text-white outline-none"
              >
                <option value="">Select exercise...</option>
                {allExercises
                  .filter((e) => e.muscleGroup === modalMuscle)
                  .sort((a, b) => a.name.localeCompare(b.name))
                  .map((e) => (
                    <option key={e.id} value={e.id}>{e.name}{e.isCustom ? ' ✦' : ''}</option>
                  ))}
                <option value="__custom__">+ Add custom exercise...</option>
              </select>
            )}

            {showCustomInput && (
              <input
                type="text"
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                placeholder="Custom exercise name..."
                autoFocus
                className="w-full bg-zinc-100 dark:bg-zinc-800 rounded-xl px-4 py-3 text-zinc-900 dark:text-white placeholder-zinc-400 outline-none focus:ring-2 focus:ring-blue-500"
              />
            )}

            <div className="flex gap-3">
              <button
                onClick={() => setAddExerciseModal(false)}
                className="flex-1 py-3 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={confirmAddExercise}
                disabled={!modalExerciseId && !(showCustomInput && customName.trim())}
                className="flex-1 py-3 rounded-xl bg-blue-500 text-white font-semibold disabled:opacity-50"
              >
                Add
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function LoadProgramSection({
  onStart, selectedProgramId, setSelectedProgramId, selectedDayId, setSelectedDayId,
  programs, setPrograms,
}: {
  onStart: () => void;
  selectedProgramId: string;
  setSelectedProgramId: (id: string) => void;
  selectedDayId: string;
  setSelectedDayId: (id: string) => void;
  programs: Program[];
  setPrograms: (p: Program[]) => void;
}) {
  const { getPrograms } = require('@/lib/db');
  useEffect(() => {
    getPrograms().then(setPrograms);
  }, []);

  const selectedProgram = programs.find((p) => p.id === selectedProgramId);

  return (
    <div className="bg-zinc-100 dark:bg-zinc-900 rounded-2xl p-4 space-y-3">
      <p className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">Start from Program</p>
      <select
        value={selectedProgramId}
        onChange={(e) => { setSelectedProgramId(e.target.value); setSelectedDayId(''); }}
        className="w-full bg-white dark:bg-zinc-800 rounded-xl px-4 py-3 text-zinc-900 dark:text-white outline-none"
      >
        <option value="">Select a program...</option>
        {programs.map((p) => (
          <option key={p.id} value={p.id}>{p.name}</option>
        ))}
      </select>

      {selectedProgram && (
        <select
          value={selectedDayId}
          onChange={(e) => setSelectedDayId(e.target.value)}
          className="w-full bg-white dark:bg-zinc-800 rounded-xl px-4 py-3 text-zinc-900 dark:text-white outline-none"
        >
          <option value="">Select a day...</option>
          {selectedProgram.days.map((d) => (
            <option key={d.id} value={d.id}>{d.name}</option>
          ))}
        </select>
      )}

      <button
        onClick={onStart}
        disabled={!selectedProgramId || !selectedDayId}
        className="w-full bg-blue-500 text-white py-3 rounded-xl font-semibold disabled:opacity-40"
      >
        Load Program Day
      </button>
    </div>
  );
}

export default function WorkoutPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><p className="text-zinc-400">Loading...</p></div>}>
      <WorkoutPageInner />
    </Suspense>
  );
}
