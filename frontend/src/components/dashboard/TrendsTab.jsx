import { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { addTrend, getTrends } from '../../utils/api';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend, AreaChart, Area } from 'recharts';
import toast from 'react-hot-toast';
import Card3D from '../3d/Card3D';
import FetalHeartbeatCard from '../3d/FetalHeartbeatCard';

const MOODS = [
  { label: 'Happy & Calm', icon: '🌸', value: 'great', color: '#2aaa8f', bg: 'rgba(61,191,168,0.12)' },
  { label: 'Energetic', icon: '✨', value: 'good', color: '#9b72cf', bg: 'rgba(155,114,207,0.12)' },
  { label: 'Relaxed', icon: '😌', value: 'okay', color: '#e6a830', bg: 'rgba(230,168,48,0.12)' },
  { label: 'Tired / Sleepy', icon: '😴', value: 'tired', color: '#f4956a', bg: 'rgba(244,149,106,0.12)' },
  { label: 'Emotional / Anxious', icon: '🥺', value: 'anxious', color: '#c94060', bg: 'rgba(242,95,122,0.12)' },
];

const SWELLING = ['None', 'Mild', 'Moderate', 'Severe'];

export default function TrendsTab() {
  const { isLoggedIn, requireLogin, healthProfile } = useApp();
  const [trends, setTrends] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [view, setView] = useState('charts');
  const [form, setForm] = useState({
    record_date: new Date().toISOString().split('T')[0],
    week_of_pregnancy: healthProfile?.week_of_pregnancy || '',
    weight: healthProfile?.weight || '',
    blood_pressure_systolic: healthProfile?.blood_pressure_systolic || '',
    blood_pressure_diastolic: healthProfile?.blood_pressure_diastolic || '',
    heart_rate: '',
    mood: 'good',
    sleep_hours: '',
    swelling_level: 'None',
    notes: ''
  });

  useEffect(() => {
    if (isLoggedIn) loadTrends();
  }, [isLoggedIn]);

  const loadTrends = async () => {
    setLoading(true);
    try {
      const res = await getTrends({ days: 90 });
      setTrends(res.data.trends || []);
    } catch {} finally { setLoading(false); }
  };

  const handleSave = async () => {
    requireLogin(async () => {
      setSaving(true);
      try {
        await addTrend(form);
        toast.success('Maternal health metrics saved! 📈🌸');
        await loadTrends();
        setView('charts');
      } catch { toast.error('Failed to save record'); }
      finally { setSaving(false); }
    });
  };

  const chartData = trends.map(t => ({
    date: new Date(t.record_date).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' }),
    weight: t.weight,
    systolic: t.blood_pressure_systolic,
    diastolic: t.blood_pressure_diastolic,
    heartRate: t.heart_rate,
    sleep: t.sleep_hours,
    week: t.week_of_pregnancy
  }));

  const latest = trends[trends.length - 1];
  const prev = trends[trends.length - 2];

  const getDiff = (key) => {
    if (!latest || !prev || !latest[key] || !prev[key]) return null;
    const diff = (latest[key] - prev[key]).toFixed(1);
    return { diff, up: diff > 0 };
  };

  const weightDiff = getDiff('weight');
  const bpDiff = latest ? `${latest.blood_pressure_systolic || '—'}/${latest.blood_pressure_diastolic || '—'}` : '—';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* 3D Fetal Heartbeat & Kick Doppler Suite */}
      <Card3D maxTilt={4} depth={10}>
        <FetalHeartbeatCard week={healthProfile?.week_of_pregnancy || latest?.week_of_pregnancy || 24} />
      </Card3D>

      {/* Latest Vitals Snapshot */}
      {latest && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: 16 }}>
          {[
            {
              label: 'Current Weight', value: `${latest.weight || '—'} kg`,
              sub: weightDiff ? `${weightDiff.up ? '+' : ''}${weightDiff.diff} kg` : null,
              subColor: weightDiff?.up ? '#c47d10' : '#2aaa8f',
              icon: '⚖️', color: '#9b72cf'
            },
            { label: 'Blood Pressure', value: bpDiff, icon: '🩺', color: '#e8639a' },
            { label: 'Heart Rate', value: `${latest.heart_rate || '—'} bpm`, icon: '❤️', color: '#c94060' },
            { label: 'Pregnancy Week', value: `Week ${latest.week_of_pregnancy || healthProfile?.week_of_pregnancy || '—'}`, icon: '🤰', color: '#2aaa8f' },
          ].map(s => (
            <Card3D key={s.label} maxTilt={8} depth={14}>
              <div className="glass-card" style={{ padding: 22, textAlign: 'center', background: 'rgba(255, 255, 255, 0.95)', height: '100%' }}>
                <div style={{ fontSize: '1.6rem', marginBottom: 6 }} className="float-soft-3d">{s.icon}</div>
                <div style={{ fontSize: '1.45rem', fontWeight: 700, color: s.color, marginBottom: 4, fontFamily: 'Playfair Display, serif' }}>{s.value}</div>
                {s.sub && <div style={{ fontSize: '0.74rem', color: s.subColor, marginBottom: 2, fontWeight: 600 }}>{s.sub} vs last check</div>}
                <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>{s.label}</div>
              </div>
            </Card3D>
          ))}
        </div>
      )}

      {/* Mood & Comfort Snapshot */}
      {latest?.mood && (
        <div className="glass-card" style={{ padding: 18, display: 'flex', alignItems: 'center', gap: 18, background: 'rgba(255, 255, 255, 0.9)' }}>
          <div style={{ fontSize: '2.4rem' }}>{MOODS.find(m => m.value === latest.mood)?.icon || '🌸'}</div>
          <div>
            <div style={{ fontSize: '0.92rem', fontWeight: 600, color: 'var(--text-primary)' }}>
              Current Mood: <span style={{ color: MOODS.find(m => m.value === latest.mood)?.color || 'var(--accent-rose)' }}>{MOODS.find(m => m.value === latest.mood)?.label || latest.mood}</span>
            </div>
            <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: 2 }}>Sleep: {latest.sleep_hours || '—'} hours • Swelling in feet/hands: {latest.swelling_level || 'None'}</div>
          </div>
          {latest.notes && <div style={{ marginLeft: 'auto', fontSize: '0.82rem', color: 'var(--text-secondary)', maxWidth: 260, fontStyle: 'italic' }}>"{latest.notes}"</div>}
        </div>
      )}

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 10 }}>
        {[
          { key: 'charts', label: 'Trend Charts', icon: '📈' },
          { key: 'record', label: 'Add Health Record', icon: '➕' },
          { key: 'history', label: 'Past Records', icon: '📋' },
        ].map(t => (
          <button key={t.key} onClick={() => setView(t.key)}
            style={{
              padding: '9px 18px', borderRadius: 12, border: '1px solid', cursor: 'pointer', fontSize: '0.86rem', fontWeight: 600, fontFamily: 'Inter, sans-serif',
              background: view === t.key ? 'linear-gradient(135deg, rgba(232, 99, 154, 0.15), rgba(155, 114, 207, 0.15))' : 'rgba(255, 255, 255, 0.75)',
              borderColor: view === t.key ? 'rgba(232, 99, 154, 0.4)' : 'rgba(232, 99, 154, 0.18)',
              color: view === t.key ? 'var(--accent-rose)' : 'var(--text-secondary)',
              boxShadow: view === t.key ? '0 2px 10px rgba(232, 99, 154, 0.12)' : 'none',
              transition: 'all 0.2s'
            }}>
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {/* CHARTS */}
      {view === 'charts' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {trends.length < 2 ? (
            <div className="glass-card" style={{ padding: 40, textAlign: 'center', background: 'rgba(255, 255, 255, 0.9)' }}>
              <div style={{ fontSize: '3rem', marginBottom: 14 }}>📈</div>
              <h4 style={{ marginBottom: 8, fontSize: '1.15rem' }}>No trend records yet</h4>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', marginBottom: 20 }}>Log your vitals regularly to monitor pregnancy progress charts</p>
              <button className="btn-primary" onClick={() => setView('record')}>➕ Log First Record</button>
            </div>
          ) : (
            <>
              {/* Weight Trend */}
              <div className="glass-card" style={{ padding: 24, background: 'rgba(255, 255, 255, 0.9)' }}>
                <h4 style={{ marginBottom: 16, fontSize: '0.98rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 8 }}>⚖️ Weight Progression (kg)</h4>
                <ResponsiveContainer width="100%" height={210}>
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="weightGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#e8639a" stopOpacity={0.35} />
                        <stop offset="95%" stopColor="#e8639a" stopOpacity={0.02} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(232, 99, 154, 0.14)" />
                    <XAxis dataKey="date" tick={{ fill: 'var(--text-secondary)', fontSize: 10 }} />
                    <YAxis tick={{ fill: 'var(--text-secondary)', fontSize: 10 }} domain={['dataMin - 2', 'dataMax + 2']} />
                    <Tooltip contentStyle={{ background: 'rgba(255, 248, 252, 0.98)', border: '1px solid rgba(232, 99, 154, 0.25)', borderRadius: 10, fontSize: '0.8rem', color: 'var(--text-primary)' }} />
                    <Area type="monotone" dataKey="weight" stroke="#e8639a" strokeWidth={2.5} fill="url(#weightGrad)" name="Weight (kg)" dot={{ fill: '#e8639a', r: 4 }} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              {/* Blood Pressure */}
              <div className="glass-card" style={{ padding: 24, background: 'rgba(255, 255, 255, 0.9)' }}>
                <h4 style={{ marginBottom: 16, fontSize: '0.98rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 8 }}>🩺 Blood Pressure Monitor (mmHg)</h4>
                <ResponsiveContainer width="100%" height={210}>
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(232, 99, 154, 0.14)" />
                    <XAxis dataKey="date" tick={{ fill: 'var(--text-secondary)', fontSize: 10 }} />
                    <YAxis tick={{ fill: 'var(--text-secondary)', fontSize: 10 }} />
                    <Tooltip contentStyle={{ background: 'rgba(255, 248, 252, 0.98)', border: '1px solid rgba(232, 99, 154, 0.25)', borderRadius: 10, fontSize: '0.8rem', color: 'var(--text-primary)' }} />
                    <Legend wrapperStyle={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }} />
                    <Line type="monotone" dataKey="systolic" stroke="#9b72cf" strokeWidth={2.5} name="Systolic (mmHg)" dot={{ fill: '#9b72cf', r: 4 }} />
                    <Line type="monotone" dataKey="diastolic" stroke="#3dbfa8" strokeWidth={2} name="Diastolic (mmHg)" dot={{ fill: '#3dbfa8', r: 3 }} strokeDasharray="4 4" />
                    <Line type="monotone" dataKey={() => 140} stroke="rgba(242,95,122,0.4)" strokeWidth={1} strokeDasharray="8 4" name="Target Upper BP (140)" dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              {/* Sleep Hours Chart */}
              <div className="glass-card" style={{ padding: 24, background: 'rgba(255, 255, 255, 0.9)' }}>
                <h4 style={{ marginBottom: 16, fontSize: '0.98rem', color: 'var(--text-secondary)' }}>😴 Sleep Duration (Hours)</h4>
                <ResponsiveContainer width="100%" height={170}>
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="sleepGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3dbfa8" stopOpacity={0.35} />
                        <stop offset="95%" stopColor="#3dbfa8" stopOpacity={0.02} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(232, 99, 154, 0.14)" />
                    <XAxis dataKey="date" tick={{ fill: 'var(--text-secondary)', fontSize: 10 }} />
                    <YAxis tick={{ fill: 'var(--text-secondary)', fontSize: 10 }} domain={[0, 12]} />
                    <Tooltip contentStyle={{ background: 'rgba(255, 248, 252, 0.98)', border: '1px solid rgba(232, 99, 154, 0.25)', borderRadius: 10, fontSize: '0.8rem', color: 'var(--text-primary)' }} />
                    <Area type="monotone" dataKey="sleep" stroke="#3dbfa8" strokeWidth={2.5} fill="url(#sleepGrad)" name="Sleep (hrs)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </>
          )}
        </div>
      )}

      {/* RECORD FORM */}
      {view === 'record' && (
        <div className="glass-card" style={{ padding: 32, maxWidth: 620, background: 'rgba(255, 255, 255, 0.92)' }}>
          <h3 style={{ fontSize: '1.25rem', marginBottom: 22, fontFamily: 'Playfair Display, serif', color: 'var(--text-primary)' }}>📊 Record Today's Vitals</h3>

          <div className="grid-2" style={{ marginBottom: 16 }}>
            <div>
              <label className="form-label">Record Date</label>
              <input type="date" value={form.record_date} onChange={e => setForm(f => ({ ...f, record_date: e.target.value }))} className="neuro-input" />
            </div>
            <div>
              <label className="form-label">Pregnancy Week</label>
              <input type="number" value={form.week_of_pregnancy} onChange={e => setForm(f => ({ ...f, week_of_pregnancy: e.target.value }))} className="neuro-input" placeholder="e.g. 24" min="1" max="42" />
            </div>
          </div>

          <div className="grid-2" style={{ marginBottom: 16 }}>
            <div>
              <label className="form-label">Current Weight (kg)</label>
              <input type="number" value={form.weight} onChange={e => setForm(f => ({ ...f, weight: e.target.value }))} className="neuro-input" placeholder="e.g. 66" step="0.1" />
            </div>
            <div>
              <label className="form-label">Resting Heart Rate (bpm)</label>
              <input type="number" value={form.heart_rate} onChange={e => setForm(f => ({ ...f, heart_rate: e.target.value }))} className="neuro-input" placeholder="e.g. 80" />
            </div>
          </div>

          <div style={{ marginBottom: 16 }}>
            <label className="form-label">Blood Pressure (mmHg)</label>
            <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
              <input type="number" value={form.blood_pressure_systolic} onChange={e => setForm(f => ({ ...f, blood_pressure_systolic: e.target.value }))} className="neuro-input" placeholder="Systolic (e.g. 120)" />
              <span style={{ color: 'var(--text-muted)' }}>/</span>
              <input type="number" value={form.blood_pressure_diastolic} onChange={e => setForm(f => ({ ...f, blood_pressure_diastolic: e.target.value }))} className="neuro-input" placeholder="Diastolic (e.g. 80)" />
            </div>
          </div>

          <div className="grid-2" style={{ marginBottom: 16 }}>
            <div>
              <label className="form-label">Sleep (Hours)</label>
              <input type="number" value={form.sleep_hours} onChange={e => setForm(f => ({ ...f, sleep_hours: e.target.value }))} className="neuro-input" placeholder="e.g. 8.5" min="0" max="24" step="0.5" />
            </div>
            <div>
              <label className="form-label">Swelling Level</label>
              <select value={form.swelling_level} onChange={e => setForm(f => ({ ...f, swelling_level: e.target.value }))} className="neuro-input" style={{ paddingTop: 11, paddingBottom: 11 }}>
                {SWELLING.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>

          <div style={{ marginBottom: 16 }}>
            <label className="form-label">Mood Today</label>
            <div style={{ display: 'flex', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
              {MOODS.map(m => (
                <button key={m.value} onClick={() => setForm(f => ({ ...f, mood: m.value }))}
                  style={{
                    padding: '8px 14px', borderRadius: 12, border: '1px solid', cursor: 'pointer', fontSize: '0.84rem', fontFamily: 'Inter, sans-serif', fontWeight: 500,
                    background: form.mood === m.value ? m.bg : 'rgba(255,255,255,0.8)',
                    borderColor: form.mood === m.value ? m.color : 'rgba(232, 99, 154, 0.18)',
                    color: form.mood === m.value ? m.color : 'var(--text-secondary)',
                    transition: 'all 0.2s'
                  }}>{m.icon} {m.label}</button>
              ))}
            </div>
          </div>

          <div style={{ marginBottom: 24 }}>
            <label className="form-label">Special Notes / Baby Kicks</label>
            <input value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} className="neuro-input" placeholder="e.g. Baby kicked after dinner, felt happy and relaxed" />
          </div>

          <div style={{ display: 'flex', gap: 14 }}>
            <button className="btn-secondary" onClick={() => setView('charts')} style={{ flex: 1 }}>Cancel</button>
            <button className="btn-primary" onClick={handleSave} disabled={saving} style={{ flex: 1, justifyContent: 'center' }}>
              {saving ? <span className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }}></span> : '🌸 Save Health Metrics'}
            </button>
          </div>
        </div>
      )}

      {/* HISTORY TABLE */}
      {view === 'history' && (
        <div className="glass-card" style={{ overflow: 'hidden', background: 'rgba(255, 255, 255, 0.9)' }}>
          <div style={{ padding: '16px 22px', borderBottom: '1px solid rgba(232, 99, 154, 0.12)' }}>
            <h4 style={{ fontSize: '0.98rem', color: 'var(--text-primary)' }}>Past Maternal Health Records</h4>
          </div>
          {trends.length === 0 ? (
            <div style={{ padding: 36, textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.88rem' }}>No trend records recorded yet</div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table className="glass-table">
                <thead>
                  <tr><th>Date</th><th>Week</th><th>Weight</th><th>BP</th><th>Heart Rate</th><th>Sleep</th><th>Mood</th><th>Swelling</th></tr>
                </thead>
                <tbody>
                  {[...trends].reverse().map((t, i) => (
                    <tr key={i}>
                      <td>{t.record_date}</td>
                      <td style={{ color: 'var(--accent-purple)', fontWeight: 600 }}>W{t.week_of_pregnancy || '—'}</td>
                      <td style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{t.weight ? `${t.weight} kg` : '—'}</td>
                      <td>{t.blood_pressure_systolic && t.blood_pressure_diastolic ? `${t.blood_pressure_systolic}/${t.blood_pressure_diastolic}` : '—'}</td>
                      <td>{t.heart_rate ? `${t.heart_rate} bpm` : '—'}</td>
                      <td>{t.sleep_hours ? `${t.sleep_hours} hrs` : '—'}</td>
                      <td>{MOODS.find(m => m.value === t.mood)?.icon || '—'} {MOODS.find(m => m.value === t.mood)?.label || t.mood || '—'}</td>
                      <td><span style={{ fontSize: '0.82rem', color: t.swelling_level === 'Severe' ? '#c94060' : t.swelling_level === 'Moderate' ? '#c47d10' : 'var(--text-secondary)' }}>{t.swelling_level || '—'}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
