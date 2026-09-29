import { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { getHealthProfile, analyzeMeal, saveMealLog, getWeeklyMeals, getTodayMeal } from '../../utils/api';
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend } from 'recharts';
import toast from 'react-hot-toast';

const STATUS_CONFIG = {
  normal: { label: 'Normal', color: '#2aaa8f', bg: 'rgba(61,191,168,0.12)', icon: '✓' },
  deficient: { label: 'Deficient', color: '#c94060', bg: 'rgba(242,95,122,0.12)', icon: '⚠' },
  excess: { label: 'Excess', color: '#c47d10', bg: 'rgba(230,168,48,0.12)', icon: '↑' },
  low: { label: 'Low', color: '#c94060', bg: 'rgba(242,95,122,0.12)', icon: '↓' },
  high: { label: 'High', color: '#c47d10', bg: 'rgba(230,168,48,0.12)', icon: '↑' },
};

export default function NutritionTab() {
  const { healthProfile, setHealthProfile, requireLogin, isLoggedIn } = useApp();
  const [profile, setProfile] = useState(healthProfile);
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [mealForm, setMealForm] = useState({ breakfast: '', lunch: '', dinner: '', snacks: '', water_ml: '' });
  const [mealAnalysis, setMealAnalysis] = useState(null);
  const [analyzingMeal, setAnalyzingMeal] = useState(false);
  const [weeklyLogs, setWeeklyLogs] = useState([]);
  const [todayLog, setTodayLog] = useState(null);

  useEffect(() => {
    if (isLoggedIn) {
      if (!profile) {
        setLoadingProfile(true);
        getHealthProfile()
          .then(res => { setProfile(res.data.profile); setHealthProfile(res.data.profile); })
          .catch(() => {})
          .finally(() => setLoadingProfile(false));
      }
      getWeeklyMeals().then(res => setWeeklyLogs(res.data.logs || [])).catch(() => {});
      getTodayMeal().then(res => { if (res.data.log) { setTodayLog(res.data.log); setMealAnalysis(res.data.log.ai_analysis); } }).catch(() => {});
    }
  }, [isLoggedIn]);

  const nutrients = profile?.nutrient_requirements || profile?.ai_analysis?.nutrient_requirements || null;
  const analysis = profile?.ai_analysis || null;

  const handleMealChange = e => setMealForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const handleMealAnalyze = async () => {
    requireLogin(async () => {
      if (!mealForm.breakfast && !mealForm.lunch && !mealForm.dinner) {
        toast.error('Please enter at least one meal to analyze');
        return;
      }
      setAnalyzingMeal(true);
      try {
        const res = await analyzeMeal(mealForm);
        const a = res.data.analysis;
        setMealAnalysis(a);
        await saveMealLog({
          ...mealForm,
          carbohydrates: a.estimated_nutrients?.carbohydrates,
          fats: a.estimated_nutrients?.fats,
          proteins: a.estimated_nutrients?.proteins,
          iron: a.estimated_nutrients?.iron,
          fiber: a.estimated_nutrients?.fiber,
          calcium: a.estimated_nutrients?.calcium,
          carb_status: a.status?.carbohydrates,
          fat_status: a.status?.fats,
          protein_status: a.status?.proteins,
          iron_status: a.status?.iron,
          fiber_status: a.status?.fiber,
          calcium_status: a.status?.calcium,
          water_status: a.status?.water,
          ai_analysis: a
        });
        toast.success('Meal analyzed and saved! 🥗🌸');
        getWeeklyMeals().then(res => setWeeklyLogs(res.data.logs || [])).catch(() => {});
      } catch (err) {
        toast.error('Meal analysis failed');
      } finally {
        setAnalyzingMeal(false);
      }
    });
  };

  const getNutrientRows = () => {
    if (!nutrients) return [];
    const nr = nutrients.nutrient_requirements || nutrients;
    return Object.entries(nr).map(([key, val]) => ({
      nutrient: key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
      daily: val?.daily || val,
      unit: val?.unit || '',
      status: val?.status || 'normal',
      note: val?.note || ''
    }));
  };

  const getMealStatusRows = () => {
    if (!mealAnalysis) return [];
    const { estimated_nutrients, daily_requirements, status } = mealAnalysis;
    const keys = ['carbohydrates', 'proteins', 'fats', 'iron', 'fiber', 'calcium', 'water'];
    const units = { carbohydrates: 'g', proteins: 'g', fats: 'g', iron: 'mg', fiber: 'g', calcium: 'mg', water: 'ml' };
    return keys.map(k => ({
      nutrient: k.charAt(0).toUpperCase() + k.slice(1),
      consumed: estimated_nutrients?.[k] || 0,
      required: daily_requirements?.[k] || 0,
      unit: units[k],
      status: status?.[k] || 'normal'
    }));
  };

  const radarData = getMealStatusRows().map(r => ({
    nutrient: r.nutrient,
    consumed: r.required > 0 ? Math.min((r.consumed / r.required) * 100, 150) : 0,
    target: 100
  }));

  const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const weekBarData = DAYS.map((day, i) => {
    const log = weeklyLogs.find(l => {
      const d = new Date(l.log_date);
      return d.getDay() === i;
    });
    return {
      day,
      Water: log?.water_ml ? Math.round(log.water_ml / 25) : 0,
      Protein: log?.proteins ? Math.round(log.proteins) : 0,
      Carbs: log?.carbohydrates ? Math.round(log.carbohydrates / 5) : 0
    };
  });

  if (loadingProfile) {
    return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 300 }}>
      <div className="spinner" />
    </div>;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
      {/* SECTION 1: Nutrient Suggestion Tabular Chart (TOP) */}
      <section>
        <h3 className="section-heading" style={{ color: 'var(--text-primary)', fontSize: '1.2rem' }}>
          <span>🎯</span> Daily Nutrient Requirements
        </h3>
        {!nutrients ? (
          <div className="glass-card" style={{ padding: 36, textAlign: 'center', background: 'rgba(255, 255, 255, 0.9)' }}>
            <div style={{ fontSize: '3rem', marginBottom: 14 }} className="float-anim">🌸</div>
            <h4 style={{ marginBottom: 8, fontSize: '1.2rem' }}>No Health Profile Saved Yet</h4>
            <p style={{ color: 'var(--text-secondary)', marginBottom: 20, fontSize: '0.9rem' }}>Fill in your health details to get your personalized daily targets</p>
            <a href="/input/precise" className="btn-primary" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 8 }}>📋 Fill Health Profile</a>
          </div>
        ) : (
          <div className="glass-card" style={{ overflow: 'hidden', background: 'rgba(255, 255, 255, 0.9)' }}>
            {/* Summary banner */}
            {analysis?.summary && (
              <div style={{ padding: '16px 22px', background: 'rgba(61,191,168,0.09)', borderBottom: '1px solid rgba(61,191,168,0.2)', fontSize: '0.9rem', color: '#2aaa8f', lineHeight: 1.6, fontWeight: 500 }}>
                ✨ {analysis.summary}
              </div>
            )}
            {/* Warnings */}
            {analysis?.warnings?.length > 0 && (
              <div style={{ padding: '12px 22px', background: 'rgba(242,95,122,0.08)', borderBottom: '1px solid rgba(242,95,122,0.2)' }}>
                {analysis.warnings.map((w, i) => (
                  <div key={i} style={{ fontSize: '0.85rem', color: '#c94060', display: 'flex', alignItems: 'center', gap: 8, fontWeight: 500 }}>⚠️ {w}</div>
                ))}
              </div>
            )}
            <div style={{ overflowX: 'auto' }}>
              <table className="glass-table">
                <thead>
                  <tr>
                    <th>Nutrient</th>
                    <th>Daily Requirement</th>
                    <th>Status</th>
                    <th>Optimal Range</th>
                    <th>Guidance & Purpose</th>
                  </tr>
                </thead>
                <tbody>
                  {getNutrientRows().map((row, i) => {
                    const sc = STATUS_CONFIG[row.status] || STATUS_CONFIG.normal;
                    const pct = row.status === 'normal' ? 75 : row.status === 'low' || row.status === 'deficient' ? 40 : 95;
                    const barColor = sc.color;
                    return (
                      <tr key={i}>
                        <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{row.nutrient}</td>
                        <td>
                          <span style={{ color: 'var(--accent-purple)', fontWeight: 700, fontSize: '0.92rem' }}>{row.daily}</span>
                          <span style={{ color: 'var(--text-secondary)', fontSize: '0.82rem' }}> {row.unit}</span>
                        </td>
                        <td>
                          <span className="status-badge" style={{ background: sc.bg, color: sc.color, border: `1px solid ${sc.color}45` }}>
                            {sc.icon} {sc.label}
                          </span>
                        </td>
                        <td style={{ width: 130 }}>
                          <div className="progress-bar" style={{ width: 110, background: 'rgba(155, 114, 207, 0.12)' }}>
                            <div className="progress-fill" style={{ width: `${pct}%`, background: `linear-gradient(90deg, ${barColor}99, ${barColor})` }} />
                          </div>
                        </td>
                        <td style={{ fontSize: '0.82rem', maxWidth: 240, color: 'var(--text-secondary)', lineHeight: 1.4 }}>{row.note}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </section>

      {/* SECTION 2: Meals & Hydration Part (BELOW Tabular Chart) */}
      <section>
        <h3 className="section-heading" style={{ color: 'var(--text-primary)', fontSize: '1.2rem' }}>
          <span>🍽️</span> Meals & Hydration Log
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 24 }}>
          {/* Meal Input Form */}
          <div className="glass-card" style={{ padding: 26, background: 'rgba(255, 255, 255, 0.9)' }}>
            <h4 style={{ marginBottom: 18, fontSize: '1.05rem', color: 'var(--accent-rose)' }}>📝 Log What You Ate Today</h4>
            {[
              { key: 'breakfast', label: '🌅 Breakfast', placeholder: 'e.g. 2 whole grain rotis, dal, mixed nuts' },
              { key: 'lunch', label: '☀️ Lunch', placeholder: 'e.g. brown rice, palak paneer, curd, cucumber salad' },
              { key: 'dinner', label: '🌙 Dinner', placeholder: 'e.g. vegetable soup, 2 soft rotis, lentils' },
              { key: 'snacks', label: '🍎 Snacks', placeholder: 'e.g. almonds, walnuts, seasonal fruits, coconut water' },
            ].map(({ key, label, placeholder }) => (
              <div key={key} style={{ marginBottom: 14 }}>
                <label className="form-label">{label}</label>
                <input name={key} value={mealForm[key]} onChange={handleMealChange} className="neuro-input" placeholder={placeholder} />
              </div>
            ))}
            <div style={{ marginBottom: 22 }}>
              <label className="form-label">💧 Water Consumption (ml)</label>
              <input name="water_ml" type="number" value={mealForm.water_ml} onChange={handleMealChange} className="neuro-input" placeholder="e.g. 2200 (Aim for 2500 ml)" min="0" max="5000" />
            </div>
            <button className="btn-primary" onClick={handleMealAnalyze} disabled={analyzingMeal} style={{ width: '100%', justifyContent: 'center', padding: '12px' }}>
              {analyzingMeal ? <><span className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }}></span> Analyzing Nutrients...</> : '🔍 Compare & Save Meal'}
            </button>
          </div>

          {/* Meal Analysis Result */}
          <div className="glass-card" style={{ padding: 26, background: 'rgba(255, 255, 255, 0.9)' }}>
            <h4 style={{ marginBottom: 18, fontSize: '1.05rem', color: 'var(--accent-rose)' }}>📊 Daily Comparison Result</h4>
            {!mealAnalysis ? (
              <div style={{ textAlign: 'center', padding: '48px 24px', color: 'var(--text-secondary)' }}>
                <div style={{ fontSize: '3rem', marginBottom: 14 }}>🥗</div>
                <p style={{ fontSize: '0.92rem', lineHeight: 1.6 }}>Enter your meals on the left to see instant comparison for Carbohydrates, Fats, Proteins, Iron, Fiber, Calcium, and Water.</p>
              </div>
            ) : (
              <>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 18 }}>
                  {getMealStatusRows().map((row, i) => {
                    const sc = STATUS_CONFIG[row.status] || STATUS_CONFIG.normal;
                    const pct = row.required > 0 ? Math.min((row.consumed / row.required) * 100, 100) : 50;
                    return (
                      <div key={i}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, fontSize: '0.85rem' }}>
                          <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{row.nutrient}</span>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span style={{ color: sc.color, fontWeight: 600 }}>{row.consumed}{row.unit}</span>
                            <span style={{ color: 'var(--text-muted)' }}>/ {row.required}{row.unit}</span>
                            <span className="status-badge" style={{ background: sc.bg, color: sc.color, border: `1px solid ${sc.color}45`, padding: '2px 9px' }}>{sc.label}</span>
                          </div>
                        </div>
                        <div className="progress-bar" style={{ height: 7, background: 'rgba(155, 114, 207, 0.12)' }}>
                          <div className="progress-fill" style={{ width: `${pct}%`, background: `linear-gradient(90deg, ${sc.color}90, ${sc.color})` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
                {mealAnalysis.notes && (
                  <div style={{ padding: '14px 18px', borderRadius: 12, background: 'rgba(155, 114, 207, 0.08)', border: '1px solid rgba(155, 114, 207, 0.2)', fontSize: '0.84rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                    💡 {mealAnalysis.notes}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </section>

      {/* SECTION 3: Nutrition Snapshot (BELOW Meals & Hydration) */}
      <section>
        <h3 className="section-heading" style={{ color: 'var(--text-primary)', fontSize: '1.2rem' }}>
          <span>📈</span> Nutrition Snapshot & Patterns
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 24 }}>
          {/* Radar Chart */}
          <div className="glass-card" style={{ padding: 24, background: 'rgba(255, 255, 255, 0.9)' }}>
            <h4 style={{ marginBottom: 14, fontSize: '0.98rem', color: 'var(--text-secondary)' }}>Today's Nutrient Coverage Target</h4>
            {radarData.length > 0 ? (
              <ResponsiveContainer width="100%" height={240}>
                <RadarChart data={radarData}>
                  <PolarGrid stroke="rgba(232, 99, 154, 0.18)" />
                  <PolarAngleAxis dataKey="nutrient" tick={{ fill: 'var(--text-secondary)', fontSize: 11, fontWeight: 500 }} />
                  <Radar name="Consumed" dataKey="consumed" stroke="#e8639a" fill="#e8639a" fillOpacity={0.25} strokeWidth={2} />
                  <Radar name="Target (100%)" dataKey="target" stroke="rgba(155, 114, 207, 0.4)" fill="transparent" strokeDasharray="4 4" />
                  <Tooltip contentStyle={{ background: 'rgba(255, 248, 252, 0.98)', border: '1px solid rgba(232, 99, 154, 0.25)', borderRadius: 10, fontSize: '0.8rem', color: 'var(--text-primary)' }} />
                </RadarChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ height: 240, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: '0.88rem', textAlign: 'center' }}>
                Log your meals above to see your nutrient radar diagram 🌸
              </div>
            )}
          </div>

          {/* Weekly Bar Chart */}
          <div className="glass-card" style={{ padding: 24, background: 'rgba(255, 255, 255, 0.9)' }}>
            <h4 style={{ marginBottom: 14, fontSize: '0.98rem', color: 'var(--text-secondary)' }}>Weekly Intake Trends</h4>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={weekBarData}>
                <XAxis dataKey="day" tick={{ fill: 'var(--text-secondary)', fontSize: 11 }} />
                <YAxis tick={{ fill: 'var(--text-secondary)', fontSize: 10 }} />
                <Tooltip contentStyle={{ background: 'rgba(255, 248, 252, 0.98)', border: '1px solid rgba(232, 99, 154, 0.25)', borderRadius: 10, fontSize: '0.8rem', color: 'var(--text-primary)' }} />
                <Legend wrapperStyle={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }} />
                <Bar dataKey="Protein" fill="#9b72cf" radius={[4,4,0,0]} name="Protein (g)" />
                <Bar dataKey="Carbs" fill="#e8639a" radius={[4,4,0,0]} name="Carbs (x5g)" />
                <Bar dataKey="Water" fill="#3dbfa8" radius={[4,4,0,0]} name="Water (x25ml)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* AI Meal Suggestions */}
        {analysis?.meal_suggestions && (
          <div className="glass-card" style={{ padding: 24, marginTop: 24, background: 'rgba(255, 255, 255, 0.9)' }}>
            <h4 style={{ marginBottom: 16, fontSize: '1rem', color: 'var(--accent-rose)' }}>🌸 Doctor-Curated Meal Suggestions</h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: 16 }}>
              {Object.entries(analysis.meal_suggestions).map(([meal, items]) => (
                <div key={meal} style={{ padding: 18, borderRadius: 14, background: 'rgba(255, 248, 252, 0.85)', border: '1px solid rgba(232, 99, 154, 0.15)' }}>
                  <div style={{ fontWeight: 600, fontSize: '0.92rem', color: 'var(--accent-rose)', marginBottom: 10, textTransform: 'capitalize' }}>
                    {meal === 'breakfast' ? '🌅' : meal === 'lunch' ? '☀️' : meal === 'dinner' ? '🌙' : '🍎'} {meal}
                  </div>
                  {Array.isArray(items) && items.map((item, i) => (
                    <div key={i} style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', padding: '4px 0', borderBottom: i < items.length - 1 ? '1px solid rgba(232, 99, 154, 0.08)' : 'none', lineHeight: 1.4 }}>
                      • {item}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Weekly Log Table */}
        {weeklyLogs.length > 0 && (
          <div className="glass-card" style={{ overflow: 'hidden', marginTop: 24, background: 'rgba(255, 255, 255, 0.9)' }}>
            <div style={{ padding: '16px 22px', borderBottom: '1px solid rgba(232, 99, 154, 0.12)' }}>
              <h4 style={{ fontSize: '0.98rem', color: 'var(--text-primary)' }}>📅 Weekly Meal Log by Weekdays</h4>
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table className="glass-table">
                <thead>
                  <tr>
                    <th>Day</th>
                    <th>Carbs</th>
                    <th>Protein</th>
                    <th>Fat</th>
                    <th>Iron</th>
                    <th>Fiber</th>
                    <th>Calcium</th>
                    <th>Water</th>
                  </tr>
                </thead>
                <tbody>
                  {weeklyLogs.map((log, i) => {
                    const statuses = {
                      carb: log.carb_status, protein: log.protein_status, fat: log.fat_status,
                      iron: log.iron_status, fiber: log.fiber_status, calcium: log.calcium_status, water: log.water_status
                    };
                    const getColor = s => s === 'normal' ? '#2aaa8f' : s === 'deficient' ? '#c94060' : '#c47d10';
                    return (
                      <tr key={i}>
                        <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{log.day_of_week || log.log_date}</td>
                        {['carb', 'protein', 'fat', 'iron', 'fiber', 'calcium', 'water'].map(k => (
                          <td key={k}>
                            {statuses[k] ? (
                              <span className="status-badge" style={{ background: `${getColor(statuses[k])}15`, color: getColor(statuses[k]), border: `1px solid ${getColor(statuses[k])}35`, fontSize: '0.72rem' }}>
                                {statuses[k]}
                              </span>
                            ) : '—'}
                          </td>
                        ))}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
