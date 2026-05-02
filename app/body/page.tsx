'use client';

import { useEffect, useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { getBodyMetrics, saveBodyMetric, deleteBodyMetric } from '@/lib/db';
import { BodyMetric } from '@/lib/types';
import { generateId } from '@/lib/utils';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';

export default function BodyPage() {
  const [metrics, setMetrics] = useState<BodyMetric[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  const [form, setForm] = useState({
    date: format(new Date(), 'yyyy-MM-dd'),
    weightLbs: '',
    bodyFatPercentage: '',
    skeletalMuscleMassLbs: '',
    bodyWaterLbs: '',
    notes: '',
  });

  useEffect(() => {
    getBodyMetrics().then((m) => {
      setMetrics(m);
      setLoading(false);
    });
  }, []);

  const handleSave = async () => {
    const metric: BodyMetric = {
      id: generateId(),
      date: form.date,
      weightLbs: form.weightLbs ? Number(form.weightLbs) : undefined,
      bodyFatPercentage: form.bodyFatPercentage ? Number(form.bodyFatPercentage) : undefined,
      skeletalMuscleMassLbs: form.skeletalMuscleMassLbs ? Number(form.skeletalMuscleMassLbs) : undefined,
      bodyWaterLbs: form.bodyWaterLbs ? Number(form.bodyWaterLbs) : undefined,
      notes: form.notes || undefined,
    };
    await saveBodyMetric(metric);
    setMetrics((prev) => [metric, ...prev.filter((m) => m.date !== metric.date)].sort((a, b) => b.date.localeCompare(a.date)));
    setShowForm(false);
    setForm({ date: format(new Date(), 'yyyy-MM-dd'), weightLbs: '', bodyFatPercentage: '', skeletalMuscleMassLbs: '', bodyWaterLbs: '', notes: '' });
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this entry?')) return;
    await deleteBodyMetric(id);
    setMetrics((prev) => prev.filter((m) => m.id !== id));
  };

  const chartData = [...metrics].reverse().map((m) => ({
    date: format(new Date(m.date + 'T12:00:00'), 'MMM d'),
    weight: m.weightLbs,
    bf: m.bodyFatPercentage,
    muscle: m.skeletalMuscleMassLbs,
    water: m.bodyWaterLbs,
  }));

  const latest = metrics[0];

  return (
    <div className="min-h-screen bg-white dark:bg-zinc-950">
      <div className="flex items-center justify-between px-4 pt-12 pb-4">
        <h1 className="text-xl font-bold text-zinc-900 dark:text-white">Body Metrics</h1>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-1.5 bg-blue-500 text-white px-3 py-2 rounded-xl text-sm font-semibold"
        >
          <Plus size={16} /> Log
        </button>
      </div>

      {loading ? (
        <div className="text-center py-16 text-zinc-400">Loading...</div>
      ) : (
        <div className="px-4 space-y-5">
          {/* Latest snapshot */}
          {latest && (
            <div className="grid grid-cols-2 gap-3">
              {latest.weightLbs !== undefined && (
                <Stat label="Body Weight" value={`${latest.weightLbs} lbs`} color="text-blue-500" />
              )}
              {latest.bodyFatPercentage !== undefined && (
                <Stat label="Body Fat" value={`${latest.bodyFatPercentage}%`} color="text-orange-500" />
              )}
              {latest.skeletalMuscleMassLbs !== undefined && (
                <Stat label="Skeletal Muscle" value={`${latest.skeletalMuscleMassLbs} lbs`} color="text-green-500" />
              )}
              {latest.bodyWaterLbs !== undefined && (
                <Stat label="Body Water" value={`${latest.bodyWaterLbs} lbs`} color="text-cyan-500" />
              )}
            </div>
          )}

          {/* Charts */}
          {chartData.length > 1 && (
            <div className="space-y-4">
              {chartData.some((d) => d.weight !== undefined) && (
                <ChartCard title="Body Weight (lbs)" dataKey="weight" data={chartData} color="#3b82f6" />
              )}
              {chartData.some((d) => d.bf !== undefined) && (
                <ChartCard title="Body Fat %" dataKey="bf" data={chartData} color="#f97316" />
              )}
              {chartData.some((d) => d.muscle !== undefined) && (
                <ChartCard title="Skeletal Muscle Mass (lbs)" dataKey="muscle" data={chartData} color="#22c55e" />
              )}
              {chartData.some((d) => d.water !== undefined) && (
                <ChartCard title="Body Water (lbs)" dataKey="water" data={chartData} color="#06b6d4" />
              )}
            </div>
          )}

          {/* History */}
          <div>
            <h2 className="text-sm font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide mb-3">History</h2>
            {metrics.length === 0 ? (
              <p className="text-sm text-zinc-400 dark:text-zinc-600 text-center py-8">No entries yet. Tap Log to add your first.</p>
            ) : (
              <div className="space-y-2">
                {metrics.map((m) => (
                  <div key={m.id} className="bg-zinc-100 dark:bg-zinc-900 rounded-xl px-4 py-3 flex items-start justify-between">
                    <div>
                      <p className="text-sm font-medium text-zinc-900 dark:text-white">
                        {format(new Date(m.date + 'T12:00:00'), 'EEE, MMM d, yyyy')}
                      </p>
                      <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1">
                        {m.weightLbs !== undefined && <p className="text-xs text-zinc-500">{m.weightLbs} lbs</p>}
                        {m.bodyFatPercentage !== undefined && <p className="text-xs text-zinc-500">{m.bodyFatPercentage}% BF</p>}
                        {m.skeletalMuscleMassLbs !== undefined && <p className="text-xs text-zinc-500">{m.skeletalMuscleMassLbs} lbs muscle</p>}
                        {m.bodyWaterLbs !== undefined && <p className="text-xs text-zinc-500">{m.bodyWaterLbs} lbs water</p>}
                      </div>
                      {m.notes && <p className="text-xs text-zinc-400 mt-0.5 italic">{m.notes}</p>}
                    </div>
                    <button onClick={() => handleDelete(m.id)} className="p-1.5 text-zinc-400 hover:text-red-400 mt-0.5">
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Log Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-end">
          <div className="w-full bg-white dark:bg-zinc-900 rounded-t-2xl p-5 space-y-3 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold text-zinc-900 dark:text-white">Log Body Metrics</h3>

            <div>
              <label className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">Date</label>
              <input
                type="date"
                value={form.date}
                onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
                className="mt-1 w-full bg-zinc-100 dark:bg-zinc-800 rounded-xl px-4 py-3 text-zinc-900 dark:text-white outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">Weight (lbs)</label>
                <input type="number" min={0} step={0.1} value={form.weightLbs} onChange={(e) => setForm((f) => ({ ...f, weightLbs: e.target.value }))}
                  placeholder="e.g. 185.5" className="mt-1 w-full bg-zinc-100 dark:bg-zinc-800 rounded-xl px-4 py-3 text-zinc-900 dark:text-white placeholder-zinc-400 outline-none" />
              </div>
              <div>
                <label className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">Body Fat %</label>
                <input type="number" min={0} max={100} step={0.1} value={form.bodyFatPercentage} onChange={(e) => setForm((f) => ({ ...f, bodyFatPercentage: e.target.value }))}
                  placeholder="e.g. 18.5" className="mt-1 w-full bg-zinc-100 dark:bg-zinc-800 rounded-xl px-4 py-3 text-zinc-900 dark:text-white placeholder-zinc-400 outline-none" />
              </div>
              <div>
                <label className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">Skeletal Muscle (lbs)</label>
                <input type="number" min={0} step={0.1} value={form.skeletalMuscleMassLbs} onChange={(e) => setForm((f) => ({ ...f, skeletalMuscleMassLbs: e.target.value }))}
                  placeholder="e.g. 82.3" className="mt-1 w-full bg-zinc-100 dark:bg-zinc-800 rounded-xl px-4 py-3 text-zinc-900 dark:text-white placeholder-zinc-400 outline-none" />
              </div>
              <div>
                <label className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">Body Water (lbs)</label>
                <input type="number" min={0} step={0.1} value={form.bodyWaterLbs} onChange={(e) => setForm((f) => ({ ...f, bodyWaterLbs: e.target.value }))}
                  placeholder="e.g. 95.2" className="mt-1 w-full bg-zinc-100 dark:bg-zinc-800 rounded-xl px-4 py-3 text-zinc-900 dark:text-white placeholder-zinc-400 outline-none" />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">Notes (optional)</label>
              <input type="text" value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                placeholder="e.g. Morning weigh-in, fasted" className="mt-1 w-full bg-zinc-100 dark:bg-zinc-800 rounded-xl px-4 py-3 text-zinc-900 dark:text-white placeholder-zinc-400 outline-none" />
            </div>

            <div className="flex gap-3 pt-1">
              <button onClick={() => setShowForm(false)}
                className="flex-1 py-3 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-semibold">
                Cancel
              </button>
              <button onClick={handleSave}
                className="flex-1 py-3 rounded-xl bg-blue-500 text-white font-semibold">
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Stat({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="bg-zinc-100 dark:bg-zinc-900 rounded-2xl p-3 flex flex-col gap-0.5">
      <span className={`text-xl font-bold ${color}`}>{value}</span>
      <span className="text-xs text-zinc-500 dark:text-zinc-400">{label}</span>
    </div>
  );
}

function ChartCard({ title, dataKey, data, color }: { title: string; dataKey: string; data: Record<string, unknown>[]; color: string }) {
  return (
    <div className="bg-zinc-100 dark:bg-zinc-900 rounded-2xl p-4">
      <p className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 mb-3">{title}</p>
      <ResponsiveContainer width="100%" height={160}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#3f3f46" />
          <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#71717a' }} />
          <YAxis tick={{ fontSize: 10, fill: '#71717a' }} />
          <Tooltip contentStyle={{ background: '#18181b', border: 'none', borderRadius: '8px', fontSize: '12px' }} labelStyle={{ color: '#a1a1aa' }} />
          <Line type="monotone" dataKey={dataKey} stroke={color} strokeWidth={2} dot={{ r: 3 }} connectNulls />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
