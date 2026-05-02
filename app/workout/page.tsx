'use client';

import { useEffect, useRef, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Plus, Check, X, ChevronDown, ChevronUp, Timer, Trophy, Moon, StopCircle, StickyNote, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { getProgram, getWorkouts, saveWorkout, getCustomExercises, saveCustomExercise, getPrograms } from '@/lib/db';
import { Program, WorkoutLog, WorkoutExerciseLog, WorkoutSetLog, MuscleGroup, Exercise, MUSCLE_GROUP_LABELS } from '@/lib/types';
import { DEFAULT_EXERCISES } from '@/lib/exercises';
import { generateId, estimateOneRepMax, getPersonalRecords, isNewPersonalRecord, formatDuration, suggestNextWeight } from '@/lib/utils';
import { useActiveWorkoutStore } from '@/lib/store';

const MUSCLE_GROUPS = Object.keys(MUSCLE_GROUP_LABELS) as MuscleGroup[];

function WorkoutPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const programId = searchParams.get('programId');

  const {
    activeWorkout, startWorkout, endWorkout, clearWorkout,
    addExercise, removeExercise, addSet, updateSet, toggleSetComplete,
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
  const [addExModal, setAddExModal] = useState(false);
  const [modalMuscle, setModalMuscle] = useState<MuscleGroup | ''>('');
  const [modalExId, setModalExId] = useState('');
  const [customName, setCustomName] = useState('');
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const elapsedRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    Promise.all([getCustomExercises(), getWorkouts(), getPrograms()]).then(([c, w, p]) => {
      setCustomExercises(c); setAllWorkouts(w); setPrMap(getPersonalRecords(w)); setPrograms(p);
    });
  }, []);

  useEffect(() => {
    if (restTimerActive) { timerRef.current = setInterval(() => tickRestTimer(), 1000); }
    else if (timerRef.current) clearInterval(timerRef.current);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [restTimerActive]);

  useEffect(() => {
    if (activeWorkout) {
      elapsedRef.current = setInterval(() => setElapsed(formatDuration(activeWorkout.startTime)), 1000);
      setElapsed(formatDuration(activeWorkout.startTime));
    } else if (elapsedRef.current) clearInterval(elapsedRef.current);
    return () => { if (elapsedRef.current) clearInterval(elapsedRef.current); };
  }, [activeWorkout?.startTime]);

  const allExercises = [...DEFAULT_EXERCISES, ...customExercises];
  const selectedProgram = programs.find(p => p.id === selectedProgramId);

  const startFromProgram = async () => {
    if (!selectedProgramId || !selectedDayId) return;
    const program = await getProgram(selectedProgramId);
    const day = program?.days.find(d => d.id === selectedDayId);
    if (!program || !day) return;
    const exercises: WorkoutExerciseLog[] = day.exercises.map(ex => ({
      id: generateId(), exerciseId: ex.exerciseId, notes: ex.notes,
      sets: ex.sets.map(s => ({ id: generateId(), type: s.type, reps: s.targetReps, weight: 0, completed: false })),
    }));
    const workout: WorkoutLog = { id: generateId(), date: format(new Date(), 'yyyy-MM-dd'), startTime: new Date().toISOString(), programId: program.id, programDayId: day.id, exercises, notes: '' };
    setExpanded(new Set(exercises.map(e => e.id)));
    startWorkout(workout);
  };

  const startEmpty = () => {
    startWorkout({ id: generateId(), date: format(new Date(), 'yyyy-MM-dd'), startTime: new Date().toISOString(), exercises: [], notes: '' });
  };

  const logRestDay = async () => {
    await saveWorkout({ id: generateId(), date: format(new Date(), 'yyyy-MM-dd'), startTime: new Date().toISOString(), endTime: new Date().toISOString(), exercises: [], notes: '', isRestDay: true });
    alert('Rest day logged. Streak protected!');
    router.push('/');
  };

  const finishWorkout = async () => {
    if (!activeWorkout || !confirm('Finish and save this workout?')) return;
    const endTime = new Date().toISOString();
    endWorkout(endTime);
    await saveWorkout({ ...activeWorkout, endTime });
    clearWorkout();
    router.push('/');
  };

  const discardWorkout = () => {
    if (confirm('Discard this workout? All data will be lost.')) clearWorkout();
  };

  const handleSetComplete = (logExId: string, setId: string, set: WorkoutSetLog) => {
    toggleSetComplete(logExId, setId);
    if (!set.completed && set.type === 'working' && set.weight > 0 && set.reps > 0) {
      const exLog = activeWorkout?.exercises.find(e => e.id === logExId);
      if (exLog && isNewPersonalRecord(exLog.exerciseId, set.weight, set.reps, prMap)) {
        setNewPRs(p => new Set(p).add(exLog.exerciseId));
        setTimeout(() => setNewPRs(p => { const n = new Set(p); n.delete(exLog.exerciseId); return n; }), 4000);
      }
      startRestTimer(90, logExId);
    }
  };

  const confirmAddExercise = async () => {
    let exerciseId = modalExId;
    if (showCustomInput && customName.trim() && modalMuscle) {
      const ex: Exercise = { id: `custom-${generateId()}`, name: customName.trim(), muscleGroup: modalMuscle, isCustom: true };
      await saveCustomExercise(ex);
      setCustomExercises(p => [...p, ex]);
      exerciseId = ex.id;
    }
    if (!exerciseId) return;
    const newEx: WorkoutExerciseLog = { id: generateId(), exerciseId, sets: [{ id: generateId(), type: 'working', reps: 0, weight: 0, completed: false }] };
    addExercise(newEx);
    setExpanded(p => new Set(p).add(newEx.id));
    setAddExModal(false);
  };

  // ── Pre-workout screen ────────────────────────────────────────────────────
  if (!activeWorkout) return (
    <div className="min-h-screen bg-page px-4 pt-12">
      <h1 className="text-xl font-bold text-heading mb-6">Start Workout</h1>
      <div className="space-y-3 mb-6">
        <button onClick={startEmpty} className="w-full bg-brand text-white py-4 rounded-2xl font-semibold text-base">
          Empty Workout
        </button>
        <button onClick={logRestDay}
          className="w-full bg-panel border border-edge text-body py-4 rounded-2xl font-semibold text-base flex items-center justify-center gap-2">
          <Moon size={18} /> Log Rest Day
        </button>
      </div>

      {/* Load from program */}
      <div className="bg-panel panel-glow rounded-2xl p-4 space-y-3">
        <p className="text-sm font-semibold text-body">Start from Program</p>
        <select value={selectedProgramId} onChange={e => { setSelectedProgramId(e.target.value); setSelectedDayId(''); }}
          className="w-full bg-raised border border-edge rounded-xl px-4 py-3 text-heading outline-none">
          <option value="">Select a program...</option>
          {programs.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
        {selectedProgram && (
          <select value={selectedDayId} onChange={e => setSelectedDayId(e.target.value)}
            className="w-full bg-raised border border-edge rounded-xl px-4 py-3 text-heading outline-none">
            <option value="">Select a day...</option>
            {selectedProgram.days.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
          </select>
        )}
        <button onClick={startFromProgram} disabled={!selectedProgramId || !selectedDayId}
          className="w-full bg-brand text-white py-3 rounded-xl font-semibold disabled:opacity-40">
          Load Program Day
        </button>
      </div>
    </div>
  );

  // ── Active workout ────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-page">
      {/* Sticky header */}
      <div className="sticky top-0 z-40 bg-page border-b border-edge px-4 py-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-dim">Workout in progress</p>
            <p className="text-sm font-semibold text-heading">{elapsed}</p>
          </div>
          <div className="flex gap-2">
            <button onClick={discardWorkout}
              className="px-3 py-1.5 rounded-xl bg-panel border border-edge text-body text-xs font-medium flex items-center gap-1">
              <Trash2 size={13} /> Discard
            </button>
            <button onClick={finishWorkout}
              className="px-3 py-1.5 rounded-xl bg-brand text-white text-xs font-semibold flex items-center gap-1">
              <StopCircle size={13} /> Finish
            </button>
          </div>
        </div>
        {restTimerActive && (
          <div className="mt-2 flex items-center justify-between bg-panel border border-edge rounded-xl px-3 py-2">
            <div className="flex items-center gap-2">
              <Timer size={16} className="text-brand" />
              <span className="text-sm font-semibold text-heading">Rest: {restTimerSeconds}s</span>
            </div>
            <button onClick={stopRestTimer} className="text-xs text-dim">Skip</button>
          </div>
        )}
      </div>

      {newPRs.size > 0 && (
        <div className="mx-4 mt-3 bg-yellow-400/10 border border-yellow-400/30 rounded-xl px-3 py-2 flex items-center gap-2">
          <Trophy size={16} className="text-yellow-500" />
          <span className="text-sm font-semibold text-yellow-500">New Personal Record! 🎉</span>
        </div>
      )}

      <div className="px-4 pt-3 pb-4 space-y-3">
        {activeWorkout.exercises.map((ex) => {
          const exercise = allExercises.find(e => e.id === ex.exerciseId);
          const isExpanded = expanded.has(ex.id);
          const showNote = showNotes.has(ex.id);
          const isPR = newPRs.has(ex.exerciseId);
          const lastSets = allWorkouts.flatMap(w => w.exercises.filter(e => e.exerciseId === ex.exerciseId)).flatMap(e => e.sets);
          const suggestion = suggestNextWeight(lastSets);
          const workingSets = ex.sets.filter(s => s.type === 'working');
          const warmupSets = ex.sets.filter(s => s.type === 'warmup');

          return (
            <div key={ex.id} className={`bg-panel panel-glow rounded-2xl overflow-hidden ${isPR ? 'ring-2 ring-yellow-400' : ''}`}>
              <button className="w-full flex items-center justify-between px-4 py-3" onClick={() => setExpanded(p => { const n = new Set(p); n.has(ex.id) ? n.delete(ex.id) : n.add(ex.id); return n; })}>
                <div className="text-left">
                  <p className="font-semibold text-heading text-sm">{exercise?.name ?? 'Unknown'}</p>
                  <p className="text-xs text-dim">
                    {warmupSets.length > 0 && `${warmupSets.length} warm · `}
                    {workingSets.length} working · {ex.sets.filter(s => s.completed).length} done
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {isPR && <Trophy size={16} className="text-yellow-500" />}
                  <button onClick={e => { e.stopPropagation(); removeExercise(ex.id); }} className="p-1 text-dim hover:text-red-500"><X size={15} /></button>
                  {isExpanded ? <ChevronUp size={16} className="text-dim" /> : <ChevronDown size={16} className="text-dim" />}
                </div>
              </button>

              {isExpanded && (
                <div className="px-4 pb-3">
                  {suggestion && <p className="text-xs text-green-500 mb-2">Suggested: {suggestion} lbs</p>}

                  <div className="grid grid-cols-5 gap-1 text-xs text-dim mb-1 px-1">
                    <span>Type</span><span className="text-center col-span-2">Weight (lbs)</span>
                    <span className="text-center">Reps</span><span className="text-center">Done</span>
                  </div>

                  {ex.sets.map(s => (
                    <div key={s.id} className="grid grid-cols-5 gap-1 items-center mb-1.5">
                      <span className={`text-xs font-medium rounded px-1 py-0.5 text-center ${
                        s.type === 'warmup' ? 'bg-amber-500/10 text-amber-500' : 'bg-brand/10 text-brand'
                      }`}>{s.type === 'warmup' ? 'W' : 'S'}</span>
                      <input type="number" min={0} value={s.weight || ''} placeholder="0"
                        onChange={e => updateSet(ex.id, s.id, { weight: Number(e.target.value) })}
                        className="col-span-2 bg-raised border border-edge rounded-lg px-2 py-1.5 text-sm text-center text-heading outline-none focus:ring-1 focus:ring-brand" />
                      <input type="number" min={0} value={s.reps || ''} placeholder="0"
                        onChange={e => updateSet(ex.id, s.id, { reps: Number(e.target.value) })}
                        className="bg-raised border border-edge rounded-lg px-2 py-1.5 text-sm text-center text-heading outline-none focus:ring-1 focus:ring-brand" />
                      <button onClick={() => handleSetComplete(ex.id, s.id, s)}
                        className={`flex items-center justify-center rounded-lg py-1.5 transition-colors ${
                          s.completed ? 'bg-green-500 text-white' : 'bg-raised border border-edge text-dim'
                        }`}>
                        <Check size={15} />
                      </button>
                    </div>
                  ))}

                  {ex.sets.filter(s => s.type === 'working' && s.completed && s.weight > 0 && s.reps > 0).slice(-1).map(s => (
                    <p key={s.id} className="text-xs text-brand mt-1">
                      Est. 1RM: {estimateOneRepMax(s.weight, s.reps)} lbs
                    </p>
                  ))}

                  <div className="flex gap-3 mt-2">
                    <button onClick={() => addSet(ex.id, { id: generateId(), type: 'warmup', reps: 10, weight: 0, completed: false })}
                      className="text-xs text-amber-500 font-medium">+ Warm-up</button>
                    <button onClick={() => addSet(ex.id, { id: generateId(), type: 'working', reps: 0, weight: 0, completed: false })}
                      className="text-xs text-brand font-medium">+ Set</button>
                    <button onClick={() => setShowNotes(p => { const n = new Set(p); n.has(ex.id) ? n.delete(ex.id) : n.add(ex.id); return n; })}
                      className="text-xs text-dim font-medium flex items-center gap-0.5">
                      <StickyNote size={11} /> Note
                    </button>
                  </div>

                  {showNote && (
                    <textarea value={ex.notes ?? ''} onChange={e => updateExerciseNotes(ex.id, e.target.value)}
                      placeholder="Exercise notes..." rows={2}
                      className="mt-2 w-full bg-raised border border-edge rounded-lg px-3 py-2 text-xs text-body placeholder-dim outline-none resize-none" />
                  )}
                </div>
              )}
            </div>
          );
        })}

        <button onClick={() => { setModalMuscle(''); setModalExId(''); setCustomName(''); setShowCustomInput(false); setAddExModal(true); }}
          className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl border-2 border-dashed border-edge text-dim text-sm font-medium">
          <Plus size={18} /> Add Exercise
        </button>

        <div>
          <p className="text-xs font-semibold text-dim uppercase tracking-wide mb-1">Workout Notes</p>
          <textarea value={activeWorkout.notes ?? ''} onChange={e => updateWorkoutNotes(e.target.value)}
            placeholder="How did it feel?" rows={3}
            className="w-full bg-panel border border-edge rounded-xl px-3 py-2 text-sm text-body placeholder-dim outline-none resize-none" />
        </div>
      </div>

      {addExModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-end">
          <div className="w-full bg-panel rounded-t-2xl p-5 space-y-3 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-heading">Add Exercise</h3>
              <button onClick={() => setAddExModal(false)}><X size={20} className="text-dim" /></button>
            </div>
            <select value={modalMuscle} onChange={e => { setModalMuscle(e.target.value as MuscleGroup); setModalExId(''); setShowCustomInput(false); }}
              className="w-full bg-raised border border-edge rounded-xl px-4 py-3 text-heading outline-none">
              <option value="">Select muscle group...</option>
              {MUSCLE_GROUPS.map(g => <option key={g} value={g}>{MUSCLE_GROUP_LABELS[g]}</option>)}
            </select>
            {modalMuscle && !showCustomInput && (
              <select value={modalExId} onChange={e => { if (e.target.value === '__custom__') { setShowCustomInput(true); setModalExId(''); } else setModalExId(e.target.value); }}
                className="w-full bg-raised border border-edge rounded-xl px-4 py-3 text-heading outline-none">
                <option value="">Select exercise...</option>
                {allExercises.filter(e => e.muscleGroup === modalMuscle).sort((a, b) => a.name.localeCompare(b.name))
                  .map(e => <option key={e.id} value={e.id}>{e.name}{e.isCustom ? ' ✦' : ''}</option>)}
                <option value="__custom__">+ Add custom exercise...</option>
              </select>
            )}
            {showCustomInput && (
              <input type="text" value={customName} onChange={e => setCustomName(e.target.value)} autoFocus
                placeholder="Custom exercise name..."
                className="w-full bg-raised border border-edge rounded-xl px-4 py-3 text-heading placeholder-dim outline-none focus:ring-2 focus:ring-brand" />
            )}
            <div className="flex gap-3">
              <button onClick={() => setAddExModal(false)} className="flex-1 py-3 rounded-xl bg-raised text-body font-semibold">Cancel</button>
              <button onClick={confirmAddExercise} disabled={!modalExId && !(showCustomInput && customName.trim())}
                className="flex-1 py-3 rounded-xl bg-brand text-white font-semibold disabled:opacity-50">Add</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function WorkoutPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-page flex items-center justify-center"><p className="text-dim">Loading...</p></div>}>
      <WorkoutPageInner />
    </Suspense>
  );
}
