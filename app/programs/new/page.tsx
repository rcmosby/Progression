'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Plus, Trash2, Link2 } from 'lucide-react';
import { saveProgram, saveCustomExercise } from '@/lib/db';
import { Program, ProgramDay, ProgramExercise, ProgramSet, MuscleGroup, Exercise, MUSCLE_GROUP_LABELS } from '@/lib/types';
import { DEFAULT_EXERCISES } from '@/lib/exercises';
import { generateId } from '@/lib/utils';

const MUSCLE_GROUPS = Object.keys(MUSCLE_GROUP_LABELS) as MuscleGroup[];

const makeSet = (type: 'warmup' | 'working'): ProgramSet => ({
  id: generateId(), type, targetReps: type === 'warmup' ? 10 : 8,
});
const makeExercise = (): ProgramExercise => ({
  id: generateId(), exerciseId: '',
  sets: [makeSet('working'), makeSet('working'), makeSet('working')],
  restSeconds: 90,
});
const makeDay = (n: number): ProgramDay => ({ id: generateId(), name: `Day ${n}`, dayNumber: n, exercises: [] });

export default function NewProgramPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [durationWeeks, setDurationWeeks] = useState(8);
  const [daysPerWeek, setDaysPerWeek] = useState(4);
  const [days, setDays] = useState<ProgramDay[]>([makeDay(1)]);
  const [customExercises, setCustomExercises] = useState<Exercise[]>([]);
  const [saving, setSaving] = useState(false);
  const [customModal, setCustomModal] = useState<{ dayId: string; exId: string } | null>(null);
  const [customName, setCustomName] = useState('');
  const [customMuscle, setCustomMuscle] = useState<MuscleGroup>('chest');

  const allExercises = [...DEFAULT_EXERCISES, ...customExercises];

  const updateDays = (fn: (d: ProgramDay[]) => ProgramDay[]) => setDays(fn);

  const updateExercise = (dayId: string, exId: string, u: Partial<ProgramExercise>) =>
    updateDays(ds => ds.map(d => d.id !== dayId ? d : {
      ...d, exercises: d.exercises.map(e => e.id !== exId ? e : { ...e, ...u })
    }));

  const updateSet = (dayId: string, exId: string, setId: string, u: Partial<ProgramSet>) =>
    updateDays(ds => ds.map(d => d.id !== dayId ? d : {
      ...d, exercises: d.exercises.map(e => e.id !== exId ? e : {
        ...e, sets: e.sets.map(s => s.id !== setId ? s : { ...s, ...u })
      })
    }));

  const toggleSuperset = (dayId: string, exId: string, nextExId: string) =>
    updateDays(ds => ds.map(d => {
      if (d.id !== dayId) return d;
      const ex = d.exercises.find(e => e.id === exId);
      const next = d.exercises.find(e => e.id === nextExId);
      if (!ex || !next) return d;
      const groupId = ex.supersetGroupId ?? generateId();
      const linked = ex.supersetGroupId === next.supersetGroupId && !!ex.supersetGroupId;
      return { ...d, exercises: d.exercises.map(e =>
        e.id === exId || e.id === nextExId ? { ...e, supersetGroupId: linked ? undefined : groupId } : e
      )};
    }));

  const addCustomExercise = async () => {
    if (!customName.trim() || !customModal) return;
    const ex: Exercise = { id: `custom-${generateId()}`, name: customName.trim(), muscleGroup: customMuscle, isCustom: true };
    await saveCustomExercise(ex);
    setCustomExercises(p => [...p, ex]);
    updateExercise(customModal.dayId, customModal.exId, { exerciseId: ex.id });
    setCustomName(''); setCustomModal(null);
  };

  const handleSave = async () => {
    if (!name.trim()) return alert('Enter a program name.');
    setSaving(true);
    const now = new Date().toISOString();
    await saveProgram({ id: generateId(), name: name.trim(), durationWeeks, daysPerWeek, days, createdAt: now, updatedAt: now });
    router.push('/programs');
  };

  return (
    <div className="min-h-screen bg-page pb-8">
      <div className="flex items-center gap-3 px-4 pt-12 pb-4">
        <button onClick={() => router.back()} className="p-1 text-dim"><ArrowLeft size={22} /></button>
        <h1 className="text-xl font-bold text-heading flex-1">New Program</h1>
        <button onClick={handleSave} disabled={saving}
          className="bg-brand text-white px-4 py-2 rounded-xl text-sm font-semibold disabled:opacity-50">
          {saving ? 'Saving...' : 'Save'}
        </button>
      </div>

      <div className="px-4 space-y-5">
        <div>
          <label className="text-xs font-semibold text-dim uppercase tracking-wide">Program Name</label>
          <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Push Pull Legs"
            className="mt-1 w-full bg-panel border border-edge rounded-xl px-4 py-3 text-heading placeholder-dim outline-none focus:ring-2 focus:ring-brand" />
        </div>

        <div className="grid grid-cols-2 gap-3">
          {[['Duration (weeks)', durationWeeks, (v: number) => setDurationWeeks(v), 1, 52],
            ['Days / Week', daysPerWeek, (v: number) => setDaysPerWeek(v), 1, 7]].map(([label, val, setter, min, max]) => (
            <div key={label as string}>
              <label className="text-xs font-semibold text-dim uppercase tracking-wide">{label as string}</label>
              <input type="number" min={min as number} max={max as number} value={val as number}
                onChange={e => (setter as (v: number) => void)(Number(e.target.value))}
                className="mt-1 w-full bg-panel border border-edge rounded-xl px-4 py-3 text-heading outline-none focus:ring-2 focus:ring-brand" />
            </div>
          ))}
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-semibold text-dim uppercase tracking-wide">Training Days</label>
            <button onClick={() => updateDays(d => [...d, makeDay(d.length + 1)])}
              className="flex items-center gap-1 text-brand text-sm font-medium">
              <Plus size={14} /> Add Day
            </button>
          </div>

          <div className="space-y-4">
            {days.map((day) => (
              <div key={day.id} className="bg-panel panel-glow rounded-2xl p-4">
                <div className="flex items-center gap-2 mb-3">
                  <input type="text" value={day.name}
                    onChange={e => updateDays(ds => ds.map(d => d.id === day.id ? { ...d, name: e.target.value } : d))}
                    className="flex-1 bg-raised rounded-lg px-3 py-1.5 text-sm font-semibold text-heading outline-none focus:ring-2 focus:ring-brand" />
                  {days.length > 1 && (
                    <button onClick={() => updateDays(ds => ds.filter(d => d.id !== day.id))} className="p-1 text-red-400">
                      <Trash2 size={15} />
                    </button>
                  )}
                </div>

                {day.exercises.map((ex, exIdx) => {
                  const nextEx = day.exercises[exIdx + 1];
                  const isSuperset = ex.supersetGroupId && nextEx?.supersetGroupId === ex.supersetGroupId;
                  const selectedEx = allExercises.find(e => e.id === ex.exerciseId);
                  const muscleGroup = selectedEx?.muscleGroup;

                  return (
                    <div key={ex.id} className={`mb-3 ${isSuperset ? 'border-l-2 border-brand pl-2' : ''}`}>
                      {isSuperset && <span className="text-xs text-brand font-semibold mb-1 block">SUPERSET</span>}

                      <div className="bg-raised rounded-xl p-3 mb-1">
                        <div className="flex gap-2 mb-2">
                          <select value={muscleGroup ?? ''}
                            onChange={() => updateExercise(day.id, ex.id, { exerciseId: '' })}
                            className="flex-1 bg-panel border border-edge rounded-lg px-2 py-1.5 text-xs text-body outline-none">
                            <option value="">Muscle Group</option>
                            {MUSCLE_GROUPS.map(g => <option key={g} value={g}>{MUSCLE_GROUP_LABELS[g]}</option>)}
                          </select>
                          <button onClick={() => updateDays(ds => ds.map(d => d.id !== day.id ? d : {
                            ...d, exercises: d.exercises.filter(e => e.id !== ex.id)
                          }))} className="p-1.5 text-red-400">
                            <Trash2 size={14} />
                          </button>
                        </div>

                        {muscleGroup && (
                          <select value={ex.exerciseId}
                            onChange={e => {
                              if (e.target.value === '__custom__') {
                                setCustomModal({ dayId: day.id, exId: ex.id });
                                setCustomMuscle(muscleGroup);
                              } else {
                                updateExercise(day.id, ex.id, { exerciseId: e.target.value });
                              }
                            }}
                            className="w-full bg-panel border border-edge rounded-lg px-2 py-1.5 text-xs text-body outline-none mb-2">
                            <option value="">Select exercise...</option>
                            {allExercises.filter(e => e.muscleGroup === muscleGroup).sort((a, b) => a.name.localeCompare(b.name))
                              .map(e => <option key={e.id} value={e.id}>{e.name}{e.isCustom ? ' ✦' : ''}</option>)}
                            <option value="__custom__">+ Add custom exercise...</option>
                          </select>
                        )}

                        <div className="flex items-center gap-2 mb-3">
                          <span className="text-xs text-dim">Rest</span>
                          <select value={ex.restSeconds}
                            onChange={e => updateExercise(day.id, ex.id, { restSeconds: Number(e.target.value) })}
                            className="bg-panel border border-edge rounded-lg px-2 py-1 text-xs text-body outline-none">
                            {[30,45,60,90,120,150,180,240,300].map(s =>
                              <option key={s} value={s}>{s < 60 ? `${s}s` : `${s/60}m`}</option>)}
                          </select>
                        </div>

                        <div className="space-y-1.5 mb-2">
                          <div className="grid grid-cols-4 gap-1 text-xs text-dim px-1 mb-0.5">
                            <span>Type</span><span className="text-center">Sets</span>
                            <span className="text-center">Reps</span><span />
                          </div>
                          {ex.sets.map(s => (
                            <div key={s.id} className="grid grid-cols-4 gap-1 items-center">
                              <select value={s.type}
                                onChange={e => updateSet(day.id, ex.id, s.id, { type: e.target.value as 'warmup' | 'working' })}
                                className="bg-panel border border-edge rounded px-1 py-1 text-xs text-body outline-none">
                                <option value="warmup">Warm</option>
                                <option value="working">Work</option>
                              </select>
                              <div className="text-center text-xs text-dim">1</div>
                              <input type="number" min={1} value={s.targetReps}
                                onChange={e => updateSet(day.id, ex.id, s.id, { targetReps: Number(e.target.value) })}
                                className="bg-panel border border-edge rounded px-1 py-1 text-xs text-center text-heading outline-none" />
                              <button onClick={() => updateDays(ds => ds.map(d => d.id !== day.id ? d : {
                                ...d, exercises: d.exercises.map(e => e.id !== ex.id ? e : {
                                  ...e, sets: e.sets.filter(s2 => s2.id !== s.id)
                                })
                              }))} className="flex justify-end text-dim hover:text-red-400 pr-1">
                                <Trash2 size={12} />
                              </button>
                            </div>
                          ))}
                        </div>

                        <div className="flex gap-3">
                          <button onClick={() => updateDays(ds => ds.map(d => d.id !== day.id ? d : {
                            ...d, exercises: d.exercises.map(e => e.id !== ex.id ? e : {
                              ...e, sets: [...e.sets, makeSet('warmup')]
                            })
                          }))} className="text-xs text-amber-500 font-medium">+ Warm-up set</button>
                          <button onClick={() => updateDays(ds => ds.map(d => d.id !== day.id ? d : {
                            ...d, exercises: d.exercises.map(e => e.id !== ex.id ? e : {
                              ...e, sets: [...e.sets, makeSet('working')]
                            })
                          }))} className="text-xs text-brand font-medium">+ Working set</button>
                        </div>
                      </div>

                      {nextEx && (
                        <button onClick={() => toggleSuperset(day.id, ex.id, nextEx.id)}
                          className={`flex items-center gap-1 text-xs font-medium ml-2 mb-1 ${isSuperset ? 'text-brand' : 'text-dim'}`}>
                          <Link2 size={12} />{isSuperset ? 'Linked as superset' : 'Link as superset'}
                        </button>
                      )}
                    </div>
                  );
                })}

                <button onClick={() => updateDays(ds => ds.map(d => d.id !== day.id ? d : {
                  ...d, exercises: [...d.exercises, makeExercise()]
                }))} className="flex items-center gap-1.5 text-brand text-sm font-medium mt-1">
                  <Plus size={15} /> Add Exercise
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {customModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-end">
          <div className="w-full bg-panel rounded-t-2xl p-6 space-y-4">
            <h3 className="text-lg font-bold text-heading">Add Custom Exercise</h3>
            <div>
              <label className="text-xs font-semibold text-dim uppercase tracking-wide">Name</label>
              <input type="text" value={customName} onChange={e => setCustomName(e.target.value)} autoFocus
                placeholder="e.g. Cable Hip Abduction"
                className="mt-1 w-full bg-raised border border-edge rounded-xl px-4 py-3 text-heading placeholder-dim outline-none focus:ring-2 focus:ring-brand" />
            </div>
            <div>
              <label className="text-xs font-semibold text-dim uppercase tracking-wide">Muscle Group</label>
              <select value={customMuscle} onChange={e => setCustomMuscle(e.target.value as MuscleGroup)}
                className="mt-1 w-full bg-raised border border-edge rounded-xl px-4 py-3 text-heading outline-none">
                {MUSCLE_GROUPS.map(g => <option key={g} value={g}>{MUSCLE_GROUP_LABELS[g]}</option>)}
              </select>
            </div>
            <div className="flex gap-3">
              <button onClick={() => { setCustomModal(null); setCustomName(''); }}
                className="flex-1 py-3 rounded-xl bg-raised text-body font-semibold">Cancel</button>
              <button onClick={addCustomExercise} disabled={!customName.trim()}
                className="flex-1 py-3 rounded-xl bg-brand text-white font-semibold disabled:opacity-50">Add</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
