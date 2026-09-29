import { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { getMedications, addMedication, deleteMedication, logMedication, getMedicationLogs, getMedicationAdherence, getTodaySchedule } from '../../utils/api';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import toast from 'react-hot-toast';

const FREQUENCIES = ['Once daily', 'Twice daily', 'Three times daily', 'Four times daily', 'Weekly', 'As needed'];
const DEFAULT_TIMES = {
  'Once daily': ['08:00'],
  'Twice daily': ['08:00', '20:00'],
  'Three times daily': ['08:00', '14:00', '20:00'],
  'Four times daily': ['08:00', '12:00', '16:00', '20:00'],
  'Weekly': ['08:00'],
  'As needed': ['08:00'],
};

export default function MedicationTab() {
  const { isLoggedIn, requireLogin } = useApp();
  const [medications, setMedications] = useState([]);
  const [todaySchedule, setTodaySchedule] = useState([]);
  const [adherence, setAdherence] = useState(null);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ name: '', dosage: '', frequency: 'Once daily', times: ['08:00'], start_date: '', notes: '' });
  const [view, setView] = useState('today');

  useEffect(() => {
    if (isLoggedIn) loadData();
  }, [isLoggedIn]);

  const loadData = async () => {
    try {
      const [medsRes, schedRes, adherRes, logsRes] = await Promise.all([
        getMedications(), getTodaySchedule(), getMedicationAdherence({ days: 30 }),
        getMedicationLogs({ from: new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0] })
      ]);
      setMedications(medsRes.data.medications || []);
      setTodaySchedule(schedRes.data.schedule || []);
      setAdherence(adherRes.data.stats || null);
      setLogs(logsRes.data.logs || []);
    } catch (err) {
      console.error('Load medication data error:', err);
    }
  };

  const handleFrequencyChange = (freq) => {
    setForm(f => ({ ...f, frequency: freq, times: DEFAULT_TIMES[freq] || ['08:00'] }));
  };

  const handleTimeChange = (idx, val) => {
    setForm(f => ({ ...f, times: f.times.map((t, i) => i === idx ? val : t) }));
  };

  const handleAdd = async () => {
    requireLogin(async () => {
      if (!form.name || !form.dosage) { toast.error('Medication name and dosage required'); return; }
      setLoading(true);
      try {
        await addMedication(form);
        toast.success(`${form.name} prescription added! 💊🌸`);
        setForm({ name: '', dosage: '', frequency: 'Once daily', times: ['08:00'], start_date: '', notes: '' });
        setView('today');
        await loadData();
        if ('Notification' in window && Notification.permission === 'default') {
          Notification.requestPermission();
        }
      } catch { toast.error('Failed to add medication'); }
      finally { setLoading(false); }
    });
  };

  const handleMarkStatus = async (medId, scheduledTime, status) => {
    requireLogin(async () => {
      try {
        const today = new Date().toISOString().split('T')[0];
        await logMedication({ medication_id: medId, scheduled_time: scheduledTime, actual_time: status === 'taken' ? new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) : null, status, log_date: today });
        toast.success(status === 'taken' ? '✅ Marked as Taken' : '❌ Marked as Missed');
        await loadData();
      } catch { toast.error('Failed to log medication'); }
    });
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Remove ${name}?`)) return;
    try {
      await deleteMedication(id);
      toast.success(`${name} removed`);
      await loadData();
    } catch { toast.error('Failed to remove medication'); }
  };

  const adheranceRate = adherence?.adherence_rate || 0;
  const adherenceColor = adheranceRate >= 80 ? '#2aaa8f' : adheranceRate >= 60 ? '#c47d10' : '#c94060';

  const logsByDay = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, i) => {
    const dayLogs = logs.filter(l => {
      const d = new Date(l.log_date);
      return d.getDay() === (i + 1) % 7;
    });
    const taken = dayLogs.filter(l => l.status === 'taken').length;
    const missed = dayLogs.filter(l => l.status === 'missed').length;
    return { day, taken, missed };
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Adherence Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: 16 }}>
        {[
          { label: 'Adherence Rate', value: `${adheranceRate}%`, color: adherenceColor, icon: '📊' },
          { label: 'Doses Taken', value: adherence?.taken || 0, color: '#2aaa8f', icon: '✅' },
          { label: 'Doses Missed', value: adherence?.missed || 0, color: '#c94060', icon: '❌' },
          { label: 'Active Meds', value: medications.length, color: '#9b72cf', icon: '💊' },
        ].map(s => (
          <div key={s.label} className="glass-card" style={{ padding: 22, textAlign: 'center', background: 'rgba(255, 255, 255, 0.9)' }}>
            <div style={{ fontSize: '1.6rem', marginBottom: 6 }}>{s.icon}</div>
            <div style={{ fontSize: '1.7rem', fontWeight: 700, color: s.color, marginBottom: 4, fontFamily: 'Playfair Display, serif' }}>{s.value}</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Adherence Progress Card */}
      {adherence && (
        <div className="glass-card" style={{ padding: 22, background: 'rgba(255, 255, 255, 0.9)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <span style={{ fontSize: '0.92rem', fontWeight: 600, color: 'var(--text-primary)' }}>30-Day Medication Adherence</span>
            <span style={{ color: adherenceColor, fontWeight: 700, fontSize: '1.05rem' }}>{adheranceRate}%</span>
          </div>
          <div className="progress-bar" style={{ height: 10, background: 'rgba(155, 114, 207, 0.12)' }}>
            <div className="progress-fill" style={{ width: `${adheranceRate}%`, background: `linear-gradient(90deg, ${adherenceColor}90, ${adherenceColor})` }} />
          </div>
          <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: 8 }}>
            {adheranceRate >= 80 ? '🎉 Wonderful consistency! Regular medicine timing protects both you and baby.' : adheranceRate >= 60 ? '⚠️ Keep a water bottle near your medicines as a visual reminder.' : '❗ Please take your prescribed vitamins & medications regularly.'}
          </div>
        </div>
      )}

      {/* Tab Navigation */}
      <div style={{ display: 'flex', gap: 10 }}>
        {[
          { key: 'today', label: "Today's Schedule", icon: '📅' },
          { key: 'history', label: 'Adherence History', icon: '📋' },
          { key: 'add', label: 'Add Medication', icon: '➕' },
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

      {/* TODAY'S SCHEDULE */}
      {view === 'today' && (
        <div>
          {todaySchedule.length === 0 ? (
            <div className="glass-card" style={{ padding: 40, textAlign: 'center', background: 'rgba(255, 255, 255, 0.9)' }}>
              <div style={{ fontSize: '3rem', marginBottom: 12 }}>💊</div>
              <h4 style={{ marginBottom: 8, fontSize: '1.15rem' }}>No medications scheduled yet</h4>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', marginBottom: 20 }}>Add your prenatal prescriptions, iron, calcium, or vitamins to set alarms and track adherence</p>
              <button className="btn-primary" onClick={() => setView('add')}>➕ Add Medication</button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {todaySchedule.map(med => (
                <div key={med.id} className="glass-card" style={{ padding: 22, background: 'rgba(255, 255, 255, 0.9)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                    <div>
                      <h4 style={{ fontSize: '1.1rem', color: 'var(--text-primary)', marginBottom: 6 }}>💊 {med.name}</h4>
                      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                        <span className="tag">💉 Dosage: {med.dosage}</span>
                        <span className="tag" style={{ background: 'rgba(230,168,48,0.1)', borderColor: 'rgba(230,168,48,0.25)', color: '#c47d10' }}>🔄 {med.frequency}</span>
                      </div>
                    </div>
                    <button onClick={() => handleDelete(med.id, med.name)} className="btn-secondary" style={{ padding: '5px 12px', fontSize: '0.76rem', color: '#c94060', borderColor: 'rgba(242,95,122,0.3)' }}>Remove</button>
                  </div>

                  {/* Time slots */}
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
                    {(med.logs || []).map((log, i) => {
                      const statusConfig = {
                        taken: { color: '#2aaa8f', bg: 'rgba(61,191,168,0.12)', border: 'rgba(61,191,168,0.3)', label: '✅ Taken' },
                        missed: { color: '#c94060', bg: 'rgba(242,95,122,0.1)', border: 'rgba(242,95,122,0.3)', label: '❌ Missed' },
                        pending: { color: '#c47d10', bg: 'rgba(230,168,48,0.12)', border: 'rgba(230,168,48,0.3)', label: '⏰ Due' },
                      }[log.status] || {};

                      return (
                        <div key={i} style={{ flex: '1 1 150px', padding: 14, borderRadius: 12, background: statusConfig.bg, border: `1px solid ${statusConfig.border}`, textAlign: 'center' }}>
                          <div style={{ fontSize: '1.05rem', fontWeight: 700, color: statusConfig.color, marginBottom: 4 }}>{log.time}</div>
                          <div style={{ fontSize: '0.78rem', color: statusConfig.color, marginBottom: 10, fontWeight: 600 }}>{statusConfig.label}</div>
                          {log.status === 'pending' && (
                            <div style={{ display: 'flex', gap: 6 }}>
                              <button onClick={() => handleMarkStatus(med.id, log.time, 'taken')} className="btn-success" style={{ flex: 1, padding: '6px 8px', fontSize: '0.75rem' }}>✓ Taken</button>
                              <button onClick={() => handleMarkStatus(med.id, log.time, 'missed')} className="btn-danger" style={{ flex: 1, padding: '6px 8px', fontSize: '0.75rem' }}>✗ Skip</button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {med.notes && <div style={{ marginTop: 14, fontSize: '0.84rem', color: 'var(--text-secondary)' }}>📝 Note: {med.notes}</div>}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* HISTORY */}
      {view === 'history' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {/* Bar Chart */}
          <div className="glass-card" style={{ padding: 24, background: 'rgba(255, 255, 255, 0.9)' }}>
            <h4 style={{ marginBottom: 16, fontSize: '0.98rem', color: 'var(--text-secondary)' }}>Weekly Adherence Pattern</h4>
            <ResponsiveContainer width="100%" height={210}>
              <BarChart data={logsByDay}>
                <XAxis dataKey="day" tick={{ fill: 'var(--text-secondary)', fontSize: 11 }} />
                <YAxis tick={{ fill: 'var(--text-secondary)', fontSize: 10 }} />
                <Tooltip contentStyle={{ background: 'rgba(255, 248, 252, 0.98)', border: '1px solid rgba(232, 99, 154, 0.25)', borderRadius: 10, fontSize: '0.8rem', color: 'var(--text-primary)' }} />
                <Bar dataKey="taken" fill="#3dbfa8" radius={[4,4,0,0]} name="Taken" />
                <Bar dataKey="missed" fill="#f25f7a" radius={[4,4,0,0]} name="Missed" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Table */}
          <div className="glass-card" style={{ overflow: 'hidden', background: 'rgba(255, 255, 255, 0.9)' }}>
            <div style={{ padding: '16px 22px', borderBottom: '1px solid rgba(232, 99, 154, 0.12)' }}>
              <h4 style={{ fontSize: '0.98rem', color: 'var(--text-primary)' }}>Recent Medication Logs</h4>
            </div>
            {logs.length === 0 ? (
              <div style={{ padding: 28, textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.88rem' }}>No medication logs recorded yet</div>
            ) : (
              <table className="glass-table">
                <thead><tr><th>Date</th><th>Medication</th><th>Scheduled Time</th><th>Status</th></tr></thead>
                <tbody>
                  {logs.slice(0, 20).map((log, i) => (
                    <tr key={i}>
                      <td>{log.log_date}</td>
                      <td style={{ color: 'var(--text-primary)', fontWeight: 600 }}>💊 {log.name}</td>
                      <td>{log.scheduled_time}</td>
                      <td>
                        <span className="status-badge" style={{
                          background: log.status === 'taken' ? 'rgba(61,191,168,0.12)' : log.status === 'missed' ? 'rgba(242,95,122,0.1)' : 'rgba(230,168,48,0.12)',
                          color: log.status === 'taken' ? '#2aaa8f' : log.status === 'missed' ? '#c94060' : '#c47d10',
                          border: `1px solid ${log.status === 'taken' ? 'rgba(61,191,168,0.3)' : log.status === 'missed' ? 'rgba(242,95,122,0.3)' : 'rgba(230,168,48,0.3)'}`
                        }}>
                          {log.status === 'taken' ? '✅' : log.status === 'missed' ? '❌' : '⏰'} {log.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* ADD MEDICATION FORM */}
      {view === 'add' && (
        <div className="glass-card" style={{ padding: 32, maxWidth: 600, background: 'rgba(255, 255, 255, 0.92)' }}>
          <h3 style={{ fontSize: '1.25rem', marginBottom: 22, fontFamily: 'Playfair Display, serif', color: 'var(--text-primary)' }}>➕ Add New Prescription</h3>
          <div className="grid-2" style={{ marginBottom: 16 }}>
            <div>
              <label className="form-label">Medication Name</label>
              <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className="neuro-input" placeholder="e.g. Folic Acid / Iron" />
            </div>
            <div>
              <label className="form-label">Dosage</label>
              <input value={form.dosage} onChange={e => setForm(f => ({ ...f, dosage: e.target.value }))} className="neuro-input" placeholder="e.g. 5mg or 1 Tablet" />
            </div>
          </div>

          <div style={{ marginBottom: 16 }}>
            <label className="form-label">Frequency</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 8 }}>
              {FREQUENCIES.map(f => (
                <button key={f} onClick={() => handleFrequencyChange(f)}
                  style={{
                    padding: '8px 15px', borderRadius: 10, border: '1px solid', cursor: 'pointer', fontSize: '0.82rem', fontFamily: 'Inter, sans-serif', fontWeight: 500,
                    background: form.frequency === f ? 'linear-gradient(135deg, rgba(232, 99, 154, 0.18), rgba(155, 114, 207, 0.15))' : 'rgba(255, 255, 255, 0.8)',
                    borderColor: form.frequency === f ? 'rgba(232, 99, 154, 0.45)' : 'rgba(232, 99, 154, 0.18)',
                    color: form.frequency === f ? 'var(--accent-rose)' : 'var(--text-secondary)',
                    transition: 'all 0.2s'
                  }}>{f}</button>
              ))}
            </div>
          </div>

          <div style={{ marginBottom: 16 }}>
            <label className="form-label">Scheduled Times</label>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 8 }}>
              {form.times.map((t, i) => (
                <input key={i} type="time" value={t} onChange={e => handleTimeChange(i, e.target.value)} className="neuro-input" style={{ width: 140 }} />
              ))}
            </div>
          </div>

          <div className="grid-2" style={{ marginBottom: 16 }}>
            <div>
              <label className="form-label">Start Date</label>
              <input type="date" value={form.start_date} onChange={e => setForm(f => ({ ...f, start_date: e.target.value }))} className="neuro-input" />
            </div>
          </div>

          <div style={{ marginBottom: 24 }}>
            <label className="form-label">Doctor's Instructions / Notes</label>
            <input value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} className="neuro-input" placeholder="e.g. Take with warm milk or after meals" />
          </div>

          <div style={{ display: 'flex', gap: 14 }}>
            <button className="btn-secondary" onClick={() => setView('today')} style={{ flex: 1 }}>Cancel</button>
            <button className="btn-primary" onClick={handleAdd} disabled={loading} style={{ flex: 1, justifyContent: 'center' }}>
              {loading ? <span className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }}></span> : '💊 Save Medication'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
