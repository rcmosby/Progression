'use client';

import { useEffect, useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { getBodyMetrics, saveBodyMetric, deleteBodyMetric } from '@/lib/db';
import { BodyMetric } from '@/lib/types';
import { generateId } from '@/lib/utils';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function BodyPage() {
  const [metrics, setMetrics] = useState<BodyMetric[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ date: format(new Date(), 'yyyy-MM-dd'), weightLbs: '', bodyFatPercentage: '', skeletalMuscleMassLbs: '', bodyWaterLbs: '', notes: '' });

  useEffect(() => { getBodyMetrics().then(m => { setMetrics(m); setLoading(false); }); }, []);

  const handleSave = async () => {
    const metric: BodyMetric = {
      id: generateId(), date: form.date,
      weightLbs: form.weightLbs ? Number(form.weightLbs) : undefined,
      bodyFatPercentage: form.bodyFatPercentage ? Number(form.bodyFatPercentage) : undefined,
      skeletalMuscleMassLbs: form.skeletalMuscleMassLbs ? Number(form.skeletalMuscleMassLbs) : undefined,
      bodyWaterLbs: form.bodyWaterLbs ? Number(form.bodyWaterLbs) : undefined,
      notes: form.notes || undefined,
    };
    await saveBodyMetric(metric);
    setMetrics(p => [metric, ...p.filter(m => m.date !== metric.date)].sort((a, b) => b.date.localeCompare(a.date)));
    setShowForm(false);
    setForm({ date: format(new Date(), 'yyyy-MM-dd'), weightLbs: '', bodyFatPercentage: '', skeletalMuscleMassLbs: '', bodyWaterLbs: '', notes: '' });
  };

  const chartData = [...metrics].reverse().map(m => ({
    date: format(new Date(m.date + 'T12:00:00'), 'MMM d'),
    weight: m.weightLbs, bf: m.bodyFatPercentage, muscle: m.skeletalMuscleMassLbs, water: m.bodyWaterLbs,
  }));

  const latest = metrics[0];
  const tooltipStyle = { background: 'var(--panel)', border: '1px solid var(--edge)', borderRadius: '8px', fontSize: '12px' };
  const labelStyle = { color: 'var(--body)' };

  const StatCard = ({ label, value, color }: { label: string; value: string; color: string }) => (
    <div className="bg-panel panel-glow rounded-2xl p-3 flex flex-col gap-0.5">
      <span className={`text-xl font-bold ${color}`}>{value}</span>
      <span className="text-xs text-dim">{label}</span>
    </div>
  );

  const ChartCard = ({ title, dataKey, color }: { title: string; dataKey: string; color: string }) => (
    <div className="bg-panel panel-glow rounded-2xl p-4">
      <p className="text-xs font-semibold text-dim mb-3">{title}</p>
      <ResponsiveContainer width="100%" height={160}>
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--edge)" />
          <XAxis dataKey="date" tick={{ fontSize: 10, fill: 'var(--dim)' }} />
          <YAxis tick={{ fontSize: 10, fill: 'var(--dim)' }} />
          <Tooltip contentStyle={tooltipStyle} labelStyle={labelStyle} />
          <Line type="monotone" dataKey={dataKey} stroke={color} strokeWidth={2} dot={{ r: 3 }} connectNulls />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );

  return (
    <div className="min-h-screen bg-page">
      <div className="flex items-center justify-between px-4 pt-12 pb-4">
        <h1 className="text-xl font-bold text-heading">Body Metrics</h1>
        <button onClick={() => setShowForm(true)}
          className="flex items-center gap-1.5 bg-brand text-white px-3 py-2 rounded-xl text-sm font-semibold">
          <Plus size={16} /> Log
        </button>
      </div>

      {loading ? <div className="text-center py-16 text-dim">Loading...</div> : (
        <div className="px-4 space-y-5">
          {latest && (
            <div className="grid grid-cols-2 gap-3">
              {latest.weightLbs !== undefined && <StatCard label="Body Weight" value={`${latest.weightLbs} lbs`} color="text-brand" />}
              {latest.bodyFatPercentage !== undefined && <StatCard label="Body Fat" value={`${latest.bodyFatPercentage}%`} color="text-orange-500" />}
              {latest.skeletalMuscleMassLbs !== undefined && <StatCard label="Skeletal Muscle" value={`${latest.skeletalMuscleMassLbs} lbs`} color="text-green-500" />}
              {latest.bodyWaterLbs !== undefined && <StatCard label="Body Water" value={`${latest.bodyWaterLbs} lbs`} color="text-cyan-500" />}
            </div>
          )}

          {chartData.length > 1 && (
            <div className="space-y-4">
              {chartData.some(d => d.weight !== undefined) && <ChartCard title="Body Weight (lbs)" dataKey="weight" color="var(--brand)" />}
              {chartData.some(d => d.bf !== undefined) && <ChartCard title="Body Fat %" dataKey="bf" color="#f97316" />}
              {chartData.some(d => d.muscle !== undefined) && <ChartCard title="Skeletal Muscle Mass (lbs)" dataKey="muscle" color="#22c55e" />}
              {chartData.some(d => d.water !== undefined) && <ChartCard title="Body Water (lbs)" dataKey="water" color="#06b6d4" />}
            </div>
          )}

          <div>
            <h2 className="text-xs font-semibold text-dim uppercase tracking-widest mb-3">History</h2>
            {metrics.length === 0 ? (
              <p className="text-sm text-dim text-center py-8">No entries yet. Tap Log to add your first.</p>
            ) : (
              <div className="space-y-2">
                {metrics.map(m => (
                  <div key={m.id} className="bg-panel panel-glow rounded-xl px-4 py-3 flex items-start justify-between">
                    <div>
                      <p className="text-sm font-medium text-heading">{format(new Date(m.date + 'T12:00:00'), 'EEE, MMM d, yyyy')}</p>
                      <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1">
                        {m.weightLbs !== undefined && <p className="text-xs text-dim">{m.weightLbs} lbs</p>}
                        {m.bodyFatPercentage !== undefined && <p className="text-xs text-dim">{m.bodyFatPercentage}% BF</p>}
                        {m.skeletalMuscleMassLbs !== undefined && <p className="text-xs text-dim">{m.skeletalMuscleMassLbs} lbs muscle</p>}
                        {m.bodyWaterLbs !== undefined && <p className="text-xs text-dim">{m.bodyWaterLbs} lbs water</p>}
                      </div>
                      {m.notes && <p className="text-xs text-dim mt-0.5 italic">{m.notes}</p>}
                    </div>
                    <button onClick={async () => { if (!confirm('Delete?')) return; await deleteBodyMetric(m.id); setMetrics(p => p.filter(x => x.id !== m.id)); }}
                      className="p-1.5 text-dim hover:text-red-500 mt-0.5"><Trash2 size={14} /></button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-end">
          <div className="w-full bg-panel rounded-t-2xl p-5 space-y-3 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold text-heading">Log Body Metrics</h3>
            <div>
              <label className="text-xs font-semibold text-dim uppercase tracking-wide">Date</label>
              <input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
                className="mt-1 w-full bg-raised border border-edge rounded-xl px-4 py-3 text-heading outline-none" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              {[
                ['Weight (lbs)', 'weightLbs', 'e.g. 185.5'],
                ['Body Fat %', 'bodyFatPercentage', 'e.g. 18.5'],
                ['Skeletal Muscle (lbs)', 'skeletalMuscleMassLbs', 'e.g. 82.3'],
                ['Body Water (lbs)', 'bodyWaterLbs', 'e.g. 95.2'],
              ].map(([label, key, ph]) => (
                <div key={key}>
                  <label className="text-xs font-semibold text-dim uppercase tracking-wide">{label}</label>
                  <input type="number" min={0} step={0.1} value={(form as Record<string, string>)[key]} placeholder={ph}
                    onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                    className="mt-1 w-full bg-raised border border-edge rounded-xl px-4 py-3 text-heading placeholder-dim outline-none" />
                </div>
              ))}
            </div>
            <div>
              <label className="text-xs font-semibold text-dim uppercase tracking-wide">Notes (optional)</label>
              <input type="text" value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                placeholder="e.g. Morning, fasted"
                className="mt-1 w-full bg-raised border border-edge rounded-xl px-4 py-3 text-heading placeholder-dim outline-none" />
            </div>
            <div className="flex gap-3 pt-1">
              <button onClick={() => setShowForm(false)} className="flex-1 py-3 rounded-xl bg-raised text-body font-semibold">Cancel</button>
              <button onClick={handleSave} className="flex-1 py-3 rounded-xl bg-brand text-white font-semibold">Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
