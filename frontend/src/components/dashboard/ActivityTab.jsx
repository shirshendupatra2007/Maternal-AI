import { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { logActivity, getWeeklyActivities, getActivityHistory, getExercises } from '../../utils/api';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import toast from 'react-hot-toast';

const INTENSITIES = ['low', 'moderate', 'high'];
const INTENSITY_CONFIG = {
  low: { color: '#2aaa8f', bg: 'rgba(61,191,168,0.12)', border: 'rgba(61,191,168,0.3)' },
  moderate: { color: '#c47d10', bg: 'rgba(230,168,48,0.12)', border: 'rgba(230,168,48,0.3)' },
  high: { color: '#c94060', bg: 'rgba(242,95,122,0.12)', border: 'rgba(242,95,122,0.3)' }
};

export default function ActivityTab() {
  const { isLoggedIn, requireLogin } = useApp();
  const [weekly, setWeekly] = useState(null);
  const [exercises, setExercises] = useState([]);
  const [history, setHistory] = useState([]);
  const [view, setView] = useState('log');
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    activity_date: new Date().toISOString().split('T')[0],
    exercise_type: '',
    duration_minutes: '',
    steps: '',
    is_rest_day: false,
    intensity: 'low',
    notes: ''
  });

  useEffect(() => {
    getExercises().then(res => setExercises(res.data.exercises || [])).catch(() => {});
    if (isLoggedIn) {
      loadData();
    }
  }, [isLoggedIn]);

  const loadData = async () => {
    try {
      const [weekRes, histRes] = await Promise.all([
        getWeeklyActivities(),
        getActivityHistory({ days: 30 })
      ]);
      setWeekly(weekRes.data);
      setHistory(histRes.data.activities || []);
    } catch {}
  };

  const handleSubmit = async () => {
    requireLogin(async () => {
      setLoading(true);
      try {
        await logActivity(form);
        toast.success(form.is_rest_day ? '😌 Gentle rest day recorded! 🌸' : '💪 Activity recorded! Keep moving gently 🌸');
        setForm(f => ({ ...f, exercise_type: '', duration_minutes: '', steps: '', notes: '', is_rest_day: false }));
        await loadData();
      } catch { toast.error('Failed to log activity'); }
      finally { setLoading(false); }
    });
  };

  const weeklyPattern = weekly?.weekly_pattern || [];
  const totalDuration = weekly?.total_duration || 0;
  const totalSteps = weekly?.total_steps || 0;
  const restDays = weekly?.rest_days || 0;

  const patternData = weeklyPattern.map(p => ({
    day: p.day.slice(0, 3),
    duration: p.activity?.duration_minutes || 0,
    steps: Math.round((p.activity?.steps || 0) / 100),
    rest: p.activity?.is_rest_day ? 1 : 0
  }));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Top Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 16 }}>
        {[
          { label: 'Active Duration', value: `${totalDuration}m`, color: '#e8639a', icon: '⏱️' },
          { label: 'Total Steps', value: totalSteps.toLocaleString(), color: '#3dbfa8', icon: '👟' },
          { label: 'Rest Days', value: restDays, color: '#9b72cf', icon: '😌' },
          { label: 'Active Days', value: weeklyPattern.filter(p => p.activity && !p.activity.is_rest_day).length, color: '#e6a830', icon: '🏃‍♀️' },
        ].map(s => (
          <div key={s.label} className="glass-card" style={{ padding: 22, textAlign: 'center', background: 'rgba(255, 255, 255, 0.9)' }}>
            <div style={{ fontSize: '1.6rem', marginBottom: 6 }}>{s.icon}</div>
            <div style={{ fontSize: '1.65rem', fontWeight: 700, color: s.color, marginBottom: 4, fontFamily: 'Playfair Display, serif' }}>{s.value}</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Weekly Pattern Chart */}
      <div className="glass-card" style={{ padding: 24, background: 'rgba(255, 255, 255, 0.9)' }}>
        <h4 style={{ marginBottom: 16, fontSize: '0.98rem', color: 'var(--text-secondary)' }}>📊 Weekly Activity & Rest Patterns</h4>
        <ResponsiveContainer width="100%" height={190}>
          <BarChart data={patternData}>
            <XAxis dataKey="day" tick={{ fill: 'var(--text-secondary)', fontSize: 11 }} />
            <YAxis tick={{ fill: 'var(--text-secondary)', fontSize: 10 }} />
            <Tooltip contentStyle={{ background: 'rgba(255, 248, 252, 0.98)', border: '1px solid rgba(232, 99, 154, 0.25)', borderRadius: 10, fontSize: '0.8rem', color: 'var(--text-primary)' }}
              formatter={(v, name) => [name === 'steps' ? `${v * 100} steps` : `${v} min`, name]} />
            <Bar dataKey="duration" fill="#e8639a" radius={[4,4,0,0]} name="Duration (min)" />
            <Bar dataKey="steps" fill="#3dbfa8" radius={[4,4,0,0]} name="Steps (÷100)" />
          </BarChart>
        </ResponsiveContainer>
        {/* Day circles */}
        <div style={{ display: 'flex', gap: 10, marginTop: 14, justifyContent: 'center', flexWrap: 'wrap' }}>
          {weeklyPattern.map((p, i) => {
            const hasActivity = p.activity;
            const isRest = p.activity?.is_rest_day;
            return (
              <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                <div style={{
                  width: 38, height: 38, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.05rem',
                  background: isRest ? 'rgba(155, 114, 207, 0.15)' : hasActivity ? 'rgba(232, 99, 154, 0.15)' : 'rgba(255, 255, 255, 0.75)',
                  border: `1px solid ${isRest ? 'rgba(155, 114, 207, 0.35)' : hasActivity ? 'rgba(232, 99, 154, 0.35)' : 'rgba(232, 99, 154, 0.15)'}`,
                  color: isRest ? '#9b72cf' : hasActivity ? '#e8639a' : 'var(--text-muted)'
                }}>
                  {isRest ? '😌' : hasActivity ? '✓' : '○'}
                </div>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', fontWeight: 500 }}>{p.day.slice(0, 3)}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Navigation tabs */}
      <div style={{ display: 'flex', gap: 10 }}>
        {[
          { key: 'log', label: 'Log Activity', icon: '📝' },
          { key: 'exercises', label: 'Doctor-Approved Exercises', icon: '🏋️‍♀️' },
          { key: 'history', label: 'Activity History', icon: '📅' },
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

      {/* LOG ACTIVITY */}
      {view === 'log' && (
        <div className="glass-card" style={{ padding: 30, maxWidth: 620, background: 'rgba(255, 255, 255, 0.92)' }}>
          <h3 style={{ fontSize: '1.2rem', marginBottom: 20, fontFamily: 'Playfair Display, serif', color: 'var(--text-primary)' }}>📝 Log Today's Physical Movement</h3>

          {/* Rest day toggle */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 22, padding: '14px 18px', borderRadius: 14, background: form.is_rest_day ? 'rgba(155, 114, 207, 0.1)' : 'rgba(255, 255, 255, 0.75)', border: `1px solid ${form.is_rest_day ? 'rgba(155, 114, 207, 0.35)' : 'rgba(232, 99, 154, 0.15)'}`, cursor: 'pointer', transition: 'all 0.2s' }}
            onClick={() => setForm(f => ({ ...f, is_rest_day: !f.is_rest_day }))}>
            <div style={{ width: 44, height: 24, borderRadius: 12, background: form.is_rest_day ? 'var(--accent-purple)' : 'rgba(200, 180, 200, 0.4)', position: 'relative', transition: 'all 0.3s' }}>
              <div style={{ width: 20, height: 20, borderRadius: '50%', background: 'white', position: 'absolute', top: 2, left: form.is_rest_day ? 22 : 2, transition: 'all 0.3s', boxShadow: '0 2px 4px rgba(0,0,0,0.15)' }} />
            </div>
            <div>
              <span style={{ fontSize: '0.92rem', fontWeight: 600, color: 'var(--text-primary)' }}>😌 This is a well-deserved rest day</span>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: 2 }}>Resting is vital for your baby's cell growth and blood supply</p>
            </div>
          </div>

          {!form.is_rest_day && (
            <>
              <div className="grid-2" style={{ marginBottom: 16 }}>
                <div>
                  <label className="form-label">Activity Date</label>
                  <input type="date" value={form.activity_date} onChange={e => setForm(f => ({ ...f, activity_date: e.target.value }))} className="neuro-input" />
                </div>
                <div>
                  <label className="form-label">Exercise Type</label>
                  <input value={form.exercise_type} onChange={e => setForm(f => ({ ...f, exercise_type: e.target.value }))} className="neuro-input" placeholder="e.g. Prenatal Yoga / Walking" list="exercise-list" />
                  <datalist id="exercise-list">
                    {exercises.map(e => <option key={e.name} value={e.name} />)}
                  </datalist>
                </div>
              </div>

              <div className="grid-2" style={{ marginBottom: 16 }}>
                <div>
                  <label className="form-label">Duration (minutes)</label>
                  <input type="number" value={form.duration_minutes} onChange={e => setForm(f => ({ ...f, duration_minutes: e.target.value }))} className="neuro-input" placeholder="e.g. 25" min="1" max="300" />
                </div>
                <div>
                  <label className="form-label">Steps Count</label>
                  <input type="number" value={form.steps} onChange={e => setForm(f => ({ ...f, steps: e.target.value }))} className="neuro-input" placeholder="e.g. 3500" min="0" />
                </div>
              </div>

              <div style={{ marginBottom: 16 }}>
                <label className="form-label">Intensity Level</label>
                <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
                  {INTENSITIES.map(intens => (
                    <button key={intens} onClick={() => setForm(f => ({ ...f, intensity: intens }))}
                      style={{
                        flex: 1, padding: '9px', borderRadius: 10, border: '1px solid', cursor: 'pointer', fontSize: '0.84rem', fontFamily: 'Inter, sans-serif', textTransform: 'capitalize', fontWeight: 600,
                        background: form.intensity === intens ? INTENSITY_CONFIG[intens].bg : 'rgba(255, 255, 255, 0.75)',
                        borderColor: form.intensity === intens ? INTENSITY_CONFIG[intens].border : 'rgba(232, 99, 154, 0.18)',
                        color: form.intensity === intens ? INTENSITY_CONFIG[intens].color : 'var(--text-secondary)',
                        transition: 'all 0.2s'
                      }}>
                      {intens === 'low' ? '🟢' : intens === 'moderate' ? '🟡' : '🔴'} {intens}
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ marginBottom: 22 }}>
                <label className="form-label">Notes (How did you feel?)</label>
                <input value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} className="neuro-input" placeholder="e.g. Felt energized, no shortness of breath" />
              </div>
            </>
          )}

          <button className="btn-primary" onClick={handleSubmit} disabled={loading} style={{ width: '100%', justifyContent: 'center', padding: '12px' }}>
            {loading ? <span className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }}></span> : form.is_rest_day ? '😌 Log Rest Day' : '🌸 Log Activity'}
          </button>
        </div>
      )}

      {/* DOCTOR APPROVED EXERCISES */}
      {view === 'exercises' && (
        <div>
          <div style={{ marginBottom: 18, padding: '14px 20px', borderRadius: 14, background: 'rgba(61, 191, 168, 0.1)', border: '1px solid rgba(61, 191, 168, 0.25)', fontSize: '0.86rem', color: '#2aaa8f', fontWeight: 500, lineHeight: 1.5 }}>
            ⚕️ Safe & Approved Movements: Staying active improves pelvic circulation, reduces backache, and eases labor. Always hydrate and avoid heavy abdominal strain.
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 18 }}>
            {exercises.map((ex, i) => (
              <div key={i} className="glass-card" style={{ padding: 22, cursor: 'pointer', background: 'rgba(255, 255, 255, 0.9)' }}
                onClick={() => { setView('log'); setForm(f => ({ ...f, exercise_type: ex.name })); }}>
                <div style={{ fontSize: '2.4rem', marginBottom: 10 }}>{ex.icon}</div>
                <h4 style={{ fontSize: '1.05rem', marginBottom: 6, color: 'var(--text-primary)' }}>{ex.name}</h4>
                <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
                  <span className="tag" style={{ background: INTENSITY_CONFIG[ex.intensity]?.bg || 'rgba(61,191,168,0.1)', borderColor: INTENSITY_CONFIG[ex.intensity]?.border || 'rgba(61,191,168,0.3)', color: INTENSITY_CONFIG[ex.intensity]?.color || '#2aaa8f' }}>
                    {ex.intensity}
                  </span>
                  <span className="tag" style={{ background: 'rgba(230,168,48,0.1)', borderColor: 'rgba(230,168,48,0.25)', color: '#c47d10' }}>
                    ⏱ {ex.duration}
                  </span>
                </div>
                <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: 12 }}>{ex.benefits}</p>
                <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                  {ex.trimester.map(t => (
                    <span key={t} style={{ fontSize: '0.72rem', padding: '3px 9px', borderRadius: 12, background: 'rgba(155, 114, 207, 0.1)', border: '1px solid rgba(155, 114, 207, 0.25)', color: 'var(--accent-purple)', fontWeight: 600 }}>Trimester {t}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* HISTORY TABLE */}
      {view === 'history' && (
        <div className="glass-card" style={{ overflow: 'hidden', background: 'rgba(255, 255, 255, 0.9)' }}>
          <div style={{ padding: '16px 22px', borderBottom: '1px solid rgba(232, 99, 154, 0.12)' }}>
            <h4 style={{ fontSize: '0.98rem', color: 'var(--text-primary)' }}>Activity History (Past 30 Days)</h4>
          </div>
          {history.length === 0 ? (
            <div style={{ padding: 36, textAlign: 'center', color: 'var(--text-secondary)' }}>No activity logs recorded yet</div>
          ) : (
            <table className="glass-table">
              <thead><tr><th>Date</th><th>Day</th><th>Activity</th><th>Duration</th><th>Steps</th><th>Intensity</th></tr></thead>
              <tbody>
                {history.map((act, i) => (
                  <tr key={i}>
                    <td>{act.activity_date}</td>
                    <td style={{ color: 'var(--text-secondary)' }}>{act.day_of_week}</td>
                    <td style={{ color: 'var(--text-primary)', fontWeight: 600 }}>
                      {act.is_rest_day ? '😌 Rest Day' : `🏃‍♀️ ${act.exercise_type || 'Exercise'}`}
                    </td>
                    <td>{act.duration_minutes ? `${act.duration_minutes} min` : '—'}</td>
                    <td>{act.steps ? act.steps.toLocaleString() : '—'}</td>
                    <td>
                      {act.intensity && (
                        <span className="status-badge" style={{
                          background: INTENSITY_CONFIG[act.intensity]?.bg || 'rgba(61,191,168,0.1)',
                          color: INTENSITY_CONFIG[act.intensity]?.color || '#2aaa8f',
                          border: `1px solid ${INTENSITY_CONFIG[act.intensity]?.border || 'rgba(61,191,168,0.3)'}`
                        }}>
                          {act.intensity}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}
