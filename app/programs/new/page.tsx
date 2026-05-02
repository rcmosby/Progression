'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Plus, Trash2, GripVertical, Link2 } from 'lucide-react';
import { saveProgram, getCustomExercises, saveCustomExercise } from '@/lib/db';
import { Program, ProgramDay, ProgramExercise, ProgramSet, MuscleGroup, Exercise, MUSCLE_GROUP_LABELS } from '@/lib/types';
import { DEFAULT_EXERCISES } from '@/lib/exercises';
import { generateId } from '@/lib/utils';

const MUSCLE_GROUPS = Object.keys(MUSCLE_GROUP_LABELS) as MuscleGroup[];

function makeSet(type: 'warmup' | 'working'): ProgramSet {
  return { id: generateId(), type, targetReps: type === 'warmup' ? 10 : 8, targetWeight: undefined };
}

function makeExercise(): ProgramExercise {
  return {
    id: generateId(),
    exerciseId: '',
    sets: [makeSet('working'), makeSet('working'), makeSet('working')],
    restSeconds: 90,
  };
}

function makeDay(dayNumber: number): ProgramDay {
  return { id: generateId(), name: `Day ${dayNumber}`, dayNumber, exercises: [] };
}

export default function NewProgramPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [durationWeeks, setDurationWeeks] = useState(8);
  const [daysPerWeek, setDaysPerWeek] = useState(4);
  const [days, setDays] = useState<ProgramDay[]>([makeDay(1)]);
  const [customExercises, setCustomExercises] = useState<Exercise[]>([]);
  const [saving, setSaving] = useState(false);

  const [newExerciseModal, setNewExerciseModal] = useState<{
    dayId: string;
    exerciseId: string;
  } | null>(null);
  const [customExerciseName, setCustomExerciseName] = useState('');
  const [customExerciseMuscle, setCustomExerciseMuscle] = useState<MuscleGroup>('chest');

  const addDay = () => {
    setDays((prev) => [...prev, makeDay(prev.length + 1)]);
  };

  const removeDay = (dayId: string) => {
    setDays((prev) => prev.filter((d) => d.id !== dayId));
  };

  const updateDayName = (dayId: string, name: string) => {
    setDays((prev) => prev.map((d) => (d.id === dayId ? { ...d, name } : d)));
  };

  const addExerciseToDay = (dayId: string) => {
    setDays((prev) =>
      prev.map((d) => (d.id === dayId ? { ...d, exercises: [...d.exercises, makeExercise()] } : d))
    );
  };

  const removeExerciseFromDay = (dayId: string, exId: string) => {
    setDays((prev) =>
      prev.map((d) => (d.id === dayId ? { ...d, exercises: d.exercises.filter((e) => e.id !== exId) } : d))
    );
  };

  const updateExercise = (dayId: string, exId: string, updates: Partial<ProgramExercise>) => {
    setDays((prev) =>
      prev.map((d) =>
        d.id === dayId
          ? { ...d, exercises: d.exercises.map((e) => (e.id === exId ? { ...e, ...updates } : e)) }
          : d
      )
    );
  };

  const addSet = (dayId: string, exId: string, type: 'warmup' | 'working') => {
    setDays((prev) =>
      prev.map((d) =>
        d.id === dayId
          ? {
              ...d,
              exercises: d.exercises.map((e) =>
                e.id === exId ? { ...e, sets: [...e.sets, makeSet(type)] } : e
              ),
            }
          : d
      )
    );
  };

  const removeSet = (dayId: string, exId: string, setId: string) => {
    setDays((prev) =>
      prev.map((d) =>
        d.id === dayId
          ? {
              ...d,
              exercises: d.exercises.map((e) =>
                e.id === exId ? { ...e, sets: e.sets.filter((s) => s.id !== setId) } : e
              ),
            }
          : d
      )
    );
  };

  const updateSet = (dayId: string, exId: string, setId: string, updates: Partial<ProgramSet>) => {
    setDays((prev) =>
      prev.map((d) =>
        d.id === dayId
          ? {
              ...d,
              exercises: d.exercises.map((e) =>
                e.id === exId
                  ? { ...e, sets: e.sets.map((s) => (s.id === setId ? { ...s, ...updates } : s)) }
                  : e
              ),
            }
          : d
      )
    );
  };

  const toggleSuperset = (dayId: string, exId: string, nextExId: string | undefined) => {
    if (!nextExId) return;
    setDays((prev) =>
      prev.map((d) => {
        if (d.id !== dayId) return d;
        const ex = d.exercises.find((e) => e.id === exId);
        const nextEx = d.exercises.find((e) => e.id === nextExId);
        if (!ex || !nextEx) return d;
        const groupId = ex.supersetGroupId ?? generateId();
        const alreadyLinked = ex.supersetGroupId && ex.supersetGroupId === nextEx.supersetGroupId;
        return {
          ...d,
          exercises: d.exercises.map((e) => {
            if (e.id === exId || e.id === nextExId) {
              return { ...e, supersetGroupId: alreadyLinked ? undefined : groupId };
            }
            return e;
          }),
        };
      })
    );
  };

  const saveCustomExerciseHandler = async () => {
    if (!customExerciseName.trim() || !newExerciseModal) return;
    const ex: Exercise = {
      id: `custom-${generateId()}`,
      name: customExerciseName.trim(),
      muscleGroup: customExerciseMuscle,
      isCustom: true,
    };
    await saveCustomExercise(ex);
    setCustomExercises((prev) => [...prev, ex]);
    updateExercise(newExerciseModal.dayId, newExerciseModal.exerciseId, { exerciseId: ex.id });
    setCustomExerciseName('');
    setNewExerciseModal(null);
  };

  const handleSave = async () => {
    if (!name.trim()) return alert('Please enter a program name.');
    setSaving(true);
    const now = new Date().toISOString();
    const program: Program = {
      id: generateId(),
      name: name.trim(),
      durationWeeks,
      daysPerWeek,
      days,
      createdAt: now,
      updatedAt: now,
    };
    await saveProgram(program);
    router.push('/programs');
  };

  const allExercises = [...DEFAULT_EXERCISES, ...customExercises].sort((a, b) =>
    a.name.localeCompare(b.name)
  );

  return (
    <div className="min-h-screen bg-white dark:bg-zinc-950 pb-8">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 pt-12 pb-4">
        <button onClick={() => router.back()} className="p-1 text-zinc-500 dark:text-zinc-400">
          <ArrowLeft size={22} />
        </button>
        <h1 className="text-xl font-bold text-zinc-900 dark:text-white flex-1">New Program</h1>
        <button
          onClick={handleSave}
          disabled={saving}
          className="bg-blue-500 text-white px-4 py-2 rounded-xl text-sm font-semibold disabled:opacity-50"
        >
          {saving ? 'Saving...' : 'Save'}
        </button>
      </div>

      <div className="px-4 space-y-5">
        {/* Program Name */}
        <div>
          <label className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">
            Program Name
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Push Pull Legs"
            className="mt-1 w-full bg-zinc-100 dark:bg-zinc-900 rounded-xl px-4 py-3 text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-600 outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Duration & Frequency */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">
              Duration (weeks)
            </label>
            <input
              type="number"
              min={1}
              max={52}
              value={durationWeeks}
              onChange={(e) => setDurationWeeks(Number(e.target.value))}
              className="mt-1 w-full bg-zinc-100 dark:bg-zinc-900 rounded-xl px-4 py-3 text-zinc-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">
              Days / Week
            </label>
            <input
              type="number"
              min={1}
              max={7}
              value={daysPerWeek}
              onChange={(e) => setDaysPerWeek(Number(e.target.value))}
              className="mt-1 w-full bg-zinc-100 dark:bg-zinc-900 rounded-xl px-4 py-3 text-zinc-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Days */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">
              Training Days
            </label>
            <button
              onClick={addDay}
              className="flex items-center gap-1 text-blue-500 text-sm font-medium"
            >
              <Plus size={14} /> Add Day
            </button>
          </div>

          <div className="space-y-4">
            {days.map((day, dayIdx) => (
              <div key={day.id} className="bg-zinc-100 dark:bg-zinc-900 rounded-2xl p-4">
                {/* Day Header */}
                <div className="flex items-center gap-2 mb-3">
                  <input
                    type="text"
                    value={day.name}
                    onChange={(e) => updateDayName(day.id, e.target.value)}
                    className="flex-1 bg-white dark:bg-zinc-800 rounded-lg px-3 py-1.5 text-sm font-semibold text-zinc-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  {days.length > 1 && (
                    <button onClick={() => removeDay(day.id)} className="p-1 text-red-400">
                      <Trash2 size={15} />
                    </button>
                  )}
                </div>

                {/* Exercises */}
                {day.exercises.map((ex, exIdx) => {
                  const nextEx = day.exercises[exIdx + 1];
                  const isSuperset =
                    ex.supersetGroupId &&
                    nextEx?.supersetGroupId === ex.supersetGroupId;

                  const selectedExercise = allExercises.find((e) => e.id === ex.exerciseId);
                  const muscleGroup = selectedExercise?.muscleGroup;
                  const filteredExercises = muscleGroup
                    ? allExercises.filter((e) => e.muscleGroup === muscleGroup)
                    : allExercises;

                  return (
                    <div
                      key={ex.id}
                      className={`mb-3 ${isSuperset ? 'border-l-2 border-purple-500 pl-2' : ''}`}
                    >
                      {isSuperset && (
                        <span className="text-xs text-purple-500 font-semibold mb-1 block">SUPERSET</span>
                      )}

                      <div className="bg-white dark:bg-zinc-800 rounded-xl p-3 mb-1">
                        {/* Exercise picker */}
                        <div className="flex gap-2 mb-2">
                          <select
                            value={muscleGroup ?? ''}
                            onChange={(e) => {
                              updateExercise(day.id, ex.id, { exerciseId: '' });
                            }}
                            className="flex-1 bg-zinc-100 dark:bg-zinc-700 rounded-lg px-2 py-1.5 text-xs text-zinc-700 dark:text-zinc-300 outline-none"
                          >
                            <option value="">Muscle Group</option>
                            {MUSCLE_GROUPS.map((g) => (
                              <option key={g} value={g}>
                                {MUSCLE_GROUP_LABELS[g]}
                              </option>
                            ))}
                          </select>
                          <button
                            onClick={() => removeExerciseFromDay(day.id, ex.id)}
                            className="p-1.5 text-red-400 hover:text-red-500"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>

                        {muscleGroup && (
                          <div className="flex gap-2 mb-3">
                            <select
                              value={ex.exerciseId}
                              onChange={(e) => {
                                if (e.target.value === '__custom__') {
                                  setNewExerciseModal({ dayId: day.id, exerciseId: ex.id });
                                  setCustomExerciseMuscle(muscleGroup);
                                } else {
                                  updateExercise(day.id, ex.id, { exerciseId: e.target.value });
                                }
                              }}
                              className="flex-1 bg-zinc-100 dark:bg-zinc-700 rounded-lg px-2 py-1.5 text-xs text-zinc-700 dark:text-zinc-300 outline-none"
                            >
                              <option value="">Select exercise...</option>
                              {allExercises
                                .filter((e) => e.muscleGroup === muscleGroup)
                                .sort((a, b) => a.name.localeCompare(b.name))
                                .map((e) => (
                                  <option key={e.id} value={e.id}>
                                    {e.name}{e.isCustom ? ' ✦' : ''}
                                  </option>
                                ))}
                              <option value="__custom__">+ Add custom exercise...</option>
                            </select>
                          </div>
                        )}

                        {/* Rest time */}
                        <div className="flex items-center gap-2 mb-3">
                          <span className="text-xs text-zinc-500 dark:text-zinc-400">Rest</span>
                          <select
                            value={ex.restSeconds}
                            onChange={(e) =>
                              updateExercise(day.id, ex.id, { restSeconds: Number(e.target.value) })
                            }
                            className="bg-zinc-100 dark:bg-zinc-700 rounded-lg px-2 py-1 text-xs text-zinc-700 dark:text-zinc-300 outline-none"
                          >
                            {[30, 45, 60, 90, 120, 150, 180, 240, 300].map((s) => (
                              <option key={s} value={s}>
                                {s < 60 ? `${s}s` : `${s / 60}m`}
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* Sets */}
                        <div className="space-y-1.5 mb-2">
                          <div className="grid grid-cols-4 gap-1 text-xs text-zinc-400 dark:text-zinc-500 px-1 mb-0.5">
                            <span>Type</span>
                            <span className="text-center">Sets</span>
                            <span className="text-center">Reps</span>
                            <span></span>
                          </div>
                          {ex.sets.map((s) => (
                            <div key={s.id} className="grid grid-cols-4 gap-1 items-center">
                              <select
                                value={s.type}
                                onChange={(e) =>
                                  updateSet(day.id, ex.id, s.id, {
                                    type: e.target.value as 'warmup' | 'working',
                                  })
                                }
                                className="bg-zinc-100 dark:bg-zinc-700 rounded px-1 py-1 text-xs text-zinc-700 dark:text-zinc-300 outline-none"
                              >
                                <option value="warmup">Warm</option>
                                <option value="working">Work</option>
                              </select>
                              <div className="text-center text-xs text-zinc-500">1</div>
                              <input
                                type="number"
                                min={1}
                                value={s.targetReps}
                                onChange={(e) =>
                                  updateSet(day.id, ex.id, s.id, { targetReps: Number(e.target.value) })
                                }
                                className="bg-zinc-100 dark:bg-zinc-700 rounded px-1 py-1 text-xs text-center text-zinc-900 dark:text-white outline-none"
                              />
                              <button
                                onClick={() => removeSet(day.id, ex.id, s.id)}
                                className="flex justify-end text-zinc-400 hover:text-red-400 pr-1"
                              >
                                <Trash2 size={12} />
                              </button>
                            </div>
                          ))}
                        </div>

                        {/* Add set buttons */}
                        <div className="flex gap-2">
                          <button
                            onClick={() => addSet(day.id, ex.id, 'warmup')}
                            className="text-xs text-amber-500 font-medium"
                          >
                            + Warm-up set
                          </button>
                          <button
                            onClick={() => addSet(day.id, ex.id, 'working')}
                            className="text-xs text-blue-500 font-medium"
                          >
                            + Working set
                          </button>
                        </div>
                      </div>

                      {/* Superset toggle */}
                      {nextEx && (
                        <button
                          onClick={() => toggleSuperset(day.id, ex.id, nextEx.id)}
                          className={`flex items-center gap-1 text-xs font-medium ml-2 mb-1 ${
                            isSuperset ? 'text-purple-500' : 'text-zinc-400 dark:text-zinc-600'
                          }`}
                        >
                          <Link2 size={12} />
                          {isSuperset ? 'Linked as superset' : 'Link as superset'}
                        </button>
                      )}
                    </div>
                  );
                })}

                <button
                  onClick={() => addExerciseToDay(day.id)}
                  className="flex items-center gap-1.5 text-blue-500 text-sm font-medium mt-1"
                >
                  <Plus size={15} />
                  Add Exercise
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Custom Exercise Modal */}
      {newExerciseModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-end">
          <div className="w-full bg-white dark:bg-zinc-900 rounded-t-2xl p-6 space-y-4">
            <h3 className="text-lg font-bold text-zinc-900 dark:text-white">Add Custom Exercise</h3>
            <div>
              <label className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">
                Exercise Name
              </label>
              <input
                type="text"
                value={customExerciseName}
                onChange={(e) => setCustomExerciseName(e.target.value)}
                placeholder="e.g. Cable Hip Abduction"
                className="mt-1 w-full bg-zinc-100 dark:bg-zinc-800 rounded-xl px-4 py-3 text-zinc-900 dark:text-white placeholder-zinc-400 outline-none focus:ring-2 focus:ring-blue-500"
                autoFocus
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">
                Muscle Group
              </label>
              <select
                value={customExerciseMuscle}
                onChange={(e) => setCustomExerciseMuscle(e.target.value as MuscleGroup)}
                className="mt-1 w-full bg-zinc-100 dark:bg-zinc-800 rounded-xl px-4 py-3 text-zinc-900 dark:text-white outline-none"
              >
                {MUSCLE_GROUPS.map((g) => (
                  <option key={g} value={g}>
                    {MUSCLE_GROUP_LABELS[g]}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => { setNewExerciseModal(null); setCustomExerciseName(''); }}
                className="flex-1 py-3 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={saveCustomExerciseHandler}
                disabled={!customExerciseName.trim()}
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
